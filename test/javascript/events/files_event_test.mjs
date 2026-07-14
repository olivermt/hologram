"use strict";

import {
  assert,
  defineGlobalErlangAndElixirModules,
} from "../support/helpers.mjs";

import Bitstring from "../../../assets/js/bitstring.mjs";
import FileRegistry from "../../../assets/js/file_registry.mjs";
import FilesEvent from "../../../assets/js/events/files_event.mjs";
import Type from "../../../assets/js/type.mjs";

defineGlobalErlangAndElixirModules();

function fileFixture(data = {}) {
  return {
    name: data.name || "banner.png",
    type: data.type || "image/png",
    size: data.size || 123,
    lastModified: data.lastModified || 1_725_000_000_000,
  };
}

function mapValue(map, key) {
  return map.data[Type.encodeMapKey(Type.atom(key))][1];
}

function metadataToken(metadata) {
  return Bitstring.toText(mapValue(metadata, "token"));
}

describe("FilesEvent", () => {
  beforeEach(() => {
    FileRegistry.clear();
  });

  describe("buildOperationParam()", () => {
    it("stores input files and returns serializable metadata", () => {
      const file = fileFixture();
      const target = {
        files: [file],
        getAttribute: () => null,
      };

      const result = FilesEvent.buildOperationParam({
        target,
        currentTarget: target,
      });

      const files = mapValue(result, "files");
      const rejectedFiles = mapValue(result, "rejected_files");
      const metadata = files.data[0];
      const token = metadataToken(metadata);

      assert.lengthOf(files.data, 1);
      assert.lengthOf(rejectedFiles.data, 0);
      assert.strictEqual(FileRegistry.get(token), file);
      assert.deepStrictEqual(
        metadata,
        Type.map([
          [Type.atom("token"), Type.bitstring(token)],
          [Type.atom("name"), Type.bitstring("banner.png")],
          [Type.atom("type"), Type.bitstring("image/png")],
          [Type.atom("size"), Type.integer(123)],
          [Type.atom("last_modified"), Type.integer(1_725_000_000_000)],
        ]),
      );
    });

    it("stores dropped files from DataTransfer", () => {
      const file = fileFixture({name: "drop.webp", type: "image/webp"});
      const dropZone = {getAttribute: () => null};

      const result = FilesEvent.buildOperationParam({
        currentTarget: dropZone,
        dataTransfer: {files: [file]},
        target: dropZone,
      });

      const metadata = mapValue(result, "files").data[0];
      const token = metadataToken(metadata);

      assert.strictEqual(FileRegistry.get(token), file);
      assert.deepStrictEqual(
        mapValue(metadata, "name"),
        Type.bitstring("drop.webp"),
      );
    });

    it("rejects files that do not match file_accept", () => {
      const pngFile = fileFixture({name: "banner.png", type: "image/png"});
      const textFile = fileFixture({name: "notes.txt", type: "text/plain"});

      const dropZone = {
        getAttribute: (name) =>
          name === "file_accept" ? "image/jpeg,image/png" : null,
      };

      const result = FilesEvent.buildOperationParam({
        currentTarget: dropZone,
        dataTransfer: {files: [pngFile, textFile]},
        target: dropZone,
      });

      const acceptedFile = mapValue(result, "files").data[0];
      const rejectedFile = mapValue(result, "rejected_files").data[0];

      assert.lengthOf(mapValue(result, "files").data, 1);
      assert.lengthOf(mapValue(result, "rejected_files").data, 1);
      assert.strictEqual(
        FileRegistry.get(metadataToken(acceptedFile)),
        pngFile,
      );
      assert.deepStrictEqual(
        rejectedFile,
        Type.map([
          [Type.atom("name"), Type.bitstring("notes.txt")],
          [Type.atom("type"), Type.bitstring("text/plain")],
          [Type.atom("size"), Type.integer(123)],
          [Type.atom("last_modified"), Type.integer(1_725_000_000_000)],
          [Type.atom("reason"), Type.atom("type")],
        ]),
      );
    });

    it("supports accept wildcards and extensions", () => {
      const webpFile = fileFixture({name: "banner.webp", type: "image/webp"});
      const pdfFile = fileFixture({
        name: "document.PDF",
        type: "application/octet-stream",
      });
      const textFile = fileFixture({name: "notes.txt", type: "text/plain"});

      const dropZone = {
        getAttribute: (name) =>
          name === "file_accept" ? "image/*,.pdf" : null,
      };

      const result = FilesEvent.buildOperationParam({
        currentTarget: dropZone,
        dataTransfer: {files: [webpFile, pdfFile, textFile]},
        target: dropZone,
      });

      const files = mapValue(result, "files");
      const rejectedFiles = mapValue(result, "rejected_files");

      assert.lengthOf(files.data, 2);
      assert.lengthOf(rejectedFiles.data, 1);
      assert.deepStrictEqual(
        mapValue(rejectedFiles.data[0], "name"),
        Type.bitstring("notes.txt"),
      );
    });

    it("rejects files over file_max_size", () => {
      const file = fileFixture({size: 124});

      const dropZone = {
        getAttribute: (name) => (name === "file_max_size" ? "123" : null),
      };

      const result = FilesEvent.buildOperationParam({
        currentTarget: dropZone,
        dataTransfer: {files: [file]},
        target: dropZone,
      });

      const rejectedFile = mapValue(result, "rejected_files").data[0];

      assert.lengthOf(mapValue(result, "files").data, 0);
      assert.deepStrictEqual(
        mapValue(rejectedFile, "reason"),
        Type.atom("size"),
      );
    });
  });

  describe("isEventIgnored()", () => {
    it("returns true when there are no files", () => {
      assert.isTrue(FilesEvent.isEventIgnored({target: {}}));
    });

    it("returns false when there are input files", () => {
      assert.isFalse(
        FilesEvent.isEventIgnored({target: {files: [fileFixture()]}}),
      );
    });

    it("returns false when there are dropped files", () => {
      assert.isFalse(
        FilesEvent.isEventIgnored({
          dataTransfer: {files: [fileFixture()]},
          target: {},
        }),
      );
    });
  });
});
