import { test, expect } from "@playwright/test";

test("noop passes", async ({ page }) => {
  await page.goto("about:blank");
  await expect(true).toBe(true);
});
