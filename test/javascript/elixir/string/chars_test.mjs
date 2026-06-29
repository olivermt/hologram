"use strict";

import {assert} from "../../support/helpers.mjs";

import Elixir_String_Chars from "../../../../assets/js/elixir/string/chars.mjs";
import HologramInterpreterError from "../../../../assets/js/errors/interpreter_error.mjs";
import Type from "../../../../assets/js/type.mjs";

describe("Elixir_String_Chars", () => {
  const to_string = Elixir_String_Chars["to_string/1"];

  it("atom", () => {
    assert.deepStrictEqual(to_string(Type.atom("abc")), Type.bitstring("abc"));
  });

  it("nil", () => {
    assert.deepStrictEqual(to_string(Type.nil()), Type.bitstring(""));
  });

  it("binary", () => {
    const term = Type.bitstring("abc");

    assert.deepStrictEqual(to_string(term), term);
  });

  it("integer", () => {
    assert.deepStrictEqual(to_string(Type.integer(123)), Type.bitstring("123"));
  });

  it("float", () => {
    assert.deepStrictEqual(to_string(Type.float(1.23)), Type.bitstring("1.23"));
  });

  it("charlist", () => {
    assert.deepStrictEqual(to_string(Type.charlist("abc")), Type.bitstring("abc"));
  });

  it("string list", () => {
    const term = Type.list([Type.bitstring("ab"), Type.bitstring("cd")]);

    assert.deepStrictEqual(to_string(term), Type.bitstring("abcd"));
  });

  it("unsupported term", () => {
    assert.throws(
      () => to_string(Type.map()),
      HologramInterpreterError,
      "protocol String.Chars not implemented for map in the shared runtime",
    );
  });
});
