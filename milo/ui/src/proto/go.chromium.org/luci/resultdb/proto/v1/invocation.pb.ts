/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { Struct } from "../../../../../google/protobuf/struct.pb";
import { Timestamp } from "../../../../../google/protobuf/timestamp.pb";
import { CommitPosition, GerritChange, GitilesCommit, StringPair } from "./common.pb";
import { ArtifactPredicate, TestResultPredicate } from "./predicate.pb";

export const protobufPackage = "luci.resultdb.v1";

/**
 * A conceptual container of results. Immutable once finalized.
 * It represents all results of some computation; examples: swarming task,
 * buildbucket build, CQ attempt.
 * Composable: can include other invocations, see inclusion.proto.
 *
 * Next id: 17.
 */
export interface Invocation {
  /**
   * Can be used to refer to this invocation, e.g. in ResultDB.GetInvocation
   * RPC.
   * Format: invocations/{INVOCATION_ID}
   * See also https://aip.dev/122.
   *
   * Output only.
   */
  readonly name: string;
  /**
   * Current state of the invocation.
   *
   * At creation time this can be set to FINALIZING e.g. if this invocation is
   * a simple wrapper of another and will itself not be modified.
   *
   * Otherwise this is an output only field.
   */
  readonly state: Invocation_State;
  /**
   * When the invocation was created.
   * Output only.
   */
  readonly createTime:
    | string
    | undefined;
  /**
   * Invocation-level string key-value pairs.
   * A key can be repeated.
   */
  readonly tags: readonly StringPair[];
  /**
   * When the invocation was finalized, i.e. transitioned to FINALIZED state.
   * If this field is set, implies that the invocation is finalized.
   *
   * Output only.
   */
  readonly finalizeTime:
    | string
    | undefined;
  /**
   * Timestamp when the invocation will be forcefully finalized.
   * Can be extended with UpdateInvocation until finalized.
   */
  readonly deadline:
    | string
    | undefined;
  /**
   * Names of invocations included into this one. Overall results of this
   * invocation is a UNION of results directly included into this invocation
   * and results from the included invocations, recursively.
   * For example, a Buildbucket build invocation may include invocations of its
   * child swarming tasks and represent overall result of the build,
   * encapsulating the internal structure of the build.
   *
   * The graph is directed.
   * There can be at most one edge between a given pair of invocations.
   * The shape of the graph does not matter. What matters is only the set of
   * reachable invocations. Thus cycles are allowed and are noop.
   *
   * QueryTestResults returns test results from the transitive closure of
   * invocations.
   *
   * This field can be set under Recorder.CreateInvocationsRequest to include
   * existing invocations at the moment of invocation creation.
   * New invocations created in the same batch (via
   * Recorder.BatchCreateInvocationsRequest) are also allowed.
   * Otherwise, this field is to be treated as Output only.
   *
   * To modify included invocations, use Recorder.UpdateIncludedInvocations in
   * all other cases.
   */
  readonly includedInvocations: readonly string[];
  /**
   * bigquery_exports indicates what BigQuery table(s) that results in this
   * invocation should export to.
   */
  readonly bigqueryExports: readonly BigQueryExport[];
  /**
   * LUCI identity (e.g. "user:<email>") who created the invocation.
   * Typically, a LUCI service account (e.g.
   * "user:cr-buildbucket@appspot.gserviceaccount.com"), but can also be a user
   * (e.g. "user:johndoe@example.com").
   *
   * Output only.
   */
  readonly createdBy: string;
  /**
   * Full name of the resource that produced results in this invocation.
   * See also https://aip.dev/122#full-resource-names
   * Typical examples:
   * - Swarming task: "//chromium-swarm.appspot.com/tasks/deadbeef"
   * - Buildbucket build: "//cr-buildbucket.appspot.com/builds/1234567890".
   */
  readonly producerResource: string;
  /**
   * Realm that the invocation exists under.
   * See https://chromium.googlesource.com/infra/luci/luci-py/+/refs/heads/master/appengine/auth_service/proto/realms_config.proto
   */
  readonly realm: string;
  /** Deprecated. Values specified here are ignored. */
  readonly historyOptions:
    | HistoryOptions
    | undefined;
  /**
   * Arbitrary JSON object that contains structured, domain-specific properties
   * of the invocation.
   *
   * The serialized size must be <= 4096 bytes.
   */
  readonly properties:
    | { readonly [key: string]: any }
    | undefined;
  /**
   * The code sources which were tested by this invocation.
   * This is used to index test results for test history, and for
   * related analyses (e.g. culprit analysis / changepoint analyses).
   *
   * The sources specified here applies only to:
   * - the test results directly contained in this invocation, and
   * - any directly included invocations which set their source_spec.inherit to
   * true.
   *
   * Clients should be careful to ensure the uploaded source spec is consistent
   * between included invocations that upload the same test variants.
   * Verdicts are associated with the sources of *any* of their constituent
   * test results, so if there is inconsistency between included invocations,
   * the position of the verdict becomes not well defined.
   */
  readonly sourceSpec:
    | SourceSpec
    | undefined;
  /**
   * A user-specified baseline identifier that maps to a set of test variants.
   * Often, this will be the source that generated the test result, such as the
   * builder name for Chromium. For example, the baseline identifier may be
   * try:linux-rel. The supported syntax for a baseline identifier is
   * ^[a-z0-9\-_.]{1,100}:[a-zA-Z0-9\-_.\(\) ]{1,128}`$. This syntax was selected
   * to allow <buildbucket bucket name>:<buildbucket builder name> as a valid
   * baseline ID.
   * See go/src/go.chromium.org/luci/buildbucket/proto/builder_common.proto for
   * character lengths for buildbucket bucket name and builder name.
   *
   * Baselines are used to identify new tests; a subtraction between the set of
   * test variants for a baseline in the Baselines table and test variants from
   * a given invocation determines whether a test is new.
   *
   * The caller must have `resultdb.baselines.put` to be able to
   * modify this field.
   */
  readonly baselineId: string;
}

export enum Invocation_State {
  /** UNSPECIFIED - The default value. This value is used if the state is omitted. */
  UNSPECIFIED = 0,
  /** ACTIVE - The invocation was created and accepts new results. */
  ACTIVE = 1,
  /**
   * FINALIZING - The invocation is in the process of transitioning into FINALIZED state.
   * This will happen automatically soon after all of its directly or
   * indirectly included invocations become inactive.
   */
  FINALIZING = 2,
  /**
   * FINALIZED - The invocation is immutable and no longer accepts new results nor
   * inclusions directly or indirectly.
   */
  FINALIZED = 3,
}

export function invocation_StateFromJSON(object: any): Invocation_State {
  switch (object) {
    case 0:
    case "STATE_UNSPECIFIED":
      return Invocation_State.UNSPECIFIED;
    case 1:
    case "ACTIVE":
      return Invocation_State.ACTIVE;
    case 2:
    case "FINALIZING":
      return Invocation_State.FINALIZING;
    case 3:
    case "FINALIZED":
      return Invocation_State.FINALIZED;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum Invocation_State");
  }
}

export function invocation_StateToJSON(object: Invocation_State): string {
  switch (object) {
    case Invocation_State.UNSPECIFIED:
      return "STATE_UNSPECIFIED";
    case Invocation_State.ACTIVE:
      return "ACTIVE";
    case Invocation_State.FINALIZING:
      return "FINALIZING";
    case Invocation_State.FINALIZED:
      return "FINALIZED";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum Invocation_State");
  }
}

/**
 * BigQueryExport indicates that results in this invocation should be exported
 * to BigQuery after finalization.
 */
export interface BigQueryExport {
  /** Name of the BigQuery project. */
  readonly project: string;
  /** Name of the BigQuery Dataset. */
  readonly dataset: string;
  /** Name of the BigQuery Table. */
  readonly table: string;
  readonly testResults?: BigQueryExport_TestResults | undefined;
  readonly textArtifacts?: BigQueryExport_TextArtifacts | undefined;
}

/** TestResults indicates that test results should be exported. */
export interface BigQueryExport_TestResults {
  /**
   * Use predicate to query test results that should be exported to
   * BigQuery table.
   */
  readonly predicate: TestResultPredicate | undefined;
}

/** TextArtifacts indicates that text artifacts should be exported. */
export interface BigQueryExport_TextArtifacts {
  /**
   * Use predicate to query artifacts that should be exported to
   * BigQuery table.
   *
   * Sub-field predicate.content_type_regexp defaults to "text/.*".
   */
  readonly predicate: ArtifactPredicate | undefined;
}

/**
 * HistoryOptions indicates how the invocations should be indexed, so that their
 * results can be queried over a range of time or of commits.
 * Deprecated: do not use.
 */
export interface HistoryOptions {
  /** Set this to index the results by the containing invocation's create_time. */
  readonly useInvocationTimestamp: boolean;
  /**
   * Set this to index by commit position.
   * It's up to the creator of the invocation to set this consistently over
   * time across the same test variant.
   */
  readonly commit: CommitPosition | undefined;
}

/**
 * Specifies the source code that was tested in an invocation, either directly
 * (via the sources field) or indirectly (via inherit_sources).
 */
export interface SourceSpec {
  /**
   * Specifies the source position that was tested.
   * Either this or inherit_sources may be set, but not both.
   */
  readonly sources:
    | Sources
    | undefined;
  /**
   * Specifies that the source position of the invocation is inherited
   * from the parent invocation it is included in.
   *
   * # Use case
   * This is useful in situations where the testing infrastructure deduplicates
   * execution of tests on identical binaries (e.g. using swarming's task
   * deduplication feature).
   *
   * Let A be the invocation for a swarming task that receives only a
   * test binary as input, with task deduplication enabled.
   * Let B be the invocation for a buildbucket build which built the
   * binary from sources (or at the very least knew the sources)
   * and triggered invocation A.
   * Invocation B includes invocation A.
   *
   * By setting A's source_spec to inherit, and specifying the sources
   * on invocation B, the test results in A will be associated with
   * the sources specified on invocation B, when queried via invocation B.
   *
   * This allows further invocations B2, B3 ... BN to be created which also
   * re-use the test results in A but associate them with possibly different
   * sources when queried via B2 ... BN (this is valid so long as the sources
   * produce a binary-identical testing input).
   *
   * # Multiple inclusion paths
   * It is possible for an invocation A to be included in the reachable
   * invocation graph for an invocation C in more than one way.
   *
   * For example, we may have:
   *   A -> B1 -> C
   *   A -> B2 -> C
   * as two paths of inclusion.
   *
   * If A sets inherit to true, the commit position assigned to its
   * test results will be selected via *one* of the paths of inclusion
   * into C (i.e. from B1 or B2).
   *
   * However, which path is selected is not guaranteed, so if clients
   * must include the same invocation multiple times, they should
   * make the source position via all paths the same.
   */
  readonly inherit: boolean;
}

/** Specifies the source code that was tested. */
export interface Sources {
  /**
   * The base version of code sources checked out. Mandatory.
   * If necessary, we could add support for non-gitiles sources here in
   * future, using a oneof statement. E.g.
   * oneof system {
   *    GitilesCommit gitiles_commit = 1;
   *    SubversionRevision svn_revision = 4;
   *    ...
   * }
   */
  readonly gitilesCommit:
    | GitilesCommit
    | undefined;
  /**
   * The changelist(s) which were applied upon the base version of sources
   * checked out. E.g. in commit queue tryjobs.
   *
   * At most 10 changelist(s) may be specified here. If there
   * are more, only include the first 10 and set is_dirty.
   */
  readonly changelists: readonly GerritChange[];
  /**
   * Whether there were any changes made to the sources, not described above.
   * For example, a version of a dependency was upgraded before testing (e.g.
   * in an autoroller recipe).
   *
   * Cherry-picking a changelist on top of the base checkout is not considered
   * making the sources dirty as it is reported separately above.
   */
  readonly isDirty: boolean;
}

function createBaseInvocation(): Invocation {
  return {
    name: "",
    state: 0,
    createTime: undefined,
    tags: [],
    finalizeTime: undefined,
    deadline: undefined,
    includedInvocations: [],
    bigqueryExports: [],
    createdBy: "",
    producerResource: "",
    realm: "",
    historyOptions: undefined,
    properties: undefined,
    sourceSpec: undefined,
    baselineId: "",
  };
}

export const Invocation = {
  encode(message: Invocation, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.state !== 0) {
      writer.uint32(16).int32(message.state);
    }
    if (message.createTime !== undefined) {
      Timestamp.encode(toTimestamp(message.createTime), writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.tags) {
      StringPair.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    if (message.finalizeTime !== undefined) {
      Timestamp.encode(toTimestamp(message.finalizeTime), writer.uint32(50).fork()).ldelim();
    }
    if (message.deadline !== undefined) {
      Timestamp.encode(toTimestamp(message.deadline), writer.uint32(58).fork()).ldelim();
    }
    for (const v of message.includedInvocations) {
      writer.uint32(66).string(v!);
    }
    for (const v of message.bigqueryExports) {
      BigQueryExport.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    if (message.createdBy !== "") {
      writer.uint32(82).string(message.createdBy);
    }
    if (message.producerResource !== "") {
      writer.uint32(90).string(message.producerResource);
    }
    if (message.realm !== "") {
      writer.uint32(98).string(message.realm);
    }
    if (message.historyOptions !== undefined) {
      HistoryOptions.encode(message.historyOptions, writer.uint32(106).fork()).ldelim();
    }
    if (message.properties !== undefined) {
      Struct.encode(Struct.wrap(message.properties), writer.uint32(114).fork()).ldelim();
    }
    if (message.sourceSpec !== undefined) {
      SourceSpec.encode(message.sourceSpec, writer.uint32(122).fork()).ldelim();
    }
    if (message.baselineId !== "") {
      writer.uint32(130).string(message.baselineId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Invocation {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvocation() as any;
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
          if (tag !== 16) {
            break;
          }

          message.state = reader.int32() as any;
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.createTime = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.tags.push(StringPair.decode(reader, reader.uint32()));
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.finalizeTime = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.deadline = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.includedInvocations.push(reader.string());
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.bigqueryExports.push(BigQueryExport.decode(reader, reader.uint32()));
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.createdBy = reader.string();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.producerResource = reader.string();
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.realm = reader.string();
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.historyOptions = HistoryOptions.decode(reader, reader.uint32());
          continue;
        case 14:
          if (tag !== 114) {
            break;
          }

          message.properties = Struct.unwrap(Struct.decode(reader, reader.uint32()));
          continue;
        case 15:
          if (tag !== 122) {
            break;
          }

          message.sourceSpec = SourceSpec.decode(reader, reader.uint32());
          continue;
        case 16:
          if (tag !== 130) {
            break;
          }

          message.baselineId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Invocation {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      state: isSet(object.state) ? invocation_StateFromJSON(object.state) : 0,
      createTime: isSet(object.createTime) ? globalThis.String(object.createTime) : undefined,
      tags: globalThis.Array.isArray(object?.tags) ? object.tags.map((e: any) => StringPair.fromJSON(e)) : [],
      finalizeTime: isSet(object.finalizeTime) ? globalThis.String(object.finalizeTime) : undefined,
      deadline: isSet(object.deadline) ? globalThis.String(object.deadline) : undefined,
      includedInvocations: globalThis.Array.isArray(object?.includedInvocations)
        ? object.includedInvocations.map((e: any) => globalThis.String(e))
        : [],
      bigqueryExports: globalThis.Array.isArray(object?.bigqueryExports)
        ? object.bigqueryExports.map((e: any) => BigQueryExport.fromJSON(e))
        : [],
      createdBy: isSet(object.createdBy) ? globalThis.String(object.createdBy) : "",
      producerResource: isSet(object.producerResource) ? globalThis.String(object.producerResource) : "",
      realm: isSet(object.realm) ? globalThis.String(object.realm) : "",
      historyOptions: isSet(object.historyOptions) ? HistoryOptions.fromJSON(object.historyOptions) : undefined,
      properties: isObject(object.properties) ? object.properties : undefined,
      sourceSpec: isSet(object.sourceSpec) ? SourceSpec.fromJSON(object.sourceSpec) : undefined,
      baselineId: isSet(object.baselineId) ? globalThis.String(object.baselineId) : "",
    };
  },

  toJSON(message: Invocation): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.state !== 0) {
      obj.state = invocation_StateToJSON(message.state);
    }
    if (message.createTime !== undefined) {
      obj.createTime = message.createTime;
    }
    if (message.tags?.length) {
      obj.tags = message.tags.map((e) => StringPair.toJSON(e));
    }
    if (message.finalizeTime !== undefined) {
      obj.finalizeTime = message.finalizeTime;
    }
    if (message.deadline !== undefined) {
      obj.deadline = message.deadline;
    }
    if (message.includedInvocations?.length) {
      obj.includedInvocations = message.includedInvocations;
    }
    if (message.bigqueryExports?.length) {
      obj.bigqueryExports = message.bigqueryExports.map((e) => BigQueryExport.toJSON(e));
    }
    if (message.createdBy !== "") {
      obj.createdBy = message.createdBy;
    }
    if (message.producerResource !== "") {
      obj.producerResource = message.producerResource;
    }
    if (message.realm !== "") {
      obj.realm = message.realm;
    }
    if (message.historyOptions !== undefined) {
      obj.historyOptions = HistoryOptions.toJSON(message.historyOptions);
    }
    if (message.properties !== undefined) {
      obj.properties = message.properties;
    }
    if (message.sourceSpec !== undefined) {
      obj.sourceSpec = SourceSpec.toJSON(message.sourceSpec);
    }
    if (message.baselineId !== "") {
      obj.baselineId = message.baselineId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Invocation>, I>>(base?: I): Invocation {
    return Invocation.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Invocation>, I>>(object: I): Invocation {
    const message = createBaseInvocation() as any;
    message.name = object.name ?? "";
    message.state = object.state ?? 0;
    message.createTime = object.createTime ?? undefined;
    message.tags = object.tags?.map((e) => StringPair.fromPartial(e)) || [];
    message.finalizeTime = object.finalizeTime ?? undefined;
    message.deadline = object.deadline ?? undefined;
    message.includedInvocations = object.includedInvocations?.map((e) => e) || [];
    message.bigqueryExports = object.bigqueryExports?.map((e) => BigQueryExport.fromPartial(e)) || [];
    message.createdBy = object.createdBy ?? "";
    message.producerResource = object.producerResource ?? "";
    message.realm = object.realm ?? "";
    message.historyOptions = (object.historyOptions !== undefined && object.historyOptions !== null)
      ? HistoryOptions.fromPartial(object.historyOptions)
      : undefined;
    message.properties = object.properties ?? undefined;
    message.sourceSpec = (object.sourceSpec !== undefined && object.sourceSpec !== null)
      ? SourceSpec.fromPartial(object.sourceSpec)
      : undefined;
    message.baselineId = object.baselineId ?? "";
    return message;
  },
};

function createBaseBigQueryExport(): BigQueryExport {
  return { project: "", dataset: "", table: "", testResults: undefined, textArtifacts: undefined };
}

export const BigQueryExport = {
  encode(message: BigQueryExport, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.project !== "") {
      writer.uint32(10).string(message.project);
    }
    if (message.dataset !== "") {
      writer.uint32(18).string(message.dataset);
    }
    if (message.table !== "") {
      writer.uint32(26).string(message.table);
    }
    if (message.testResults !== undefined) {
      BigQueryExport_TestResults.encode(message.testResults, writer.uint32(34).fork()).ldelim();
    }
    if (message.textArtifacts !== undefined) {
      BigQueryExport_TextArtifacts.encode(message.textArtifacts, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BigQueryExport {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBigQueryExport() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.project = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.dataset = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.table = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.testResults = BigQueryExport_TestResults.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.textArtifacts = BigQueryExport_TextArtifacts.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BigQueryExport {
    return {
      project: isSet(object.project) ? globalThis.String(object.project) : "",
      dataset: isSet(object.dataset) ? globalThis.String(object.dataset) : "",
      table: isSet(object.table) ? globalThis.String(object.table) : "",
      testResults: isSet(object.testResults) ? BigQueryExport_TestResults.fromJSON(object.testResults) : undefined,
      textArtifacts: isSet(object.textArtifacts)
        ? BigQueryExport_TextArtifacts.fromJSON(object.textArtifacts)
        : undefined,
    };
  },

  toJSON(message: BigQueryExport): unknown {
    const obj: any = {};
    if (message.project !== "") {
      obj.project = message.project;
    }
    if (message.dataset !== "") {
      obj.dataset = message.dataset;
    }
    if (message.table !== "") {
      obj.table = message.table;
    }
    if (message.testResults !== undefined) {
      obj.testResults = BigQueryExport_TestResults.toJSON(message.testResults);
    }
    if (message.textArtifacts !== undefined) {
      obj.textArtifacts = BigQueryExport_TextArtifacts.toJSON(message.textArtifacts);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BigQueryExport>, I>>(base?: I): BigQueryExport {
    return BigQueryExport.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BigQueryExport>, I>>(object: I): BigQueryExport {
    const message = createBaseBigQueryExport() as any;
    message.project = object.project ?? "";
    message.dataset = object.dataset ?? "";
    message.table = object.table ?? "";
    message.testResults = (object.testResults !== undefined && object.testResults !== null)
      ? BigQueryExport_TestResults.fromPartial(object.testResults)
      : undefined;
    message.textArtifacts = (object.textArtifacts !== undefined && object.textArtifacts !== null)
      ? BigQueryExport_TextArtifacts.fromPartial(object.textArtifacts)
      : undefined;
    return message;
  },
};

function createBaseBigQueryExport_TestResults(): BigQueryExport_TestResults {
  return { predicate: undefined };
}

export const BigQueryExport_TestResults = {
  encode(message: BigQueryExport_TestResults, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.predicate !== undefined) {
      TestResultPredicate.encode(message.predicate, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BigQueryExport_TestResults {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBigQueryExport_TestResults() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.predicate = TestResultPredicate.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BigQueryExport_TestResults {
    return { predicate: isSet(object.predicate) ? TestResultPredicate.fromJSON(object.predicate) : undefined };
  },

  toJSON(message: BigQueryExport_TestResults): unknown {
    const obj: any = {};
    if (message.predicate !== undefined) {
      obj.predicate = TestResultPredicate.toJSON(message.predicate);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BigQueryExport_TestResults>, I>>(base?: I): BigQueryExport_TestResults {
    return BigQueryExport_TestResults.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BigQueryExport_TestResults>, I>>(object: I): BigQueryExport_TestResults {
    const message = createBaseBigQueryExport_TestResults() as any;
    message.predicate = (object.predicate !== undefined && object.predicate !== null)
      ? TestResultPredicate.fromPartial(object.predicate)
      : undefined;
    return message;
  },
};

function createBaseBigQueryExport_TextArtifacts(): BigQueryExport_TextArtifacts {
  return { predicate: undefined };
}

export const BigQueryExport_TextArtifacts = {
  encode(message: BigQueryExport_TextArtifacts, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.predicate !== undefined) {
      ArtifactPredicate.encode(message.predicate, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BigQueryExport_TextArtifacts {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBigQueryExport_TextArtifacts() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.predicate = ArtifactPredicate.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BigQueryExport_TextArtifacts {
    return { predicate: isSet(object.predicate) ? ArtifactPredicate.fromJSON(object.predicate) : undefined };
  },

  toJSON(message: BigQueryExport_TextArtifacts): unknown {
    const obj: any = {};
    if (message.predicate !== undefined) {
      obj.predicate = ArtifactPredicate.toJSON(message.predicate);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BigQueryExport_TextArtifacts>, I>>(base?: I): BigQueryExport_TextArtifacts {
    return BigQueryExport_TextArtifacts.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BigQueryExport_TextArtifacts>, I>>(object: I): BigQueryExport_TextArtifacts {
    const message = createBaseBigQueryExport_TextArtifacts() as any;
    message.predicate = (object.predicate !== undefined && object.predicate !== null)
      ? ArtifactPredicate.fromPartial(object.predicate)
      : undefined;
    return message;
  },
};

function createBaseHistoryOptions(): HistoryOptions {
  return { useInvocationTimestamp: false, commit: undefined };
}

export const HistoryOptions = {
  encode(message: HistoryOptions, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.useInvocationTimestamp === true) {
      writer.uint32(8).bool(message.useInvocationTimestamp);
    }
    if (message.commit !== undefined) {
      CommitPosition.encode(message.commit, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HistoryOptions {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHistoryOptions() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.useInvocationTimestamp = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.commit = CommitPosition.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HistoryOptions {
    return {
      useInvocationTimestamp: isSet(object.useInvocationTimestamp)
        ? globalThis.Boolean(object.useInvocationTimestamp)
        : false,
      commit: isSet(object.commit) ? CommitPosition.fromJSON(object.commit) : undefined,
    };
  },

  toJSON(message: HistoryOptions): unknown {
    const obj: any = {};
    if (message.useInvocationTimestamp === true) {
      obj.useInvocationTimestamp = message.useInvocationTimestamp;
    }
    if (message.commit !== undefined) {
      obj.commit = CommitPosition.toJSON(message.commit);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<HistoryOptions>, I>>(base?: I): HistoryOptions {
    return HistoryOptions.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<HistoryOptions>, I>>(object: I): HistoryOptions {
    const message = createBaseHistoryOptions() as any;
    message.useInvocationTimestamp = object.useInvocationTimestamp ?? false;
    message.commit = (object.commit !== undefined && object.commit !== null)
      ? CommitPosition.fromPartial(object.commit)
      : undefined;
    return message;
  },
};

function createBaseSourceSpec(): SourceSpec {
  return { sources: undefined, inherit: false };
}

export const SourceSpec = {
  encode(message: SourceSpec, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.sources !== undefined) {
      Sources.encode(message.sources, writer.uint32(10).fork()).ldelim();
    }
    if (message.inherit === true) {
      writer.uint32(16).bool(message.inherit);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SourceSpec {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSourceSpec() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.sources = Sources.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.inherit = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SourceSpec {
    return {
      sources: isSet(object.sources) ? Sources.fromJSON(object.sources) : undefined,
      inherit: isSet(object.inherit) ? globalThis.Boolean(object.inherit) : false,
    };
  },

  toJSON(message: SourceSpec): unknown {
    const obj: any = {};
    if (message.sources !== undefined) {
      obj.sources = Sources.toJSON(message.sources);
    }
    if (message.inherit === true) {
      obj.inherit = message.inherit;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SourceSpec>, I>>(base?: I): SourceSpec {
    return SourceSpec.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<SourceSpec>, I>>(object: I): SourceSpec {
    const message = createBaseSourceSpec() as any;
    message.sources = (object.sources !== undefined && object.sources !== null)
      ? Sources.fromPartial(object.sources)
      : undefined;
    message.inherit = object.inherit ?? false;
    return message;
  },
};

function createBaseSources(): Sources {
  return { gitilesCommit: undefined, changelists: [], isDirty: false };
}

export const Sources = {
  encode(message: Sources, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.gitilesCommit !== undefined) {
      GitilesCommit.encode(message.gitilesCommit, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.changelists) {
      GerritChange.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.isDirty === true) {
      writer.uint32(24).bool(message.isDirty);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Sources {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSources() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.gitilesCommit = GitilesCommit.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.changelists.push(GerritChange.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.isDirty = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Sources {
    return {
      gitilesCommit: isSet(object.gitilesCommit) ? GitilesCommit.fromJSON(object.gitilesCommit) : undefined,
      changelists: globalThis.Array.isArray(object?.changelists)
        ? object.changelists.map((e: any) => GerritChange.fromJSON(e))
        : [],
      isDirty: isSet(object.isDirty) ? globalThis.Boolean(object.isDirty) : false,
    };
  },

  toJSON(message: Sources): unknown {
    const obj: any = {};
    if (message.gitilesCommit !== undefined) {
      obj.gitilesCommit = GitilesCommit.toJSON(message.gitilesCommit);
    }
    if (message.changelists?.length) {
      obj.changelists = message.changelists.map((e) => GerritChange.toJSON(e));
    }
    if (message.isDirty === true) {
      obj.isDirty = message.isDirty;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Sources>, I>>(base?: I): Sources {
    return Sources.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Sources>, I>>(object: I): Sources {
    const message = createBaseSources() as any;
    message.gitilesCommit = (object.gitilesCommit !== undefined && object.gitilesCommit !== null)
      ? GitilesCommit.fromPartial(object.gitilesCommit)
      : undefined;
    message.changelists = object.changelists?.map((e) => GerritChange.fromPartial(e)) || [];
    message.isDirty = object.isDirty ?? false;
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
