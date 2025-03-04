// Copyright 2020 The LUCI Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package invocations

import (
	"context"

	"cloud.google.com/go/spanner"
	"go.opentelemetry.io/otel/attribute"
	"google.golang.org/grpc/codes"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"

	"go.chromium.org/luci/common/errors"
	"go.chromium.org/luci/grpc/appstatus"
	"go.chromium.org/luci/server/span"

	"go.chromium.org/luci/resultdb/internal/spanutil"
	"go.chromium.org/luci/resultdb/internal/tracing"
	"go.chromium.org/luci/resultdb/pbutil"
	pb "go.chromium.org/luci/resultdb/proto/v1"
)

// ReadColumns reads the specified columns from an invocation Spanner row.
// If the invocation does not exist, the returned error is annotated with
// NotFound GRPC code.
// For ptrMap see ReadRow comment in span/util.go.
func ReadColumns(ctx context.Context, id ID, ptrMap map[string]any) error {
	if id == "" {
		return errors.Reason("id is unspecified").Err()
	}
	err := spanutil.ReadRow(ctx, "Invocations", id.Key(), ptrMap)
	switch {
	case spanner.ErrCode(err) == codes.NotFound:
		return appstatus.Attachf(err, codes.NotFound, "%s not found", id.Name())

	case err != nil:
		return errors.Annotate(err, "failed to fetch %s", id.Name()).Err()

	default:
		return nil
	}
}

func readMulti(ctx context.Context, ids IDSet, f func(id ID, inv *pb.Invocation) error) error {
	if len(ids) == 0 {
		return nil
	}

	st := spanner.NewStatement(`
		SELECT
		 i.InvocationId,
		 i.State,
		 i.CreatedBy,
		 i.CreateTime,
		 i.FinalizeTime,
		 i.Deadline,
		 i.Tags,
		 i.BigQueryExports,
		 ARRAY(SELECT IncludedInvocationId FROM IncludedInvocations incl WHERE incl.InvocationID = i.InvocationId),
		 i.ProducerResource,
		 i.Realm,
		 i.Properties,
		 i.Sources,
		 i.InheritSources,
		 i.BaselineId,
		FROM Invocations i
		WHERE i.InvocationID IN UNNEST(@invIDs)
	`)
	st.Params = spanutil.ToSpannerMap(map[string]any{
		"invIDs": ids,
	})
	var b spanutil.Buffer
	return spanutil.Query(ctx, st, func(row *spanner.Row) error {
		var id ID
		included := IDSet{}
		inv := &pb.Invocation{}

		var (
			createdBy        spanner.NullString
			producerResource spanner.NullString
			realm            spanner.NullString
			properties       spanutil.Compressed
			sources          spanutil.Compressed
			inheritSources   spanner.NullBool
			baselineId       spanner.NullString
		)
		err := b.FromSpanner(row, &id,
			&inv.State,
			&createdBy,
			&inv.CreateTime,
			&inv.FinalizeTime,
			&inv.Deadline,
			&inv.Tags,
			&inv.BigqueryExports,
			&included,
			&producerResource,
			&realm,
			&properties,
			&sources,
			&inheritSources,
			&baselineId)
		if err != nil {
			return err
		}

		inv.Name = pbutil.InvocationName(string(id))
		inv.IncludedInvocations = included.Names()
		inv.CreatedBy = createdBy.StringVal
		inv.ProducerResource = producerResource.StringVal
		inv.Realm = realm.StringVal

		if len(properties) != 0 {
			inv.Properties = &structpb.Struct{}
			if err := proto.Unmarshal(properties, inv.Properties); err != nil {
				return err
			}
		}

		if inheritSources.Valid || len(sources) > 0 {
			inv.SourceSpec = &pb.SourceSpec{}
			inv.SourceSpec.Inherit = inheritSources.Valid && inheritSources.Bool
			if len(sources) != 0 {
				inv.SourceSpec.Sources = &pb.Sources{}
				if err := proto.Unmarshal(sources, inv.SourceSpec.Sources); err != nil {
					return err
				}
			}
		}

		if baselineId.Valid {
			inv.BaselineId = baselineId.StringVal
		}
		return f(id, inv)
	})
}

// Read reads one invocation from Spanner.
// If the invocation does not exist, the returned error is annotated with
// NotFound GRPC code.
func Read(ctx context.Context, id ID) (*pb.Invocation, error) {
	var ret *pb.Invocation
	err := readMulti(ctx, NewIDSet(id), func(id ID, inv *pb.Invocation) error {
		ret = inv
		return nil
	})

	switch {
	case err != nil:
		return nil, err
	case ret == nil:
		return nil, appstatus.Errorf(codes.NotFound, "%s not found", id.Name())
	default:
		return ret, nil
	}
}

// ReadBatch reads multiple invocations from Spanner.
// If any of them are not found, returns an error.
func ReadBatch(ctx context.Context, ids IDSet) (map[ID]*pb.Invocation, error) {
	ret := make(map[ID]*pb.Invocation, len(ids))
	err := readMulti(ctx, ids, func(id ID, inv *pb.Invocation) error {
		if _, ok := ret[id]; ok {
			panic("query is incorrect; it returned duplicated invocation IDs")
		}
		ret[id] = inv
		return nil
	})
	if err != nil {
		return nil, err
	}
	for id := range ids {
		if _, ok := ret[id]; !ok {
			return nil, appstatus.Errorf(codes.NotFound, "%s not found", id.Name())
		}
	}
	return ret, nil
}

// ReadState returns the invocation's state.
func ReadState(ctx context.Context, id ID) (pb.Invocation_State, error) {
	var state pb.Invocation_State
	err := ReadColumns(ctx, id, map[string]any{"State": &state})
	return state, err
}

// ReadStateBatch reads the states of multiple invocations.
func ReadStateBatch(ctx context.Context, ids IDSet) (map[ID]pb.Invocation_State, error) {
	ret := make(map[ID]pb.Invocation_State)
	err := span.Read(ctx, "Invocations", ids.Keys(), []string{"InvocationID", "State"}).Do(func(r *spanner.Row) error {
		var id ID
		var s pb.Invocation_State
		if err := spanutil.FromSpanner(r, &id, &s); err != nil {
			return errors.Annotate(err, "failed to fetch %s", ids).Err()
		}
		ret[id] = s
		return nil
	})
	if err != nil {
		return nil, err
	}
	return ret, nil
}

// ReadRealm returns the invocation's realm.
func ReadRealm(ctx context.Context, id ID) (string, error) {
	var realm string
	err := ReadColumns(ctx, id, map[string]any{"Realm": &realm})
	return realm, err
}

// QueryRealms returns the invocations' realms where available from the
// Invocations table.
// Makes a single RPC.
func QueryRealms(ctx context.Context, ids IDSet) (realms map[ID]string, err error) {
	ctx, ts := tracing.Start(ctx, "resultdb.invocations.QueryRealms",
		attribute.Int("cr.dev.count", len(ids)),
	)
	defer func() { tracing.End(ts, err) }()

	realms = map[ID]string{}
	st := spanner.NewStatement(`
		SELECT
			i.InvocationId,
			i.Realm
		FROM UNNEST(@invIDs) inv
		JOIN Invocations i
		ON i.InvocationId = inv`)
	st.Params = spanutil.ToSpannerMap(map[string]any{
		"invIDs": ids,
	})
	b := &spanutil.Buffer{}
	err = spanutil.Query(ctx, st, func(r *spanner.Row) error {
		var invocationID ID
		var realm spanner.NullString
		if err := b.FromSpanner(r, &invocationID, &realm); err != nil {
			return err
		}
		realms[invocationID] = realm.StringVal
		return nil
	})
	return realms, err
}

// ReadRealms returns the invocations' realms.
// Returns a NotFound error if unable to get the realm for any of the requested
// invocations.
// Makes a single RPC.
func ReadRealms(ctx context.Context, ids IDSet) (realms map[ID]string, err error) {
	ctx, ts := tracing.Start(ctx, "resultdb.invocations.ReadRealms",
		attribute.Int("cr.dev.count", len(ids)),
	)
	defer func() { tracing.End(ts, err) }()

	realms, err = QueryRealms(ctx, ids)
	if err != nil {
		return nil, err
	}

	// Return a NotFound error if ret is missing a requested invocation.
	for id := range ids {
		if _, ok := realms[id]; !ok {
			return nil, appstatus.Errorf(codes.NotFound, "%s not found", id.Name())
		}
	}
	return realms, nil
}

// InclusionKey returns a spanner key for an Inclusion row.
func InclusionKey(including, included ID) spanner.Key {
	return spanner.Key{including.RowID(), included.RowID()}
}

// ReadIncluded reads ids of (directly) included invocations.
func ReadIncluded(ctx context.Context, id ID) (IDSet, error) {
	var ret IDSet
	var b spanutil.Buffer
	err := span.Read(ctx, "IncludedInvocations", id.Key().AsPrefix(), []string{"IncludedInvocationId"}).Do(func(row *spanner.Row) error {
		var included ID
		if err := b.FromSpanner(row, &included); err != nil {
			return err
		}
		if ret == nil {
			ret = make(IDSet)
		}
		ret.Add(included)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return ret, nil
}

// ReadSubmitted returns the invocation's submitted status.
func ReadSubmitted(ctx context.Context, id ID) (bool, error) {
	var submitted spanner.NullBool
	if err := ReadColumns(ctx, id, map[string]any{"Submitted": &submitted}); err != nil {
		return false, err
	}
	// submitted is not a required field and so may be nil, in which we default to false.
	return submitted.Valid && submitted.Bool, nil
}
