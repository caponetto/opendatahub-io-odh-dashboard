declare module 'google-protobuf/google/protobuf/struct_pb' {
  export type JavaScriptValue =
    | null
    | number
    | string
    | boolean
    | JavaScriptValue[]
    | { [key: string]: JavaScriptValue };

  export class Struct {
    static fromJavaScript(obj: object): Struct;
    toJavaScript(): { [key: string]: JavaScriptValue };
  }

  export class Value {
    getKindCase(): Value.ValueCase;
    getStringValue(): string;
    getNumberValue(): number;
    getBoolValue(): boolean;
    getStructValue(): Struct | undefined;
    getListValue(): ListValue | undefined;
    getNullValue(): number;
    toJavaScript(): JavaScriptValue;
  }

  export namespace Value {
    enum ValueCase {
      VALUE_NOT_SET = 0,
      NULL_VALUE = 1,
      NUMBER_VALUE = 2,
      STRING_VALUE = 3,
      BOOL_VALUE = 4,
      STRUCT_VALUE = 5,
      LIST_VALUE = 6,
    }

    type AsObject = {
      nullValue?: number;
      numberValue?: number;
      stringValue?: string;
      boolValue?: boolean;
      structValue?: Struct.AsObject;
      listValue?: ListValue.AsObject;
    };
  }

  export namespace Struct {
    type AsObject = {
      fieldsMap: Array<[string, Value.AsObject]>;
    };
  }

  export namespace ListValue {
    type AsObject = {
      valuesList: Value.AsObject[];
    };
  }

  export class ListValue {
    getValuesList(): Value[];
  }
}
