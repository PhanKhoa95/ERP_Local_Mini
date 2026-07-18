import fs from "node:fs";

function fail(message) {
  console.error(`version check failed: ${message}`);
  process.exitCode = 1;
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const versionFile = fs.readFileSync("VERSION", "utf8").trim();
const changelog = fs.readFileSync("CHANGELOG.md", "utf8");

function validateNpmLock() {
  const lockJson = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));

  if (lockJson.version !== versionFile) {
    fail(`package-lock root version ${lockJson.version} does not match VERSION ${versionFile}`);
  }

  const rootPackage = lockJson.packages?.[""];
  if (!rootPackage) {
    fail("package-lock is missing root package entry");
    return "package-lock.json";
  }

  if (rootPackage.name !== packageJson.name) {
    fail(`package-lock root name ${rootPackage.name} does not match package.json name ${packageJson.name}`);
  }
  if (rootPackage.version !== versionFile) {
    fail(`package-lock root version ${rootPackage.version} does not match VERSION ${versionFile}`);
  }

  return "package-lock.json";
}

function validatePnpmLock() {
  const lockText = fs.readFileSync("pnpm-lock.yaml", "utf8");

  if (!/^lockfileVersion:\s*['"]?\d+(?:\.\d+)?['"]?\s*$/m.test(lockText)) {
    fail("pnpm-lock.yaml is missing a valid lockfileVersion");
  }
  if (!/^importers:\s*\r?\n(?:\s*\r?\n)*\s{2}\.:\s*$/m.test(lockText)) {
    fail("pnpm-lock.yaml is missing the root importer");
  }

  return "pnpm-lock.yaml";
}

function validateLockfile() {
  const hasNpmLock = fs.existsSync("package-lock.json");
  const hasPnpmLock = fs.existsSync("pnpm-lock.yaml");

  if (hasNpmLock && hasPnpmLock) {
    fail("multiple lockfiles found; keep exactly one package manager lockfile");
    return "package-lock.json + pnpm-lock.yaml";
  }
  if (hasNpmLock) return validateNpmLock();
  if (hasPnpmLock) return validatePnpmLock();

  fail("no supported lockfile found (expected package-lock.json or pnpm-lock.yaml)");
  return "none";
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(versionFile)) {
  fail(`VERSION is not semver: ${versionFile}`);
}

if (packageJson.name !== "multi-sale-organizer") {
  fail(`package name should be multi-sale-organizer, got ${packageJson.name}`);
}

if (packageJson.version !== versionFile) {
  fail(`package.json version ${packageJson.version} does not match VERSION ${versionFile}`);
}

const lockfile = validateLockfile();

if (!changelog.includes(`## [${versionFile}]`)) {
  fail(`CHANGELOG.md has no entry for ${versionFile}`);
}

if (!process.exitCode) {
  console.log(`version check passed: ${packageJson.name}@${versionFile} (${lockfile})`);
}
