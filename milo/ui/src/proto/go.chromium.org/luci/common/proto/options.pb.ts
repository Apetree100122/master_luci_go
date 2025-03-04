/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "luci";

/** Defining extensions is supported in proto2 syntax only. */

/**
 * Type of formatting to apply to a primitive field when converting a message to
 * TextPB
 */
export enum TextPBFieldFormat {
  /** DEFAULT - The default formatting for TextPB for the field */
  DEFAULT = 0,
  /**
   * JSON - Interpret the field's value as a JSON object and format it across multiple
   * lines, valid only for string fields
   */
  JSON = 1,
}

export function textPBFieldFormatFromJSON(object: any): TextPBFieldFormat {
  switch (object) {
    case 0:
    case "DEFAULT":
      return TextPBFieldFormat.DEFAULT;
    case 1:
    case "JSON":
      return TextPBFieldFormat.JSON;
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum TextPBFieldFormat");
  }
}

export function textPBFieldFormatToJSON(object: TextPBFieldFormat): string {
  switch (object) {
    case TextPBFieldFormat.DEFAULT:
      return "DEFAULT";
    case TextPBFieldFormat.JSON:
      return "JSON";
    default:
      throw new globalThis.Error("Unrecognized enum value " + object + " for enum TextPBFieldFormat");
  }
}

export interface Metadata {
  /** URL to a human-readable proto schema definition doc. */
  readonly docUrl: string;
}

function createBaseMetadata(): Metadata {
  return { docUrl: "" };
}

export const Metadata = {
  encode(message: Metadata, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.docUrl !== "") {
      writer.uint32(10).string(message.docUrl);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Metadata {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMetadata() as any;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.docUrl = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Metadata {
    return { docUrl: isSet(object.docUrl) ? globalThis.String(object.docUrl) : "" };
  },

  toJSON(message: Metadata): unknown {
    const obj: any = {};
    if (message.docUrl !== "") {
      obj.docUrl = message.docUrl;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Metadata>, I>>(base?: I): Metadata {
    return Metadata.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Metadata>, I>>(object: I): Metadata {
    const message = createBaseMetadata() as any;
    message.docUrl = object.docUrl ?? "";
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
