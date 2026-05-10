import fs from "node:fs";
import { execSync } from "node:child_process";

const readVersion = (file) => JSON.parse(fs.readFileSync(file, "utf8")).version;

const versions = {
  web: readVersion("apps/web/package.json"),
  api: readVersion("apps/api/package.json"),
  android: readVersion("apps/mobile-android/package.json"),
};

for (const [app, version] of Object.entries(versions)) {
  const tag = `${app}-v${version}`;
  try {
    execSync(`git rev-parse ${tag}`, { stdio: "ignore" });
    console.log(`Tag exists: ${tag}`);
  } catch {
    execSync(`git tag ${tag}`);
    console.log(`Created tag: ${tag}`);
  }
}
