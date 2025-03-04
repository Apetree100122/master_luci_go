/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { Duration } from "../../../../../google/protobuf/duration.pb";
import { Struct } from "../../../../../google/protobuf/struct.pb";
import { Timestamp } from "../../../../../google/protobuf/timestamp.pb";
import { StringPair, Variant } from "./common.pb";
import { FailureReason } from "./failure_reason.pb";
import { TestMetadata } from "./test_metadata.pb";

export const protobufPackage = "luci.resultdb.v1";

/** Machine-readable status of a test result. */
export enum TestStatus {
  /**
   * STATUS_UNSPECIFIED - Status was not specified.
   * Not to be used in actual test results; serves as a default value for an
   * unset field.
   */
  STATUS_UNSPECIFIED = 0,
  /** PASS - The test case has passed. */
  PASS = 1,
  /**
   * FAIL - The test case has failed.
   * Suggests that the code under test is incorrect, but it is also possible
   * that the test is incorrect or it is a flake.
   */
  FAIL = 2,
  /**
   * CRASH - The test case has crashed during execution.
   * The outcome is inconclusive: the code under test might or might not be
   * correct, but the test+code is incorrect.
   */
  CRASH = 3,
  /**
   * ABORT - The test case has started, but was aborted before finishing.
   * A common reason: timeout.
   */
  ABORT = 4,
  /**
   * SKIP - The test case did not execute.
   * Examples:
   * - The execution of the collection of test cases, such as a test
   *   binary, was aborted prematurely and execution of some test cases was
   *   skipped.
   * - The test harness configuration specified that the test case MUST be
   *   skipped.
   */
  SKIP = 5,
}

export function testStatusFromJSON(object: any): TestStatus {
  switch (object) {
    case 0:
    case "STATUS_UNSPECIFIED":
      return TestStatus.STATUS_UNSPECIFIED;
    case 1:
    case "PASS":
      return TestStatus.PASS;
    case 2:
    case "FAIL":
      return TestStatus.FAIL;
    case 3:
    case "CRASH":
      return TestStatus.CRASH;
    case 4:
    case "ABORT":
      return TestStatus.ABORT;
    case 5:
    case "SKIP":
      return TestStatus.SKIP;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum TestStatus");
  }
}

export function testStatusToJSON(object: TestStatus): string {
  switch (object) {
    case TestStatus.STATUS_UNSPECIFIED:
      return "STATUS_UNSPECIFIED";
    case TestStatus.PASS:
      return "PASS";
    case TestStatus.FAIL:
      return "FAIL";
    case TestStatus.CRASH:
      return "CRASH";
    case TestStatus.ABORT:
      return "ABORT";
    case TestStatus.SKIP:
      return "SKIP";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum TestStatus");
  }
}

/**
 * Machine-readable reason that a test execution was skipped.
 * Only reasons actually used are listed here, if you need a new reason
 * please add it here and send a CL to the OWNERS.
 */
export enum SkipReason {
  /**
   * UNSPECIFIED - Skip reason was not specified.
   * This represents an unset field which should be used for non-skip test
   * result statuses.  It can also be used if none of the other statuses
   * apply.
   */
  UNSPECIFIED = 0,
  /**
   * AUTOMATICALLY_DISABLED_FOR_FLAKINESS - Disabled automatically in response to a test skipping policy that skips
   * flaky tests.
   * Used for ChromeOS CQ test filtering.
   */
  AUTOMATICALLY_DISABLED_FOR_FLAKINESS = 1,
}

export function skipReasonFromJSON(object: any): SkipReason {
  switch (object) {
    case 0:
    case "SKIP_REASON_UNSPECIFIED":
      return SkipReason.UNSPECIFIED;
    case 1:
    case "AUTOMATICALLY_DISABLED_FOR_FLAKINESS":
      return SkipReason.AUTOMATICALLY_DISABLED_FOR_FLAKINESS;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum SkipReason");
  }
}

export function skipReasonToJSON(object: SkipReason): string {
  switch (object) {
    case SkipReason.UNSPECIFIED:
      return "SKIP_REASON_UNSPECIFIED";
    case SkipReason.AUTOMATICALLY_DISABLED_FOR_FLAKINESS:
      return "AUTOMATICALLY_DISABLED_FOR_FLAKINESS";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum SkipReason");
  }
}

/** Reason why a test variant was exonerated. */
export enum ExonerationReason {
  /**
   * UNSPECIFIED - Reason was not specified.
   * Not to be used in actual test exonerations; serves as a default value for
   * an unset field.
   */
  UNSPECIFIED = 0,
  /**
   * OCCURS_ON_MAINLINE - Similar unexpected results were observed on a mainline branch
   * (i.e. against a build without unsubmitted changes applied).
   * (For avoidance of doubt, this includes both flakily and
   * deterministically occurring unexpected results.)
   * Applies to unexpected results in presubmit/CQ runs only.
   */
  OCCURS_ON_MAINLINE = 1,
  /**
   * OCCURS_ON_OTHER_CLS - Similar unexpected results were observed in presubmit run(s) for other,
   * unrelated CL(s). (This is suggestive of the issue being present
   * on mainline but is not confirmed as there are possible confounding
   * factors, like how tests are run on CLs vs how tests are run on
   * mainline branches.)
   * Applies to unexpected results in presubmit/CQ runs only.
   */
  OCCURS_ON_OTHER_CLS = 2,
  /**
   * NOT_CRITICAL - The tests are not critical to the test subject (e.g. CL) passing.
   * This could be because more data is being collected to determine if
   * the tests are stable enough to be made critical (as is often the
   * case for experimental test suites).
   * If information exists indicating the tests are producing unexpected
   * results, and the tests are not critical for that reason,
   * prefer more specific reasons OCCURS_ON_MAINLINE or OCCURS_ON_OTHER_CLS.
   */
  NOT_CRITICAL = 3,
  /**
   * UNEXPECTED_PASS - The test result was an unexpected pass. (Note that such an exoneration is
   * not automatically created for unexpected passes, unless the option is
   * specified to ResultSink or the project manually creates one).
   */
  UNEXPECTED_PASS = 4,
}

export function exonerationReasonFromJSON(object: any): ExonerationReason {
  switch (object) {
    case 0:
    case "EXONERATION_REASON_UNSPECIFIED":
      return ExonerationReason.UNSPECIFIED;
    case 1:
    case "OCCURS_ON_MAINLINE":
      return ExonerationReason.OCCURS_ON_MAINLINE;
    case 2:
    case "OCCURS_ON_OTHER_CLS":
      return ExonerationReason.OCCURS_ON_OTHER_CLS;
    case 3:
    case "NOT_CRITICAL":
      return ExonerationReason.NOT_CRITICAL;
    case 4:
    case "UNEXPECTED_PASS":
      return ExonerationReason.UNEXPECTED_PASS;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ExonerationReason");
  }
}

export function exonerationReasonToJSON(object: ExonerationReason): string {
  switch (object) {
    case ExonerationReason.UNSPECIFIED:
      return "EXONERATION_REASON_UNSPECIFIED";
    case ExonerationReason.OCCURS_ON_MAINLINE:
      return "OCCURS_ON_MAINLINE";
    case ExonerationReason.OCCURS_ON_OTHER_CLS:
      return "OCCURS_ON_OTHER_CLS";
    case ExonerationReason.NOT_CRITICAL:
      return "NOT_CRITICAL";
    case ExonerationReason.UNEXPECTED_PASS:
      return "UNEXPECTED_PASS";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum ExonerationReason");
  }
}

/**
 * A result of a functional test case.
 * Often a single test case is executed multiple times and has multiple results,
 * a single test suite has multiple test cases,
 * and the same test suite can be executed in different variants
 * (OS, GPU, compile flags, etc).
 *
 * This message does not specify the test id.
 * It should be available in the message that embeds this message.
 *
 * Next id: 17.
 */
export interface TestResult {
  /**
   * Can be used to refer to this test result, e.g. in ResultDB.GetTestResult
   * RPC.
   * Format:
   * "invocations/{INVOCATION_ID}/tests/{URL_ESCAPED_TEST_ID}/results/{RESULT_ID}".
   * where URL_ESCAPED_TEST_ID is test_id escaped with
   * https://golang.org/pkg/net/url/#PathEscape See also https://aip.dev/122.
   *
   * Output only.
   */
  readonly name: string;
  /**
   * Test id, a unique identifier of the test in a LUCI project.
   * Regex: ^[[::print::]]{1,512}$
   *
   * If two tests have a common test id prefix that ends with a
   * non-alphanumeric character, they considered a part of a group. Examples:
   * - "a/b/c"
   * - "a/b/d"
   * - "a/b/e:x"
   * - "a/b/e:y"
   * - "a/f"
   * This defines the following groups:
   * - All items belong to one group because of the common prefix "a/"
   * - Within that group, the first 4 form a sub-group because of the common
   *   prefix "a/b/"
   * - Within that group, "a/b/e:x" and "a/b/e:y" form a sub-group because of
   *   the common prefix "a/b/e:".
   * This can be used in UI.
   * LUCI does not interpret test ids in any other way.
   */
  readonly testId: string;
  /**
   * Identifies a test result in a given invocation and test id.
   * Regex: ^[a-z0-9\-_.]{1,32}$
   */
  readonly resultId: string;
  /**
   * Description of one specific way of running the test,
   * e.g. a specific bucket, builder and a test suite.
   */
  readonly variant:
    | Variant
    | undefined;
  /**
   * Whether the result of test case execution is expected.
   * In a typical Chromium CL, 99%+ of test results are expected.
   * Users are typically interested only in the unexpected results.
   *
   * An unexpected result != test case failure. There are test cases that are
   * expected to fail/skip/crash. The test harness compares the actual status
   * with the expected one(s) and this field is the result of the comparison.
   */
  readonly expected: boolean;
  /**
   * Machine-readable status of the test case.
   * MUST NOT be STATUS_UNSPECIFIED.
   */
  readonly status: TestStatus;
  /**
   * Human-readable explanation of the result, in HTML.
   * MUST be sanitized before rendering in the browser.
   *
   * The size of the summary must be equal to or smaller than 4096 bytes in
   * UTF-8.
   *
   * Supports artifact embedding using custom tags:
   * * <text-artifact> renders contents of an artifact as text.
   *   Usage:
   *   * To embed result level artifact: <text-artifact
   *   artifact-id="<artifact_id>">
   *   * To embed invocation level artifact: <text-artifact
   *   artifact-id="<artifact_id>" inv-level>
   */
  readonly summaryHtml: string;
  /** The point in time when the test case started to execute. */
  readonly startTime:
    | string
    | undefined;
  /**
   * Duration of the test case execution.
   * MUST be equal to or greater than 0.
   */
  readonly duration:
    | Duration
    | undefined;
  /**
   * Metadata for this test result.
   * It might describe this particular execution or the test case.
   * A key can be repeated.
   */
  readonly tags: readonly StringPair[];
  /**
   * Hash of the variant.
   * hex(sha256(sorted(''.join('%s:%s\n' for k, v in variant.items())))).
   *
   * Output only.
   */
  readonly variantHash: string;
  /** Information about the test at the time of its execution. */
  readonly testMetadata:
    | TestMetadata
    | undefined;
  /** Information about the test failure. Only present if the test failed. */
  readonly failureReason:
    | FailureReason
    | undefined;
  /**
   * Arbitrary JSON object that contains structured, domain-specific properties
   * of the test result.
   *
   * The serialized size must be <= 4096 bytes.
   */
  readonly properties:
    | { readonly [key: string]: any }
    | undefined;
  /**
   * Whether the test result has been masked so that it includes only metadata.
   * The metadata fields for a TestResult are:
   * * name
   * * test_id
   * * result_id
   * * expected
   * * status
   * * start_time
   * * duration
   * * variant_hash
   * * failure_reason.primary_error_message (truncated to 140 characters)
   *
   * Output only.
   */
  readonly isMasked: boolean;
  /**
   * Reasoning behind a test skip, in machine-readable form.
   * Used to assist downstream analyses, such as automatic bug-filing.
   * MUST not be set unless status is SKIP.
   */
  readonly skipReason: SkipReason;
}

/**
 * Indicates the test subject (e.g. a CL) is absolved from blame
 * for an unexpected result of a test variant.
 * For example, the test variant fails both with and without CL, so it is not
 * CL's fault.
 */
export interface TestExoneration {
  /**
   * Can be used to refer to this test exoneration, e.g. in
   * ResultDB.GetTestExoneration RPC.
   * Format:
   * invocations/{INVOCATION_ID}/tests/{URL_ESCAPED_TEST_ID}/exonerations/{EXONERATION_ID}.
   * URL_ESCAPED_TEST_ID is test_variant.test_id escaped with
   * https://golang.org/pkg/net/url/#PathEscape See also https://aip.dev/122.
   *
   * Output only.
   */
  readonly name: string;
  /** Test identifier, see TestResult.test_id. */
  readonly testId: string;
  /**
   * Description of the variant of the test, see Variant type.
   * Unlike TestResult.extra_variant_pairs, this one must be a full definition
   * of the variant, i.e. it is not combined with Invocation.base_test_variant.
   */
  readonly variant:
    | Variant
    | undefined;
  /**
   * Identifies an exoneration in a given invocation and test id.
   * It is server-generated.
   */
  readonly exonerationId: string;
  /**
   * Reasoning behind the exoneration, in HTML.
   * MUST be sanitized before rendering in the browser.
   */
  readonly explanationHtml: string;
  /**
   * Hash of the variant.
   * hex(sha256(sorted(''.join('%s:%s\n' for k, v in variant.items())))).
   */
  readonly variantHash: string;
  /**
   * Reasoning behind the exoneration, in machine-readable form.
   * Used to assist downstream analyses, such as automatic bug-filing.
   * This allow detection of e.g. critical tests failing in presubmit,
   * even if they are being exonerated because they fail on other CLs.
   */
  readonly reason: ExonerationReason;
  /**
   * Whether the test exoneration has been masked so that it includes only
   * metadata. The metadata fields for a TestExoneration are:
   * * name
   * * test_id
   * * exoneration_id
   * * variant_hash
   * * explanation_html
   * * reason
   *
   * Output only.
   */
  readonly isMasked: boolean;
}

function createBaseTestResult(): TestResult {
  return {
    name: "",
    testId: "",
    resultId: "",
    variant: undefined,
    expected: false,
    status: 0,
    summaryHtml: "",
    startTime: undefined,
    duration: undefined,
    tags: [],
    variantHash: "",
    testMetadata: undefined,
    failureReason: undefined,
    properties: undefined,
    isMasked: false,
    skipReason: 0,
  };
}

export const TestResult = {
  encode(message: TestResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.testId !== "") {
      writer.uint32(18).string(message.testId);
    }
    if (message.resultId !== "") {
      writer.uint32(26).string(message.resultId);
    }
    if (message.variant !== undefined) {
      Variant.encode(message.variant, writer.uint32(34).fork()).ldelim();
    }
    if (message.expected === true) {
      writer.uint32(40).bool(message.expected);
    }
    if (message.status !== 0) {
      writer.uint32(48).int32(message.status);
    }
    if (message.summaryHtml !== "") {
      writer.uint32(58).string(message.summaryHtml);
    }
    if (message.startTime !== undefined) {
      Timestamp.encode(toTimestamp(message.startTime), writer.uint32(66).fork()).ldelim();
    }
    if (message.duration !== undefined) {
      Duration.encode(message.duration, writer.uint32(74).fork()).ldelim();
    }
    for (const v of message.tags) {
      StringPair.encode(v!, writer.uint32(82).fork()).ldelim();
    }
    if (message.variantHash !== "") {
      writer.uint32(98).string(message.variantHash);
    }
    if (message.testMetadata !== undefined) {
      TestMetadata.encode(message.testMetadata, writer.uint32(106).fork()).ldelim();
    }
    if (message.failureReason !== undefined) {
      FailureReason.encode(message.failureReason, writer.uint32(114).fork()).ldelim();
    }
    if (message.properties !== undefined) {
      Struct.encode(Struct.wrap(message.properties), writer.uint32(122).fork()).ldelim();
    }
    if (message.isMasked === true) {
      writer.uint32(128).bool(message.isMasked);
    }
    if (message.skipReason !== 0) {
      writer.uint32(144).int32(message.skipReason);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TestResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTestResult() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.testId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.resultId = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.variant = Variant.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.expected = reader.bool();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.status = reader.int32() as any;
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.summaryHtml = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.startTime = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.duration = Duration.decode(reader, reader.uint32());
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.tags.push(StringPair.decode(reader, reader.uint32()));
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.variantHash = reader.string();
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.testMetadata = TestMetadata.decode(reader, reader.uint32());
          continue;
        case 14:
          if (tag !== 114) {
            break;
          }

          message.failureReason = FailureReason.decode(reader, reader.uint32());
          continue;
        case 15:
          if (tag !== 122) {
            break;
          }

          message.properties = Struct.unwrap(Struct.decode(reader, reader.uint32()));
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.isMasked = reader.bool();
          continue;
        case 18:
          if (tag !== 144) {
            break;
          }

          message.skipReason = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TestResult {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      testId: isSet(object.testId) ? globalThis.String(object.testId) : "",
      resultId: isSet(object.resultId) ? globalThis.String(object.resultId) : "",
      variant: isSet(object.variant) ? Variant.fromJSON(object.variant) : undefined,
      expected: isSet(object.expected) ? globalThis.Boolean(object.expected) : false,
      status: isSet(object.status) ? testStatusFromJSON(object.status) : 0,
      summaryHtml: isSet(object.summaryHtml) ? globalThis.String(object.summaryHtml) : "",
      startTime: isSet(object.startTime) ? globalThis.String(object.startTime) : undefined,
      duration: isSet(object.duration) ? Duration.fromJSON(object.duration) : undefined,
      tags: globalThis.Array.isArray(object?.tags) ? object.tags.map((e: any) => StringPair.fromJSON(e)) : [],
      variantHash: isSet(object.variantHash) ? globalThis.String(object.variantHash) : "",
      testMetadata: isSet(object.testMetadata) ? TestMetadata.fromJSON(object.testMetadata) : undefined,
      failureReason: isSet(object.failureReason) ? FailureReason.fromJSON(object.failureReason) : undefined,
      properties: isObject(object.properties) ? object.properties : undefined,
      isMasked: isSet(object.isMasked) ? globalThis.Boolean(object.isMasked) : false,
      skipReason: isSet(object.skipReason) ? skipReasonFromJSON(object.skipReason) : 0,
    };
  },

  toJSON(message: TestResult): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.testId !== "") {
      obj.testId = message.testId;
    }
    if (message.resultId !== "") {
      obj.resultId = message.resultId;
    }
    if (message.variant !== undefined) {
      obj.variant = Variant.toJSON(message.variant);
    }
    if (message.expected === true) {
      obj.expected = message.expected;
    }
    if (message.status !== 0) {
      obj.status = testStatusToJSON(message.status);
    }
    if (message.summaryHtml !== "") {
      obj.summaryHtml = message.summaryHtml;
    }
    if (message.startTime !== undefined) {
      obj.startTime = message.startTime;
    }
    if (message.duration !== undefined) {
      obj.duration = Duration.toJSON(message.duration);
    }
    if (message.tags?.length) {
      obj.tags = message.tags.map((e) => StringPair.toJSON(e));
    }
    if (message.variantHash !== "") {
      obj.variantHash = message.variantHash;
    }
    if (message.testMetadata !== undefined) {
      obj.testMetadata = TestMetadata.toJSON(message.testMetadata);
    }
    if (message.failureReason !== undefined) {
      obj.failureReason = FailureReason.toJSON(message.failureReason);
    }
    if (message.properties !== undefined) {
      obj.properties = message.properties;
    }
    if (message.isMasked === true) {
      obj.isMasked = message.isMasked;
    }
    if (message.skipReason !== 0) {
      obj.skipReason = skipReasonToJSON(message.skipReason);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TestResult>, I>>(base?: I): TestResult {
    return TestResult.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TestResult>, I>>(object: I): TestResult {
    const message = createBaseTestResult() as any;
    message.name = object.name ?? "";
    message.testId = object.testId ?? "";
    message.resultId = object.resultId ?? "";
    message.variant = (object.variant !== undefined && object.variant !== null)
      ? Variant.fromPartial(object.variant)
      : undefined;
    message.expected = object.expected ?? false;
    message.status = object.status ?? 0;
    message.summaryHtml = object.summaryHtml ?? "";
    message.startTime = object.startTime ?? undefined;
    message.duration = (object.duration !== undefined && object.duration !== null)
      ? Duration.fromPartial(object.duration)
      : undefined;
    message.tags = object.tags?.map((e) => StringPair.fromPartial(e)) || [];
    message.variantHash = object.variantHash ?? "";
    message.testMetadata = (object.testMetadata !== undefined && object.testMetadata !== null)
      ? TestMetadata.fromPartial(object.testMetadata)
      : undefined;
    message.failureReason = (object.failureReason !== undefined && object.failureReason !== null)
      ? FailureReason.fromPartial(object.failureReason)
      : undefined;
    message.properties = object.properties ?? undefined;
    message.isMasked = object.isMasked ?? false;
    message.skipReason = object.skipReason ?? 0;
    return message;
  },
};

function createBaseTestExoneration(): TestExoneration {
  return {
    name: "",
    testId: "",
    variant: undefined,
    exonerationId: "",
    explanationHtml: "",
    variantHash: "",
    reason: 0,
    isMasked: false,
  };
}

export const TestExoneration = {
  encode(message: TestExoneration, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.testId !== "") {
      writer.uint32(18).string(message.testId);
    }
    if (message.variant !== undefined) {
      Variant.encode(message.variant, writer.uint32(26).fork()).ldelim();
    }
    if (message.exonerationId !== "") {
      writer.uint32(34).string(message.exonerationId);
    }
    if (message.explanationHtml !== "") {
      writer.uint32(42).string(message.explanationHtml);
    }
    if (message.variantHash !== "") {
      writer.uint32(50).string(message.variantHash);
    }
    if (message.reason !== 0) {
      writer.uint32(56).int32(message.reason);
    }
    if (message.isMasked === true) {
      writer.uint32(64).bool(message.isMasked);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TestExoneration {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTestExoneration() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.testId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.variant = Variant.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.exonerationId = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.explanationHtml = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.variantHash = reader.string();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.reason = reader.int32() as any;
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.isMasked = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TestExoneration {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      testId: isSet(object.testId) ? globalThis.String(object.testId) : "",
      variant: isSet(object.variant) ? Variant.fromJSON(object.variant) : undefined,
      exonerationId: isSet(object.exonerationId) ? globalThis.String(object.exonerationId) : "",
      explanationHtml: isSet(object.explanationHtml) ? globalThis.String(object.explanationHtml) : "",
      variantHash: isSet(object.variantHash) ? globalThis.String(object.variantHash) : "",
      reason: isSet(object.reason) ? exonerationReasonFromJSON(object.reason) : 0,
      isMasked: isSet(object.isMasked) ? globalThis.Boolean(object.isMasked) : false,
    };
  },

  toJSON(message: TestExoneration): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.testId !== "") {
      obj.testId = message.testId;
    }
    if (message.variant !== undefined) {
      obj.variant = Variant.toJSON(message.variant);
    }
    if (message.exonerationId !== "") {
      obj.exonerationId = message.exonerationId;
    }
    if (message.explanationHtml !== "") {
      obj.explanationHtml = message.explanationHtml;
    }
    if (message.variantHash !== "") {
      obj.variantHash = message.variantHash;
    }
    if (message.reason !== 0) {
      obj.reason = exonerationReasonToJSON(message.reason);
    }
    if (message.isMasked === true) {
      obj.isMasked = message.isMasked;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TestExoneration>, I>>(base?: I): TestExoneration {
    return TestExoneration.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TestExoneration>, I>>(object: I): TestExoneration {
    const message = createBaseTestExoneration() as any;
    message.name = object.name ?? "";
    message.testId = object.testId ?? "";
    message.variant = (object.variant !== undefined && object.variant !== null)
      ? Variant.fromPartial(object.variant)
      : undefined;
    message.exonerationId = object.exonerationId ?? "";
    message.explanationHtml = object.explanationHtml ?? "";
    message.variantHash = object.variantHash ?? "";
    message.reason = object.reason ?? 0;
    message.isMasked = object.isMasked ?? false;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function toTimestamp(dateStr: string): Timestamp {
  const date = new globalThis.Date(dateStr);
  const seconds = Math.trunc(date.getTime() / 1_000).toString();
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): string {
  let millis = (globalThis.Number(t.seconds) || 0) * 1_000;
  millis += (t.nanos || 0) / 1_000_000;
  return new globalThis.Date(millis).toISOString();
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
