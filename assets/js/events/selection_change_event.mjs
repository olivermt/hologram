"use strict";

import BeforeInputEvent from "./before_input_event.mjs";
import DomSelection from "../dom_selection.mjs";
import Type from "../type.mjs";

export default class SelectionChangeEvent {
  static isDefaultAllowed = true;

  static buildOperationParam(event) {
    const root = event.currentTarget || event.target;
    const textSelection = DomSelection.buildTextControlSelection(root);
    const domSelection =
      textSelection === null ? DomSelection.buildDomSelection(root) : null;

    return Type.map([
      [
        Type.atom("value"),
        Type.bitstring($.#selectionValue(textSelection, domSelection, root)),
      ],
      [Type.atom("selection"), $.#boxSelection(textSelection, domSelection)],
      [
        Type.atom("selection_start"),
        textSelection === null
          ? Type.nil()
          : Type.integer(textSelection.selectionStart),
      ],
      [
        Type.atom("selection_end"),
        textSelection === null
          ? Type.nil()
          : Type.integer(textSelection.selectionEnd),
      ],
      [
        Type.atom("selection_direction"),
        textSelection === null
          ? Type.nil()
          : Type.bitstring(textSelection.selectionDirection),
      ],
    ]);
  }

  static isEventIgnored(event) {
    const root = event.currentTarget || event.target;

    return (
      DomSelection.buildTextControlSelection(root) === null &&
      DomSelection.buildDomSelection(root) === null
    );
  }

  static #boxSelection(textSelection, domSelection) {
    return BeforeInputEvent.boxSelection(textSelection, domSelection);
  }

  static #selectionValue(textSelection, domSelection, root) {
    if (textSelection !== null) {
      return root.value.substring(
        textSelection.selectionStart,
        textSelection.selectionEnd,
      );
    }

    return domSelection === null ? "" : domSelection.value;
  }
}

const $ = SelectionChangeEvent;
