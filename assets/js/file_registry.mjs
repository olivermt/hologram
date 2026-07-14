"use strict";

import HologramRuntimeError from "./errors/runtime_error.mjs";

export default class FileRegistry {
  static #files = new Map();
  static #fallbackSequence = 0;

  static clear() {
    $.#files = new Map();
    $.#fallbackSequence = 0;
  }

  static delete(token) {
    return $.#files.delete(token);
  }

  static get(token) {
    return $.#files.get(token) || null;
  }

  static store(file) {
    const token = $.#generateToken();
    $.#files.set(token, file);

    return token;
  }

  static #generateToken() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    if (globalThis.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");

      return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
      ].join("-");
    }

    if (globalThis.process?.env?.NODE_ENV !== "test") {
      throw new HologramRuntimeError("Web Crypto API is not available");
    }

    $.#fallbackSequence += 1;
    return `test-file-token-${$.#fallbackSequence}`;
  }
}

const $ = FileRegistry;
