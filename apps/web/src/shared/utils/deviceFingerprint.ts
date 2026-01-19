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
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback para navegadores antiguos
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
