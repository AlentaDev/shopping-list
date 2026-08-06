import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDeviceFingerprint, resetDeviceFingerprint } from "./deviceFingerprint";

describe("deviceFingerprint", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getDeviceFingerprint", () => {
    it("genera un fingerprint único la primera vez", () => {
      const fingerprint = getDeviceFingerprint();

      expect(fingerprint).toBeTruthy();
      expect(typeof fingerprint).toBe("string");
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    it("reutiliza el mismo fingerprint en llamadas posteriores", () => {
      const first = getDeviceFingerprint();
      const second = getDeviceFingerprint();

      expect(first).toBe(second);
    });

    it("persiste el fingerprint en localStorage", () => {
      const fingerprint = getDeviceFingerprint();
      const stored = localStorage.getItem("device_fingerprint");

      expect(stored).toBe(fingerprint);
    });

    it("recupera fingerprint existente de localStorage", () => {
      const existing = "existing-fingerprint-123";
      localStorage.setItem("device_fingerprint", existing);

      const fingerprint = getDeviceFingerprint();

      expect(fingerprint).toBe(existing);
    });

    it("maneja error de localStorage y genera fingerprint temporal", () => {
      const originalWindowStorage = window.localStorage;
      const originalGlobalStorage = globalThis.localStorage;
      const mockGetItem = vi.fn(() => {
        throw new Error("localStorage not available");
      });
      const throwingStorage = new Proxy(originalWindowStorage, {
        get(target, property, receiver) {
          if (property === "getItem") {
            return mockGetItem;
          }

          return Reflect.get(target, property, receiver);
        },
      });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: throwingStorage,
      });
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: throwingStorage,
      });

      try {
        const fingerprint = getDeviceFingerprint();

        expect(fingerprint).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        expect(warnSpy).toHaveBeenCalledWith(
          "Cannot persist device fingerprint:",
          expect.any(Error),
        );
      } finally {
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          value: originalWindowStorage,
        });
        Object.defineProperty(globalThis, "localStorage", {
          configurable: true,
          value: originalGlobalStorage,
        });
        warnSpy.mockRestore();
      }
    });
  });

  describe("resetDeviceFingerprint", () => {
    it("genera un nuevo fingerprint diferente al anterior", () => {
      const first = getDeviceFingerprint();
      const reset = resetDeviceFingerprint();

      expect(reset).not.toBe(first);
      expect(reset).toBeTruthy();
    });

    it("persiste el nuevo fingerprint en localStorage", () => {
      const fingerprint = resetDeviceFingerprint();
      const stored = localStorage.getItem("device_fingerprint");

      expect(stored).toBe(fingerprint);
    });

    it("el nuevo fingerprint se usa en siguientes llamadas a getDeviceFingerprint", () => {
      const reset = resetDeviceFingerprint();
      const next = getDeviceFingerprint();

      expect(next).toBe(reset);
    });
  });

  describe("formato del fingerprint", () => {
    it("genera un UUID válido (formato correcto)", () => {
      const fingerprint = getDeviceFingerprint();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(fingerprint).toMatch(uuidRegex);
    });
  });
});
