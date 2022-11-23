import { Item, itemsDecoder } from "./Item";
import { Data, dataDecoder } from "./Data"
import {
  Decoder,
  object,
  string,
  array,
  oneOf,
  optional,
  number,
  anyJson,
  constant
} from "@mojotech/json-type-validation";

export interface Flow {
  activityId: number | undefined;
  title: string;
  description: string;
  tags: string[] | null | undefined;
  data: Data;
}

export const flowDecoder: Decoder<Flow> = object({
  activityId: optional(number()),
  title: string(),
  description: string(),
  tags: optional(oneOf(array(string()), constant(null))),
  data: dataDecoder
});
