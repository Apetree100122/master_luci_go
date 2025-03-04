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
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"

	"go.chromium.org/luci/server/auth"
	"go.chromium.org/luci/server/auth/authtest"

	"go.chromium.org/luci/resultdb/internal/invocations"
	"go.chromium.org/luci/resultdb/internal/testutil"
	"go.chromium.org/luci/resultdb/internal/testutil/insert"
	pb "go.chromium.org/luci/resultdb/proto/v1"

	. "github.com/smartystreets/goconvey/convey"
	. "go.chromium.org/luci/common/testing/assertions"
)

func TestValidateUpdateIncludedInvocationsRequest(t *testing.T) {
	t.Parallel()
	Convey(`TestValidateUpdateIncludedInvocationsRequest`, t, func() {
		Convey(`Valid`, func() {
			err := validateUpdateIncludedInvocationsRequest(&pb.UpdateIncludedInvocationsRequest{
				IncludingInvocation: "invocations/a",
				AddInvocations:      []string{"invocations/b"},
				RemoveInvocations:   []string{"invocations/c"},
			})
			So(err, ShouldBeNil)
		})

		Convey(`Invalid including_invocation`, func() {
			err := validateUpdateIncludedInvocationsRequest(&pb.UpdateIncludedInvocationsRequest{
				IncludingInvocation: "x",
				AddInvocations:      []string{"invocations/b"},
				RemoveInvocations:   []string{"invocations/c"},
			})
			So(err, ShouldErrLike, `including_invocation: does not match`)
		})
		Convey(`Invalid add_invocations`, func() {
			err := validateUpdateIncludedInvocationsRequest(&pb.UpdateIncludedInvocationsRequest{
				IncludingInvocation: "invocations/a",
				AddInvocations:      []string{"x"},
				RemoveInvocations:   []string{"invocations/c"},
			})
			So(err, ShouldErrLike, `add_invocations: "x": does not match`)
		})
		Convey(`Invalid remove_invocations`, func() {
			err := validateUpdateIncludedInvocationsRequest(&pb.UpdateIncludedInvocationsRequest{
				IncludingInvocation: "invocations/a",
				AddInvocations:      []string{"invocations/b"},
				RemoveInvocations:   []string{"x"},
			})
			So(err, ShouldErrLike, `remove_invocations: "x": does not match`)
		})
		Convey(`Include itself`, func() {
			err := validateUpdateIncludedInvocationsRequest(&pb.UpdateIncludedInvocationsRequest{
				IncludingInvocation: "invocations/a",
				AddInvocations:      []string{"invocations/a"},
				RemoveInvocations:   []string{"invocations/c"},
			})
			So(err, ShouldErrLike, `cannot include itself`)
		})
		Convey(`Add and remove same invocation`, func() {
			err := validateUpdateIncludedInvocationsRequest(&pb.UpdateIncludedInvocationsRequest{
				IncludingInvocation: "invocations/a",
				AddInvocations:      []string{"invocations/b"},
				RemoveInvocations:   []string{"invocations/b"},
			})
			So(err, ShouldErrLike, `cannot add and remove the same invocation(s) at the same time: ["invocations/b"]`)
		})
	})
}

func TestUpdateIncludedInvocations(t *testing.T) {
	Convey(`TestIncludedInvocations`, t, func() {
		ctx := auth.WithState(testutil.SpannerTestContext(t), &authtest.FakeState{
			Identity: "user:someone@example.com",
			IdentityPermissions: []authtest.RealmPermission{
				{Realm: "testproject:testrealm", Permission: permIncludeInvocation},
			},
		})
		recorder := newTestRecorderServer()

		token, err := generateInvocationToken(ctx, "including")
		So(err, ShouldBeNil)
		ctx = metadata.NewIncomingContext(ctx, metadata.Pairs(pb.UpdateTokenMetadataKey, token))

		assertIncluded := func(includedInvID invocations.ID) {
			var throwAway invocations.ID
			testutil.MustReadRow(ctx, "IncludedInvocations", invocations.InclusionKey("including", includedInvID), map[string]any{
				"IncludedInvocationID": &throwAway,
			})
		}
		assertNotIncluded := func(includedInvID invocations.ID) {
			var throwAway invocations.ID
			testutil.MustNotFindRow(ctx, "IncludedInvocations", invocations.InclusionKey("including", includedInvID), map[string]any{
				"IncludedInvocationID": &throwAway,
			})
		}

		Convey(`Invalid request`, func() {
			_, err := recorder.UpdateIncludedInvocations(ctx, &pb.UpdateIncludedInvocationsRequest{})
			So(err, ShouldHaveAppStatus, codes.InvalidArgument, `bad request: including_invocation: unspecified`)
		})

		Convey(`With valid request`, func() {
			req := &pb.UpdateIncludedInvocationsRequest{
				IncludingInvocation: "invocations/including",
				AddInvocations: []string{
					"invocations/included",
					"invocations/included2",
				},
				RemoveInvocations: []string{
					"invocations/toberemoved",
					"invocations/neverexisted",
				},
			}

			Convey(`No including invocation`, func() {
				testutil.MustApply(ctx,
					insert.Invocation("included", pb.Invocation_FINALIZED, map[string]any{"Realm": "testproject:testrealm"}),
					insert.Invocation("included2", pb.Invocation_FINALIZED, map[string]any{"Realm": "testproject:testrealm"}),
				)
				_, err := recorder.UpdateIncludedInvocations(ctx, req)
				So(err, ShouldHaveAppStatus, codes.NotFound, `invocations/including not found`)
			})

			Convey(`With existing inclusion`, func() {
				testutil.MustApply(ctx,
					insert.Invocation("including", pb.Invocation_ACTIVE, nil),
					insert.Invocation("toberemoved", pb.Invocation_FINALIZED, map[string]any{"Realm": "testproject:testrealm"}),
				)
				_, err := recorder.UpdateIncludedInvocations(ctx, &pb.UpdateIncludedInvocationsRequest{
					IncludingInvocation: "invocations/including",
					AddInvocations:      []string{"invocations/toberemoved"},
				})
				So(err, ShouldBeNil)
				assertIncluded("toberemoved")

				Convey(`No included invocation`, func() {
					_, err := recorder.UpdateIncludedInvocations(ctx, req)
					So(err, ShouldHaveAppStatus, codes.NotFound, `invocations/included`)
				})

				Convey(`Leaking disallowed`, func() {
					testutil.MustApply(ctx,
						insert.Invocation("included", pb.Invocation_FINALIZED, map[string]any{"Realm": "testproject:testrealm"}),
						insert.Invocation("included2", pb.Invocation_FINALIZED, map[string]any{"Realm": "testproject:secretrealm"}),
					)

					_, err := recorder.UpdateIncludedInvocations(ctx, req)
					So(err, ShouldHaveAppStatus, codes.PermissionDenied, `caller does not have permission resultdb.invocations.include in realm of invocation included2`)
					assertNotIncluded("included2")
				})

				Convey(`Success - idempotent`, func() {
					testutil.MustApply(ctx,
						insert.Invocation("included", pb.Invocation_FINALIZED, map[string]any{"Realm": "testproject:testrealm"}),
						insert.Invocation("included2", pb.Invocation_FINALIZED, map[string]any{"Realm": "testproject:testrealm"}),
					)

					_, err := recorder.UpdateIncludedInvocations(ctx, req)
					So(err, ShouldBeNil)
					assertIncluded("included")
					assertIncluded("included2")
					assertNotIncluded("toberemoved")

					_, err = recorder.UpdateIncludedInvocations(ctx, req)
					So(err, ShouldBeNil)
					assertIncluded("included")
					assertIncluded("included2")
					assertNotIncluded("toberemoved")
				})
			})
		})
	})
}
