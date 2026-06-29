"use strict";

import Bitstring from "../../bitstring.mjs";
import HologramInterpreterError from "../../errors/interpreter_error.mjs";
import Type from "../../type.mjs";

const Elixir_String_Chars = {
  "to_string/1": (term) => {
    switch (term.type) {
      case "atom":
        return Type.bitstring(term.value === "nil" ? "" : term.value);

      case "bitstring":
        if (Type.isBinary(term)) {
          return term;
        }
        break;

      case "float":
      case "integer":
        return Type.bitstring(term.value.toString());

      case "list":
        return listToString(term);
    }

    throw new HologramInterpreterError(
      `protocol String.Chars not implemented for ${term.type} in the shared runtime`,
    );
  },
};

function listToString(term) {
  if (!Type.isProperList(term)) {
    throw new HologramInterpreterError(
      "protocol String.Chars not implemented for improper lists in the shared runtime",
    );
  }

  const chunks = [];

  for (const item of term.data) {
    if (Type.isInteger(item) && Bitstring.validateCodePoint(item.value)) {
      chunks.push(String.fromCodePoint(Number(item.value)));
    } else if (Type.isBinary(item)) {
      chunks.push(Bitstring.toText(item));
    } else {
      throw new HologramInterpreterError(
        "protocol String.Chars not implemented for this list in the shared runtime",
      );
    }
  }

  return Type.bitstring(chunks.join(""));
}

export default Elixir_String_Chars;
