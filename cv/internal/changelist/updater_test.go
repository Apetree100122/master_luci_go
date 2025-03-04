// Copyright 2021 The LUCI Authors.
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

package changelist

import (
	"context"
	"fmt"
	"sort"
	"testing"
	"time"

	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"

	"go.chromium.org/luci/common/clock/testclock"
	"go.chromium.org/luci/common/errors"
	gerrit "go.chromium.org/luci/common/proto/gerrit"
	"go.chromium.org/luci/common/retry/transient"
	"go.chromium.org/luci/gae/service/datastore"
	"go.chromium.org/luci/server/tq"
	"go.chromium.org/luci/server/tq/tqtesting"

	"go.chromium.org/luci/cv/internal/common"
	"go.chromium.org/luci/cv/internal/cvtesting"
	"go.chromium.org/luci/cv/internal/metrics"

	. "github.com/smartystreets/goconvey/convey"
	. "go.chromium.org/luci/common/testing/assertions"
)

func externalTime(t time.Time) *UpdateCLTask_Hint {
	return &UpdateCLTask_Hint{ExternalUpdateTime: timestamppb.New(t)}
}

func TestUpdaterSchedule(t *testing.T) {
	t.Parallel()

	Convey("Correctly generate dedup keys for Updater TQ tasks", t, func() {
		ct := cvtesting.Test{}
		ctx, cancel := ct.SetUp(t)
		defer cancel()

		Convey("Correctly generate dedup keys for Updater TQ tasks", func() {
			Convey("Diff CLIDs have diff dedup keys", func() {
				t := &UpdateCLTask{LuciProject: "proj", Id: 7}
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				t.Id = 8
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldNotResemble, k2)
			})

			Convey("Diff ExternalID have diff dedup keys", func() {
				t := &UpdateCLTask{LuciProject: "proj"}
				t.ExternalId = "kind1/foo/23"
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				t.ExternalId = "kind4/foo/56"
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldNotResemble, k2)
			})

			Convey("Even if ExternalID and internal ID refer to the same CL, they have diff dedup keys", func() {
				t1 := &UpdateCLTask{LuciProject: "proj", ExternalId: "kind1/foo/23"}
				t2 := &UpdateCLTask{LuciProject: "proj", Id: 2}
				k1 := makeTaskDeduplicationKey(ctx, t1, 0)
				k2 := makeTaskDeduplicationKey(ctx, t2, 0)
				So(k1, ShouldNotResemble, k2)
			})

			Convey("Diff updatedHint have diff dedup keys", func() {
				t := &UpdateCLTask{LuciProject: "proj", ExternalId: "kind1/foo/23"}
				t.Hint = externalTime(ct.Clock.Now())
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				t.Hint = externalTime(ct.Clock.Now().Add(time.Second))
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldNotResemble, k2)
			})

			Convey("Same CLs but diff LUCI projects have diff dedup keys", func() {
				t := &UpdateCLTask{LuciProject: "proj", ExternalId: "kind1/foo/23"}
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				t.LuciProject += "-diff"
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldNotResemble, k2)
			})

			Convey("Same CL at the same time is de-duped", func() {
				t := &UpdateCLTask{LuciProject: "proj", ExternalId: "kind1/foo/23"}
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldResemble, k2)

				Convey("Internal ID doesn't affect dedup based on ExternalID", func() {
					t.Id = 123
					k3 := makeTaskDeduplicationKey(ctx, t, 0)
					So(k3, ShouldResemble, k1)
				})
			})

			Convey("Same CL with a delay or after the same delay is de-duped", func() {
				t := &UpdateCLTask{LuciProject: "proj", Id: 123}
				k1 := makeTaskDeduplicationKey(ctx, t, time.Second)
				ct.Clock.Add(time.Second)
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldResemble, k2)
			})

			Convey("Same CL at mostly same time is also de-duped", func() {
				t := &UpdateCLTask{LuciProject: "proj", ExternalId: "kind1/foo/23"}
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				// NOTE: this check may fail if common.DistributeOffset is changed,
				// making new timestamp in the next epoch. If so, adjust the increment.
				ct.Clock.Add(time.Second)
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldResemble, k2)
			})

			Convey("Same CL after sufficient time is no longer de-duped", func() {
				t := &UpdateCLTask{LuciProject: "proj", ExternalId: "kind1/foo/23"}
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				k2 := makeTaskDeduplicationKey(ctx, t, blindRefreshInterval)
				So(k1, ShouldNotResemble, k2)
			})

			Convey("Same CL with the same MetaRevId is de-duped", func() {
				t := &UpdateCLTask{LuciProject: "proj", ExternalId: "kind1/foo/23"}
				t.Hint = &UpdateCLTask_Hint{MetaRevId: "foo"}
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldResemble, k2)
			})

			Convey("Same CL with the different MetaRevId is not de-duped", func() {
				t := &UpdateCLTask{LuciProject: "proj", ExternalId: "kind1/foo/23"}
				t.Hint = &UpdateCLTask_Hint{MetaRevId: "foo"}
				k1 := makeTaskDeduplicationKey(ctx, t, 0)
				t.Hint = &UpdateCLTask_Hint{MetaRevId: "bar"}
				k2 := makeTaskDeduplicationKey(ctx, t, 0)
				So(k1, ShouldNotResemble, k2)
			})
		})

		Convey("makeTQTitleForHumans works", func() {
			So(makeTQTitleForHumans(&UpdateCLTask{
				LuciProject: "proj",
				Id:          123,
			}), ShouldResemble, "proj/123")
			So(makeTQTitleForHumans(&UpdateCLTask{
				LuciProject: "proj",
				ExternalId:  "kind/xyz/44",
				Id:          123,
			}), ShouldResemble, "proj/123/kind/xyz/44")
			So(makeTQTitleForHumans(&UpdateCLTask{
				LuciProject: "proj",
				ExternalId:  "gerrit/chromium-review.googlesource.com/1111111",
				Id:          123,
			}), ShouldResemble, "proj/123/gerrit/chromium/1111111")
			So(makeTQTitleForHumans(&UpdateCLTask{
				LuciProject: "proj",
				ExternalId:  "gerrit/chromium-review.googlesource.com/1111111",
				Hint:        externalTime(testclock.TestRecentTimeUTC),
			}), ShouldResemble, "proj/gerrit/chromium/1111111/u2016-02-03T04:05:06Z")
		})

		Convey("Works overall", func() {
			u := NewUpdater(ct.TQDispatcher, nil)
			t := &UpdateCLTask{
				LuciProject: "proj",
				Id:          123,
				Hint:        externalTime(ct.Clock.Now().Add(-time.Second)),
				Requester:   UpdateCLTask_RUN_POKE,
			}
			delay := time.Minute
			So(u.ScheduleDelayed(ctx, t, delay), ShouldBeNil)
			So(ct.TQ.Tasks().Payloads(), ShouldResembleProto, []proto.Message{t})

			_, _ = Println("Dedup works")
			ct.Clock.Add(delay)
			So(u.Schedule(ctx, t), ShouldBeNil)
			So(ct.TQ.Tasks().Payloads(), ShouldHaveLength, 1)

			_, _ = Println("But not within the transaction")
			err := datastore.RunInTransaction(ctx, func(ctx context.Context) error {
				return u.Schedule(ctx, t)
			}, nil)
			So(err, ShouldBeNil)
			So(ct.TQ.Tasks().Payloads(), ShouldResembleProto, []proto.Message{t, t})

			_, _ = Println("Once out of dedup window, schedules a new task")
			ct.Clock.Add(knownRefreshInterval)
			So(u.Schedule(ctx, t), ShouldBeNil)
			So(ct.TQ.Tasks().Payloads(), ShouldResembleProto, []proto.Message{t, t, t})
		})
	})
}

func TestUpdaterBatch(t *testing.T) {
	t.Parallel()

	Convey("Correctly handle batches", t, func() {
		ct := cvtesting.Test{}
		ctx, cancel := ct.SetUp(t)
		defer cancel()

		sortedTQPayloads := func() []proto.Message {
			payloads := ct.TQ.Tasks().Payloads()
			sort.Slice(payloads, func(i, j int) bool {
				return payloads[i].(*UpdateCLTask).GetExternalId() < payloads[j].(*UpdateCLTask).GetExternalId()
			})
			return payloads
		}

		u := NewUpdater(ct.TQDispatcher, nil)
		clA := ExternalID("foo/a/1").MustCreateIfNotExists(ctx)
		clB := ExternalID("foo/b/2").MustCreateIfNotExists(ctx)

		expectedPayloads := []proto.Message{
			&UpdateCLTask{
				LuciProject: "proj",
				ExternalId:  "foo/a/1",
				Id:          int64(clA.ID),
				Requester:   UpdateCLTask_RUN_POKE,
			},
			&UpdateCLTask{
				LuciProject: "proj",
				ExternalId:  "foo/b/2",
				Id:          int64(clB.ID),
				Requester:   UpdateCLTask_RUN_POKE,
			},
		}

		Convey("outside of a transaction, enqueues individual tasks", func() {
			Convey("special case of just one task", func() {
				err := u.ScheduleBatch(ctx, "proj", []*CL{clA}, UpdateCLTask_RUN_POKE)
				So(err, ShouldBeNil)
				So(sortedTQPayloads(), ShouldResembleProto, expectedPayloads[:1])
			})
			Convey("multiple", func() {
				err := u.ScheduleBatch(ctx, "proj", []*CL{clA, clB}, UpdateCLTask_RUN_POKE)
				So(err, ShouldBeNil)
				So(sortedTQPayloads(), ShouldResembleProto, expectedPayloads)
			})
		})

		Convey("inside of a transaction, enqueues just one task", func() {
			err := datastore.RunInTransaction(ctx, func(ctx context.Context) error {
				return u.ScheduleBatch(ctx, "proj", []*CL{clA, clB}, UpdateCLTask_RUN_POKE)
			}, nil)
			So(err, ShouldBeNil)
			So(ct.TQ.Tasks(), ShouldHaveLength, 1)
			// Run just the batch task.
			ct.TQ.Run(ctx, tqtesting.StopAfterTask(BatchUpdateCLTaskClass))
			So(sortedTQPayloads(), ShouldResembleProto, expectedPayloads)
		})
	})
}

// TestUpdaterWorkingHappyPath is the simplest test for an updater, which also
// illustrates the simplest UpdaterBackend.
func TestUpdaterHappyPath(t *testing.T) {
	t.Parallel()

	Convey("Updater's happy path with simplest possible backend", t, func() {
		ct := cvtesting.Test{}
		ctx, cancel := ct.SetUp(t)
		defer cancel()

		pm, rm, tj := pmMock{}, rmMock{}, tjMock{}
		u := NewUpdater(ct.TQDispatcher, NewMutator(ct.TQDispatcher, &pm, &rm, &tj))
		b := &fakeUpdaterBackend{}
		u.RegisterBackend(b)

		////////////////////////////////////////////
		// Phase 1: import CL for the first time. //
		////////////////////////////////////////////

		b.fetchResult = UpdateFields{
			Snapshot: &Snapshot{
				ExternalUpdateTime:    timestamppb.New(ct.Clock.Now().Add(-1 * time.Second)),
				Patchset:              2,
				MinEquivalentPatchset: 1,
				LuciProject:           "luci-project",
				Kind:                  nil, // but should be set in practice,
			},
			ApplicableConfig: &ApplicableConfig{
				Projects: []*ApplicableConfig_Project{
					{
						Name:           "luci-project",
						ConfigGroupIds: []string{"hash/name"},
					},
				},
			},
		}
		// Actually run the Updater.
		So(u.handleCL(ctx, &UpdateCLTask{
			LuciProject: "luci-project",
			ExternalId:  "fake/123",
			Requester:   UpdateCLTask_PUBSUB_POLL,
		}), ShouldBeNil)

		// Ensure that it reported metrics for the CL fetch events.
		So(ct.TSMonSentValue(ctx, metrics.Internal.CLIngestionAttempted,
			UpdateCLTask_PUBSUB_POLL.String(), // metric:requester,
			true,                              // metric:changed == true
			false,                             // metric:dep
			"luci-project",                    // metric:project,
			true,                              // metric:changed_snapshot == true
		), ShouldEqual, 1)
		So(ct.TSMonSentDistr(ctx, metrics.Internal.CLIngestionLatency,
			UpdateCLTask_PUBSUB_POLL.String(), // metric:requester,
			false,                             // metric:dep
			"luci-project",                    // metric:project,
			true,                              // metric:changed_snapshot == true
		).Sum(), ShouldAlmostEqual, 1)
		So(ct.TSMonSentDistr(ctx, metrics.Internal.CLIngestionLatencyWithoutFetch,
			UpdateCLTask_PUBSUB_POLL.String(), // metric:requester,
			false,                             // metric:dep
			"luci-project",                    // metric:project,
			true,                              // metric:changed_snapshot == true
		).Sum(), ShouldNotBeNil)

		// Ensure CL is created with correct data.
		cl, err := ExternalID("fake/123").Load(ctx)
		So(err, ShouldBeNil)
		So(cl.Snapshot, ShouldResembleProto, b.fetchResult.Snapshot)
		So(cl.ApplicableConfig, ShouldResembleProto, b.fetchResult.ApplicableConfig)
		So(cl.UpdateTime, ShouldHappenWithin, time.Microsecond /*see DS.RoundTime()*/, ct.Clock.Now())

		// Since there are no Runs associated with the CL, the outstanding TQ task
		// should ultimately notify the Project Manager.
		ct.TQ.Run(ctx, tqtesting.StopWhenDrained())
		So(pm.byProject, ShouldResemble, map[string]map[common.CLID]int64{
			"luci-project": {cl.ID: cl.EVersion},
		})

		// Later, a Run will start on this CL.
		const runID = "luci-project/123-1-beef"
		cl.IncompleteRuns = common.RunIDs{runID}
		cl.EVersion++
		So(datastore.Put(ctx, cl), ShouldBeNil)

		///////////////////////////////////////////////////
		// Phase 2: update the CL with the new patchset. //
		///////////////////////////////////////////////////

		ct.Clock.Add(time.Hour)
		b.reset()
		b.fetchResult.Snapshot = proto.Clone(cl.Snapshot).(*Snapshot)
		b.fetchResult.Snapshot.ExternalUpdateTime = timestamppb.New(ct.Clock.Now())
		b.fetchResult.Snapshot.Patchset++
		b.lookupACfgResult = cl.ApplicableConfig // unchanged

		// Actually run the Updater.
		So(u.handleCL(ctx, &UpdateCLTask{
			LuciProject: "luci-project",
			ExternalId:  "fake/123",
		}), ShouldBeNil)
		cl2 := reloadCL(ctx, cl)

		// The CL entity should have a new patchset and PM/RM should be notified.
		So(cl2.Snapshot.GetPatchset(), ShouldEqual, 3)
		ct.TQ.Run(ctx, tqtesting.StopWhenDrained())
		So(pm.byProject, ShouldResemble, map[string]map[common.CLID]int64{
			"luci-project": {cl.ID: cl2.EVersion},
		})
		So(rm.byRun, ShouldResemble, map[common.RunID]map[common.CLID]int64{
			runID: {cl.ID: cl2.EVersion},
		})

		///////////////////////////////////////////////////
		// Phase 3: update if backend detect a change    //
		///////////////////////////////////////////////////
		b.reset()
		b.fetchResult.Snapshot = proto.Clone(cl.Snapshot).(*Snapshot) // unchanged
		b.lookupACfgResult = cl.ApplicableConfig                      // unchanged
		b.backendSnapshotUpdated = true

		// Actually run the Updater.
		So(u.handleCL(ctx, &UpdateCLTask{
			LuciProject: "luci-project",
			ExternalId:  "fake/123",
		}), ShouldBeNil)
		cl3 := reloadCL(ctx, cl)

		// The CL entity have been updated
		So(cl3.EVersion, ShouldBeGreaterThan, cl2.EVersion)
		ct.TQ.Run(ctx, tqtesting.StopWhenDrained())
		So(pm.byProject, ShouldResemble, map[string]map[common.CLID]int64{
			"luci-project": {cl.ID: cl3.EVersion},
		})
		So(rm.byRun, ShouldResemble, map[common.RunID]map[common.CLID]int64{
			runID: {cl.ID: cl3.EVersion},
		})
	})
}

func TestUpdaterFetchedNoNewData(t *testing.T) {
	t.Parallel()

	Convey("Updater skips updating the CL when no new data is fetched", t, func() {
		ct := cvtesting.Test{}
		ctx, cancel := ct.SetUp(t)
		defer cancel()

		pm, rm, tj := pmMock{}, rmMock{}, tjMock{}
		u := NewUpdater(ct.TQDispatcher, NewMutator(ct.TQDispatcher, &pm, &rm, &tj))
		b := &fakeUpdaterBackend{}
		u.RegisterBackend(b)

		snap := &Snapshot{
			ExternalUpdateTime:    timestamppb.New(ct.Clock.Now()),
			Patchset:              2,
			MinEquivalentPatchset: 1,
			LuciProject:           "luci-project",
			Kind:                  nil, // but should be set in practice
		}
		acfg := &ApplicableConfig{Projects: []*ApplicableConfig_Project{
			{
				Name:           "luci-projectj",
				ConfigGroupIds: []string{"hash/old"},
			},
		}}
		// Put an existing CL.
		cl := ExternalID("fake/1").MustCreateIfNotExists(ctx)
		cl.ApplicableConfig = acfg
		cl.Snapshot = snap
		cl.EVersion++
		So(datastore.Put(ctx, cl), ShouldBeNil)

		Convey("updaterBackend is aware that there is no new data", func() {
			b.fetchResult = UpdateFields{}
		})
		Convey("updaterBackend is not aware that it fetched the exact same data", func() {
			b.fetchResult = UpdateFields{
				Snapshot:         snap,
				ApplicableConfig: acfg,
			}
		})

		err := u.handleCL(ctx, &UpdateCLTask{
			LuciProject: "luci-project",
			ExternalId:  "fake/1",
			Requester:   UpdateCLTask_PUBSUB_POLL})

		So(err, ShouldBeNil)

		// Check the monitoring data
		if b.fetchResult.IsEmpty() {
			// Empty fetched result implies that it didn't even perform
			// a fetch. Hence, no metrics should have been reported.
			So(ct.TSMonStore.GetAll(ctx), ShouldBeNil)
		} else {
			// This is the case where a fetch was performed but
			// the data was actually the same as the existing snapshot.
			So(ct.TSMonSentValue(ctx, metrics.Internal.CLIngestionAttempted,
				UpdateCLTask_PUBSUB_POLL.String(), // metric:requester,
				false,                             // metric:changed == false
				false,                             // metric:dep
				"luci-project",                    // metric:project,
				false,                             // metric:changed_snapshot == false
			), ShouldEqual, 1)
			So(ct.TSMonSentDistr(ctx, metrics.Internal.CLIngestionLatency,
				UpdateCLTask_PUBSUB_POLL.String(), // metric:requester,
				false,                             // metric:dep
				"luci-project",                    // metric:project,
				false,                             // metric:changed_snapshot == false,
			), ShouldBeNil)
			So(ct.TSMonSentDistr(ctx, metrics.Internal.CLIngestionLatencyWithoutFetch,
				UpdateCLTask_PUBSUB_POLL.String(), // metric:requester,
				false,                             // metric:dep
				"luci-project",                    // metric:project,
				false,                             // metric:changed_snapshot == false
			), ShouldBeNil)
		}

		// CL entity shouldn't change and notifications should not be emitted.
		cl2 := reloadCL(ctx, cl)
		So(cl2.EVersion, ShouldEqual, cl.EVersion)
		// CL Mutator guarantees that EVersion is bumped on every write, but check
		// the entire CL contents anyway in case there is a buggy by-pass of
		// Mutator somewhere.
		So(cl2, cvtesting.SafeShouldResemble, cl)
		So(ct.TQ.Tasks(), ShouldBeEmpty)
	})
}

func TestUpdaterAccessRestriction(t *testing.T) {
	t.Parallel()

	Convey("Updater works correctly when backend denies access to the CL", t, func() {
		// This is a long test, don't debug it first if other TestUpdater* tests are
		// also failing.
		ct := cvtesting.Test{}
		ctx, cancel := ct.SetUp(t)
		defer cancel()

		pm, rm, tj := pmMock{}, rmMock{}, tjMock{}
		u := NewUpdater(ct.TQDispatcher, NewMutator(ct.TQDispatcher, &pm, &rm, &tj))
		b := &fakeUpdaterBackend{}
		u.RegisterBackend(b)

		//////////////////////////////////////////////////////////////////////////
		// Phase 1: prepare an old CL previously fetched for another LUCI project.
		//////////////////////////////////////////////////////////////////////////

		longTimeAgo := ct.Clock.Now().Add(-180 * 24 * time.Hour)
		cl := ExternalID("fake/1").MustCreateIfNotExists(ctx)
		cl.Snapshot = &Snapshot{
			ExternalUpdateTime:    timestamppb.New(longTimeAgo),
			Patchset:              2,
			MinEquivalentPatchset: 1,
			LuciProject:           "previously-existing-project",
			Kind:                  nil, // but should be set in practice,
		}
		cl.ApplicableConfig = &ApplicableConfig{Projects: []*ApplicableConfig_Project{
			{
				Name:           "previously-existing-project",
				ConfigGroupIds: []string{"old-hash/old-name"},
			},
		}}
		alsoLongTimeAgo := longTimeAgo.Add(time.Minute)
		cl.Access = &Access{ByProject: map[string]*Access_Project{
			// One possibility is user makes a typo in the free-from Cq-Depend
			// footer and accidentally referenced a CL from totally different
			// project.
			"another-project-with-invalid-cl-deps": {NoAccessTime: timestamppb.New(alsoLongTimeAgo)},
		}}
		cl.EVersion++
		So(datastore.Put(ctx, cl), ShouldBeNil)

		//////////////////////////////////////////////////////////////////////////
		// Phase 2: simulate a Fetch which got access denied from backend.
		//////////////////////////////////////////////////////////////////////////

		b.fetchResult = UpdateFields{
			ApplicableConfig: &ApplicableConfig{Projects: []*ApplicableConfig_Project{
				// Note that the old project is no longer watching this CL.
				{
					Name:           "luci-project",
					ConfigGroupIds: []string{"hash/name"},
				},
			}},
			Snapshot: nil, // nothing was actually fetched.
			AddDependentMeta: &Access{ByProject: map[string]*Access_Project{
				"luci-project": {NoAccessTime: timestamppb.New(ct.Clock.Now())},
			}},
		}

		err := u.handleCL(ctx, &UpdateCLTask{LuciProject: "luci-project", ExternalId: "fake/1"})
		So(err, ShouldBeNil)

		// Resulting CL entity should keep the Snapshot, rewrite ApplicableConfig,
		// and merge Access.
		cl2 := reloadCL(ctx, cl)
		So(cl2.Snapshot, ShouldResembleProto, cl.Snapshot)
		So(cl2.ApplicableConfig, ShouldResembleProto, b.fetchResult.ApplicableConfig)
		So(cl2.Access, ShouldResembleProto, &Access{ByProject: map[string]*Access_Project{
			"another-project-with-invalid-cl-deps": {NoAccessTime: timestamppb.New(alsoLongTimeAgo)},
			"luci-project":                         {NoAccessTime: timestamppb.New(ct.Clock.Now())},
		}})
		// Notifications doesn't have to be sent to the project with invalid deps,
		// as this update is irrelevant to the project.
		ct.TQ.Run(ctx, tqtesting.StopWhenDrained())
		So(pm.byProject, ShouldResemble, map[string]map[common.CLID]int64{
			"luci-project":                {cl.ID: cl2.EVersion},
			"previously-existing-project": {cl.ID: cl2.EVersion},
		})

		//////////////////////////////////////////////////////////////////////////
		// Phase 3: backend ACLs are fixed.
		//////////////////////////////////////////////////////////////////////////
		ct.Clock.Add(time.Hour)
		b.reset()
		b.fetchResult = UpdateFields{
			Snapshot: &Snapshot{
				ExternalUpdateTime:    timestamppb.New(ct.Clock.Now()),
				Patchset:              4,
				MinEquivalentPatchset: 1,
				LuciProject:           "luci-project",
				Kind:                  nil, // but should be set in practice
			},
			ApplicableConfig: cl2.ApplicableConfig, // same as before
			DelAccess:        []string{"luci-project"},
		}
		err = u.handleCL(ctx, &UpdateCLTask{LuciProject: "luci-project", ExternalId: "fake/1"})
		So(err, ShouldBeNil)
		cl3 := reloadCL(ctx, cl)
		So(cl3.Snapshot, ShouldResembleProto, b.fetchResult.Snapshot)                      // replaced
		So(cl3.ApplicableConfig, ShouldResembleProto, cl2.ApplicableConfig)                // same
		So(cl3.Access, ShouldResembleProto, &Access{ByProject: map[string]*Access_Project{ // updated
			// No more "luci-project" entry.
			"another-project-with-invalid-cl-deps": {NoAccessTime: timestamppb.New(alsoLongTimeAgo)},
		}})
		// Notifications are still not sent to the project with invalid deps.
		ct.TQ.Run(ctx, tqtesting.StopWhenDrained())
		So(pm.byProject, ShouldResemble, map[string]map[common.CLID]int64{
			"luci-project":                {cl.ID: cl3.EVersion},
			"previously-existing-project": {cl.ID: cl3.EVersion},
		})
	})
}

func TestUpdaterHandlesErrors(t *testing.T) {
	t.Parallel()

	Convey("Updater handles errors", t, func() {
		ct := cvtesting.Test{}
		ctx, cancel := ct.SetUp(t)
		defer cancel()

		u := NewUpdater(ct.TQDispatcher, nil)

		Convey("bails permanently in cases which should not happen", func() {
			Convey("No ID given", func() {
				err := u.handleCL(ctx, &UpdateCLTask{
					LuciProject: "luci-project",
				})
				So(err, ShouldErrLike, "invalid task input")
				So(tq.Fatal.In(err), ShouldBeTrue)
			})
			Convey("No LUCI project given", func() {
				err := u.handleCL(ctx, &UpdateCLTask{
					ExternalId: "fake/1",
				})
				So(err, ShouldErrLike, "invalid task input")
				So(tq.Fatal.In(err), ShouldBeTrue)
			})
			Convey("Contradicting external and internal IDs", func() {
				cl1 := ExternalID("fake/1").MustCreateIfNotExists(ctx)
				cl2 := ExternalID("fake/2").MustCreateIfNotExists(ctx)
				err := u.handleCL(ctx, &UpdateCLTask{
					LuciProject: "luci-project",
					Id:          int64(cl1.ID),
					ExternalId:  string(cl2.ExternalID),
				})
				So(err, ShouldErrLike, "invalid task")
				So(tq.Fatal.In(err), ShouldBeTrue)
			})
			Convey("Internal ID doesn't actually exist", func() {
				// While in most cases this is a bug, it can happen in prod
				// if an old CL is being deleted due to data retention policy at the
				// same time as something else inside the CV is requesting a refresh of
				// the CL against external system. One example of this is if a new CL
				// mistakenly marked a very old CL as a dependency.
				err := u.handleCL(ctx, &UpdateCLTask{
					Id:          404,
					LuciProject: "luci-project",
				})
				So(err, ShouldErrLike, datastore.ErrNoSuchEntity)
				So(tq.Fatal.In(err), ShouldBeTrue)
			})
			Convey("CL from unregistered backend", func() {
				err := u.handleCL(ctx, &UpdateCLTask{
					ExternalId:  "unknown/404",
					LuciProject: "luci-project",
				})
				So(err, ShouldErrLike, "backend is not supported")
				So(tq.Fatal.In(err), ShouldBeTrue)
			})
		})

		Convey("Respects TQErrorSpec", func() {
			ignoreMe := errors.New("ignore-me")
			b := &fakeUpdaterBackend{
				tqErrorSpec: common.TQIfy{
					KnownIgnore: []error{ignoreMe},
				},
				fetchError: errors.Annotate(ignoreMe, "something went wrong").Err(),
			}
			u.RegisterBackend(b)
			err := u.handleCL(ctx, &UpdateCLTask{LuciProject: "lp", ExternalId: "fake/1"})
			So(tq.Ignore.In(err), ShouldBeTrue)
			So(err, ShouldErrLike, "ignore-me")
		})
	})
}

func TestUpdaterAvoidsFetchWhenPossible(t *testing.T) {
	t.Parallel()

	Convey("Updater skips fetching when possible", t, func() {
		ct := cvtesting.Test{}
		ctx, cancel := ct.SetUp(t)
		defer cancel()

		u := NewUpdater(ct.TQDispatcher, NewMutator(ct.TQDispatcher, &pmMock{}, &rmMock{}, &tjMock{}))
		b := &fakeUpdaterBackend{}
		u.RegisterBackend(b)

		// Simulate a perfect case for avoiding the snapshot.
		cl := ExternalID("fake/123").MustCreateIfNotExists(ctx)
		cl.Snapshot = &Snapshot{
			ExternalUpdateTime:    timestamppb.New(ct.Clock.Now()),
			Patchset:              2,
			MinEquivalentPatchset: 1,
			LuciProject:           "luci-project",
			Kind:                  nil, // but should be set in practice,
		}
		cl.ApplicableConfig = &ApplicableConfig{
			Projects: []*ApplicableConfig_Project{
				{
					Name:           "luci-project",
					ConfigGroupIds: []string{"hash/name"},
				},
			},
		}
		cl.EVersion++
		So(datastore.Put(ctx, cl), ShouldBeNil)

		task := &UpdateCLTask{
			LuciProject: "luci-project",
			ExternalId:  string(cl.ExternalID),
			Hint:        externalTime(ct.Clock.Now()),
		}
		// Typically, ApplicableConfig config (i.e. which LUCI project watch this
		// CL) doesn't change, too.
		b.lookupACfgResult = cl.ApplicableConfig

		Convey("skips Fetch", func() {
			Convey("happy path: everything is up to date", func() {
				So(u.handleCL(ctx, task), ShouldBeNil)

				cl2 := reloadCL(ctx, cl)
				// Quick-fail if EVersion changes.
				So(cl2.EVersion, ShouldEqual, cl.EVersion)
				// Ensure nothing about the CL actually changed.
				So(cl2, cvtesting.SafeShouldResemble, cl)

				So(b.wasLookupApplicableConfigCalled(), ShouldBeTrue)
				So(b.wasFetchCalled(), ShouldBeFalse)
			})

			Convey("special path: changed ApplicableConfig is saved", func() {
				Convey("CL is not watched by any project", func(c C) {
					b.lookupACfgResult = &ApplicableConfig{}
				})
				Convey("CL is watched by another project", func(c C) {
					b.lookupACfgResult = &ApplicableConfig{Projects: []*ApplicableConfig_Project{
						{
							Name:           "other-project",
							ConfigGroupIds: []string{"ohter-hash/other-name"},
						},
					}}
				})
				Convey("CL is additionally watched by another project", func(c C) {
					b.lookupACfgResult.Projects = append(b.lookupACfgResult.Projects, &ApplicableConfig_Project{
						Name:           "other-project",
						ConfigGroupIds: []string{"ohter-hash/other-name"},
					})
				})
				// Either way, fetch can be skipped & Snapshot can be preserved, but the
				// ApplicableConfig must be updated.
				So(u.handleCL(ctx, task), ShouldBeNil)
				So(b.wasFetchCalled(), ShouldBeFalse)
				cl2 := reloadCL(ctx, cl)
				So(cl2.Snapshot, ShouldResembleProto, cl.Snapshot)
				So(cl2.ApplicableConfig, ShouldResembleProto, b.lookupACfgResult)
			})

			Convey("meta_rev_id is the same", func() {
				Convey("even if the CL entity is really old", func(c C) {
					ct.Clock.Add(autoRefreshAfter + time.Minute)
				})

				cl.Snapshot.Kind = &Snapshot_Gerrit{Gerrit: &Gerrit{
					Info: &gerrit.ChangeInfo{MetaRevId: "deadbeef"},
				}}
				So(datastore.Put(ctx, cl), ShouldBeNil)
				task.Hint.MetaRevId = "deadbeef"
				So(u.handleCL(ctx, task), ShouldBeNil)
				So(b.wasFetchCalled(), ShouldBeFalse)
			})
		})

		Convey("doesn't skip Fetch because ...", func() {
			saveCLAndRun := func() {
				cl.EVersion++
				So(datastore.Put(ctx, cl), ShouldBeNil)
				So(u.handleCL(ctx, task), ShouldBeNil)
			}
			Convey("no snapshot", func(c C) {
				cl.Snapshot = nil
				saveCLAndRun()
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
			Convey("snapshot marked outdated", func(c C) {
				cl.Snapshot.Outdated = &Snapshot_Outdated{}
				saveCLAndRun()
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
			Convey("snapshot is definitely old", func(c C) {
				cl.Snapshot.ExternalUpdateTime.Seconds -= 3600
				saveCLAndRun()
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
			Convey("snapshot might be old", func(c C) {
				task.Hint = nil
				saveCLAndRun()
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
			Convey("CL entity is really old", func(c C) {
				ct.Clock.Add(autoRefreshAfter + time.Minute)
				saveCLAndRun()
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
			Convey("snapshot is for a different project", func(c C) {
				cl.Snapshot.LuciProject = "other"
				saveCLAndRun()
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
			Convey("backend isn't sure about applicable config", func(c C) {
				b.lookupACfgResult = nil
				saveCLAndRun()
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
			Convey("CL entity has record of prior access restriction", func(c C) {
				cl.Access = &Access{
					ByProject: map[string]*Access_Project{
						"luci-project": {
							// In practice, actual fields are set, but they aren't important
							// for this test.
						},
					},
				}
				saveCLAndRun()
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
			Convey("meta_rev_id is different", func() {
				cl.Snapshot.Kind = &Snapshot_Gerrit{Gerrit: &Gerrit{
					Info: &gerrit.ChangeInfo{MetaRevId: "deadbeef"},
				}}
				So(datastore.Put(ctx, cl), ShouldBeNil)
				task.Hint.MetaRevId = "foo"
				So(u.handleCL(ctx, task), ShouldBeNil)
				So(b.wasFetchCalled(), ShouldBeTrue)
			})
		})

		Convey("aborts before the Fetch because LookupApplicableConfig failed", func() {
			b.lookupACfgError = errors.New("boo", transient.Tag)
			err := u.handleCL(ctx, task)
			So(err, ShouldErrLike, b.lookupACfgError)
			So(b.wasFetchCalled(), ShouldBeFalse)
		})
	})
}

func TestUpdaterResolveAndScheduleDepsUpdate(t *testing.T) {
	t.Parallel()

	Convey("ResolveAndScheduleDepsUpdate correctly resolves deps", t, func() {
		ct := cvtesting.Test{}
		ctx, cancel := ct.SetUp(t)
		defer cancel()

		u := NewUpdater(ct.TQDispatcher, NewMutator(ct.TQDispatcher, &pmMock{}, &rmMock{}, &tjMock{}))

		scheduledUpdates := func() (out []string) {
			for _, p := range ct.TQ.Tasks().Payloads() {
				if task, ok := p.(*UpdateCLTask); ok {
					// Each scheduled task should have ID set, as it is known,
					// to save on future lookup.
					So(task.GetId(), ShouldNotEqual, 0)
					e := task.GetExternalId()
					// But also ExternalID, primarily for debugging.
					So(e, ShouldNotBeEmpty)
					out = append(out, e)
				}
			}
			sort.Strings(out)
			return out
		}
		eids := func(cls ...*CL) []string {
			out := make([]string, len(cls))
			for i, cl := range cls {
				out[i] = string(cl.ExternalID)
			}
			sort.Strings(out)
			return out
		}

		// Setup 4 existing CLs in various states.
		const lProject = "luci-project"
		// Various backend IDs are used here for test readability and debug-ability
		// only. In practice, all deps likely come from the same backend.
		var (
			clBareBones           = ExternalID("bare-bones/10").MustCreateIfNotExists(ctx)
			clOld                 = ExternalID("old/11").MustCreateIfNotExists(ctx)
			clUpToDate            = ExternalID("up-to-date/12").MustCreateIfNotExists(ctx)
			clUpToDateDiffProject = ExternalID("up-to-date-diff-project/13").MustCreateIfNotExists(ctx)
		)
		clOld.UpdateTime = datastore.RoundTime(ct.Clock.Now().Add(-autoRefreshAfter - time.Minute).UTC())
		clOld.Snapshot = &Snapshot{
			ExternalUpdateTime:    timestamppb.New(clOld.UpdateTime),
			Patchset:              1,
			MinEquivalentPatchset: 1,
			LuciProject:           lProject,
		}
		clUpToDate.Snapshot = proto.Clone(clOld.Snapshot).(*Snapshot)
		clUpToDate.Snapshot.ExternalUpdateTime = timestamppb.New(ct.Clock.Now())
		clUpToDateDiffProject.Snapshot = proto.Clone(clUpToDate.Snapshot).(*Snapshot)
		clUpToDateDiffProject.Snapshot.LuciProject = "other-project"
		So(datastore.Put(ctx, clOld, clUpToDate, clUpToDateDiffProject), ShouldBeNil)

		Convey("no deps", func() {
			deps, err := u.ResolveAndScheduleDepsUpdate(ctx, lProject, nil, UpdateCLTask_RUN_POKE)
			So(err, ShouldBeNil)
			So(deps, ShouldBeEmpty)
		})

		Convey("only existing CLs", func() {
			deps, err := u.ResolveAndScheduleDepsUpdate(ctx, lProject, map[ExternalID]DepKind{
				clBareBones.ExternalID:           DepKind_SOFT,
				clOld.ExternalID:                 DepKind_HARD,
				clUpToDate.ExternalID:            DepKind_HARD,
				clUpToDateDiffProject.ExternalID: DepKind_SOFT,
			}, UpdateCLTask_RUN_POKE)
			So(err, ShouldBeNil)
			So(deps, ShouldResembleProto, sortDeps([]*Dep{
				{Clid: int64(clBareBones.ID), Kind: DepKind_SOFT},
				{Clid: int64(clOld.ID), Kind: DepKind_HARD},
				{Clid: int64(clUpToDate.ID), Kind: DepKind_HARD},
				{Clid: int64(clUpToDateDiffProject.ID), Kind: DepKind_SOFT},
			}))
			// Update for the `clUpToDate` is not necessary.
			So(scheduledUpdates(), ShouldResemble, eids(clOld, clBareBones, clUpToDateDiffProject))
		})

		Convey("only new CLs", func() {
			deps, err := u.ResolveAndScheduleDepsUpdate(ctx, lProject, map[ExternalID]DepKind{
				"new/1": DepKind_SOFT,
				"new/2": DepKind_HARD,
			}, UpdateCLTask_RUN_POKE)
			So(err, ShouldBeNil)
			cl1 := ExternalID("new/1").MustCreateIfNotExists(ctx)
			cl2 := ExternalID("new/2").MustCreateIfNotExists(ctx)
			So(deps, ShouldResembleProto, sortDeps([]*Dep{
				{Clid: int64(cl1.ID), Kind: DepKind_SOFT},
				{Clid: int64(cl2.ID), Kind: DepKind_HARD},
			}))
			So(scheduledUpdates(), ShouldResemble, eids(cl1, cl2))
		})

		Convey("mix old and new CLs", func() {
			deps, err := u.ResolveAndScheduleDepsUpdate(ctx, lProject, map[ExternalID]DepKind{
				"new/1":                DepKind_SOFT,
				"new/2":                DepKind_HARD,
				clBareBones.ExternalID: DepKind_HARD,
				clUpToDate.ExternalID:  DepKind_SOFT,
			}, UpdateCLTask_RUN_POKE)
			So(err, ShouldBeNil)
			cl1 := ExternalID("new/1").MustCreateIfNotExists(ctx)
			cl2 := ExternalID("new/2").MustCreateIfNotExists(ctx)
			So(deps, ShouldResembleProto, sortDeps([]*Dep{
				{Clid: int64(cl1.ID), Kind: DepKind_SOFT},
				{Clid: int64(cl2.ID), Kind: DepKind_HARD},
				{Clid: int64(clBareBones.ID), Kind: DepKind_HARD},
				{Clid: int64(clUpToDate.ID), Kind: DepKind_SOFT},
			}))
			// Update for the `clUpToDate` is not necessary.
			So(scheduledUpdates(), ShouldResemble, eids(cl1, cl2, clBareBones))
		})

		Convey("high number of dependency CLs", func() {
			const clCount = 1024
			depCLMap := make(map[ExternalID]DepKind, clCount)
			depCLs := make([]*CL, clCount)
			for i := 0; i < clCount; i++ {
				depCLs[i] = ExternalID(fmt.Sprintf("high-dep-cl/%04d", i)).MustCreateIfNotExists(ctx)
				depCLMap[depCLs[i].ExternalID] = DepKind_HARD
			}

			deps, err := u.ResolveAndScheduleDepsUpdate(ctx, lProject, depCLMap, UpdateCLTask_RUN_POKE)
			So(err, ShouldBeNil)
			expectedDeps := make([]*Dep, clCount)
			for i, depCL := range depCLs {
				expectedDeps[i] = &Dep{
					Clid: int64(depCL.ID),
					Kind: DepKind_HARD,
				}
			}
			So(deps, ShouldResembleProto, expectedDeps)
			So(scheduledUpdates(), ShouldResemble, eids(depCLs...))
		})
	})
}

// fakeUpdaterBackend is a fake UpdaterBackend.
//
// It provides functionality which is a subset of what gomock would generate,
// but with additional assertions to validate the contract between Updater and
// its backend.
type fakeUpdaterBackend struct {
	tqErrorSpec common.TQIfy

	// LookupApplicableConfig related fields:

	lookupACfgCL     *CL // copy
	lookupACfgResult *ApplicableConfig
	lookupACfgError  error

	// Fetch related fields:
	fetchCL          *CL // copy
	fetchProject     string
	fetchUpdatedHint time.Time
	fetchResult      UpdateFields
	fetchError       error

	backendSnapshotUpdated bool
}

func (f *fakeUpdaterBackend) Kind() string {
	return "fake"
}

func (f *fakeUpdaterBackend) TQErrorSpec() common.TQIfy {
	return f.tqErrorSpec
}

func (f *fakeUpdaterBackend) wasLookupApplicableConfigCalled() bool {
	return f.lookupACfgCL != nil
}

func (f *fakeUpdaterBackend) LookupApplicableConfig(ctx context.Context, saved *CL) (*ApplicableConfig, error) {
	So(f.wasLookupApplicableConfigCalled(), ShouldBeFalse)

	// Check contract with a backend:
	So(saved, ShouldNotBeNil)
	So(saved.ID, ShouldNotEqual, 0)
	So(saved.ExternalID, ShouldNotBeEmpty)
	So(saved.Snapshot, ShouldNotBeNil)

	// Shallow-copy to catch some mistakes in test.
	f.lookupACfgCL = &CL{}
	*f.lookupACfgCL = *saved
	return f.lookupACfgResult, f.lookupACfgError
}

func (f *fakeUpdaterBackend) wasFetchCalled() bool {
	return f.fetchCL != nil
}

func (f *fakeUpdaterBackend) Fetch(ctx context.Context, in *FetchInput) (UpdateFields, error) {
	So(f.wasFetchCalled(), ShouldBeFalse)

	// Check contract with a backend:
	So(in.CL, ShouldNotBeNil)
	So(in.CL.ExternalID, ShouldNotBeEmpty)

	// Shallow-copy to catch some mistakes in test.
	f.fetchCL = &CL{}
	*f.fetchCL = *in.CL
	f.fetchProject = in.Project
	f.fetchUpdatedHint = in.UpdatedHint
	return f.fetchResult, f.fetchError
}

func (f *fakeUpdaterBackend) HasChanged(cvCurrent, backendCurrent *Snapshot) bool {
	switch {
	case backendCurrent == nil:
		panic("impossible. Backend must have a non-nil snapshot")
	case cvCurrent == nil:
		return true
	case backendCurrent.GetExternalUpdateTime().AsTime().After(cvCurrent.GetExternalUpdateTime().AsTime()):
		return true
	case backendCurrent.GetPatchset() > cvCurrent.GetPatchset():
		return true
	case f.backendSnapshotUpdated:
		return true
	default:
		return false
	}
}

// reset resets the fake for the next use.
func (f *fakeUpdaterBackend) reset() {
	*f = fakeUpdaterBackend{}
}

// reloadCL loads a new CL from Datastore.
//
// Doesn't re-use the object.
func reloadCL(ctx context.Context, cl *CL) *CL {
	ret := &CL{ID: cl.ID}
	if err := datastore.Get(ctx, ret); err != nil {
		panic(err)
	}
	return ret
}
