import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

const isWindows = process.platform === "win32";
const executableName = isWindows ? "datacontract.exe" : "datacontract";
const localPath = isWindows 
  ? path.join(process.cwd(), ".venv", "Scripts", executableName)
  : path.join(process.cwd(), ".venv", "bin", executableName);

// Fallback to globally available command if .venv doesn't exist
const datacontractBin = fs.existsSync(localPath) ? localPath : "datacontract";

console.log(`Running offline data contract test using: ${datacontractBin}`);

const env = { ...process.env, PYTHONIOENCODING: "utf-8" };

const child = spawn(datacontractBin, ["test", "datacontract.yaml"], {
  env,
  stdio: "inherit",
  shell: false
});

child.on("close", (code) => {
  if (code !== null && code !== 0) {
    console.error(`datacontract test failed with exit code: ${code}`);
    process.exit(code);
  }
  console.log("datacontract test validation passed successfully!");
  process.exit(0);
});

child.on("error", (err) => {
  console.error("Failed to start datacontract process:", err);
  process.exit(1);
});
