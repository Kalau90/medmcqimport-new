import { Flow } from "../../interfaces/Flow";

export const calculateQuestionCount = (flow: Flow): number => {
  let questions = 0;
  console.log(flow)
  flow.data.items.forEach(item => (questions += item.questions.length));
  return questions;
};
