---
"@app/web": patch
---

Fix catalog UX stability and loading placeholders.

- Keep catalog shell stable across category route changes (no full remount).
- Preserve categories panel scroll position while switching categories.
- Improve product loading state with stable heading/message and aligned skeleton sizing.
- Replace categories loading text with full-height category skeleton placeholders.
