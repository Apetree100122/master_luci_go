/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { HealthStatus } from "./common.pb";
import { BuilderConfig } from "./project_config.pb";

export const protobufPackage = "buildbucket.v2";

/**
 * Identifies a builder.
 * Canonical string representation: "{project}/{bucket}/{builder}".
 */
export interface BuilderID {
  /**
   * Project ID, e.g. "chromium". Unique within a LUCI deployment.
   * Regex: ^[a-z0-9\-_]+$
   */
  readonly project: string;
  /**
   * Bucket name, e.g. "try". Unique within the project.
   * Regex: ^[a-z0-9\-_.]{1,100}$
   * Together with project, defines an ACL.
   */
  readonly bucket: string;
  /**
   * Builder name, e.g. "linux-rel". Unique within the bucket.
   * Regex: ^[a-zA-Z0-9\-_.\(\) ]{1,128}$
   */
  readonly builder: string;
}

export interface BuilderMetadata {
  /** Team that owns the builder */
  readonly owner: string;
  /** Builders current health status */
  readonly health: HealthStatus | undefined;
}

/**
 * A configured builder.
 *
 * It is called BuilderItem and not Builder because
 * 1) Builder already exists
 * 2) Name "Builder" is incompatible with proto->Java compiler.
 */
export interface BuilderItem {
  /** Uniquely identifies the builder in a given Buildbucket instance. */
  readonly id:
    | BuilderID
    | undefined;
  /**
   * User-supplied configuration after normalization.
   * Does not refer to mixins and has defaults inlined.
   */
  readonly config:
    | BuilderConfig
    | undefined;
  /** Metadata surrounding the builder. */
  readonly metadata: BuilderMetadata | undefined;
}

function createBaseBuilderID(): BuilderID {
  return { project: "", bucket: "", builder: "" };
}

export const BuilderID = {
  encode(message: BuilderID, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.project !== "") {
      writer.uint32(10).string(message.project);
    }
    if (message.bucket !== "") {
      writer.uint32(18).string(message.bucket);
    }
    if (message.builder !== "") {
      writer.uint32(26).string(message.builder);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BuilderID {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBuilderID() as any;
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

          message.bucket = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.builder = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BuilderID {
    return {
      project: isSet(object.project) ? globalThis.String(object.project) : "",
      bucket: isSet(object.bucket) ? globalThis.String(object.bucket) : "",
      builder: isSet(object.builder) ? globalThis.String(object.builder) : "",
    };
  },

  toJSON(message: BuilderID): unknown {
    const obj: any = {};
    if (message.project !== "") {
      obj.project = message.project;
    }
    if (message.bucket !== "") {
      obj.bucket = message.bucket;
    }
    if (message.builder !== "") {
      obj.builder = message.builder;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BuilderID>, I>>(base?: I): BuilderID {
    return BuilderID.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BuilderID>, I>>(object: I): BuilderID {
    const message = createBaseBuilderID() as any;
    message.project = object.project ?? "";
    message.bucket = object.bucket ?? "";
    message.builder = object.builder ?? "";
    return message;
  },
};

function createBaseBuilderMetadata(): BuilderMetadata {
  return { owner: "", health: undefined };
}

export const BuilderMetadata = {
  encode(message: BuilderMetadata, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.owner !== "") {
      writer.uint32(10).string(message.owner);
    }
    if (message.health !== undefined) {
      HealthStatus.encode(message.health, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BuilderMetadata {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBuilderMetadata() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.owner = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.health = HealthStatus.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BuilderMetadata {
    return {
      owner: isSet(object.owner) ? globalThis.String(object.owner) : "",
      health: isSet(object.health) ? HealthStatus.fromJSON(object.health) : undefined,
    };
  },

  toJSON(message: BuilderMetadata): unknown {
    const obj: any = {};
    if (message.owner !== "") {
      obj.owner = message.owner;
    }
    if (message.health !== undefined) {
      obj.health = HealthStatus.toJSON(message.health);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BuilderMetadata>, I>>(base?: I): BuilderMetadata {
    return BuilderMetadata.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BuilderMetadata>, I>>(object: I): BuilderMetadata {
    const message = createBaseBuilderMetadata() as any;
    message.owner = object.owner ?? "";
    message.health = (object.health !== undefined && object.health !== null)
      ? HealthStatus.fromPartial(object.health)
      : undefined;
    return message;
  },
};

function createBaseBuilderItem(): BuilderItem {
  return { id: undefined, config: undefined, metadata: undefined };
}

export const BuilderItem = {
  encode(message: BuilderItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== undefined) {
      BuilderID.encode(message.id, writer.uint32(10).fork()).ldelim();
    }
    if (message.config !== undefined) {
      BuilderConfig.encode(message.config, writer.uint32(18).fork()).ldelim();
    }
    if (message.metadata !== undefined) {
      BuilderMetadata.encode(message.metadata, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BuilderItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBuilderItem() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = BuilderID.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.config = BuilderConfig.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.metadata = BuilderMetadata.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BuilderItem {
    return {
      id: isSet(object.id) ? BuilderID.fromJSON(object.id) : undefined,
      config: isSet(object.config) ? BuilderConfig.fromJSON(object.config) : undefined,
      metadata: isSet(object.metadata) ? BuilderMetadata.fromJSON(object.metadata) : undefined,
    };
  },

  toJSON(message: BuilderItem): unknown {
    const obj: any = {};
    if (message.id !== undefined) {
      obj.id = BuilderID.toJSON(message.id);
    }
    if (message.config !== undefined) {
      obj.config = BuilderConfig.toJSON(message.config);
    }
    if (message.metadata !== undefined) {
      obj.metadata = BuilderMetadata.toJSON(message.metadata);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BuilderItem>, I>>(base?: I): BuilderItem {
    return BuilderItem.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BuilderItem>, I>>(object: I): BuilderItem {
    const message = createBaseBuilderItem() as any;
    message.id = (object.id !== undefined && object.id !== null) ? BuilderID.fromPartial(object.id) : undefined;
    message.config = (object.config !== undefined && object.config !== null)
      ? BuilderConfig.fromPartial(object.config)
      : undefined;
    message.metadata = (object.metadata !== undefined && object.metadata !== null)
      ? BuilderMetadata.fromPartial(object.metadata)
      : undefined;
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

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
