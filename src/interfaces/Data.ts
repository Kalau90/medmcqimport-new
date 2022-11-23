import { Item, itemsDecoder } from "./Item";
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

export interface Data {
  items: Item[];
  rendering_type: string;
}

export const dataDecoder: Decoder<Data> = object(
  {
    items: itemsDecoder,
    rendering_type: string()
  }
);
