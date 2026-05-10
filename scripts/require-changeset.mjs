import { execSync } from "node:child_process";

const changedFiles = execSync("git diff --name-only origin/main...HEAD", {
  encoding: "utf8",
})
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

const touchesVersionedApps = changedFiles.some(
  (file) =>
    file.startsWith("apps/web/") ||
    file.startsWith("apps/api/") ||
    file.startsWith("apps/mobile-android/")
);

if (!touchesVersionedApps) {
  console.log("No app changes detected. Changeset not required.");
  process.exit(0);
}

const hasChangeset = changedFiles.some(
  (file) => file.startsWith(".changeset/") && file.endsWith(".md")
);

if (!hasChangeset) {
  console.error("❌ Missing changeset.");
  console.error(
    "Add one with: pnpm changeset (select @app/web, @app/api, @app/mobile-android)"
  );
  process.exit(1);
}

console.log("✅ Changeset found.");
