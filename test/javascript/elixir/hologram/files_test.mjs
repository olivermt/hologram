"use strict";

import {
  assert,
  defineGlobalErlangAndElixirModules,
  sinon,
} from "../../support/helpers.mjs";

import ERTS from "../../../../assets/js/erts.mjs";
import FileRegistry from "../../../../assets/js/file_registry.mjs";
import Elixir_Hologram_Files from "../../../../assets/js/elixir/hologram/files.mjs";
import HologramRuntimeError from "../../../../assets/js/errors/runtime_error.mjs";
import Type from "../../../../assets/js/type.mjs";

defineGlobalErlangAndElixirModules();

describe("Elixir_Hologram_Files", () => {
  beforeEach(() => {
    FileRegistry.clear();
  });

  afterEach(() => {
    sinon.restore();
    delete globalThis.fetch;
  });

  describe("delete/1", () => {
    it("deletes a registered file", () => {
      const token = FileRegistry.store({name: "banner.png"});

      assert.deepStrictEqual(
        Elixir_Hologram_Files["delete/1"](Type.bitstring(token)),
        Type.boolean(true),
      );

      assert.isNull(FileRegistry.get(token));
    });

    it("returns false for a missing token", () => {
      assert.deepStrictEqual(
        Elixir_Hologram_Files["delete/1"](Type.bitstring("missing")),
        Type.boolean(false),
      );
    });
  });

  describe("upload", () => {
    it("supports default opts through upload/2", async () => {
      const file = {name: "banner.png", type: "image/png"};
      const response = {ok: true, status: 200};
      const token = FileRegistry.store(file);
      const fetchStub = sinon.stub().resolves(response);
      globalThis.fetch = fetchStub;

      const task = Elixir_Hologram_Files["upload/2"](
        Type.bitstring(token),
        Type.bitstring("/upload"),
      );

      assert.strictEqual(await ERTS.takePromise(task), response);
      sinon.assert.calledOnceWithExactly(fetchStub, "/upload", {
        body: file,
        headers: {"Content-Type": "image/png"},
        method: "POST",
      });
    });

    it("uploads the file body with default POST and file content type", async () => {
      const file = {name: "banner.png", type: "image/png"};
      const response = {ok: true, status: 200};
      const token = FileRegistry.store(file);
      const fetchStub = sinon.stub().resolves(response);
      globalThis.fetch = fetchStub;

      const task = Elixir_Hologram_Files["upload/3"](
        Type.bitstring(token),
        Type.bitstring("/upload"),
        Type.keywordList(),
      );

      assert.strictEqual(await ERTS.takePromise(task), response);
      assert.isNull(FileRegistry.get(token));
      sinon.assert.calledOnceWithExactly(fetchStub, "/upload", {
        body: file,
        headers: {"Content-Type": "image/png"},
        method: "POST",
      });
    });

    it("supports custom method and headers", async () => {
      const file = {name: "banner.png", type: "image/png"};
      const response = {ok: true, status: 200};
      const token = FileRegistry.store(file);
      const fetchStub = sinon.stub().resolves(response);
      globalThis.fetch = fetchStub;

      const task = Elixir_Hologram_Files["upload/3"](
        Type.bitstring(token),
        Type.bitstring("/upload"),
        Type.keywordList([
          [Type.atom("method"), Type.bitstring("PUT")],
          [
            Type.atom("headers"),
            Type.map([
              [Type.bitstring("X-CSRF-Token"), Type.bitstring("abc")],
              [Type.atom("content_type"), Type.bitstring("image/custom")],
            ]),
          ],
        ]),
      );

      assert.strictEqual(await ERTS.takePromise(task), response);
      sinon.assert.calledOnceWithExactly(fetchStub, "/upload", {
        body: file,
        headers: {
          "X-CSRF-Token": "abc",
          "content-type": "image/custom",
        },
        method: "PUT",
      });
    });

    it("keeps the file when the response is not ok", async () => {
      const file = {name: "banner.png", type: "image/png"};
      const response = {ok: false, status: 500};
      const token = FileRegistry.store(file);
      globalThis.fetch = sinon.stub().resolves(response);

      const task = Elixir_Hologram_Files["upload/3"](
        Type.bitstring(token),
        Type.bitstring("/upload"),
        Type.keywordList(),
      );

      assert.strictEqual(await ERTS.takePromise(task), response);
      assert.strictEqual(FileRegistry.get(token), file);
    });

    it("keeps the file when cleanup is false", async () => {
      const file = {name: "banner.png", type: "image/png"};
      const response = {ok: true, status: 200};
      const token = FileRegistry.store(file);
      globalThis.fetch = sinon.stub().resolves(response);

      const task = Elixir_Hologram_Files["upload/3"](
        Type.bitstring(token),
        Type.bitstring("/upload"),
        Type.keywordList([[Type.atom("cleanup"), Type.boolean(false)]]),
      );

      assert.strictEqual(await ERTS.takePromise(task), response);
      assert.strictEqual(FileRegistry.get(token), file);
    });

    it("raises when the token is not registered", () => {
      assert.throws(
        () =>
          Elixir_Hologram_Files["upload/3"](
            Type.bitstring("missing"),
            Type.bitstring("/upload"),
            Type.keywordList(),
          ),
        HologramRuntimeError,
        'no registered file found for token "missing"',
      );
    });

    it("accepts a string-keyed opts map", async () => {
      const file = {name: "banner.png", type: ""};
      const response = {ok: true, status: 200};
      const token = FileRegistry.store(file);
      const fetchStub = sinon.stub().resolves(response);
      globalThis.fetch = fetchStub;

      const task = Elixir_Hologram_Files["upload/3"](
        Type.bitstring(token),
        Type.bitstring("/upload"),
        Type.map([
          [Type.bitstring("method"), Type.bitstring("PATCH")],
          [
            Type.bitstring("headers"),
            Type.keywordList([
              [Type.atom("authorization"), Type.bitstring("Bearer 1")],
            ]),
          ],
        ]),
      );

      assert.strictEqual(await ERTS.takePromise(task), response);
      sinon.assert.calledOnceWithExactly(fetchStub, "/upload", {
        body: file,
        headers: {authorization: "Bearer 1"},
        method: "PATCH",
      });
    });
  });
});
