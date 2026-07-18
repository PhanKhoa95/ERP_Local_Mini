import { spawn, spawnSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

const isWindows = process.platform === "win32";
const executableName = isWindows ? "datacontract.exe" : "datacontract";
const localPath = isWindows 
  ? path.join(process.cwd(), ".venv", "Scripts", executableName)
  : path.join(process.cwd(), ".venv", "bin", executableName);

function commandWorks(command, args, env) {
  const result = spawnSync(command, args, {
    env,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  return !result.error && result.status === 0;
}

function findLocalSitePackages() {
  const windowsPath = path.join(process.cwd(), ".venv", "Lib", "site-packages");
  if (fs.existsSync(windowsPath)) return windowsPath;

  const unixLibPath = path.join(process.cwd(), ".venv", "lib");
  if (!fs.existsSync(unixLibPath)) return null;

  const pythonDir = fs.readdirSync(unixLibPath).find((entry) => entry.startsWith("python"));
  if (!pythonDir) return null;

  const sitePackages = path.join(unixLibPath, pythonDir, "site-packages");
  return fs.existsSync(sitePackages) ? sitePackages : null;
}

const baseEnv = { ...process.env, PYTHONIOENCODING: "utf-8" };

function resolveCommand() {
  if (fs.existsSync(localPath) && commandWorks(localPath, ["--version"], baseEnv)) {
    return { command: localPath, args: ["test", "datacontract.yaml"], env: baseEnv, label: localPath };
  }

  const localSitePackages = findLocalSitePackages();
  if (localSitePackages) {
    const separator = isWindows ? ";" : ":";
    const pythonEnv = {
      ...baseEnv,
      PYTHONPATH: [localSitePackages, process.env.PYTHONPATH].filter(Boolean).join(separator),
    };
    const pythonCommands = isWindows
      ? [{ command: "python", prefixArgs: [] }, { command: "py", prefixArgs: ["-3"] }]
      : [{ command: "python3", prefixArgs: [] }, { command: "python", prefixArgs: [] }];

    for (const candidate of pythonCommands) {
      const bootstrap = [
        ...candidate.prefixArgs,
        "-c",
        "from datacontract.cli import main; main()",
      ];
      if (commandWorks(candidate.command, [...bootstrap, "--version"], pythonEnv)) {
        return {
          command: candidate.command,
          args: [...bootstrap, "test", "datacontract.yaml"],
          env: pythonEnv,
          label: `${candidate.command} (using ${localSitePackages})`,
        };
      }
    }
  }

  if (commandWorks("datacontract", ["--version"], baseEnv)) {
    return {
      command: "datacontract",
      args: ["test", "datacontract.yaml"],
      env: baseEnv,
      label: "datacontract (PATH)",
    };
  }

  return null;
}

const resolved = resolveCommand();

if (!resolved) {
  console.error(
    "Unable to run datacontract-cli. The local .venv launcher is missing or broken, " +
      "and no compatible Python/global datacontract command was found.",
  );
  process.exit(1);
}

console.log(`Running offline data contract test using: ${resolved.label}`);

const child = spawn(resolved.command, resolved.args, {
  env: resolved.env,
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
  console.error(`Failed to start datacontract process: ${err.message}`);
  process.exit(1);
});
