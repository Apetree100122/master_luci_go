/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { Timestamp } from "../../../../../google/protobuf/timestamp.pb";

export const protobufPackage = "luci.analysis.v1";

/**
 * BuildStatus the result of the build in which the test verdict was produced.
 * This can be used to detect if the test verdict is incomplete (e.g. because
 * an infra failure or cancellation occurred), and whether the unexpected
 * test verdict was also followed by a failing build.
 *
 * Note: All values prefixed with BUILD_STATUS_ as the names are generic
 * and likely to conflict with other/future enumerations otherwise.
 * See https://google.aip.dev/126.
 */
export enum BuildStatus {
  /** UNSPECIFIED - A build must not have this status. */
  UNSPECIFIED = 0,
  /** SUCCESS - The build succeeded. */
  SUCCESS = 1,
  /** FAILURE - The build failed. */
  FAILURE = 2,
  /** INFRA_FAILURE - The build encountered an infrastructure failure. */
  INFRA_FAILURE = 3,
  /** CANCELED - The build was canceled. */
  CANCELED = 4,
}

export function buildStatusFromJSON(object: any): BuildStatus {
  switch (object) {
    case 0:
    case "BUILD_STATUS_UNSPECIFIED":
      return BuildStatus.UNSPECIFIED;
    case 1:
    case "BUILD_STATUS_SUCCESS":
      return BuildStatus.SUCCESS;
    case 2:
    case "BUILD_STATUS_FAILURE":
      return BuildStatus.FAILURE;
    case 3:
    case "BUILD_STATUS_INFRA_FAILURE":
      return BuildStatus.INFRA_FAILURE;
    case 4:
    case "BUILD_STATUS_CANCELED":
      return BuildStatus.CANCELED;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum BuildStatus");
  }
}

export function buildStatusToJSON(object: BuildStatus): string {
  switch (object) {
    case BuildStatus.UNSPECIFIED:
      return "BUILD_STATUS_UNSPECIFIED";
    case BuildStatus.SUCCESS:
      return "BUILD_STATUS_SUCCESS";
    case BuildStatus.FAILURE:
      return "BUILD_STATUS_FAILURE";
    case BuildStatus.INFRA_FAILURE:
      return "BUILD_STATUS_INFRA_FAILURE";
    case BuildStatus.CANCELED:
      return "BUILD_STATUS_CANCELED";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum BuildStatus");
  }
}

/**
 * ExonerationReason captures a reason why a test failure was
 * exonerated. Exonerated means the failure was ignored and did not
 * have further impact, in terms of causing the build to fail or
 * rejecting the CL being tested in a presubmit run.
 *
 * Based on https://source.chromium.org/chromium/infra/infra/+/main:go/src/go.chromium.org/luci/resultdb/proto/v1/test_result.proto?q=ExonerationReason&type=cs.
 */
export enum ExonerationReason {
  /** UNSPECIFIED - A test failure must not have this status. */
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
 * SubmittedFilter filters test verdicts based on whether they had unsubmitted
 * changes.
 */
export enum SubmittedFilter {
  /** UNSPECIFIED - Default value. Include all test verdicts. */
  UNSPECIFIED = 0,
  /** ONLY_SUBMITTED - Only include test verdicts that don't have unsubmitted changes. */
  ONLY_SUBMITTED = 1,
  /** ONLY_UNSUBMITTED - Only include test verdicts that have unsubmitted changes. */
  ONLY_UNSUBMITTED = 2,
}

export function submittedFilterFromJSON(object: any): SubmittedFilter {
  switch (object) {
    case 0:
    case "SUBMITTED_FILTER_UNSPECIFIED":
      return SubmittedFilter.UNSPECIFIED;
    case 1:
    case "ONLY_SUBMITTED":
      return SubmittedFilter.ONLY_SUBMITTED;
    case 2:
    case "ONLY_UNSUBMITTED":
      return SubmittedFilter.ONLY_UNSUBMITTED;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum SubmittedFilter");
  }
}

export function submittedFilterToJSON(object: SubmittedFilter): string {
  switch (object) {
    case SubmittedFilter.UNSPECIFIED:
      return "SUBMITTED_FILTER_UNSPECIFIED";
    case SubmittedFilter.ONLY_SUBMITTED:
      return "ONLY_SUBMITTED";
    case SubmittedFilter.ONLY_UNSUBMITTED:
      return "ONLY_UNSUBMITTED";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum SubmittedFilter");
  }
}

/**
 * PresubmitRunMode describes the mode of a presubmit run. Currently
 * based on LUCI CV run mode enumeration at
 * https://source.chromium.org/chromium/infra/infra/+/main:go/src/go.chromium.org/luci/cv/api/bigquery/v1/attempt.proto?q=QUICK_DRY_RUN&type=cs.
 */
export enum PresubmitRunMode {
  /** UNSPECIFIED - A presubmit run must not have this status. */
  UNSPECIFIED = 0,
  /** DRY_RUN - Run all tests but do not submit. */
  DRY_RUN = 1,
  /** FULL_RUN - Run all tests and potentially submit. */
  FULL_RUN = 2,
  /** QUICK_DRY_RUN - Run some tests but do not submit. */
  QUICK_DRY_RUN = 3,
  /** NEW_PATCHSET_RUN - Runs some tests on patchset upload but do not submit. */
  NEW_PATCHSET_RUN = 4,
}

export function presubmitRunModeFromJSON(object: any): PresubmitRunMode {
  switch (object) {
    case 0:
    case "PRESUBMIT_RUN_MODE_UNSPECIFIED":
      return PresubmitRunMode.UNSPECIFIED;
    case 1:
    case "DRY_RUN":
      return PresubmitRunMode.DRY_RUN;
    case 2:
    case "FULL_RUN":
      return PresubmitRunMode.FULL_RUN;
    case 3:
    case "QUICK_DRY_RUN":
      return PresubmitRunMode.QUICK_DRY_RUN;
    case 4:
    case "NEW_PATCHSET_RUN":
      return PresubmitRunMode.NEW_PATCHSET_RUN;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum PresubmitRunMode");
  }
}

export function presubmitRunModeToJSON(object: PresubmitRunMode): string {
  switch (object) {
    case PresubmitRunMode.UNSPECIFIED:
      return "PRESUBMIT_RUN_MODE_UNSPECIFIED";
    case PresubmitRunMode.DRY_RUN:
      return "DRY_RUN";
    case PresubmitRunMode.FULL_RUN:
      return "FULL_RUN";
    case PresubmitRunMode.QUICK_DRY_RUN:
      return "QUICK_DRY_RUN";
    case PresubmitRunMode.NEW_PATCHSET_RUN:
      return "NEW_PATCHSET_RUN";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum PresubmitRunMode");
  }
}

/**
 * PresubmitRunStatus is the ending status of a presubmit run.
 *
 * Note: All values prefixed with PRESUBMIT_RUN_STATUS_ as the names are
 * generic and likely to conflict with other/future enumerations otherwise.
 * See https://google.aip.dev/126.
 *
 * Based on https://source.chromium.org/chromium/infra/infra/+/main:go/src/go.chromium.org/luci/cv/internal/run/storage.proto;l=28?q=LUCI%20CV%20status%20lang:proto.
 */
export enum PresubmitRunStatus {
  /** UNSPECIFIED - A build must not have this status. */
  UNSPECIFIED = 0,
  /** SUCCEEDED - The run succeeded. */
  SUCCEEDED = 1,
  /** FAILED - The run failed. */
  FAILED = 2,
  /** CANCELED - The run was canceled. */
  CANCELED = 3,
}

export function presubmitRunStatusFromJSON(object: any): PresubmitRunStatus {
  switch (object) {
    case 0:
    case "PRESUBMIT_RUN_STATUS_UNSPECIFIED":
      return PresubmitRunStatus.UNSPECIFIED;
    case 1:
    case "PRESUBMIT_RUN_STATUS_SUCCEEDED":
      return PresubmitRunStatus.SUCCEEDED;
    case 2:
    case "PRESUBMIT_RUN_STATUS_FAILED":
      return PresubmitRunStatus.FAILED;
    case 3:
    case "PRESUBMIT_RUN_STATUS_CANCELED":
      return PresubmitRunStatus.CANCELED;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum PresubmitRunStatus");
  }
}

export function presubmitRunStatusToJSON(object: PresubmitRunStatus): string {
  switch (object) {
    case PresubmitRunStatus.UNSPECIFIED:
      return "PRESUBMIT_RUN_STATUS_UNSPECIFIED";
    case PresubmitRunStatus.SUCCEEDED:
      return "PRESUBMIT_RUN_STATUS_SUCCEEDED";
    case PresubmitRunStatus.FAILED:
      return "PRESUBMIT_RUN_STATUS_FAILED";
    case PresubmitRunStatus.CANCELED:
      return "PRESUBMIT_RUN_STATUS_CANCELED";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum PresubmitRunStatus");
  }
}

/** A range of timestamps. */
export interface TimeRange {
  /** The oldest timestamp to include in the range. */
  readonly earliest:
    | string
    | undefined;
  /** Include only timestamps that are strictly older than this. */
  readonly latest: string | undefined;
}

/** Identity of a test result. */
export interface TestResultId {
  /**
   * The test results system.
   * Currently, the only valid value is "resultdb".
   */
  readonly system: string;
  /**
   * ID for the test result in the test results system.
   * For test results in ResultDB, the format is:
   * "invocations/{INVOCATION_ID}/tests/{URL_ESCAPED_TEST_ID}/results/{RESULT_ID}"
   * Where INVOCATION_ID, URL_ESCAPED_TEST_ID and RESULT_ID are values defined
   * in ResultDB.
   */
  readonly id: string;
}

/**
 * Variant represents a way of running a test case.
 *
 * The same test case can be executed in different ways, for example on
 * different OS, GPUs, with different compile options or runtime flags.
 */
export interface Variant {
  /**
   * The definition of the variant. Each key-value pair represents a
   * parameter describing how the test was run (e.g. OS, GPU, etc.).
   */
  readonly def: { [key: string]: string };
}

export interface Variant_DefEntry {
  readonly key: string;
  readonly value: string;
}

export interface StringPair {
  /**
   * Regex: ^[a-z][a-z0-9_]*(/[a-z][a-z0-9_]*)*$
   * Max length: 64.
   */
  readonly key: string;
  /** Max length: 256. */
  readonly value: string;
}

/** Identity of a bug tracking component in a bug tracking system. */
export interface BugTrackingComponent {
  /**
   * The bug tracking system corresponding to this test case, as identified
   * by the test results system.
   * Currently, the valid values are "monorail" or "buganizer".
   */
  readonly system: string;
  /**
   * The bug tracking component corresponding to this test case, as identified
   * by the test results system.
   * If the bug tracking system is monorail, this is the component as the
   * user would see it, e.g. "Infra>Test>Flakiness". For monorail, the bug
   * tracking project (e.g. "chromium") is not encoded, but assumed to be
   * specified in the project's LUCI Analysis configuration.
   */
  readonly component: string;
}

/** Identity of a presubmit run (also known as a "CQ Run" or "CV Run"). */
export interface PresubmitRunId {
  /**
   * The system that was used to process the presubmit run.
   * Currently, the only valid value is "luci-cv" for LUCI Commit Verifier
   * (LUCI CV).
   */
  readonly system: string;
  /**
   * Identity of the presubmit run.
   * If the presubmit system is LUCI CV, the format of this value is:
   *   "{LUCI_PROJECT}/{LUCI_CV_ID}", e.g.
   *   "infra/8988819463854-1-f94732fe20056fd1".
   */
  readonly id: string;
}

/** Identity of a bug in a bug-tracking system. */
export interface AssociatedBug {
  /**
   * System is the bug tracking system of the bug. This is either
   * "monorail" or "buganizer".
   */
  readonly system: string;
  /**
   * Id is the bug tracking system-specific identity of the bug.
   * For monorail, the scheme is {project}/{numeric_id}, for
   * buganizer the scheme is {numeric_id}.
   */
  readonly id: string;
  /**
   * A human-readable name for the bug. This is typically the
   * bug shortlink (e.g. "crbug.com/1234567").
   */
  readonly linkText: string;
  /**
   * The resolved bug URL, e.g.
   * E.g. "https://bugs.chromium.org/p/chromium/issues/detail?id=123456".
   */
  readonly url: string;
}

/**
 * ClusterId represents the identity of a cluster. The LUCI Project is
 * omitted as it is assumed to be implicit from the context.
 *
 * This is often used in place of the resource name of the cluster
 * (in the sense of https://google.aip.dev/122) as clients may need
 * to access individual parts of the resource name (e.g. to determine
 * the algorithm used) and it is not desirable to make clients parse
 * the resource name.
 */
export interface ClusterId {
  /**
   * Algorithm is the name of the clustering algorithm that identified
   * the cluster.
   */
  readonly algorithm: string;
  /**
   * Id is the cluster identifier returned by the algorithm. The underlying
   * identifier is at most 16 bytes, but is represented here as a hexadecimal
   * string of up to 32 lowercase hexadecimal characters.
   */
  readonly id: string;
}

/** Represents a reference in a source control system. */
export interface SourceRef {
  /** A branch in gitiles repository. */
  readonly gitiles?: GitilesRef | undefined;
}

/** Represents a branch in a gitiles repository. */
export interface GitilesRef {
  /** The gitiles host, e.g. "chromium.googlesource.com". */
  readonly host: string;
  /** The project on the gitiles host, e.g. "chromium/src". */
  readonly project: string;
  /**
   * Commit ref, e.g. "refs/heads/main" from which the commit was fetched.
   * Not the branch name, use "refs/heads/branch"
   */
  readonly ref: string;
}

function createBaseTimeRange(): TimeRange {
  return { earliest: undefined, latest: undefined };
}

export const TimeRange = {
  encode(message: TimeRange, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.earliest !== undefined) {
      Timestamp.encode(toTimestamp(message.earliest), writer.uint32(10).fork()).ldelim();
    }
    if (message.latest !== undefined) {
      Timestamp.encode(toTimestamp(message.latest), writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TimeRange {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTimeRange() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.earliest = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.latest = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TimeRange {
    return {
      earliest: isSet(object.earliest) ? globalThis.String(object.earliest) : undefined,
      latest: isSet(object.latest) ? globalThis.String(object.latest) : undefined,
    };
  },

  toJSON(message: TimeRange): unknown {
    const obj: any = {};
    if (message.earliest !== undefined) {
      obj.earliest = message.earliest;
    }
    if (message.latest !== undefined) {
      obj.latest = message.latest;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TimeRange>, I>>(base?: I): TimeRange {
    return TimeRange.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TimeRange>, I>>(object: I): TimeRange {
    const message = createBaseTimeRange() as any;
    message.earliest = object.earliest ?? undefined;
    message.latest = object.latest ?? undefined;
    return message;
  },
};

function createBaseTestResultId(): TestResultId {
  return { system: "", id: "" };
}

export const TestResultId = {
  encode(message: TestResultId, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.system !== "") {
      writer.uint32(10).string(message.system);
    }
    if (message.id !== "") {
      writer.uint32(18).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TestResultId {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTestResultId() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.system = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TestResultId {
    return {
      system: isSet(object.system) ? globalThis.String(object.system) : "",
      id: isSet(object.id) ? globalThis.String(object.id) : "",
    };
  },

  toJSON(message: TestResultId): unknown {
    const obj: any = {};
    if (message.system !== "") {
      obj.system = message.system;
    }
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TestResultId>, I>>(base?: I): TestResultId {
    return TestResultId.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<TestResultId>, I>>(object: I): TestResultId {
    const message = createBaseTestResultId() as any;
    message.system = object.system ?? "";
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseVariant(): Variant {
  return { def: {} };
}

export const Variant = {
  encode(message: Variant, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.def).forEach(([key, value]) => {
      Variant_DefEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Variant {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVariant() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = Variant_DefEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.def[entry1.key] = entry1.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Variant {
    return {
      def: isObject(object.def)
        ? Object.entries(object.def).reduce<{ [key: string]: string }>((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: Variant): unknown {
    const obj: any = {};
    if (message.def) {
      const entries = Object.entries(message.def);
      if (entries.length > 0) {
        obj.def = {};
        entries.forEach(([k, v]) => {
          obj.def[k] = v;
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Variant>, I>>(base?: I): Variant {
    return Variant.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Variant>, I>>(object: I): Variant {
    const message = createBaseVariant() as any;
    message.def = Object.entries(object.def ?? {}).reduce<{ [key: string]: string }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = globalThis.String(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseVariant_DefEntry(): Variant_DefEntry {
  return { key: "", value: "" };
}

export const Variant_DefEntry = {
  encode(message: Variant_DefEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Variant_DefEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVariant_DefEntry() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Variant_DefEntry {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : "",
      value: isSet(object.value) ? globalThis.String(object.value) : "",
    };
  },

  toJSON(message: Variant_DefEntry): unknown {
    const obj: any = {};
    if (message.key !== "") {
      obj.key = message.key;
    }
    if (message.value !== "") {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Variant_DefEntry>, I>>(base?: I): Variant_DefEntry {
    return Variant_DefEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Variant_DefEntry>, I>>(object: I): Variant_DefEntry {
    const message = createBaseVariant_DefEntry() as any;
    message.key = object.key ?? "";
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseStringPair(): StringPair {
  return { key: "", value: "" };
}

export const StringPair = {
  encode(message: StringPair, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StringPair {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStringPair() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StringPair {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : "",
      value: isSet(object.value) ? globalThis.String(object.value) : "",
    };
  },

  toJSON(message: StringPair): unknown {
    const obj: any = {};
    if (message.key !== "") {
      obj.key = message.key;
    }
    if (message.value !== "") {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<StringPair>, I>>(base?: I): StringPair {
    return StringPair.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<StringPair>, I>>(object: I): StringPair {
    const message = createBaseStringPair() as any;
    message.key = object.key ?? "";
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseBugTrackingComponent(): BugTrackingComponent {
  return { system: "", component: "" };
}

export const BugTrackingComponent = {
  encode(message: BugTrackingComponent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.system !== "") {
      writer.uint32(10).string(message.system);
    }
    if (message.component !== "") {
      writer.uint32(18).string(message.component);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BugTrackingComponent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBugTrackingComponent() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.system = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.component = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BugTrackingComponent {
    return {
      system: isSet(object.system) ? globalThis.String(object.system) : "",
      component: isSet(object.component) ? globalThis.String(object.component) : "",
    };
  },

  toJSON(message: BugTrackingComponent): unknown {
    const obj: any = {};
    if (message.system !== "") {
      obj.system = message.system;
    }
    if (message.component !== "") {
      obj.component = message.component;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BugTrackingComponent>, I>>(base?: I): BugTrackingComponent {
    return BugTrackingComponent.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BugTrackingComponent>, I>>(object: I): BugTrackingComponent {
    const message = createBaseBugTrackingComponent() as any;
    message.system = object.system ?? "";
    message.component = object.component ?? "";
    return message;
  },
};

function createBasePresubmitRunId(): PresubmitRunId {
  return { system: "", id: "" };
}

export const PresubmitRunId = {
  encode(message: PresubmitRunId, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.system !== "") {
      writer.uint32(10).string(message.system);
    }
    if (message.id !== "") {
      writer.uint32(18).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PresubmitRunId {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePresubmitRunId() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.system = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PresubmitRunId {
    return {
      system: isSet(object.system) ? globalThis.String(object.system) : "",
      id: isSet(object.id) ? globalThis.String(object.id) : "",
    };
  },

  toJSON(message: PresubmitRunId): unknown {
    const obj: any = {};
    if (message.system !== "") {
      obj.system = message.system;
    }
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<PresubmitRunId>, I>>(base?: I): PresubmitRunId {
    return PresubmitRunId.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<PresubmitRunId>, I>>(object: I): PresubmitRunId {
    const message = createBasePresubmitRunId() as any;
    message.system = object.system ?? "";
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseAssociatedBug(): AssociatedBug {
  return { system: "", id: "", linkText: "", url: "" };
}

export const AssociatedBug = {
  encode(message: AssociatedBug, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.system !== "") {
      writer.uint32(10).string(message.system);
    }
    if (message.id !== "") {
      writer.uint32(18).string(message.id);
    }
    if (message.linkText !== "") {
      writer.uint32(26).string(message.linkText);
    }
    if (message.url !== "") {
      writer.uint32(34).string(message.url);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AssociatedBug {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAssociatedBug() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.system = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.id = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.linkText = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.url = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): AssociatedBug {
    return {
      system: isSet(object.system) ? globalThis.String(object.system) : "",
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      linkText: isSet(object.linkText) ? globalThis.String(object.linkText) : "",
      url: isSet(object.url) ? globalThis.String(object.url) : "",
    };
  },

  toJSON(message: AssociatedBug): unknown {
    const obj: any = {};
    if (message.system !== "") {
      obj.system = message.system;
    }
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.linkText !== "") {
      obj.linkText = message.linkText;
    }
    if (message.url !== "") {
      obj.url = message.url;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<AssociatedBug>, I>>(base?: I): AssociatedBug {
    return AssociatedBug.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<AssociatedBug>, I>>(object: I): AssociatedBug {
    const message = createBaseAssociatedBug() as any;
    message.system = object.system ?? "";
    message.id = object.id ?? "";
    message.linkText = object.linkText ?? "";
    message.url = object.url ?? "";
    return message;
  },
};

function createBaseClusterId(): ClusterId {
  return { algorithm: "", id: "" };
}

export const ClusterId = {
  encode(message: ClusterId, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.algorithm !== "") {
      writer.uint32(10).string(message.algorithm);
    }
    if (message.id !== "") {
      writer.uint32(18).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClusterId {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClusterId() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.algorithm = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClusterId {
    return {
      algorithm: isSet(object.algorithm) ? globalThis.String(object.algorithm) : "",
      id: isSet(object.id) ? globalThis.String(object.id) : "",
    };
  },

  toJSON(message: ClusterId): unknown {
    const obj: any = {};
    if (message.algorithm !== "") {
      obj.algorithm = message.algorithm;
    }
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClusterId>, I>>(base?: I): ClusterId {
    return ClusterId.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClusterId>, I>>(object: I): ClusterId {
    const message = createBaseClusterId() as any;
    message.algorithm = object.algorithm ?? "";
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseSourceRef(): SourceRef {
  return { gitiles: undefined };
}

export const SourceRef = {
  encode(message: SourceRef, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.gitiles !== undefined) {
      GitilesRef.encode(message.gitiles, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SourceRef {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSourceRef() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.gitiles = GitilesRef.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SourceRef {
    return { gitiles: isSet(object.gitiles) ? GitilesRef.fromJSON(object.gitiles) : undefined };
  },

  toJSON(message: SourceRef): unknown {
    const obj: any = {};
    if (message.gitiles !== undefined) {
      obj.gitiles = GitilesRef.toJSON(message.gitiles);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SourceRef>, I>>(base?: I): SourceRef {
    return SourceRef.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<SourceRef>, I>>(object: I): SourceRef {
    const message = createBaseSourceRef() as any;
    message.gitiles = (object.gitiles !== undefined && object.gitiles !== null)
      ? GitilesRef.fromPartial(object.gitiles)
      : undefined;
    return message;
  },
};

function createBaseGitilesRef(): GitilesRef {
  return { host: "", project: "", ref: "" };
}

export const GitilesRef = {
  encode(message: GitilesRef, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.host !== "") {
      writer.uint32(10).string(message.host);
    }
    if (message.project !== "") {
      writer.uint32(18).string(message.project);
    }
    if (message.ref !== "") {
      writer.uint32(26).string(message.ref);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GitilesRef {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGitilesRef() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.host = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.project = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.ref = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GitilesRef {
    return {
      host: isSet(object.host) ? globalThis.String(object.host) : "",
      project: isSet(object.project) ? globalThis.String(object.project) : "",
      ref: isSet(object.ref) ? globalThis.String(object.ref) : "",
    };
  },

  toJSON(message: GitilesRef): unknown {
    const obj: any = {};
    if (message.host !== "") {
      obj.host = message.host;
    }
    if (message.project !== "") {
      obj.project = message.project;
    }
    if (message.ref !== "") {
      obj.ref = message.ref;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GitilesRef>, I>>(base?: I): GitilesRef {
    return GitilesRef.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GitilesRef>, I>>(object: I): GitilesRef {
    const message = createBaseGitilesRef() as any;
    message.host = object.host ?? "";
    message.project = object.project ?? "";
    message.ref = object.ref ?? "";
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
