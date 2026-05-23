/**
 * Temporary compatibility shim.
 *
 * New imports should target `@src/infrastructure/http/fetchWithAuthRuntime` directly.
 * Keep this re-export only while legacy paths are migrated.
 */
export {
  AUTH_401_RETRY_PRESETS,
  fetchWithAuth,
  type FetchWithAuthOptions,
} from "@src/infrastructure/http/fetchWithAuthRuntime";
