"use strict";

import {assert} from "./support/helpers.mjs";

import FileRegistry from "../../assets/js/file_registry.mjs";

describe("FileRegistry", () => {
  beforeEach(() => {
    FileRegistry.clear();
  });

  it("stores and retrieves a file by generated token", () => {
    const file = {name: "banner.png"};

    const token = FileRegistry.store(file);

    assert.isString(token);
    assert.strictEqual(FileRegistry.get(token), file);
  });

  it("generates distinct tokens", () => {
    const token1 = FileRegistry.store({name: "one.png"});
    const token2 = FileRegistry.store({name: "two.png"});

    assert.notEqual(token1, token2);
  });

  it("deletes a file", () => {
    const token = FileRegistry.store({name: "banner.png"});

    assert.isTrue(FileRegistry.delete(token));
    assert.isNull(FileRegistry.get(token));
    assert.isFalse(FileRegistry.delete(token));
  });

  it("clears all files", () => {
    const token = FileRegistry.store({name: "banner.png"});

    FileRegistry.clear();

    assert.isNull(FileRegistry.get(token));
  });
});
