import * as fs from "fs";
import { fileExists } from "../utils";

export async function loadTrustMarksFromFilesystem() {
  const trust_marks_path = "./trust_marks.json";
  if (await fileExists(trust_marks_path)) return JSON.parse(await fs.promises.readFile(trust_marks_path, "utf8"));
  else return [];
}
