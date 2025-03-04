// Copyright 2019 The LUCI Authors.
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

package recorder

import (
	"context"
	"strings"
	"time"

	"github.com/golang/protobuf/ptypes"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/timestamppb"

	"go.chromium.org/luci/common/clock"
	"go.chromium.org/luci/common/errors"
	"go.chromium.org/luci/grpc/appstatus"
	"go.chromium.org/luci/grpc/prpc"
	"go.chromium.org/luci/resultdb/internal"
	"go.chromium.org/luci/resultdb/internal/invocations"
	"go.chromium.org/luci/resultdb/internal/permissions"
	"go.chromium.org/luci/resultdb/pbutil"
	pb "go.chromium.org/luci/resultdb/proto/v1"
	"go.chromium.org/luci/server/auth"
	"go.chromium.org/luci/server/auth/realms"
)

// TestMagicOverdueDeadlineUnixSecs is a magic value used by tests to set an
// invocation's deadline in the past.
const TestMagicOverdueDeadlineUnixSecs = 904924800

// isValidCreateState returns false if invocations cannot be created in the
// given state `s`.
func isValidCreateState(s pb.Invocation_State) bool {
	switch s {
	default:
		return false
	case pb.Invocation_STATE_UNSPECIFIED:
	case pb.Invocation_ACTIVE:
	case pb.Invocation_FINALIZING:
	}
	return true
}

// validateInvocationDeadline returns a non-nil error if deadline is invalid.
func validateInvocationDeadline(deadline *timestamppb.Timestamp, now time.Time) error {
	internal.AssertUTC(now)
	switch d, err := ptypes.Timestamp(deadline); {
	case err != nil:
		return err

	case deadline.GetSeconds() == TestMagicOverdueDeadlineUnixSecs && deadline.GetNanos() == 0:
		return nil

	case d.Sub(now) < 10*time.Second:
		return errors.Reason("must be at least 10 seconds in the future").Err()

	case d.Sub(now) > 2*24*time.Hour:
		return errors.Reason("must be before 48h in the future").Err()

	default:
		return nil
	}
}

// validateCreateInvocationRequest returns an error if req is determined to be
// invalid.
// It also adds the invocations to be included into the newly
// created invocation to the given IDSet.
func validateCreateInvocationRequest(req *pb.CreateInvocationRequest, now time.Time, includedIDs invocations.IDSet) error {
	if err := pbutil.ValidateInvocationID(req.InvocationId); err != nil {
		return errors.Annotate(err, "invocation_id").Err()
	}
	if err := pbutil.ValidateRequestID(req.RequestId); err != nil {
		return errors.Annotate(err, "request_id").Err()
	}

	inv := req.Invocation
	if inv == nil {
		return errors.Annotate(errors.Reason("unspecified").Err(), "invocation").Err()
	}

	if err := pbutil.ValidateStringPairs(inv.GetTags()); err != nil {
		return errors.Annotate(err, "invocation: tags").Err()
	}

	if inv.Realm == "" {
		return errors.Annotate(errors.Reason("unspecified").Err(), "invocation: realm").Err()
	}

	if err := realms.ValidateRealmName(inv.Realm, realms.GlobalScope); err != nil {
		return errors.Annotate(err, "invocation: realm").Err()
	}

	if inv.GetDeadline() != nil {
		if err := validateInvocationDeadline(inv.Deadline, now); err != nil {
			return errors.Annotate(err, "invocation: deadline").Err()
		}
	}

	if !isValidCreateState(inv.GetState()) {
		return errors.Reason("invocation: state: cannot be created in the state %s", inv.GetState()).Err()
	}

	for i, bqExport := range inv.GetBigqueryExports() {
		if err := pbutil.ValidateBigQueryExport(bqExport); err != nil {
			return errors.Annotate(err, "bigquery_export[%d]", i).Err()
		}
	}

	for i, incInvName := range inv.GetIncludedInvocations() {
		incInvID, err := pbutil.ParseInvocationName(incInvName)
		if err != nil {
			return errors.Annotate(err, "included_invocations[%d]: invalid included invocation name %q", i, incInvName).Err()
		}
		if incInvID == req.InvocationId {
			return errors.Reason("included_invocations[%d]: invocation cannot include itself", i).Err()
		}
		includedIDs.Add(invocations.ID(incInvID))
	}

	if err := pbutil.ValidateSourceSpec(inv.GetSourceSpec()); err != nil {
		return errors.Annotate(err, "source_spec").Err()
	}

	if inv.GetBaselineId() != "" {
		if err := pbutil.ValidateBaselineID(inv.GetBaselineId()); err != nil {
			return errors.Annotate(err, "invocation: baseline_id").Err()
		}
	}

	if err := pbutil.ValidateProperties(req.Invocation.GetProperties()); err != nil {
		return errors.Annotate(err, "properties").Err()
	}

	return nil
}

func verifyCreateInvocationPermissions(ctx context.Context, in *pb.CreateInvocationRequest) error {
	inv := in.Invocation
	if inv == nil {
		return appstatus.BadRequest(errors.Annotate(errors.Reason("unspecified").Err(), "invocation").Err())
	}

	realm := inv.Realm
	if realm == "" {
		return appstatus.BadRequest(errors.Annotate(errors.Reason("unspecified").Err(), "invocation: realm").Err())
	}
	if err := realms.ValidateRealmName(realm, realms.GlobalScope); err != nil {
		return appstatus.BadRequest(errors.Annotate(err, "invocation: realm").Err())
	}

	switch allowed, err := auth.HasPermission(ctx, permCreateInvocation, realm, nil); {
	case err != nil:
		return err
	case !allowed:
		return appstatus.Errorf(codes.PermissionDenied, `creator does not have permission to create invocations in realm %q`, realm)
	}

	if !strings.HasPrefix(in.InvocationId, "u-") {
		switch allowed, err := auth.HasPermission(ctx, permCreateWithReservedID, realm, nil); {
		case err != nil:
			return err
		case !allowed:
			return appstatus.Errorf(codes.PermissionDenied, `only invocations created by trusted systems may have id not starting with "u-"; please generate "u-{GUID}" or reach out to ResultDB owners`)
		}
	}

	if len(inv.GetBigqueryExports()) > 0 {
		switch allowed, err := auth.HasPermission(ctx, permExportToBigQuery, realm, nil); {
		case err != nil:
			return err
		case !allowed:
			return appstatus.Errorf(codes.PermissionDenied, `creator does not have permission to set bigquery exports in realm %q`, inv.GetRealm())
		}
	}

	if inv.GetProducerResource() != "" {
		switch allowed, err := auth.HasPermission(ctx, permSetProducerResource, realm, nil); {
		case err != nil:
			return err
		case !allowed:
			return appstatus.Errorf(codes.PermissionDenied, `only invocations created by trusted system may have a populated producer_resource field`)
		}
	}

	if inv.BaselineId != "" {
		switch allowed, err := auth.HasPermission(ctx, permPutBaseline, realm, nil); {
		case err != nil:
			return err
		case !allowed:
			return appstatus.Errorf(codes.PermissionDenied, `creator does not have permission to set baseline ids in realm %q`, inv.GetRealm())
		}
	}

	return nil
}

// CreateInvocation implements pb.RecorderServer.
func (s *recorderServer) CreateInvocation(ctx context.Context, in *pb.CreateInvocationRequest) (*pb.Invocation, error) {
	now := clock.Now(ctx).UTC()

	if err := verifyCreateInvocationPermissions(ctx, in); err != nil {
		return nil, err
	}

	includedInvs := make(invocations.IDSet)
	if err := validateCreateInvocationRequest(in, now, includedInvs); err != nil {
		return nil, appstatus.BadRequest(err)
	}

	if err := permissions.VerifyInvocations(ctx, includedInvs, permIncludeInvocation); err != nil {
		return nil, err
	}

	invs, tokens, err := s.createInvocations(ctx, []*pb.CreateInvocationRequest{in}, in.RequestId, now, invocations.NewIDSet(invocations.ID(in.InvocationId)))
	if err != nil {
		return nil, err
	}
	if len(invs) != 1 || len(tokens) != 1 {
		panic("createInvocations did not return either an error or a valid invocation/token pair")
	}
	md := metadata.MD{}
	md.Set(pb.UpdateTokenMetadataKey, tokens...)
	prpc.SetHeader(ctx, md)
	return invs[0], nil
}

func invocationAlreadyExists(id invocations.ID) error {
	return appstatus.Errorf(codes.AlreadyExists, "%s already exists", id.Name())
}
