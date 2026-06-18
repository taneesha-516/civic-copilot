import { spawn } from "node:child_process";
import { mkdirSync, openSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const logDir = resolve(root, "work");
mkdirSync(logDir, { recursive: true });

const out = openSync(resolve(logDir, "dev-server-node.out"), "a");
const err = openSync(resolve(logDir, "dev-server-node.err"), "a");

const child = spawn(
  process.execPath,
  ["node_modules/vinext/dist/cli.js", "dev", "--host", "127.0.0.1", "--port", "3000"],
  {
    cwd: root,
    detached: true,
    stdio: ["ignore", out, err],
    windowsHide: true,
  },
);

child.unref();
writeFileSync(resolve(logDir, "dev-server.pid"), `${child.pid}\n`);
console.log(`started ${child.pid}`);
