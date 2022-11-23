import * as fs from "fs";
import { rootPath } from "../index";
import { Flow } from "../interfaces/Flow";
import { calculateQuestionCount } from "./validation/calculateQuestionCount";

interface FlowIndex {
  title: string;
  questions: number;
  activityId: number;
}

const indexFlows = (flows: Flow[]): FlowIndex[] => {
  let index: FlowIndex[] = [];
  let ids: number[] = [];
  console.log("1",flows)
  flows.map(flow => {
    let aid = flow.activityId || 0;
    ids.push(aid);
    index.push({
      title: flow.title,
      questions: calculateQuestionCount(flow),
      activityId: aid
    });
  });
  if (!fs.existsSync(rootPath + "/output")) fs.mkdirSync(rootPath + "/output");
  fs.writeFileSync(rootPath + "/output/.prevFlows.json", JSON.stringify(ids));
  return index;
};

export default indexFlows;
