import request = require("request-promise");
import colors = require("colors/safe");
import * as fs from "fs";
import { Flow } from "../interfaces/Flow";
import { Question } from "../interfaces/Question";
import { parseQuestion, ParsedQuestion } from "./parseQuestion";
import { rootPath } from "../index";

// Grimt typecheck fix med number hhv. string tilladt :-(
interface ExamSetMetadata {
  semester: 7 | 8 | 9 | 11 | number;
  exam: { year: number; season: "F" | "E" | string };
}

const baseToFile = (basestr: any, imageName: string): string => {
  let imgDir = rootPath + "/output/images";
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  // Grab the extension to resolve any image error
  // ugly possible null fix
  var ext = (basestr.split(";")[0].match(/jpeg|png|gif/) || [
    null,
  ])[0];

  // strip off the data: url prefix to get just the base64-encoded bytes
  var data = basestr.replace(/^data:image\/\w+;base64,/, "");
  var buf = Buffer.from(data, "base64");
  try{
    fs.writeFileSync(
      `${imgDir}/${imageName}.${ext}`,
      buf,
      "base64");
    return imageName+"."+ext;
  } catch(err){
    console.log(err);
    return "";
  }
}

class ExamSet {
  activityId: number | undefined;
  semesterId: 1 | 2 | 3 | 4 | undefined;
  semesterName: "Inf" | "Abd" | "HLK" | "GOP" | undefined;
  season: "E" | "F" | string | undefined;
  year: number | undefined;
  questions: ParsedQuestion[] = [];

  fillMetadata(metadata: ExamSetMetadata) {
    let semesterId: ExamSet["semesterId"];
    let semesterName: ExamSet["semesterName"];

    switch (metadata.semester) {
      case 7:
        semesterId = 1;
        semesterName = "Inf";
        break;
      case 8:
        semesterId = 2;
        semesterName = "Abd";
        break;
      case 9:
        semesterId = 3;
        semesterName = "HLK";
        break;
      case 11:
        semesterId = 4;
        semesterName = "GOP";
        break;
    }

    this.semesterId = semesterId;
    this.semesterName = semesterName;
    this.season = metadata.exam.season;
    this.year = metadata.exam.year;
  }
  stringifySetInfo() {
    return `${this.semesterName}-${this.year}${this.season}`;
  }

  async downloadImages() {
    if (this.semesterId === 4) {
      console.log(colors.yellow("Fjerner billeder, da det er 11. semester"));
      this.questions = this.questions.map((question) => {
        question.images = [];
        const matches = question.text.match(/(data:image)/g);
        if(matches){
          const img_count = matches.length;
          console.log("Removing "+img_count+" images from text in question no "+question.examSetQno)
          for(let i = 0; i < img_count; i++){
            let basestr0 = question.text.split("(data:image/")[1]
            let basestr = "data:image/"+basestr0.split(")")[0];
            question.text = question.text.replace("("+basestr+")", "");
          }
        }
        return question;
      });
    } else {
      this.questions = await Promise.all(
        this.questions.map(async (question) => {
          if (question.images.length > 0) {
            console.log("Images for "+question.examSetQno+" includes image(s)")
            const imageName = `${this.stringifySetInfo()}-${question.examSetQno}`;

            // image is blob
            if (question.images[0].link.includes("data:image")) {
              let basestr = question.images[0].link;
              question.images[0].link = baseToFile(basestr, imageName);
            } else {
              let imgDir = rootPath + "/output/images";
              if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
              await request({ uri: question.images[0].link, encoding: "binary" })
                .then((body) => {
                  const imageFile = fs.createWriteStream(`${imgDir}/${imageName}.jpg`);
                  imageFile.write(body, "binary");
                  imageFile.end();
                  question.images[0].link = imageName;
                })
                .catch(() => {
                  console.error(
                    colors.red(
                      "Kunne ikke hente billede til spørgsmål " + question.examSetQno
                    )
                  );
                });
            }
          }
          if(question.text.includes("data:image")){
            // THIS SHOULD LOOP FOR SEVERAL IMAGES
            let imgDir = rootPath + "/output/images";
            if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
            const matches = question.text.match(/(data:image)/g);
            if(matches){
              const img_count = matches.length;
              console.log("Text for "+question.examSetQno+" includes "+img_count+" images")
              for(let i = 0; i < img_count; i++){
                const imageName = `${this.stringifySetInfo()}-${question.examSetQno}_${i}`;
                let basestr0 = question.text.split("(data:image/")[1]
                let basestr = "data:image/"+basestr0.split(")")[0];
                //let reg = new RegExp("("+basestr+")", "g");
                question.text = question.text.replace("("+basestr+")", "");
                question.images.push({ link: baseToFile(basestr, imageName)});
              }
            }
            
            
          }
          return question;
        })
      );
    }
  }

  toJSON() {
    return JSON.stringify({
      semesterId: this.semesterId,
      season: this.season,
      year: this.year,
      questions: this.questions,
    });
  }

  async writeToFile() {
    if (!fs.existsSync(rootPath + "/output")) fs.mkdirSync(rootPath + "/output");

    await this.downloadImages();

    let fileName = `${rootPath}/output/${this.stringifySetInfo()}-${
      this.activityId
    }.json`;
    fs.writeFileSync(fileName, this.toJSON());
    console.log(`Skrev sættet til filen ${fileName}`);
  }
}

export const parseFlow = (flow: Flow, metadata: ExamSetMetadata): ExamSet => {
  const examSet = new ExamSet();
  examSet.activityId = flow.activityId;
  examSet.fillMetadata(metadata);
  const questionsRaw: Question[] = [];
  flow.data.items.forEach((item) => {
    // enkelte sæt har en "intro-tekst" til hvert spørgsmål i item.features
    // -- dette kræver at der kun er 1 spørsmål til hver item, derfor
    //    nedenstående fix
    if (item.questions.length === 1) {
      item.questions[0].data.stimulus =
        "<p></p>" + item.questions[0].data.stimulus;
    }

    item.questions.forEach((question) => questionsRaw.push(question));
  });
  const questions = questionsRaw.map((question, index) =>
    parseQuestion(question, index + 1)
  );
  examSet.questions = questions;

  return examSet;
};
