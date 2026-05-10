import fs from "node:fs";
import path from "node:path";

const androidPkgPath = path.resolve("apps/mobile-android/package.json");
const gradlePath = path.resolve("apps/mobile-android/app/build.gradle.kts");

const androidPkg = JSON.parse(fs.readFileSync(androidPkgPath, "utf8"));
const versionName = androidPkg.version;

const match = versionName.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!match) {
  throw new Error(`Invalid Android semver: ${versionName}`);
}

const [, major, minor, patch] = match.map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

const gradle = fs.readFileSync(gradlePath, "utf8");

const next = gradle
  .replace(/versionCode\s*=\s*\d+/, `versionCode = ${versionCode}`)
  .replace(/versionName\s*=\s*"[^"]+"/, `versionName = "${versionName}"`);

fs.writeFileSync(gradlePath, next);

console.log(`Android synced -> versionName=${versionName}, versionCode=${versionCode}`);
