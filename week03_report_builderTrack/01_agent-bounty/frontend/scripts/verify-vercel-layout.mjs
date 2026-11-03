import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(frontendRoot, ".next", "required-server-files.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const traceRoot = path.resolve(manifest.config.outputFileTracingRoot);

if (traceRoot !== frontendRoot || manifest.relativeAppDir !== "") {
  throw new Error(
    `Invalid Vercel trace layout: root=${traceRoot}, relativeAppDir=${JSON.stringify(manifest.relativeAppDir)}`,
  );
}

console.log("Verified Vercel trace layout: Next.js resolves from the frontend root.");
