"use strict";

import FileRegistry from "../file_registry.mjs";
import Type from "../type.mjs";

export default class FilesEvent {
  static isDefaultAllowed = false;

  static buildOperationParam(event) {
    const constraints = $.#constraints(event.currentTarget || event.target);
    const files = $.#filesFromEvent(event);
    const acceptedFiles = [];
    const rejectedFiles = [];

    files.forEach((file) => {
      const rejectionReason = $.#rejectionReason(file, constraints);

      if (rejectionReason === null) {
        acceptedFiles.push($.#acceptedFileMetadata(file));
      } else {
        rejectedFiles.push($.#rejectedFileMetadata(file, rejectionReason));
      }
    });

    return Type.map([
      [Type.atom("files"), Type.list(acceptedFiles)],
      [Type.atom("rejected_files"), Type.list(rejectedFiles)],
    ]);
  }

  static isEventIgnored(event) {
    return $.#filesFromEvent(event).length === 0;
  }

  static #acceptedFileMetadata(file) {
    const token = FileRegistry.store(file);

    return Type.map([
      [Type.atom("token"), Type.bitstring(token)],
      [Type.atom("name"), Type.bitstring(file.name || "")],
      [Type.atom("type"), Type.bitstring(file.type || "")],
      [Type.atom("size"), Type.integer(file.size || 0)],
      [Type.atom("last_modified"), Type.integer(file.lastModified || 0)],
    ]);
  }

  static #acceptsFileType(file, accept) {
    if (accept.length === 0) {
      return true;
    }

    const fileName = file.name || "";
    const fileType = (file.type || "").toLowerCase();

    return accept.some((acceptedType) => {
      if (acceptedType.startsWith(".")) {
        return fileName.toLowerCase().endsWith(acceptedType);
      }

      if (acceptedType.endsWith("/*")) {
        return fileType.startsWith(acceptedType.slice(0, -1));
      }

      return fileType === acceptedType;
    });
  }

  static #acceptList(element) {
    const rawAccept =
      element?.getAttribute?.("file_accept") ||
      element?.getAttribute?.("accept") ||
      "";

    return rawAccept
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item !== "");
  }

  static #constraints(element) {
    return {
      accept: $.#acceptList(element),
      maxSize: $.#maxSize(element),
    };
  }

  static #filesFromEvent(event) {
    const files = event.dataTransfer?.files || event.target?.files;

    return files ? Array.from(files) : [];
  }

  static #maxSize(element) {
    const rawMaxSize = element?.getAttribute?.("file_max_size");

    if (rawMaxSize === null || typeof rawMaxSize === "undefined") {
      return null;
    }

    const maxSize = Number(rawMaxSize);

    return Number.isFinite(maxSize) && maxSize >= 0 ? maxSize : null;
  }

  static #rejectedFileMetadata(file, reason) {
    return Type.map([
      [Type.atom("name"), Type.bitstring(file.name || "")],
      [Type.atom("type"), Type.bitstring(file.type || "")],
      [Type.atom("size"), Type.integer(file.size || 0)],
      [Type.atom("last_modified"), Type.integer(file.lastModified || 0)],
      [Type.atom("reason"), Type.atom(reason)],
    ]);
  }

  static #rejectionReason(file, constraints) {
    if (!$.#acceptsFileType(file, constraints.accept)) {
      return "type";
    }

    if (constraints.maxSize !== null && file.size > constraints.maxSize) {
      return "size";
    }

    return null;
  }
}

const $ = FilesEvent;
