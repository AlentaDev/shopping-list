/**
 * Genera y persiste un fingerprint único por dispositivo.
 * 
 * En web usa localStorage.
 * En Android/iOS usarías SharedPreferences/UserDefaults con la misma lógica.
 * 
 * Este fingerprint identifica el dispositivo para:
 * - Refresh tokens por dispositivo
 * - Logout selectivo por dispositivo
 * - Seguridad anti-robo de tokens
 */

const STORAGE_KEY = "device_fingerprint";

/**
 * Obtiene o genera el fingerprint del dispositivo.
 * El fingerprint se persiste para ser reutilizado entre sesiones.
 */
export function getDeviceFingerprint(): string {
  try {
    // Intentar obtener fingerprint existente
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }

    // Generar nuevo fingerprint
    const fingerprint = generateFingerprint();
    localStorage.setItem(STORAGE_KEY, fingerprint);
    
    return fingerprint;
  } catch (error) {
    // Fallback si localStorage no está disponible (modo incógnito, etc)
    console.warn("Cannot persist device fingerprint:", error);
    return generateFingerprint();
  }
}

/**
 * Genera un nuevo fingerprint único.
 * Usa crypto.randomUUID() si está disponible, sino genera uno manual.
 */
function generateFingerprint(): string {
    const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;

    if (cryptoApi?.randomUUID) {
        return cryptoApi.randomUUID();
    }

    if (cryptoApi?.getRandomValues) {
        const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
        // Ajustar bits de versión (4) y variante (RFC 4122)
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    throw new Error("Crypto API no disponible para generar fingerprint");
}


/**
 * Regenera el fingerprint del dispositivo.
 * Útil para testing o reset manual.
 */
export function resetDeviceFingerprint(): string {
  const fingerprint = generateFingerprint();
  try {
    localStorage.setItem(STORAGE_KEY, fingerprint);
  } catch {
    // No-op si localStorage no está disponible
  }
  return fingerprint;
}
