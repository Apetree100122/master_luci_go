/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { Build } from "../../../buildbucket/proto/build.pb";
import { BuilderID, BuilderItem } from "../../../buildbucket/proto/builder_common.pb";
import { GitilesCommit } from "../../../buildbucket/proto/common.pb";
import { Commit } from "../../../common/proto/git/commit.pb";
import { Console, Project } from "../projectconfig/project.pb";

export const protobufPackage = "luci.milo.v1";

/** A request message for `QueryBlamelist` RPC. */
export interface QueryBlamelistRequest {
  /**
   * The Gitiles commit of the build.
   *
   * This defines the end_commit of the blamelist.
   * It should be set to the output Gitiles commit of the build.
   * Input Gitiles commit should be used when output gitiles commit is not
   * available.
   */
  readonly gitilesCommit:
    | GitilesCommit
    | undefined;
  /**
   * The context builder of the blamelist.
   *
   * The start commit of the blamelist is the closest ancestor commit with an
   * associated build that is from the same builder and is not expired,
   * cancelled, or infra-failed.
   */
  readonly builder:
    | BuilderID
    | undefined;
  /**
   * Optional. The maximum number of commits to return.
   *
   * The service may return fewer than this value.
   * If unspecified, at most 100 commits will be returned.
   * The maximum value is 1000; values above 1000 will be coerced to 1000.
   */
  readonly pageSize: number;
  /**
   * Optional. A page token, received from a previous `QueryBlamelist` call.
   * Provide this to retrieve the subsequent page.
   *
   * When paginating, all parameters provided to `QueryBlamelist`, with the
   * exception of page_size and page_token, must match the call that provided
   * the page token.
   */
  readonly pageToken: string;
  /**
   * This field is unused.
   *
   * TODO(crbugs/1047893): remove this field in the once no clients depends on
   * this.
   */
  readonly multiProjectSupport: boolean;
}

/** A response message for QueryBlamelist RPC. */
export interface QueryBlamelistResponse {
  /**
   * The commits from the blamelist of the build, in reverse chronological
   * order.
   */
  readonly commits: readonly Commit[];
  /**
   * A token that can be sent as `page_token` to retrieve the next page.
   * If this field is omitted, there are no subsequent pages.
   */
  readonly nextPageToken: string;
  /**
   * The repo commit immediately preceding |commits|. Useful for creating
   * git log queries, which are exclusive of the first commit.
   * Unset when |commits| includes the first commit in the repository.
   */
  readonly precedingCommit: Commit | undefined;
}

/** A stateless page token for QueryBlamelist RPC. */
export interface QueryBlamelistPageToken {
  /** The first commit in the next page. */
  readonly nextCommitId: string;
}

/** A request message for `ListProjects` RPC. */
export interface ListProjectsRequest {
  /**
   * Optional. The maxium number of projects to return.
   *
   * The service may return fewer than this value.
   * If unspecified, at most 100 projects will be returned.
   * The maximum value is 10000; values above 10000 will be coerced to 10000.
   */
  readonly pageSize: number;
  /**
   * Optional. A page token, received from a previous `ListProjects`
   * call. Provide this to retrieve the subsequent page.
   *
   * When paginating, all parameters provided to `ListProjects`, with the
   * exception of page_size and page_token, must match the call that provided
   * the page token.
   */
  readonly pageToken: string;
}

/** A response message for `ListProjects` RPC. */
export interface ListProjectsResponse {
  /**
   * A list of matched projects.
   *
   * Projects are ordered by their string ID
   */
  readonly projects: readonly ProjectListItem[];
  /**
   * A token that can be sent as `page_token` to retrieve the next page.
   * If this field is omitted, there are no subsequent pages.
   */
  readonly nextPageToken: string;
}

/** A single project in a ListProjectsResponse. */
export interface ProjectListItem {
  /** The project id. */
  readonly id: string;
  /** The url of the project logo. */
  readonly logoUrl: string;
}

/** A stateless page token for `ListProjects` RPC. */
export interface ListProjectsPageToken {
  /** The index of the next project from all projects. */
  readonly nextProjectIndex: number;
}

export interface GetProjectCfgRequest {
  /** The project name. */
  readonly project: string;
}

/** A request message for `QueryRecentBuilds` RPC. */
export interface QueryRecentBuildsRequest {
  /** The builder to query the build history from. */
  readonly builder:
    | BuilderID
    | undefined;
  /**
   * Optional. The maxium number of builds to return.
   *
   * The service may return fewer than this value.
   * If unspecified, at most 25 builds will be returned.
   * The maximum value is 100; values above 100 will be coerced to 100.
   */
  readonly pageSize: number;
  /**
   * Optional. A page token, received from a previous `QueryRecentBuilds`
   * call. Provide this to retrieve the subsequent page.
   *
   * When paginating, all parameters provided to `QueryRecentBuilds`, with
   * the exception of page_size and page_token, must match the call that
   * provided the page token.
   */
  readonly pageToken: string;
}

/** A response message for `QueryRecentBuilds` RPC. */
export interface QueryRecentBuildsResponse {
  /**
   * Recent builds. Ordered by `CreateTime`.
   * Only Id, Builder, Number, CreateTime, Status, Critical are populated.
   */
  readonly builds: readonly Build[];
  /**
   * A token that can be sent as `page_token` to retrieve the next page.
   * If this field is omitted, there are no subsequent pages.
   */
  readonly nextPageToken: string;
}

/** A request message for `ListBuilders` RPC. */
export interface ListBuildersRequest {
  /**
   * Required only when `group` is specified. The project to query the builders
   * from.
   *
   * When specified, query all builders in the project as well as any external
   * builders  referenced by the consoles in the project.
   * When omitted, query all builders in any project.
   */
  readonly project: string;
  /**
   * Optional. The group/console to query the builders from.
   *
   * When omitted, all builders from the project is returned. Including all
   * builders defined in the consoles, builder groups, and buildbucket.
   */
  readonly group: string;
  /**
   * Optional. The maxium number of builders to return.
   *
   * The service may return fewer than this value.
   * If unspecified, at most 100 builders will be returned.
   * The maximum value is 10000; values above 10000 will be coerced to 10000.
   */
  readonly pageSize: number;
  /**
   * Optional. A page token, received from a previous `ListBuilders`
   * call. Provide this to retrieve the subsequent page.
   *
   * When paginating, all parameters provided to `ListBuilders`, with the
   * exception of page_size and page_token, must match the call that provided
   * the page token.
   */
  readonly pageToken: string;
}

/** A response message for `ListBuilders` RPC. */
export interface ListBuildersResponse {
  /**
   * A list of matched builders.
   *
   * Builders are ordered by their canonical string ID
   * (i.e. "{project}/{bucket}/{builder}") with the exception that builders from
   * `ListBuildersRequest.project` always come before builders from other
   * projects.
   * Only builder IDs are populated for now.
   */
  readonly builders: readonly BuilderItem[];
  /**
   * A token that can be sent as `page_token` to retrieve the next page.
   * If this field is omitted, there are no subsequent pages.
   */
  readonly nextPageToken: string;
}

/** A stateless page token for `ListBuilders` RPC. */
export interface ListBuildersPageToken {
  /**
   * The index of the next builder from all cached builders from buildbucket.
   *
   * Should not coexist with `NextMiloBuilderIndex`.
   */
  readonly nextBuildbucketBuilderIndex: number;
  /**
   * The index of the next builder from Milo project definition.
   *
   * Should not coexist with `NextBuildbucketBuilderIndex`.
   */
  readonly nextMiloBuilderIndex: number;
}

/** A request message for `QueryBuilderStats` RPC. */
export interface QueryBuilderStatsRequest {
  /** The builder to query the stats from. */
  readonly builder: BuilderID | undefined;
}

/** A message that contains some basic stats of a builder. */
export interface BuilderStats {
  /** The builder that the stats belongs to. */
  readonly builder:
    | BuilderID
    | undefined;
  /** The number of pending builds associated with the builder. */
  readonly pendingBuildsCount: number;
  /** The number of running builds associated with the builder. */
  readonly runningBuildsCount: number;
}

/** A request message for `BatchCheckPermissions` RPC. */
export interface BatchCheckPermissionsRequest {
  /** Required. The realm to check the permissions against. */
  readonly realm: string;
  /**
   * String representation of the permissions.
   *
   * Permissions must have the following format: `<service>.<subject>.<verb>`.
   */
  readonly permissions: readonly string[];
}

/** A response message for `BatchCheckPermissions` RPC. */
export interface BatchCheckPermissionsResponse {
  /**
   * A map of permission check results.
   *
   * The key is the permission name and the value is whether the user has the
   * permission.
   */
  readonly results: { [key: string]: boolean };
}

export interface BatchCheckPermissionsResponse_ResultsEntry {
  readonly key: string;
  readonly value: boolean;
}

/**
 * Represents a function Console -> bool.
 * Empty message matches all consoles.
 */
export interface ConsolePredicate {
  /** A console must belong to this project. */
  readonly project: string;
  /** A console must include this builder. */
  readonly builder: BuilderID | undefined;
}

export interface QueryConsolesRequest {
  /** A console in the response must satisfy this predicate. */
  readonly predicate:
    | ConsolePredicate
    | undefined;
  /**
   * Optional. The maxium number of consoles to return.
   *
   * The service may return fewer than this value.
   * If unspecified, at most 25 consoles will be returned.
   * The maximum value is 100; values above 100 will be coerced to 100.
   */
  readonly pageSize: number;
  /**
   * Optional. A page token, received from a previous `ListBuilders`
   * call. Provide this to retrieve the subsequent page.
   *
   * When paginating, all parameters provided to `ListBuilders`, with the
   * exception of page_size and page_token, must match the call that provided
   * the page token.
   */
  readonly pageToken: string;
}

export interface QueryConsolesResponse {
  /** A list of matched consoles. */
  readonly consoles: readonly Console[];
  /**
   * A token that can be sent as `page_token` to retrieve the next page.
   * If this field is omitted, there are no subsequent pages.
   */
  readonly nextPageToken: string;
}

export interface QueryConsoleSnapshotsRequest {
  /**
   * A console in the response must satisfy this predicate.
   * `predicate.project` is required.
   */
  readonly predicate:
    | ConsolePredicate
    | undefined;
  /**
   * Optional. The maximum number of consoles to return.
   *
   * The service may return fewer than this value.
   * If unspecified, at most 25 consoles will be returned.
   * The maximum value is 100; values above 100 will be coerced to 100.
   */
  readonly pageSize: number;
  /**
   * Optional. A page token, received from a previous `QueryConsoleSnapshots`
   * call. Provide this to retrieve the subsequent page.
   *
   * When paginating, all parameters provided to `QueryConsoleSnapshots`, with
   * the exception of page_size and page_token, must match the call that
   * provided the page token.
   */
  readonly pageToken: string;
}

export interface BuilderSnapshot {
  /** The builder this snapshot belongs to. */
  readonly builder:
    | BuilderID
    | undefined;
  /**
   * The latest build associated with the builder at the time the snapshot is
   * taken. Nil if there's no associated build.
   */
  readonly build: Build | undefined;
}

export interface ConsoleSnapshot {
  /** The console this snapshot belongs to. */
  readonly console:
    | Console
    | undefined;
  /**
   * The snapshots of all the builders in the console.
   * In the same order as `console.builders`.
   */
  readonly builderSnapshots: readonly BuilderSnapshot[];
}

export interface QueryConsoleSnapshotsResponse {
  /** A list of matched consoles. */
  readonly snapshots: readonly ConsoleSnapshot[];
  /**
   * A token that can be sent as `page_token` to retrieve the next page.
   * If this field is omitted, there are no subsequent pages.
   */
  readonly nextPageToken: string;
}

function createBaseQueryBlamelistRequest(): QueryBlamelistRequest {
  return { gitilesCommit: undefined, builder: undefined, pageSize: 0, pageToken: "", multiProjectSupport: false };
}

export const QueryBlamelistRequest = {
  encode(message: QueryBlamelistRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.gitilesCommit !== undefined) {
      GitilesCommit.encode(message.gitilesCommit, writer.uint32(10).fork()).ldelim();
    }
    if (message.builder !== undefined) {
      BuilderID.encode(message.builder, writer.uint32(18).fork()).ldelim();
    }
    if (message.pageSize !== 0) {
      writer.uint32(24).int32(message.pageSize);
    }
    if (message.pageToken !== "") {
      writer.uint32(34).string(message.pageToken);
    }
    if (message.multiProjectSupport === true) {
      writer.uint32(40).bool(message.multiProjectSupport);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryBlamelistRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryBlamelistRequest() as any;
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

          message.builder = BuilderID.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.pageSize = reader.int32();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.pageToken = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.multiProjectSupport = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryBlamelistRequest {
    return {
      gitilesCommit: isSet(object.gitilesCommit) ? GitilesCommit.fromJSON(object.gitilesCommit) : undefined,
      builder: isSet(object.builder) ? BuilderID.fromJSON(object.builder) : undefined,
      pageSize: isSet(object.pageSize) ? globalThis.Number(object.pageSize) : 0,
      pageToken: isSet(object.pageToken) ? globalThis.String(object.pageToken) : "",
      multiProjectSupport: isSet(object.multiProjectSupport) ? globalThis.Boolean(object.multiProjectSupport) : false,
    };
  },

  toJSON(message: QueryBlamelistRequest): unknown {
    const obj: any = {};
    if (message.gitilesCommit !== undefined) {
      obj.gitilesCommit = GitilesCommit.toJSON(message.gitilesCommit);
    }
    if (message.builder !== undefined) {
      obj.builder = BuilderID.toJSON(message.builder);
    }
    if (message.pageSize !== 0) {
      obj.pageSize = Math.round(message.pageSize);
    }
    if (message.pageToken !== "") {
      obj.pageToken = message.pageToken;
    }
    if (message.multiProjectSupport === true) {
      obj.multiProjectSupport = message.multiProjectSupport;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryBlamelistRequest>, I>>(base?: I): QueryBlamelistRequest {
    return QueryBlamelistRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryBlamelistRequest>, I>>(object: I): QueryBlamelistRequest {
    const message = createBaseQueryBlamelistRequest() as any;
    message.gitilesCommit = (object.gitilesCommit !== undefined && object.gitilesCommit !== null)
      ? GitilesCommit.fromPartial(object.gitilesCommit)
      : undefined;
    message.builder = (object.builder !== undefined && object.builder !== null)
      ? BuilderID.fromPartial(object.builder)
      : undefined;
    message.pageSize = object.pageSize ?? 0;
    message.pageToken = object.pageToken ?? "";
    message.multiProjectSupport = object.multiProjectSupport ?? false;
    return message;
  },
};

function createBaseQueryBlamelistResponse(): QueryBlamelistResponse {
  return { commits: [], nextPageToken: "", precedingCommit: undefined };
}

export const QueryBlamelistResponse = {
  encode(message: QueryBlamelistResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.commits) {
      Commit.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== "") {
      writer.uint32(18).string(message.nextPageToken);
    }
    if (message.precedingCommit !== undefined) {
      Commit.encode(message.precedingCommit, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryBlamelistResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryBlamelistResponse() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.commits.push(Commit.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nextPageToken = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.precedingCommit = Commit.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryBlamelistResponse {
    return {
      commits: globalThis.Array.isArray(object?.commits) ? object.commits.map((e: any) => Commit.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? globalThis.String(object.nextPageToken) : "",
      precedingCommit: isSet(object.precedingCommit) ? Commit.fromJSON(object.precedingCommit) : undefined,
    };
  },

  toJSON(message: QueryBlamelistResponse): unknown {
    const obj: any = {};
    if (message.commits?.length) {
      obj.commits = message.commits.map((e) => Commit.toJSON(e));
    }
    if (message.nextPageToken !== "") {
      obj.nextPageToken = message.nextPageToken;
    }
    if (message.precedingCommit !== undefined) {
      obj.precedingCommit = Commit.toJSON(message.precedingCommit);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryBlamelistResponse>, I>>(base?: I): QueryBlamelistResponse {
    return QueryBlamelistResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryBlamelistResponse>, I>>(object: I): QueryBlamelistResponse {
    const message = createBaseQueryBlamelistResponse() as any;
    message.commits = object.commits?.map((e) => Commit.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? "";
    message.precedingCommit = (object.precedingCommit !== undefined && object.precedingCommit !== null)
      ? Commit.fromPartial(object.precedingCommit)
      : undefined;
    return message;
  },
};

function createBaseQueryBlamelistPageToken(): QueryBlamelistPageToken {
  return { nextCommitId: "" };
}

export const QueryBlamelistPageToken = {
  encode(message: QueryBlamelistPageToken, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.nextCommitId !== "") {
      writer.uint32(18).string(message.nextCommitId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryBlamelistPageToken {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryBlamelistPageToken() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nextCommitId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryBlamelistPageToken {
    return { nextCommitId: isSet(object.nextCommitId) ? globalThis.String(object.nextCommitId) : "" };
  },

  toJSON(message: QueryBlamelistPageToken): unknown {
    const obj: any = {};
    if (message.nextCommitId !== "") {
      obj.nextCommitId = message.nextCommitId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryBlamelistPageToken>, I>>(base?: I): QueryBlamelistPageToken {
    return QueryBlamelistPageToken.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryBlamelistPageToken>, I>>(object: I): QueryBlamelistPageToken {
    const message = createBaseQueryBlamelistPageToken() as any;
    message.nextCommitId = object.nextCommitId ?? "";
    return message;
  },
};

function createBaseListProjectsRequest(): ListProjectsRequest {
  return { pageSize: 0, pageToken: "" };
}

export const ListProjectsRequest = {
  encode(message: ListProjectsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pageSize !== 0) {
      writer.uint32(8).int32(message.pageSize);
    }
    if (message.pageToken !== "") {
      writer.uint32(18).string(message.pageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListProjectsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListProjectsRequest() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.pageSize = reader.int32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.pageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListProjectsRequest {
    return {
      pageSize: isSet(object.pageSize) ? globalThis.Number(object.pageSize) : 0,
      pageToken: isSet(object.pageToken) ? globalThis.String(object.pageToken) : "",
    };
  },

  toJSON(message: ListProjectsRequest): unknown {
    const obj: any = {};
    if (message.pageSize !== 0) {
      obj.pageSize = Math.round(message.pageSize);
    }
    if (message.pageToken !== "") {
      obj.pageToken = message.pageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListProjectsRequest>, I>>(base?: I): ListProjectsRequest {
    return ListProjectsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListProjectsRequest>, I>>(object: I): ListProjectsRequest {
    const message = createBaseListProjectsRequest() as any;
    message.pageSize = object.pageSize ?? 0;
    message.pageToken = object.pageToken ?? "";
    return message;
  },
};

function createBaseListProjectsResponse(): ListProjectsResponse {
  return { projects: [], nextPageToken: "" };
}

export const ListProjectsResponse = {
  encode(message: ListProjectsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.projects) {
      ProjectListItem.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== "") {
      writer.uint32(18).string(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListProjectsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListProjectsResponse() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.projects.push(ProjectListItem.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nextPageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListProjectsResponse {
    return {
      projects: globalThis.Array.isArray(object?.projects)
        ? object.projects.map((e: any) => ProjectListItem.fromJSON(e))
        : [],
      nextPageToken: isSet(object.nextPageToken) ? globalThis.String(object.nextPageToken) : "",
    };
  },

  toJSON(message: ListProjectsResponse): unknown {
    const obj: any = {};
    if (message.projects?.length) {
      obj.projects = message.projects.map((e) => ProjectListItem.toJSON(e));
    }
    if (message.nextPageToken !== "") {
      obj.nextPageToken = message.nextPageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListProjectsResponse>, I>>(base?: I): ListProjectsResponse {
    return ListProjectsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListProjectsResponse>, I>>(object: I): ListProjectsResponse {
    const message = createBaseListProjectsResponse() as any;
    message.projects = object.projects?.map((e) => ProjectListItem.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? "";
    return message;
  },
};

function createBaseProjectListItem(): ProjectListItem {
  return { id: "", logoUrl: "" };
}

export const ProjectListItem = {
  encode(message: ProjectListItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.logoUrl !== "") {
      writer.uint32(18).string(message.logoUrl);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProjectListItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProjectListItem() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.logoUrl = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProjectListItem {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      logoUrl: isSet(object.logoUrl) ? globalThis.String(object.logoUrl) : "",
    };
  },

  toJSON(message: ProjectListItem): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.logoUrl !== "") {
      obj.logoUrl = message.logoUrl;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProjectListItem>, I>>(base?: I): ProjectListItem {
    return ProjectListItem.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProjectListItem>, I>>(object: I): ProjectListItem {
    const message = createBaseProjectListItem() as any;
    message.id = object.id ?? "";
    message.logoUrl = object.logoUrl ?? "";
    return message;
  },
};

function createBaseListProjectsPageToken(): ListProjectsPageToken {
  return { nextProjectIndex: 0 };
}

export const ListProjectsPageToken = {
  encode(message: ListProjectsPageToken, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.nextProjectIndex !== 0) {
      writer.uint32(24).int32(message.nextProjectIndex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListProjectsPageToken {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListProjectsPageToken() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 3:
          if (tag !== 24) {
            break;
          }

          message.nextProjectIndex = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListProjectsPageToken {
    return { nextProjectIndex: isSet(object.nextProjectIndex) ? globalThis.Number(object.nextProjectIndex) : 0 };
  },

  toJSON(message: ListProjectsPageToken): unknown {
    const obj: any = {};
    if (message.nextProjectIndex !== 0) {
      obj.nextProjectIndex = Math.round(message.nextProjectIndex);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListProjectsPageToken>, I>>(base?: I): ListProjectsPageToken {
    return ListProjectsPageToken.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListProjectsPageToken>, I>>(object: I): ListProjectsPageToken {
    const message = createBaseListProjectsPageToken() as any;
    message.nextProjectIndex = object.nextProjectIndex ?? 0;
    return message;
  },
};

function createBaseGetProjectCfgRequest(): GetProjectCfgRequest {
  return { project: "" };
}

export const GetProjectCfgRequest = {
  encode(message: GetProjectCfgRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.project !== "") {
      writer.uint32(10).string(message.project);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetProjectCfgRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetProjectCfgRequest() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.project = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetProjectCfgRequest {
    return { project: isSet(object.project) ? globalThis.String(object.project) : "" };
  },

  toJSON(message: GetProjectCfgRequest): unknown {
    const obj: any = {};
    if (message.project !== "") {
      obj.project = message.project;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetProjectCfgRequest>, I>>(base?: I): GetProjectCfgRequest {
    return GetProjectCfgRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetProjectCfgRequest>, I>>(object: I): GetProjectCfgRequest {
    const message = createBaseGetProjectCfgRequest() as any;
    message.project = object.project ?? "";
    return message;
  },
};

function createBaseQueryRecentBuildsRequest(): QueryRecentBuildsRequest {
  return { builder: undefined, pageSize: 0, pageToken: "" };
}

export const QueryRecentBuildsRequest = {
  encode(message: QueryRecentBuildsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.builder !== undefined) {
      BuilderID.encode(message.builder, writer.uint32(10).fork()).ldelim();
    }
    if (message.pageSize !== 0) {
      writer.uint32(16).int32(message.pageSize);
    }
    if (message.pageToken !== "") {
      writer.uint32(26).string(message.pageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryRecentBuildsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryRecentBuildsRequest() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.builder = BuilderID.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.pageSize = reader.int32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.pageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryRecentBuildsRequest {
    return {
      builder: isSet(object.builder) ? BuilderID.fromJSON(object.builder) : undefined,
      pageSize: isSet(object.pageSize) ? globalThis.Number(object.pageSize) : 0,
      pageToken: isSet(object.pageToken) ? globalThis.String(object.pageToken) : "",
    };
  },

  toJSON(message: QueryRecentBuildsRequest): unknown {
    const obj: any = {};
    if (message.builder !== undefined) {
      obj.builder = BuilderID.toJSON(message.builder);
    }
    if (message.pageSize !== 0) {
      obj.pageSize = Math.round(message.pageSize);
    }
    if (message.pageToken !== "") {
      obj.pageToken = message.pageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryRecentBuildsRequest>, I>>(base?: I): QueryRecentBuildsRequest {
    return QueryRecentBuildsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryRecentBuildsRequest>, I>>(object: I): QueryRecentBuildsRequest {
    const message = createBaseQueryRecentBuildsRequest() as any;
    message.builder = (object.builder !== undefined && object.builder !== null)
      ? BuilderID.fromPartial(object.builder)
      : undefined;
    message.pageSize = object.pageSize ?? 0;
    message.pageToken = object.pageToken ?? "";
    return message;
  },
};

function createBaseQueryRecentBuildsResponse(): QueryRecentBuildsResponse {
  return { builds: [], nextPageToken: "" };
}

export const QueryRecentBuildsResponse = {
  encode(message: QueryRecentBuildsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.builds) {
      Build.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== "") {
      writer.uint32(18).string(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryRecentBuildsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryRecentBuildsResponse() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.builds.push(Build.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nextPageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryRecentBuildsResponse {
    return {
      builds: globalThis.Array.isArray(object?.builds) ? object.builds.map((e: any) => Build.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? globalThis.String(object.nextPageToken) : "",
    };
  },

  toJSON(message: QueryRecentBuildsResponse): unknown {
    const obj: any = {};
    if (message.builds?.length) {
      obj.builds = message.builds.map((e) => Build.toJSON(e));
    }
    if (message.nextPageToken !== "") {
      obj.nextPageToken = message.nextPageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryRecentBuildsResponse>, I>>(base?: I): QueryRecentBuildsResponse {
    return QueryRecentBuildsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryRecentBuildsResponse>, I>>(object: I): QueryRecentBuildsResponse {
    const message = createBaseQueryRecentBuildsResponse() as any;
    message.builds = object.builds?.map((e) => Build.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? "";
    return message;
  },
};

function createBaseListBuildersRequest(): ListBuildersRequest {
  return { project: "", group: "", pageSize: 0, pageToken: "" };
}

export const ListBuildersRequest = {
  encode(message: ListBuildersRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.project !== "") {
      writer.uint32(10).string(message.project);
    }
    if (message.group !== "") {
      writer.uint32(18).string(message.group);
    }
    if (message.pageSize !== 0) {
      writer.uint32(24).int32(message.pageSize);
    }
    if (message.pageToken !== "") {
      writer.uint32(34).string(message.pageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListBuildersRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListBuildersRequest() as any;
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

          message.group = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.pageSize = reader.int32();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.pageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListBuildersRequest {
    return {
      project: isSet(object.project) ? globalThis.String(object.project) : "",
      group: isSet(object.group) ? globalThis.String(object.group) : "",
      pageSize: isSet(object.pageSize) ? globalThis.Number(object.pageSize) : 0,
      pageToken: isSet(object.pageToken) ? globalThis.String(object.pageToken) : "",
    };
  },

  toJSON(message: ListBuildersRequest): unknown {
    const obj: any = {};
    if (message.project !== "") {
      obj.project = message.project;
    }
    if (message.group !== "") {
      obj.group = message.group;
    }
    if (message.pageSize !== 0) {
      obj.pageSize = Math.round(message.pageSize);
    }
    if (message.pageToken !== "") {
      obj.pageToken = message.pageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListBuildersRequest>, I>>(base?: I): ListBuildersRequest {
    return ListBuildersRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListBuildersRequest>, I>>(object: I): ListBuildersRequest {
    const message = createBaseListBuildersRequest() as any;
    message.project = object.project ?? "";
    message.group = object.group ?? "";
    message.pageSize = object.pageSize ?? 0;
    message.pageToken = object.pageToken ?? "";
    return message;
  },
};

function createBaseListBuildersResponse(): ListBuildersResponse {
  return { builders: [], nextPageToken: "" };
}

export const ListBuildersResponse = {
  encode(message: ListBuildersResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.builders) {
      BuilderItem.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== "") {
      writer.uint32(18).string(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListBuildersResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListBuildersResponse() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.builders.push(BuilderItem.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nextPageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListBuildersResponse {
    return {
      builders: globalThis.Array.isArray(object?.builders)
        ? object.builders.map((e: any) => BuilderItem.fromJSON(e))
        : [],
      nextPageToken: isSet(object.nextPageToken) ? globalThis.String(object.nextPageToken) : "",
    };
  },

  toJSON(message: ListBuildersResponse): unknown {
    const obj: any = {};
    if (message.builders?.length) {
      obj.builders = message.builders.map((e) => BuilderItem.toJSON(e));
    }
    if (message.nextPageToken !== "") {
      obj.nextPageToken = message.nextPageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListBuildersResponse>, I>>(base?: I): ListBuildersResponse {
    return ListBuildersResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListBuildersResponse>, I>>(object: I): ListBuildersResponse {
    const message = createBaseListBuildersResponse() as any;
    message.builders = object.builders?.map((e) => BuilderItem.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? "";
    return message;
  },
};

function createBaseListBuildersPageToken(): ListBuildersPageToken {
  return { nextBuildbucketBuilderIndex: 0, nextMiloBuilderIndex: 0 };
}

export const ListBuildersPageToken = {
  encode(message: ListBuildersPageToken, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.nextBuildbucketBuilderIndex !== 0) {
      writer.uint32(24).int32(message.nextBuildbucketBuilderIndex);
    }
    if (message.nextMiloBuilderIndex !== 0) {
      writer.uint32(16).int32(message.nextMiloBuilderIndex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListBuildersPageToken {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListBuildersPageToken() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 3:
          if (tag !== 24) {
            break;
          }

          message.nextBuildbucketBuilderIndex = reader.int32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.nextMiloBuilderIndex = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListBuildersPageToken {
    return {
      nextBuildbucketBuilderIndex: isSet(object.nextBuildbucketBuilderIndex)
        ? globalThis.Number(object.nextBuildbucketBuilderIndex)
        : 0,
      nextMiloBuilderIndex: isSet(object.nextMiloBuilderIndex) ? globalThis.Number(object.nextMiloBuilderIndex) : 0,
    };
  },

  toJSON(message: ListBuildersPageToken): unknown {
    const obj: any = {};
    if (message.nextBuildbucketBuilderIndex !== 0) {
      obj.nextBuildbucketBuilderIndex = Math.round(message.nextBuildbucketBuilderIndex);
    }
    if (message.nextMiloBuilderIndex !== 0) {
      obj.nextMiloBuilderIndex = Math.round(message.nextMiloBuilderIndex);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListBuildersPageToken>, I>>(base?: I): ListBuildersPageToken {
    return ListBuildersPageToken.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListBuildersPageToken>, I>>(object: I): ListBuildersPageToken {
    const message = createBaseListBuildersPageToken() as any;
    message.nextBuildbucketBuilderIndex = object.nextBuildbucketBuilderIndex ?? 0;
    message.nextMiloBuilderIndex = object.nextMiloBuilderIndex ?? 0;
    return message;
  },
};

function createBaseQueryBuilderStatsRequest(): QueryBuilderStatsRequest {
  return { builder: undefined };
}

export const QueryBuilderStatsRequest = {
  encode(message: QueryBuilderStatsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.builder !== undefined) {
      BuilderID.encode(message.builder, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryBuilderStatsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryBuilderStatsRequest() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.builder = BuilderID.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryBuilderStatsRequest {
    return { builder: isSet(object.builder) ? BuilderID.fromJSON(object.builder) : undefined };
  },

  toJSON(message: QueryBuilderStatsRequest): unknown {
    const obj: any = {};
    if (message.builder !== undefined) {
      obj.builder = BuilderID.toJSON(message.builder);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryBuilderStatsRequest>, I>>(base?: I): QueryBuilderStatsRequest {
    return QueryBuilderStatsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryBuilderStatsRequest>, I>>(object: I): QueryBuilderStatsRequest {
    const message = createBaseQueryBuilderStatsRequest() as any;
    message.builder = (object.builder !== undefined && object.builder !== null)
      ? BuilderID.fromPartial(object.builder)
      : undefined;
    return message;
  },
};

function createBaseBuilderStats(): BuilderStats {
  return { builder: undefined, pendingBuildsCount: 0, runningBuildsCount: 0 };
}

export const BuilderStats = {
  encode(message: BuilderStats, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.builder !== undefined) {
      BuilderID.encode(message.builder, writer.uint32(10).fork()).ldelim();
    }
    if (message.pendingBuildsCount !== 0) {
      writer.uint32(16).int32(message.pendingBuildsCount);
    }
    if (message.runningBuildsCount !== 0) {
      writer.uint32(24).int32(message.runningBuildsCount);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BuilderStats {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBuilderStats() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.builder = BuilderID.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.pendingBuildsCount = reader.int32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.runningBuildsCount = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BuilderStats {
    return {
      builder: isSet(object.builder) ? BuilderID.fromJSON(object.builder) : undefined,
      pendingBuildsCount: isSet(object.pendingBuildsCount) ? globalThis.Number(object.pendingBuildsCount) : 0,
      runningBuildsCount: isSet(object.runningBuildsCount) ? globalThis.Number(object.runningBuildsCount) : 0,
    };
  },

  toJSON(message: BuilderStats): unknown {
    const obj: any = {};
    if (message.builder !== undefined) {
      obj.builder = BuilderID.toJSON(message.builder);
    }
    if (message.pendingBuildsCount !== 0) {
      obj.pendingBuildsCount = Math.round(message.pendingBuildsCount);
    }
    if (message.runningBuildsCount !== 0) {
      obj.runningBuildsCount = Math.round(message.runningBuildsCount);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BuilderStats>, I>>(base?: I): BuilderStats {
    return BuilderStats.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BuilderStats>, I>>(object: I): BuilderStats {
    const message = createBaseBuilderStats() as any;
    message.builder = (object.builder !== undefined && object.builder !== null)
      ? BuilderID.fromPartial(object.builder)
      : undefined;
    message.pendingBuildsCount = object.pendingBuildsCount ?? 0;
    message.runningBuildsCount = object.runningBuildsCount ?? 0;
    return message;
  },
};

function createBaseBatchCheckPermissionsRequest(): BatchCheckPermissionsRequest {
  return { realm: "", permissions: [] };
}

export const BatchCheckPermissionsRequest = {
  encode(message: BatchCheckPermissionsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.realm !== "") {
      writer.uint32(10).string(message.realm);
    }
    for (const v of message.permissions) {
      writer.uint32(18).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BatchCheckPermissionsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBatchCheckPermissionsRequest() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.realm = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.permissions.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BatchCheckPermissionsRequest {
    return {
      realm: isSet(object.realm) ? globalThis.String(object.realm) : "",
      permissions: globalThis.Array.isArray(object?.permissions)
        ? object.permissions.map((e: any) => globalThis.String(e))
        : [],
    };
  },

  toJSON(message: BatchCheckPermissionsRequest): unknown {
    const obj: any = {};
    if (message.realm !== "") {
      obj.realm = message.realm;
    }
    if (message.permissions?.length) {
      obj.permissions = message.permissions;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BatchCheckPermissionsRequest>, I>>(base?: I): BatchCheckPermissionsRequest {
    return BatchCheckPermissionsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BatchCheckPermissionsRequest>, I>>(object: I): BatchCheckPermissionsRequest {
    const message = createBaseBatchCheckPermissionsRequest() as any;
    message.realm = object.realm ?? "";
    message.permissions = object.permissions?.map((e) => e) || [];
    return message;
  },
};

function createBaseBatchCheckPermissionsResponse(): BatchCheckPermissionsResponse {
  return { results: {} };
}

export const BatchCheckPermissionsResponse = {
  encode(message: BatchCheckPermissionsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.results).forEach(([key, value]) => {
      BatchCheckPermissionsResponse_ResultsEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BatchCheckPermissionsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBatchCheckPermissionsResponse() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = BatchCheckPermissionsResponse_ResultsEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.results[entry1.key] = entry1.value;
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

  fromJSON(object: any): BatchCheckPermissionsResponse {
    return {
      results: isObject(object.results)
        ? Object.entries(object.results).reduce<{ [key: string]: boolean }>((acc, [key, value]) => {
          acc[key] = Boolean(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: BatchCheckPermissionsResponse): unknown {
    const obj: any = {};
    if (message.results) {
      const entries = Object.entries(message.results);
      if (entries.length > 0) {
        obj.results = {};
        entries.forEach(([k, v]) => {
          obj.results[k] = v;
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BatchCheckPermissionsResponse>, I>>(base?: I): BatchCheckPermissionsResponse {
    return BatchCheckPermissionsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BatchCheckPermissionsResponse>, I>>(
    object: I,
  ): BatchCheckPermissionsResponse {
    const message = createBaseBatchCheckPermissionsResponse() as any;
    message.results = Object.entries(object.results ?? {}).reduce<{ [key: string]: boolean }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = globalThis.Boolean(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseBatchCheckPermissionsResponse_ResultsEntry(): BatchCheckPermissionsResponse_ResultsEntry {
  return { key: "", value: false };
}

export const BatchCheckPermissionsResponse_ResultsEntry = {
  encode(message: BatchCheckPermissionsResponse_ResultsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value === true) {
      writer.uint32(16).bool(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BatchCheckPermissionsResponse_ResultsEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBatchCheckPermissionsResponse_ResultsEntry() as any;
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
          if (tag !== 16) {
            break;
          }

          message.value = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BatchCheckPermissionsResponse_ResultsEntry {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : "",
      value: isSet(object.value) ? globalThis.Boolean(object.value) : false,
    };
  },

  toJSON(message: BatchCheckPermissionsResponse_ResultsEntry): unknown {
    const obj: any = {};
    if (message.key !== "") {
      obj.key = message.key;
    }
    if (message.value === true) {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BatchCheckPermissionsResponse_ResultsEntry>, I>>(
    base?: I,
  ): BatchCheckPermissionsResponse_ResultsEntry {
    return BatchCheckPermissionsResponse_ResultsEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BatchCheckPermissionsResponse_ResultsEntry>, I>>(
    object: I,
  ): BatchCheckPermissionsResponse_ResultsEntry {
    const message = createBaseBatchCheckPermissionsResponse_ResultsEntry() as any;
    message.key = object.key ?? "";
    message.value = object.value ?? false;
    return message;
  },
};

function createBaseConsolePredicate(): ConsolePredicate {
  return { project: "", builder: undefined };
}

export const ConsolePredicate = {
  encode(message: ConsolePredicate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.project !== "") {
      writer.uint32(18).string(message.project);
    }
    if (message.builder !== undefined) {
      BuilderID.encode(message.builder, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConsolePredicate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConsolePredicate() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag !== 18) {
            break;
          }

          message.project = reader.string();
          continue;
        case 1:
          if (tag !== 10) {
            break;
          }

          message.builder = BuilderID.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ConsolePredicate {
    return {
      project: isSet(object.project) ? globalThis.String(object.project) : "",
      builder: isSet(object.builder) ? BuilderID.fromJSON(object.builder) : undefined,
    };
  },

  toJSON(message: ConsolePredicate): unknown {
    const obj: any = {};
    if (message.project !== "") {
      obj.project = message.project;
    }
    if (message.builder !== undefined) {
      obj.builder = BuilderID.toJSON(message.builder);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ConsolePredicate>, I>>(base?: I): ConsolePredicate {
    return ConsolePredicate.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ConsolePredicate>, I>>(object: I): ConsolePredicate {
    const message = createBaseConsolePredicate() as any;
    message.project = object.project ?? "";
    message.builder = (object.builder !== undefined && object.builder !== null)
      ? BuilderID.fromPartial(object.builder)
      : undefined;
    return message;
  },
};

function createBaseQueryConsolesRequest(): QueryConsolesRequest {
  return { predicate: undefined, pageSize: 0, pageToken: "" };
}

export const QueryConsolesRequest = {
  encode(message: QueryConsolesRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.predicate !== undefined) {
      ConsolePredicate.encode(message.predicate, writer.uint32(10).fork()).ldelim();
    }
    if (message.pageSize !== 0) {
      writer.uint32(16).int32(message.pageSize);
    }
    if (message.pageToken !== "") {
      writer.uint32(26).string(message.pageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryConsolesRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryConsolesRequest() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.predicate = ConsolePredicate.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.pageSize = reader.int32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.pageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryConsolesRequest {
    return {
      predicate: isSet(object.predicate) ? ConsolePredicate.fromJSON(object.predicate) : undefined,
      pageSize: isSet(object.pageSize) ? globalThis.Number(object.pageSize) : 0,
      pageToken: isSet(object.pageToken) ? globalThis.String(object.pageToken) : "",
    };
  },

  toJSON(message: QueryConsolesRequest): unknown {
    const obj: any = {};
    if (message.predicate !== undefined) {
      obj.predicate = ConsolePredicate.toJSON(message.predicate);
    }
    if (message.pageSize !== 0) {
      obj.pageSize = Math.round(message.pageSize);
    }
    if (message.pageToken !== "") {
      obj.pageToken = message.pageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryConsolesRequest>, I>>(base?: I): QueryConsolesRequest {
    return QueryConsolesRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryConsolesRequest>, I>>(object: I): QueryConsolesRequest {
    const message = createBaseQueryConsolesRequest() as any;
    message.predicate = (object.predicate !== undefined && object.predicate !== null)
      ? ConsolePredicate.fromPartial(object.predicate)
      : undefined;
    message.pageSize = object.pageSize ?? 0;
    message.pageToken = object.pageToken ?? "";
    return message;
  },
};

function createBaseQueryConsolesResponse(): QueryConsolesResponse {
  return { consoles: [], nextPageToken: "" };
}

export const QueryConsolesResponse = {
  encode(message: QueryConsolesResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.consoles) {
      Console.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== "") {
      writer.uint32(18).string(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryConsolesResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryConsolesResponse() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.consoles.push(Console.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nextPageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryConsolesResponse {
    return {
      consoles: globalThis.Array.isArray(object?.consoles) ? object.consoles.map((e: any) => Console.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? globalThis.String(object.nextPageToken) : "",
    };
  },

  toJSON(message: QueryConsolesResponse): unknown {
    const obj: any = {};
    if (message.consoles?.length) {
      obj.consoles = message.consoles.map((e) => Console.toJSON(e));
    }
    if (message.nextPageToken !== "") {
      obj.nextPageToken = message.nextPageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryConsolesResponse>, I>>(base?: I): QueryConsolesResponse {
    return QueryConsolesResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryConsolesResponse>, I>>(object: I): QueryConsolesResponse {
    const message = createBaseQueryConsolesResponse() as any;
    message.consoles = object.consoles?.map((e) => Console.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? "";
    return message;
  },
};

function createBaseQueryConsoleSnapshotsRequest(): QueryConsoleSnapshotsRequest {
  return { predicate: undefined, pageSize: 0, pageToken: "" };
}

export const QueryConsoleSnapshotsRequest = {
  encode(message: QueryConsoleSnapshotsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.predicate !== undefined) {
      ConsolePredicate.encode(message.predicate, writer.uint32(10).fork()).ldelim();
    }
    if (message.pageSize !== 0) {
      writer.uint32(16).int32(message.pageSize);
    }
    if (message.pageToken !== "") {
      writer.uint32(26).string(message.pageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryConsoleSnapshotsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryConsoleSnapshotsRequest() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.predicate = ConsolePredicate.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.pageSize = reader.int32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.pageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryConsoleSnapshotsRequest {
    return {
      predicate: isSet(object.predicate) ? ConsolePredicate.fromJSON(object.predicate) : undefined,
      pageSize: isSet(object.pageSize) ? globalThis.Number(object.pageSize) : 0,
      pageToken: isSet(object.pageToken) ? globalThis.String(object.pageToken) : "",
    };
  },

  toJSON(message: QueryConsoleSnapshotsRequest): unknown {
    const obj: any = {};
    if (message.predicate !== undefined) {
      obj.predicate = ConsolePredicate.toJSON(message.predicate);
    }
    if (message.pageSize !== 0) {
      obj.pageSize = Math.round(message.pageSize);
    }
    if (message.pageToken !== "") {
      obj.pageToken = message.pageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryConsoleSnapshotsRequest>, I>>(base?: I): QueryConsoleSnapshotsRequest {
    return QueryConsoleSnapshotsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryConsoleSnapshotsRequest>, I>>(object: I): QueryConsoleSnapshotsRequest {
    const message = createBaseQueryConsoleSnapshotsRequest() as any;
    message.predicate = (object.predicate !== undefined && object.predicate !== null)
      ? ConsolePredicate.fromPartial(object.predicate)
      : undefined;
    message.pageSize = object.pageSize ?? 0;
    message.pageToken = object.pageToken ?? "";
    return message;
  },
};

function createBaseBuilderSnapshot(): BuilderSnapshot {
  return { builder: undefined, build: undefined };
}

export const BuilderSnapshot = {
  encode(message: BuilderSnapshot, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.builder !== undefined) {
      BuilderID.encode(message.builder, writer.uint32(10).fork()).ldelim();
    }
    if (message.build !== undefined) {
      Build.encode(message.build, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BuilderSnapshot {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBuilderSnapshot() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.builder = BuilderID.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.build = Build.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BuilderSnapshot {
    return {
      builder: isSet(object.builder) ? BuilderID.fromJSON(object.builder) : undefined,
      build: isSet(object.build) ? Build.fromJSON(object.build) : undefined,
    };
  },

  toJSON(message: BuilderSnapshot): unknown {
    const obj: any = {};
    if (message.builder !== undefined) {
      obj.builder = BuilderID.toJSON(message.builder);
    }
    if (message.build !== undefined) {
      obj.build = Build.toJSON(message.build);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BuilderSnapshot>, I>>(base?: I): BuilderSnapshot {
    return BuilderSnapshot.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BuilderSnapshot>, I>>(object: I): BuilderSnapshot {
    const message = createBaseBuilderSnapshot() as any;
    message.builder = (object.builder !== undefined && object.builder !== null)
      ? BuilderID.fromPartial(object.builder)
      : undefined;
    message.build = (object.build !== undefined && object.build !== null) ? Build.fromPartial(object.build) : undefined;
    return message;
  },
};

function createBaseConsoleSnapshot(): ConsoleSnapshot {
  return { console: undefined, builderSnapshots: [] };
}

export const ConsoleSnapshot = {
  encode(message: ConsoleSnapshot, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.console !== undefined) {
      Console.encode(message.console, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.builderSnapshots) {
      BuilderSnapshot.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConsoleSnapshot {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConsoleSnapshot() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.console = Console.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.builderSnapshots.push(BuilderSnapshot.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ConsoleSnapshot {
    return {
      console: isSet(object.console) ? Console.fromJSON(object.console) : undefined,
      builderSnapshots: globalThis.Array.isArray(object?.builderSnapshots)
        ? object.builderSnapshots.map((e: any) => BuilderSnapshot.fromJSON(e))
        : [],
    };
  },

  toJSON(message: ConsoleSnapshot): unknown {
    const obj: any = {};
    if (message.console !== undefined) {
      obj.console = Console.toJSON(message.console);
    }
    if (message.builderSnapshots?.length) {
      obj.builderSnapshots = message.builderSnapshots.map((e) => BuilderSnapshot.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ConsoleSnapshot>, I>>(base?: I): ConsoleSnapshot {
    return ConsoleSnapshot.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ConsoleSnapshot>, I>>(object: I): ConsoleSnapshot {
    const message = createBaseConsoleSnapshot() as any;
    message.console = (object.console !== undefined && object.console !== null)
      ? Console.fromPartial(object.console)
      : undefined;
    message.builderSnapshots = object.builderSnapshots?.map((e) => BuilderSnapshot.fromPartial(e)) || [];
    return message;
  },
};

function createBaseQueryConsoleSnapshotsResponse(): QueryConsoleSnapshotsResponse {
  return { snapshots: [], nextPageToken: "" };
}

export const QueryConsoleSnapshotsResponse = {
  encode(message: QueryConsoleSnapshotsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.snapshots) {
      ConsoleSnapshot.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== "") {
      writer.uint32(18).string(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryConsoleSnapshotsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryConsoleSnapshotsResponse() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.snapshots.push(ConsoleSnapshot.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nextPageToken = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryConsoleSnapshotsResponse {
    return {
      snapshots: globalThis.Array.isArray(object?.snapshots)
        ? object.snapshots.map((e: any) => ConsoleSnapshot.fromJSON(e))
        : [],
      nextPageToken: isSet(object.nextPageToken) ? globalThis.String(object.nextPageToken) : "",
    };
  },

  toJSON(message: QueryConsoleSnapshotsResponse): unknown {
    const obj: any = {};
    if (message.snapshots?.length) {
      obj.snapshots = message.snapshots.map((e) => ConsoleSnapshot.toJSON(e));
    }
    if (message.nextPageToken !== "") {
      obj.nextPageToken = message.nextPageToken;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryConsoleSnapshotsResponse>, I>>(base?: I): QueryConsoleSnapshotsResponse {
    return QueryConsoleSnapshotsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryConsoleSnapshotsResponse>, I>>(
    object: I,
  ): QueryConsoleSnapshotsResponse {
    const message = createBaseQueryConsoleSnapshotsResponse() as any;
    message.snapshots = object.snapshots?.map((e) => ConsoleSnapshot.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? "";
    return message;
  },
};

/**
 * Service to query data on the Milo server.
 *
 * Note: this is private API and should only be used by Milo apps. Breaking
 * changes might be introduced without notice.
 * Please contact chops-luci-test@ if your code needs to depend on this service.
 */
export interface MiloInternal {
  /**
   * Retrieves blamelist of a build.
   *
   * The blamelist of a build is defined as [end_commit, start_commit)
   * end_commit is the Gitiles commit of the build (specified in gitiles
   * buildset tag).
   * start_commit is the closest ancestor commit with an associated build that
   * is from the same builder and is not expired, cancelled, or infra-failed.
   */
  QueryBlamelist(request: QueryBlamelistRequest): Promise<QueryBlamelistResponse>;
  /** Retrieves a list of projects. */
  ListProjects(request: ListProjectsRequest): Promise<ListProjectsResponse>;
  /**
   * Gets the project config.
   *
   * Return the config of the project.
   */
  GetProjectCfg(request: GetProjectCfgRequest): Promise<Project>;
  /** Retrieves the recent, finished builds of a builder. */
  QueryRecentBuilds(request: QueryRecentBuildsRequest): Promise<QueryRecentBuildsResponse>;
  /** Retrieves a list of builders in a project or a builder group. */
  ListBuilders(request: ListBuildersRequest): Promise<ListBuildersResponse>;
  /** Get the statistics associated with a builder. */
  QueryBuilderStats(request: QueryBuilderStatsRequest): Promise<BuilderStats>;
  /** Check whether the users has the specified permissions in the given realm. */
  BatchCheckPermissions(request: BatchCheckPermissionsRequest): Promise<BatchCheckPermissionsResponse>;
  /** Retrieves a list of consoles. */
  QueryConsoles(request: QueryConsolesRequest): Promise<QueryConsolesResponse>;
  /** Retrieves a list of consoles with latest snapshots. */
  QueryConsoleSnapshots(request: QueryConsoleSnapshotsRequest): Promise<QueryConsoleSnapshotsResponse>;
}

export const MiloInternalServiceName = "luci.milo.v1.MiloInternal";
export class MiloInternalClientImpl implements MiloInternal {
  static readonly DEFAULT_SERVICE = MiloInternalServiceName;
  private readonly rpc: Rpc;
  private readonly service: string;
  constructor(rpc: Rpc, opts?: { service?: string }) {
    this.service = opts?.service || MiloInternalServiceName;
    this.rpc = rpc;
    this.QueryBlamelist = this.QueryBlamelist.bind(this);
    this.ListProjects = this.ListProjects.bind(this);
    this.GetProjectCfg = this.GetProjectCfg.bind(this);
    this.QueryRecentBuilds = this.QueryRecentBuilds.bind(this);
    this.ListBuilders = this.ListBuilders.bind(this);
    this.QueryBuilderStats = this.QueryBuilderStats.bind(this);
    this.BatchCheckPermissions = this.BatchCheckPermissions.bind(this);
    this.QueryConsoles = this.QueryConsoles.bind(this);
    this.QueryConsoleSnapshots = this.QueryConsoleSnapshots.bind(this);
  }
  QueryBlamelist(request: QueryBlamelistRequest): Promise<QueryBlamelistResponse> {
    const data = QueryBlamelistRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "QueryBlamelist", data);
    return promise.then((data) => QueryBlamelistResponse.decode(_m0.Reader.create(data)));
  }

  ListProjects(request: ListProjectsRequest): Promise<ListProjectsResponse> {
    const data = ListProjectsRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "ListProjects", data);
    return promise.then((data) => ListProjectsResponse.decode(_m0.Reader.create(data)));
  }

  GetProjectCfg(request: GetProjectCfgRequest): Promise<Project> {
    const data = GetProjectCfgRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "GetProjectCfg", data);
    return promise.then((data) => Project.decode(_m0.Reader.create(data)));
  }

  QueryRecentBuilds(request: QueryRecentBuildsRequest): Promise<QueryRecentBuildsResponse> {
    const data = QueryRecentBuildsRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "QueryRecentBuilds", data);
    return promise.then((data) => QueryRecentBuildsResponse.decode(_m0.Reader.create(data)));
  }

  ListBuilders(request: ListBuildersRequest): Promise<ListBuildersResponse> {
    const data = ListBuildersRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "ListBuilders", data);
    return promise.then((data) => ListBuildersResponse.decode(_m0.Reader.create(data)));
  }

  QueryBuilderStats(request: QueryBuilderStatsRequest): Promise<BuilderStats> {
    const data = QueryBuilderStatsRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "QueryBuilderStats", data);
    return promise.then((data) => BuilderStats.decode(_m0.Reader.create(data)));
  }

  BatchCheckPermissions(request: BatchCheckPermissionsRequest): Promise<BatchCheckPermissionsResponse> {
    const data = BatchCheckPermissionsRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "BatchCheckPermissions", data);
    return promise.then((data) => BatchCheckPermissionsResponse.decode(_m0.Reader.create(data)));
  }

  QueryConsoles(request: QueryConsolesRequest): Promise<QueryConsolesResponse> {
    const data = QueryConsolesRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "QueryConsoles", data);
    return promise.then((data) => QueryConsolesResponse.decode(_m0.Reader.create(data)));
  }

  QueryConsoleSnapshots(request: QueryConsoleSnapshotsRequest): Promise<QueryConsoleSnapshotsResponse> {
    const data = QueryConsoleSnapshotsRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "QueryConsoleSnapshots", data);
    return promise.then((data) => QueryConsoleSnapshotsResponse.decode(_m0.Reader.create(data)));
  }
}

interface Rpc {
  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
