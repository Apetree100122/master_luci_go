// Copyright 2022 The LUCI Authors.
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

package resultingester

import (
	"time"

	"google.golang.org/protobuf/types/known/durationpb"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"go.chromium.org/luci/common/proto/mask"
	"go.chromium.org/luci/resultdb/pbutil"
	rdbpb "go.chromium.org/luci/resultdb/proto/v1"
)

var sampleVar = pbutil.Variant("k1", "v1")

var originalTmd = &rdbpb.TestMetadata{
	Name: "original_name",
	Location: &rdbpb.TestLocation{
		Repo:     "old_repo",
		FileName: "old_file_name",
		Line:     567,
	},
	BugComponent: &rdbpb.BugComponent{
		System: &rdbpb.BugComponent_Monorail{
			Monorail: &rdbpb.MonorailComponent{
				Project: "chrome",
				Value:   "Blink>Component",
			},
		},
	},
}

var updatedTmd = &rdbpb.TestMetadata{
	Name: "updated_name",
	Location: &rdbpb.TestLocation{
		Repo:     "repo",
		FileName: "file_name",
		Line:     456,
	},
	BugComponent: &rdbpb.BugComponent{
		System: &rdbpb.BugComponent_IssueTracker{
			IssueTracker: &rdbpb.IssueTrackerComponent{
				ComponentId: 12345,
			},
		},
	},
}

var testProperties = &structpb.Struct{
	Fields: map[string]*structpb.Value{
		"stringkey": structpb.NewStringValue("stringvalue"),
		"numberkey": structpb.NewNumberValue(123),
	},
}

func mockedQueryTestVariantsRsp() *rdbpb.QueryTestVariantsResponse {
	response := &rdbpb.QueryTestVariantsResponse{
		TestVariants: []*rdbpb.TestVariant{
			{
				TestId:      "ninja://test_consistent_failure",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_EXONERATED,
				Exonerations: []*rdbpb.TestExoneration{
					// Test behaviour in the presence of multiple exoneration reasons.
					{
						ExplanationHtml: "LUCI Analysis reported this test as flaky.",
						Reason:          rdbpb.ExonerationReason_OCCURS_ON_OTHER_CLS,
					},
					{
						ExplanationHtml: "Test is marked informational.",
						Reason:          rdbpb.ExonerationReason_NOT_CRITICAL,
					},
					{
						Reason: rdbpb.ExonerationReason_OCCURS_ON_MAINLINE,
					},
				},
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:    "one",
							Name:        "invocations/build-1234/tests/ninja%3A%2F%2Ftest_consistent_failure/results/one",
							Expected:    false,
							Status:      rdbpb.TestStatus_FAIL,
							SummaryHtml: "SummaryHTML",
							StartTime:   timestamppb.New(time.Date(2010, time.March, 1, 0, 0, 0, 0, time.UTC)),
							Duration:    durationpb.New(time.Second*3 + time.Microsecond),
							FailureReason: &rdbpb.FailureReason{
								PrimaryErrorMessage: "abc.def(123): unexpected nil-deference",
							},
							Properties: testProperties,
						},
					},
				},
				SourcesId: "sources1",
			},
			// Should ignore for test variant analysis.
			{
				TestId:      "ninja://test_expected",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_EXPECTED,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:  "one",
							Name:      "invocations/build-1234/tests/ninja%3A%2F%2Ftest_expected/results/one",
							StartTime: timestamppb.New(time.Date(2010, time.May, 1, 0, 0, 0, 0, time.UTC)),
							Status:    rdbpb.TestStatus_PASS,
							Expected:  true,
							Duration:  durationpb.New(time.Second * 5),
						},
					},
				},
			},
			{
				TestId:      "ninja://test_filtering_event",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_EXPECTED,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:   "one",
							Name:       "invocations/build-1234/tests/ninja%3A%2F%2Ftest_filtering_event/results/one",
							StartTime:  timestamppb.New(time.Date(2010, time.February, 2, 0, 0, 0, 0, time.UTC)),
							Status:     rdbpb.TestStatus_SKIP,
							SkipReason: rdbpb.SkipReason_AUTOMATICALLY_DISABLED_FOR_FLAKINESS,
							Expected:   true,
						},
					},
				},
			},
			{
				TestId:      "ninja://test_from_luci_bisection",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_UNEXPECTED,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId: "one",
							Name:     "invocations/build-1234/tests/ninja%3A%2F%2Ftest_from_luci_bisection/results/one",
							Status:   rdbpb.TestStatus_PASS,
							Expected: false,
							Tags:     pbutil.StringPairs("is_luci_bisection", "true"),
						},
					},
				},
			},
			{
				TestId:      "ninja://test_has_unexpected",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_FLAKY,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:  "one",
							Name:      "invocations/invocation-0b/tests/ninja%3A%2F%2Ftest_has_unexpected/results/one",
							StartTime: timestamppb.New(time.Date(2010, time.February, 1, 0, 0, 10, 0, time.UTC)),
							Status:    rdbpb.TestStatus_FAIL,
							Expected:  false,
						},
					},
					{
						Result: &rdbpb.TestResult{
							ResultId:  "two",
							Name:      "invocations/invocation-0a/tests/ninja%3A%2F%2Ftest_has_unexpected/results/two",
							StartTime: timestamppb.New(time.Date(2010, time.February, 1, 0, 0, 20, 0, time.UTC)),
							Status:    rdbpb.TestStatus_PASS,
							Expected:  true,
						},
					},
				},
			},
			{
				TestId:       "ninja://test_known_flake",
				VariantHash:  "hash_2",
				Status:       rdbpb.TestVariantStatus_UNEXPECTED,
				Variant:      pbutil.Variant("k1", "v2"),
				TestMetadata: updatedTmd,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:  "one",
							Name:      "invocations/build-1234/tests/ninja%3A%2F%2Ftest_known_flake/results/one",
							StartTime: timestamppb.New(time.Date(2010, time.February, 1, 0, 0, 0, 0, time.UTC)),
							Status:    rdbpb.TestStatus_FAIL,
							Expected:  false,
							Duration:  durationpb.New(time.Second * 2),
							Tags:      pbutil.StringPairs("os", "Mac", "monorail_component", "Monorail>Component"),
						},
					},
				},
			},
			{
				TestId:       "ninja://test_new_failure",
				VariantHash:  "hash_1",
				Status:       rdbpb.TestVariantStatus_UNEXPECTED,
				Variant:      pbutil.Variant("k1", "v1"),
				TestMetadata: updatedTmd,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:  "one",
							Name:      "invocations/build-1234/tests/ninja%3A%2F%2Ftest_new_failure/results/one",
							StartTime: timestamppb.New(time.Date(2010, time.January, 1, 0, 0, 0, 0, time.UTC)),
							Status:    rdbpb.TestStatus_FAIL,
							Expected:  false,
							Duration:  durationpb.New(time.Second * 1),
							Tags:      pbutil.StringPairs("random_tag", "random_tag_value", "monorail_component", "Monorail>Component"),
						},
					},
				},
			},
			{
				TestId:      "ninja://test_new_flake",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_FLAKY,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:  "two",
							Name:      "invocations/invocation-1234/tests/ninja%3A%2F%2Ftest_new_flake/results/two",
							StartTime: timestamppb.New(time.Date(2010, time.January, 1, 0, 0, 20, 0, time.UTC)),
							Status:    rdbpb.TestStatus_FAIL,
							Expected:  false,
							Duration:  durationpb.New(time.Second * 11),
						},
					},
					{
						Result: &rdbpb.TestResult{
							ResultId:  "one",
							Name:      "invocations/invocation-1234/tests/ninja%3A%2F%2Ftest_new_flake/results/one",
							StartTime: timestamppb.New(time.Date(2010, time.January, 1, 0, 0, 10, 0, time.UTC)),
							Status:    rdbpb.TestStatus_FAIL,
							Expected:  false,
							Duration:  durationpb.New(time.Second * 10),
						},
					},
					{
						Result: &rdbpb.TestResult{
							ResultId:  "three",
							Name:      "invocations/invocation-4567/tests/ninja%3A%2F%2Ftest_new_flake/results/three",
							StartTime: timestamppb.New(time.Date(2010, time.January, 1, 0, 0, 15, 0, time.UTC)),
							Status:    rdbpb.TestStatus_PASS,
							Expected:  true,
							Duration:  durationpb.New(time.Second * 12),
						},
					},
				},
			},
			{
				TestId:      "ninja://test_no_new_results",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_UNEXPECTED,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:  "one",
							Name:      "invocations/build-1234/tests/ninja%3A%2F%2Ftest_no_new_results/results/one",
							StartTime: timestamppb.New(time.Date(2010, time.April, 1, 0, 0, 0, 0, time.UTC)),
							Status:    rdbpb.TestStatus_FAIL,
							Expected:  false,
							Duration:  durationpb.New(time.Second * 4),
						},
					},
				},
			},
			// Should ignore for test variant analysis.
			{
				TestId:      "ninja://test_skip",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_UNEXPECTEDLY_SKIPPED,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId:  "one",
							Name:      "invocations/build-1234/tests/ninja%3A%2F%2Ftest_skip/results/one",
							StartTime: timestamppb.New(time.Date(2010, time.February, 2, 0, 0, 0, 0, time.UTC)),
							Status:    rdbpb.TestStatus_SKIP,
							Expected:  false,
						},
					},
				},
			},
			{
				TestId:      "ninja://test_unexpected_pass",
				VariantHash: "hash",
				Status:      rdbpb.TestVariantStatus_UNEXPECTED,
				Results: []*rdbpb.TestResultBundle{
					{
						Result: &rdbpb.TestResult{
							ResultId: "one",
							Name:     "invocations/build-1234/tests/ninja%3A%2F%2Ftest_unexpected_pass/results/one",
							Status:   rdbpb.TestStatus_PASS,
							Expected: false,
						},
					},
				},
			},
		},
		Sources: map[string]*rdbpb.Sources{
			"sources1": {
				GitilesCommit: &rdbpb.GitilesCommit{
					Host:       "project.googlesource.com",
					Project:    "myproject/src",
					Ref:        "refs/heads/main",
					CommitHash: "abcdefabcd1234567890abcdefabcd1234567890",
					Position:   16801,
				},
				Changelists: []*rdbpb.GerritChange{
					{
						Host:     "project-review.googlesource.com",
						Project:  "myproject/src2",
						Change:   9991,
						Patchset: 82,
					},
				},
				IsDirty: false,
			},
		},
	}

	isFieldNameJSON := false
	isUpdateMask := false
	m, err := mask.FromFieldMask(testVariantReadMask, &rdbpb.TestVariant{}, isFieldNameJSON, isUpdateMask)
	if err != nil {
		panic(err)
	}
	for _, tv := range response.TestVariants {
		if err := m.Trim(tv); err != nil {
			panic(err)
		}
	}
	return response
}
