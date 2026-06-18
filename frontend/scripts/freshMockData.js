import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const mockComplaintsPath = path.join(root, "src", "data", "mockComplaints.js");
const nowIso = new Date().toISOString();

const source = await readFile(mockComplaintsPath, "utf8");
const updated = source.replace(
  /export const MOCK_DATA_REFRESHED_AT = ".*?";/,
  `export const MOCK_DATA_REFRESHED_AT = "${nowIso}";`,
);

if (source === updated) {
  throw new Error("Could not find MOCK_DATA_REFRESHED_AT in src/data/mockComplaints.js");
}

await writeFile(mockComplaintsPath, updated, "utf8");

console.log(`Updated mock complaint timestamps relative to ${nowIso}`);
console.log("Run `npm run build` after refreshing data if you are serving a production bundle.");
