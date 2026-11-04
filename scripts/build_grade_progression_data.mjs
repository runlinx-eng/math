import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildGradeProgressionModel } from "../dist/grade-progression-model.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = path => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const model = buildGradeProgressionModel({
  atlas: readJson("dist/data/atlas.json"),
  nodeStageCandidates: readJson("docs/grade-progression/node-stage-candidates.json"),
  packStageEvidence: readJson("docs/grade-progression/pack-stage-evidence.json")
});
const output = resolve(root, "dist/data/grade-progression.json");
writeFileSync(output, JSON.stringify(model) + "\n", "utf8");
console.log("Built dist/data/grade-progression.json", JSON.stringify(model.counts));
