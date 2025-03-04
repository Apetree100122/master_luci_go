// Copyright 2023 The LUCI Authors.
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

package imports

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.chromium.org/luci/auth_service/impl/info"
	"go.chromium.org/luci/auth_service/impl/model"
	"go.chromium.org/luci/auth_service/testsupport"
	"go.chromium.org/luci/gae/filter/txndefer"
	"go.chromium.org/luci/gae/impl/memory"
	"go.chromium.org/luci/gae/service/datastore"

	"go.chromium.org/luci/server/auth"
	"go.chromium.org/luci/server/auth/authtest"
	"go.chromium.org/luci/server/router"
	"go.chromium.org/luci/server/tq"

	"github.com/julienschmidt/httprouter"
	. "github.com/smartystreets/goconvey/convey"
	. "go.chromium.org/luci/common/testing/assertions"
)

func TestIngestTarball(t *testing.T) {
	t.Parallel()

	callEndpoint := func(ctx context.Context, tarballName string, body io.ReadCloser) ([]byte, error) {
		rw := httptest.NewRecorder()

		rctx := &router.Context{
			Writer: rw,
			Request: (&http.Request{
				Method: "PUT",
				Body:   body,
			}).WithContext(ctx),
			Params: []httprouter.Param{
				{
					Key:   "tarballName",
					Value: tarballName,
				},
			},
		}

		if err := HandleTarballIngestHandler(rctx); err != nil {
			return nil, err
		}
		return rw.Body.Bytes(), nil
	}

	ctx := auth.WithState(memory.Use(context.Background()), &authtest.FakeState{
		Identity: "user:test-user@example.com",
	})
	ctx = info.SetImageVersion(ctx, "test-version")
	ctx, taskScheduler := tq.TestingContext(txndefer.FilterRDS(ctx), nil)

	datastore.Put(ctx, &model.GroupImporterConfig{
		Kind: "GroupImporterConfig",
		ID:   "config",
		ConfigProto: `
		tarball_upload {
			name: "test_groups.tar.gz"
			authorized_uploader: "test-user@example.com"
			systems: "test"
		}
		`,
		ConfigRevision: []byte("some-config-revision"),
		ModifiedBy:     "some-user@example.com",
		ModifiedTS:     time.Date(2021, time.August, 16, 12, 20, 0, 0, time.UTC),
	})

	datastore.Put(ctx, &model.AuthDBSnapshotLatest{
		Kind:         "AuthDBSnapshotLatest",
		ID:           "latest",
		AuthDBRev:    42,
		AuthDBSha256: "test-sha",
		ModifiedTS:   time.Date(2021, time.August, 16, 12, 20, 0, 0, time.UTC),
	})

	Convey("Test tarball", t, func() {
		Convey("Empty tarball", func() {
			_, err := callEndpoint(ctx, "test_groups.tar.gz", io.NopCloser(bytes.NewReader(nil)))
			So(err, ShouldErrLike, "bad tarball: EOF")
		})

		Convey("Happy", func() {
			tarfile := testsupport.BuildTargz(map[string][]byte{
				"at_root":      []byte("a\nb"),
				"test/group-1": []byte("a@example.com\nb@example.com"),
				"test/group-2": []byte("a@example.com\nb@example.com"),
			})

			res, err := callEndpoint(ctx, "test_groups.tar.gz", io.NopCloser(bytes.NewReader(tarfile)))
			So(err, ShouldBeNil)

			actual := GroupsJSON{}

			json.Unmarshal(res, &actual)

			expected := GroupsJSON{
				Groups: []string{
					"test/group-1",
					"test/group-2",
				},
				AuthDBRev: 1,
			}
			So(actual, ShouldResemble, expected)
			So(taskScheduler.Tasks(), ShouldHaveLength, 2)
		})
	})
}
