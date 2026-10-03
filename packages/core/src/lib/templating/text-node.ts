import { getDocument, getWindow } from '../dom';

// A text node passes through; any other value becomes a new text node.
export const getNewTextValue = (value: Text | unknown) =>
    value instanceof getWindow().Text
        ? (value as Text)
        : getDocument().createTextNode(String(value));
