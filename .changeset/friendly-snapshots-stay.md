---
"@app/api": patch
"@app/web": patch
---

Fix active-list finish flow to preserve `categorySnapshot` and `subcategorySnapshot` when mapping autosave draft catalog items back into ACTIVE items.

Also remove deprecated `baseUrl` from web tsconfig (TypeScript 6 warning) and align web/api release metadata with version `1.2.2`.
