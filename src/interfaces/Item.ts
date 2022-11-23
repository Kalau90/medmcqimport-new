import { Question, questionsDecoder } from "./Question";
import {
  Decoder,
  object,
  string,
  array,
  optional,
  number,
  anyJson
} from "@mojotech/json-type-validation";

export interface Item {
  id: number | undefined;
  "i  d": number | undefined;
  questions: Question[];
  title: string;
}

export const itemsDecoder: Decoder<Item[]> = array(
  object({
    id: optional(number()),
    "i  d": optional(number()),
    questions: questionsDecoder,
    title: string()
  })
);
