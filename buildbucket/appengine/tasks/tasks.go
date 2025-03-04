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

// Package tasks contains task queue implementations.
package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"

	"go.chromium.org/luci/common/errors"
	"go.chromium.org/luci/common/logging"
	"go.chromium.org/luci/server/tq"

	"go.chromium.org/luci/buildbucket/appengine/internal/resultdb"
	taskdefs "go.chromium.org/luci/buildbucket/appengine/tasks/defs"
	pb "go.chromium.org/luci/buildbucket/proto"

	// Enable datastore transactional tasks support.
	_ "go.chromium.org/luci/server/tq/txn/datastore"
)

// rejectionHandler returns a tq.Handler which rejects the given task.
// Used by tasks which are handled in Python.
// TODO(crbug/1042991): Remove once all handlers are implemented in Go.
func rejectionHandler(tq string) tq.Handler {
	return func(ctx context.Context, payload proto.Message) error {
		logging.Errorf(ctx, "tried to handle %s: %q", tq, payload)
		return errors.Reason("handler called").Err()
	}
}

func init() {
	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "cancel-backend-task",
		Kind:      tq.FollowsContext,
		Prototype: (*taskdefs.CancelBackendTask)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.CancelBackendTask)
			return HandleCancelBackendTask(ctx, t.Project, t.Target, t.TaskId)
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID: "cancel-swarming-task",
		Custom: func(ctx context.Context, m proto.Message) (*tq.CustomPayload, error) {
			task := m.(*taskdefs.CancelSwarmingTask)
			body, err := json.Marshal(map[string]any{
				"hostname": task.Hostname,
				"task_id":  task.TaskId,
				"realm":    task.Realm,
			})
			if err != nil {
				return nil, errors.Annotate(err, "error marshaling payload").Err()
			}
			return &tq.CustomPayload{
				Body:        body,
				Method:      "POST",
				RelativeURI: fmt.Sprintf("/internal/task/buildbucket/cancel_swarming_task/%s/%s", task.Hostname, task.TaskId),
			}, nil
		},
		Handler:   rejectionHandler("cancel-swarming-task"),
		Kind:      tq.FollowsContext,
		Prototype: (*taskdefs.CancelSwarmingTask)(nil),
		Queue:     "backend-default",
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "cancel-swarming-task-go",
		Kind:      tq.FollowsContext,
		Prototype: (*taskdefs.CancelSwarmingTaskGo)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.CancelSwarmingTaskGo)
			return HandleCancelSwarmingTask(ctx, t.Hostname, t.TaskId, t.Realm)
		},
	})

	// TODO(crbug.com/1328646): Delete it after swarming-build-create migration is done.
	tq.RegisterTaskClass(tq.TaskClass{
		ID: "create-swarming-task",
		Custom: func(ctx context.Context, m proto.Message) (*tq.CustomPayload, error) {
			task := m.(*taskdefs.CreateSwarmingTask)
			body, err := json.Marshal(map[string]any{
				"generation": 0,
				"id":         task.BuildId,
			})
			if err != nil {
				return nil, errors.Annotate(err, "error marshaling payload").Err()
			}
			return &tq.CustomPayload{
				Body:        body,
				Method:      "POST",
				RelativeURI: fmt.Sprintf("/internal/task/swarming/sync-build/%d", task.BuildId),
			}, nil
		},
		Handler:   rejectionHandler("create-swarming-task"),
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.CreateSwarmingTask)(nil),
		Queue:     "swarming-build-create",
	})

	// TODO(crbug.com/1356766): remove it after bq-exporter runs in Go.
	tq.RegisterTaskClass(tq.TaskClass{
		ID: "export-bigquery",
		Custom: func(ctx context.Context, m proto.Message) (*tq.CustomPayload, error) {
			task := m.(*taskdefs.ExportBigQuery)
			body, err := json.Marshal(map[string]any{
				"id": task.BuildId,
			})
			if err != nil {
				return nil, errors.Annotate(err, "error marshaling payload").Err()
			}
			return &tq.CustomPayload{
				Body:        body,
				Method:      "POST",
				RelativeURI: fmt.Sprintf("/internal/task/bq/export/%d", task.BuildId),
			}, nil
		},
		Handler:   rejectionHandler("export-bigquery"),
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.ExportBigQuery)(nil),
		Queue:     "backend-default",
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID: "finalize-resultdb",
		Custom: func(ctx context.Context, m proto.Message) (*tq.CustomPayload, error) {
			task := m.(*taskdefs.FinalizeResultDB)
			body, err := json.Marshal(map[string]any{
				"id": task.BuildId,
			})
			if err != nil {
				return nil, errors.Annotate(err, "error marshaling payload").Err()
			}
			return &tq.CustomPayload{
				Body:        body,
				Method:      "POST",
				RelativeURI: fmt.Sprintf("/internal/task/resultdb/finalize/%d", task.BuildId),
			}, nil
		},
		Handler:   rejectionHandler("finalize-resultdb"),
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.FinalizeResultDB)(nil),
		Queue:     "backend-default",
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "finalize-resultdb-go",
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.FinalizeResultDBGo)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.FinalizeResultDBGo)
			return resultdb.FinalizeInvocation(ctx, t.BuildId)
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID: "notify-pubsub",
		Custom: func(ctx context.Context, m proto.Message) (*tq.CustomPayload, error) {
			task := m.(*taskdefs.NotifyPubSub)
			mode := "global"
			if task.Callback {
				mode = "callback"
			}
			body, err := json.Marshal(map[string]any{
				"id":   task.BuildId,
				"mode": mode,
			})
			if err != nil {
				return nil, errors.Annotate(err, "error marshaling payload").Err()
			}
			return &tq.CustomPayload{
				Body:        body,
				Method:      "POST",
				RelativeURI: fmt.Sprintf("/internal/task/buildbucket/notify/%d", task.BuildId),
			}, nil
		},
		Handler:   rejectionHandler("notify-pubsub"),
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.NotifyPubSub)(nil),
		Queue:     "backend-default",
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "notify-pubsub-go",
		Kind:      tq.FollowsContext,
		Prototype: (*taskdefs.NotifyPubSubGo)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.NotifyPubSubGo)
			return PublishBuildsV2Notification(ctx, t.BuildId, t.Topic, t.Callback)
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "notify-pubsub-go-proxy",
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.NotifyPubSubGoProxy)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.NotifyPubSubGoProxy)
			return EnqueueNotifyPubSubGo(ctx, t.BuildId, t.Project)
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "builds_v2",
		Kind:      tq.NonTransactional,
		Prototype: (*pb.BuildsV2PubSub)(nil),
		Topic:     "builds_v2",
		Custom: func(ctx context.Context, m proto.Message) (*tq.CustomPayload, error) {
			t := m.(*pb.BuildsV2PubSub)
			blob, err := (protojson.MarshalOptions{Indent: "\t"}).Marshal(m)
			if err != nil {
				logging.Errorf(ctx, "failed to marshal builds_v2 pubsub message body - %s", err)
				return nil, err
			}
			return &tq.CustomPayload{
				Body: blob,
				Meta: generateBuildsV2Attributes(t.Build),
			}, nil
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "cancel-build",
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.CancelBuildTask)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.CancelBuildTask)
			_, err := Cancel(ctx, t.BuildId)
			return err
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "create-swarming-task-go",
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.CreateSwarmingBuildTask)(nil),
		Queue:     "swarming-build-create-go",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.CreateSwarmingBuildTask)
			return SyncBuild(ctx, t.GetBuildId(), 0)
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "create-backend-task-go",
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.CreateBackendBuildTask)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.CreateBackendBuildTask)
			return CreateBackendTask(ctx, t.GetBuildId(), t.GetRequestId())
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "sync-swarming-task-go",
		Kind:      tq.NonTransactional,
		Prototype: (*taskdefs.SyncSwarmingBuildTask)(nil),
		Queue:     "swarming-build-sync-go",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.SyncSwarmingBuildTask)
			return SyncBuild(ctx, t.GetBuildId(), t.GetGeneration())
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "export-bigquery-go",
		Kind:      tq.Transactional,
		Prototype: (*taskdefs.ExportBigQueryGo)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.ExportBigQueryGo)
			return ExportBuild(ctx, t.BuildId)
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "sync-builds-with-backend-tasks",
		Kind:      tq.NonTransactional,
		Prototype: (*taskdefs.SyncBuildsWithBackendTasks)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.SyncBuildsWithBackendTasks)
			return SyncBuildsWithBackendTasks(ctx, t.Backend, t.Project)
		},
	})

	tq.RegisterTaskClass(tq.TaskClass{
		ID:        "check-build-liveness",
		Kind:      tq.FollowsContext,
		Prototype: (*taskdefs.CheckBuildLiveness)(nil),
		Queue:     "backend-go-default",
		Handler: func(ctx context.Context, payload proto.Message) error {
			t := payload.(*taskdefs.CheckBuildLiveness)
			return CheckLiveness(ctx, t.BuildId, t.HeartbeatTimeout)
		},
	})
}

// CancelBackendTask enqueues a task queue task to cancel the given Backend
// task.
func CancelBackendTask(ctx context.Context, task *taskdefs.CancelBackendTask) error {
	switch {
	case task.Project == "":
		return errors.Reason("project is required").Err()
	case task.TaskId == "":
		return errors.Reason("task_id is required").Err()
	case task.Target == "":
		return errors.Reason("task target is required").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Payload: task,
	})
}

// CancelSwarmingTask enqueues a task queue task to cancel the given Swarming
// task.
func CancelSwarmingTask(ctx context.Context, task *taskdefs.CancelSwarmingTaskGo) error {
	switch {
	case task.GetHostname() == "":
		return errors.Reason("hostname is required").Err()
	case task.TaskId == "":
		return errors.Reason("task_id is required").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Payload: task,
	})
}

// CreateSwarmingTask enqueues a task queue task to create a Swarming task from
// the given build.
func CreateSwarmingTask(ctx context.Context, task *taskdefs.CreateSwarmingTask) error {
	if task.GetBuildId() == 0 {
		return errors.Reason("build_id is required").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Payload: task,
	})
}

// CreateSwarmingBuildTask enqueues a Cloud Tasks task to create a Swarming task
// from the given build.
func CreateSwarmingBuildTask(ctx context.Context, task *taskdefs.CreateSwarmingBuildTask) error {
	if task.GetBuildId() == 0 {
		return errors.Reason("build_id is required").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Title:   fmt.Sprintf("create-swarming-task-%d", task.BuildId),
		Payload: task,
	})
}

// CreateBackendBuildTask enqueues a Cloud Tasks task to create a backend task
// from the given build.
func CreateBackendBuildTask(ctx context.Context, task *taskdefs.CreateBackendBuildTask) error {
	if task.GetBuildId() == 0 {
		return errors.Reason("build_id is required").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Title:   fmt.Sprintf("create-backend-task-%d", task.BuildId),
		Payload: task,
	})
}

// SyncSwarmingBuildTask enqueues a Cloud Tasks task to sync the Swarming task
// with the given build.
func SyncSwarmingBuildTask(ctx context.Context, task *taskdefs.SyncSwarmingBuildTask, delay time.Duration) error {
	switch {
	case task.GetBuildId() == 0:
		return errors.Reason("build_id is required").Err()
	case task.GetGeneration() == 0:
		return errors.Reason("generation should be larger than 0").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Title:            fmt.Sprintf("sync-swarming-task-%d", task.BuildId),
		Payload:          task,
		Delay:            delay,
		DeduplicationKey: fmt.Sprintf("%d-%d", task.BuildId, task.Generation),
	})
}

// ExportBigQuery enqueues a task queue task to export the given build to Bq.
// TODO(crbug.com/1356766): routeToGo will be removed once migration is done.
func ExportBigQuery(ctx context.Context, buildID int64, routeToGo bool) error {
	if buildID <= 0 {
		return errors.Reason("build_id is invalid").Err()
	}
	if routeToGo {
		return tq.AddTask(ctx, &tq.Task{
			Payload: &taskdefs.ExportBigQueryGo{BuildId: buildID},
		})
	}
	return tq.AddTask(ctx, &tq.Task{
		Payload: &taskdefs.ExportBigQuery{BuildId: buildID},
	})
}

// FinalizeResultDB enqueues a task queue task to finalize the invocation for
// the given build in ResultDB.
func FinalizeResultDB(ctx context.Context, task *taskdefs.FinalizeResultDBGo) error {
	if task.GetBuildId() == 0 {
		return errors.Reason("build_id is required").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Payload: task,
	})
}

// SyncWithBackend enqueues a task queue task to sync builds in one project
// running on a backend.
func SyncWithBackend(ctx context.Context, backend, project string) error {
	switch {
	case backend == "":
		return errors.Reason("backend is required").Err()
	case project == "":
		return errors.Reason("project is required").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Payload: &taskdefs.SyncBuildsWithBackendTasks{
			Backend: backend,
			Project: project,
		},
	})
}

// CheckBuildLiveness enqueues a task queue task to check a build's liveness.
func CheckBuildLiveness(ctx context.Context, buildID int64, heartbeatTimeout uint32, delay time.Duration) error {
	if buildID <= 0 {
		return errors.Reason("build_id is invalid").Err()
	}
	return tq.AddTask(ctx, &tq.Task{
		Payload: &taskdefs.CheckBuildLiveness{
			BuildId:          buildID,
			HeartbeatTimeout: heartbeatTimeout,
		},
		Delay: delay,
	})
}
