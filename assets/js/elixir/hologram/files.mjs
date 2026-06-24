"use strict";

import Bitstring from "../../bitstring.mjs";
import ERTS from "../../erts.mjs";
import FileRegistry from "../../file_registry.mjs";
import HologramRuntimeError from "../../errors/runtime_error.mjs";
import Type from "../../type.mjs";

const CONTENT_TYPE_HEADER = "content-type";

function booleanOption(term, defaultValue) {
  if (typeof term === "undefined" || Type.isNil(term)) {
    return defaultValue;
  }

  return Type.isTrue(term);
}

function getOption(opts, name, defaultValue) {
  if (Type.isList(opts)) {
    const entry = opts.data.find(
      (item) =>
        Type.isTuple(item) &&
        item.data.length === 2 &&
        Type.isAtom(item.data[0]) &&
        item.data[0].value === name,
    );

    return entry ? entry.data[1] : defaultValue;
  }

  if (Type.isMap(opts)) {
    const atomEntry = opts.data[Type.encodeMapKey(Type.atom(name))];

    if (atomEntry) {
      return atomEntry[1];
    }

    const bitstringEntry = opts.data[Type.encodeMapKey(Type.bitstring(name))];

    if (bitstringEntry) {
      return bitstringEntry[1];
    }
  }

  return defaultValue;
}

function headerName(term) {
  if (Type.isAtom(term)) {
    return term.value.replace(/_/g, "-");
  }

  return Bitstring.toText(term);
}

function headerValue(term) {
  if (Type.isAtom(term)) {
    return term.value;
  }

  if (Type.isInteger(term)) {
    return term.value.toString();
  }

  return Bitstring.toText(term);
}

function headersFromTerm(term) {
  if (typeof term === "undefined" || Type.isNil(term)) {
    return {};
  }

  if (Type.isMap(term)) {
    return Object.fromEntries(
      Object.values(term.data).map(([key, value]) => [
        headerName(key),
        headerValue(value),
      ]),
    );
  }

  if (Type.isList(term)) {
    return Object.fromEntries(
      term.data.map((item) => [
        headerName(item.data[0]),
        headerValue(item.data[1]),
      ]),
    );
  }

  return {};
}

function hasHeader(headers, name) {
  return Object.keys(headers).some(
    (headerName) => headerName.toLowerCase() === name,
  );
}

function methodFromTerm(term) {
  if (typeof term === "undefined" || Type.isNil(term)) {
    return "POST";
  }

  if (Type.isAtom(term)) {
    return term.value.toUpperCase();
  }

  return Bitstring.toText(term).toUpperCase();
}

function upload(token, url, opts) {
  const tokenText = Bitstring.toText(token);
  const file = FileRegistry.get(tokenText);

  if (file === null) {
    throw new HologramRuntimeError(
      `no registered file found for token "${tokenText}"`,
    );
  }

  const headers = headersFromTerm(getOption(opts, "headers", Type.map()));

  if (file.type && !hasHeader(headers, CONTENT_TYPE_HEADER)) {
    headers["Content-Type"] = file.type;
  }

  const cleanup = booleanOption(
    getOption(opts, "cleanup", Type.boolean(true)),
    true,
  );
  const method = methodFromTerm(
    getOption(opts, "method", Type.bitstring("POST")),
  );
  const urlText = Bitstring.toText(url);

  const uploadPromise = fetch(urlText, {
    body: file,
    headers,
    method,
  }).then((response) => {
    if (cleanup && response.ok) {
      FileRegistry.delete(tokenText);
    }

    return response;
  });

  return ERTS.registerPromise(uploadPromise);
}

const Elixir_Hologram_Files = {
  "delete/1": (token) => {
    return Type.boolean(FileRegistry.delete(Bitstring.toText(token)));
  },

  "upload/2": (token, url) => upload(token, url, Type.keywordList()),

  "upload/3": upload,
};

export default Elixir_Hologram_Files;
