import { describe, it, expect } from "vitest";
import {
  isHTMLElement,
  isInputElement,
  isTextAreaElement,
  isButtonElement,
  isSelectElement,
  isTableCellElement,
  isTableRowElement,
  isEditableElement,
  isInteractiveElement,
  isPlainObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isDate,
  isDefined,
  isNullish,
  safeArrayAccess,
  first,
  last,
  shouldIgnoreEvent,
  closestElement,
  safeParseInt,
  safeParseFloat,
} from "../../utils/type-guards";

// ─── DOM ELEMENT TYPE GUARDS ─────────────────────────────────────────────────

describe("DOM Element Type Guards", () => {
  describe("isHTMLElement", () => {
    it("should return true for HTMLElement", () => {
      const element = document.createElement("div");
      expect(isHTMLElement(element)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isHTMLElement(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isHTMLElement(undefined)).toBe(false);
    });

    it("should return false for non-Element objects", () => {
      expect(isHTMLElement({})).toBe(false);
      expect(isHTMLElement("string")).toBe(false);
    });
  });

  describe("isInputElement", () => {
    it("should return true for input element", () => {
      const input = document.createElement("input");
      expect(isInputElement(input)).toBe(true);
    });

    it("should return false for non-input elements", () => {
      const div = document.createElement("div");
      expect(isInputElement(div)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isInputElement(null)).toBe(false);
    });
  });

  describe("isTextAreaElement", () => {
    it("should return true for textarea element", () => {
      const textarea = document.createElement("textarea");
      expect(isTextAreaElement(textarea)).toBe(true);
    });

    it("should return false for non-textarea elements", () => {
      const input = document.createElement("input");
      expect(isTextAreaElement(input)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isTextAreaElement(null)).toBe(false);
    });
  });

  describe("isButtonElement", () => {
    it("should return true for button element", () => {
      const button = document.createElement("button");
      expect(isButtonElement(button)).toBe(true);
    });

    it("should return false for non-button elements", () => {
      const div = document.createElement("div");
      expect(isButtonElement(div)).toBe(false);
    });
  });

  describe("isSelectElement", () => {
    it("should return true for select element", () => {
      const select = document.createElement("select");
      expect(isSelectElement(select)).toBe(true);
    });

    it("should return false for non-select elements", () => {
      const input = document.createElement("input");
      expect(isSelectElement(input)).toBe(false);
    });
  });

  describe("isTableCellElement", () => {
    it("should return true for td element", () => {
      const td = document.createElement("td");
      expect(isTableCellElement(td)).toBe(true);
    });

    it("should return true for th element", () => {
      const th = document.createElement("th");
      expect(isTableCellElement(th)).toBe(true);
    });

    it("should return false for non-table-cell elements", () => {
      const div = document.createElement("div");
      expect(isTableCellElement(div)).toBe(false);
    });
  });

  describe("isTableRowElement", () => {
    it("should return true for tr element", () => {
      const tr = document.createElement("tr");
      expect(isTableRowElement(tr)).toBe(true);
    });

    it("should return false for non-tr elements", () => {
      const td = document.createElement("td");
      expect(isTableRowElement(td)).toBe(false);
    });
  });

  describe("isEditableElement", () => {
    it("should return true for input element", () => {
      const input = document.createElement("input");
      expect(isEditableElement(input)).toBe(true);
    });

    it("should return true for textarea element", () => {
      const textarea = document.createElement("textarea");
      expect(isEditableElement(textarea)).toBe(true);
    });

    it("should return true for contenteditable element", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      expect(isEditableElement(div)).toBe(true);
    });

    it("should return false for regular div", () => {
      const div = document.createElement("div");
      expect(isEditableElement(div)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isEditableElement(null)).toBe(false);
    });
  });

  describe("isInteractiveElement", () => {
    it("should return true for button", () => {
      const button = document.createElement("button");
      expect(isInteractiveElement(button)).toBe(true);
    });

    it("should return true for link", () => {
      const link = document.createElement("a");
      expect(isInteractiveElement(link)).toBe(true);
    });

    it("should return true for input", () => {
      const input = document.createElement("input");
      expect(isInteractiveElement(input)).toBe(true);
    });

    it("should return true for element with role=button", () => {
      const div = document.createElement("div");
      div.setAttribute("role", "button");
      expect(isInteractiveElement(div)).toBe(true);
    });

    it("should return true for element with data-interactive", () => {
      const div = document.createElement("div");
      div.setAttribute("data-interactive", "true");
      expect(isInteractiveElement(div)).toBe(true);
    });

    it("should return true for child of interactive element", () => {
      const button = document.createElement("button");
      const span = document.createElement("span");
      button.appendChild(span);
      document.body.appendChild(button);

      expect(isInteractiveElement(span)).toBe(true);

      document.body.removeChild(button);
    });

    it("should return false for regular div", () => {
      const div = document.createElement("div");
      expect(isInteractiveElement(div)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isInteractiveElement(null)).toBe(false);
    });
  });
});

// ─── OBJECT TYPE GUARDS ─────────────────────────────────────────────────────

describe("Object Type Guards", () => {
  describe("isPlainObject", () => {
    it("should return true for plain objects", () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ key: "value" })).toBe(true);
    });

    it("should return false for arrays", () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);
    });

    it("should return false for null", () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it("should return false for primitives", () => {
      expect(isPlainObject("string")).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
    });
  });

  describe("isArray", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it("should return false for non-arrays", () => {
      expect(isArray({})).toBe(false);
      expect(isArray("string")).toBe(false);
      expect(isArray(null)).toBe(false);
    });
  });

  describe("isString", () => {
    it("should return true for strings", () => {
      expect(isString("")).toBe(true);
      expect(isString("hello")).toBe(true);
    });

    it("should return false for non-strings", () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("should return true for valid numbers", () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-1.5)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
    });

    it("should return false for NaN", () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it("should return false for non-numbers", () => {
      expect(isNumber("123")).toBe(false);
      expect(isNumber(null)).toBe(false);
    });
  });

  describe("isBoolean", () => {
    it("should return true for booleans", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it("should return false for non-booleans", () => {
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean("true")).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });
  });

  describe("isDate", () => {
    it("should return true for valid Date objects", () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date("2024-01-01"))).toBe(true);
    });

    it("should return false for invalid Date", () => {
      expect(isDate(new Date("invalid"))).toBe(false);
    });

    it("should return false for non-Date objects", () => {
      expect(isDate("2024-01-01")).toBe(false);
      expect(isDate(1704067200000)).toBe(false);
      expect(isDate(null)).toBe(false);
    });
  });

  describe("isDefined", () => {
    it("should return true for defined values", () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined("")).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it("should return false for null", () => {
      expect(isDefined(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe("isNullish", () => {
    it("should return true for null", () => {
      expect(isNullish(null)).toBe(true);
    });

    it("should return true for undefined", () => {
      expect(isNullish(undefined)).toBe(true);
    });

    it("should return false for defined values", () => {
      expect(isNullish(0)).toBe(false);
      expect(isNullish("")).toBe(false);
      expect(isNullish(false)).toBe(false);
    });
  });
});

// ─── ARRAY UTILITIES ─────────────────────────────────────────────────────────

describe("Array Utilities", () => {
  describe("safeArrayAccess", () => {
    const arr = [1, 2, 3];

    it("should return element at valid index", () => {
      expect(safeArrayAccess(arr, 0)).toBe(1);
      expect(safeArrayAccess(arr, 1)).toBe(2);
      expect(safeArrayAccess(arr, 2)).toBe(3);
    });

    it("should return undefined for negative index", () => {
      expect(safeArrayAccess(arr, -1)).toBeUndefined();
    });

    it("should return undefined for out of bounds index", () => {
      expect(safeArrayAccess(arr, 3)).toBeUndefined();
      expect(safeArrayAccess(arr, 100)).toBeUndefined();
    });

    it("should work with empty array", () => {
      expect(safeArrayAccess([], 0)).toBeUndefined();
    });
  });

  describe("first", () => {
    it("should return first element", () => {
      expect(first([1, 2, 3])).toBe(1);
      expect(first(["a", "b", "c"])).toBe("a");
    });

    it("should return undefined for empty array", () => {
      expect(first([])).toBeUndefined();
    });
  });

  describe("last", () => {
    it("should return last element", () => {
      expect(last([1, 2, 3])).toBe(3);
      expect(last(["a", "b", "c"])).toBe("c");
    });

    it("should return undefined for empty array", () => {
      expect(last([])).toBeUndefined();
    });
  });
});

// ─── EVENT UTILITIES ─────────────────────────────────────────────────────────

describe("Event Utilities", () => {
  describe("shouldIgnoreEvent", () => {
    it("should return true when target is button", () => {
      const button = document.createElement("button");
      document.body.appendChild(button);

      const event = new MouseEvent("click");
      Object.defineProperty(event, "target", { value: button });

      expect(shouldIgnoreEvent(event)).toBe(true);

      document.body.removeChild(button);
    });

    it("should return true when target is inside button", () => {
      const button = document.createElement("button");
      const span = document.createElement("span");
      button.appendChild(span);
      document.body.appendChild(button);

      const event = new MouseEvent("click");
      Object.defineProperty(event, "target", { value: span });

      expect(shouldIgnoreEvent(event)).toBe(true);

      document.body.removeChild(button);
    });

    it("should return true for input element", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);

      const event = new MouseEvent("click");
      Object.defineProperty(event, "target", { value: input });

      expect(shouldIgnoreEvent(event)).toBe(true);

      document.body.removeChild(input);
    });

    it("should return true for element with data-ignore-row-click", () => {
      const div = document.createElement("div");
      div.setAttribute("data-ignore-row-click", "true");
      document.body.appendChild(div);

      const event = new MouseEvent("click");
      Object.defineProperty(event, "target", { value: div });

      expect(shouldIgnoreEvent(event)).toBe(true);

      document.body.removeChild(div);
    });

    it("should return false for regular div", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const event = new MouseEvent("click");
      Object.defineProperty(event, "target", { value: div });

      expect(shouldIgnoreEvent(event)).toBe(false);

      document.body.removeChild(div);
    });

    it("should return false for non-HTMLElement target", () => {
      const event = new MouseEvent("click");
      Object.defineProperty(event, "target", { value: null });

      expect(shouldIgnoreEvent(event)).toBe(false);
    });
  });

  describe("closestElement", () => {
    it("should find closest matching element", () => {
      const table = document.createElement("table");
      const tbody = document.createElement("tbody");
      const tr = document.createElement("tr");
      const td = document.createElement("td");

      table.appendChild(tbody);
      tbody.appendChild(tr);
      tr.appendChild(td);
      document.body.appendChild(table);

      expect(closestElement(td, "tr")).toBe(tr);
      expect(closestElement(td, "table")).toBe(table);

      document.body.removeChild(table);
    });

    it("should return null when not found", () => {
      const div = document.createElement("div");
      expect(closestElement(div, "table")).toBeNull();
    });

    it("should return null for null target", () => {
      expect(closestElement(null, "div")).toBeNull();
    });

    it("should return null for non-HTMLElement", () => {
      expect(closestElement({} as EventTarget, "div")).toBeNull();
    });
  });
});

// ─── PARSE UTILITIES ─────────────────────────────────────────────────────────

describe("Parse Utilities", () => {
  describe("safeParseInt", () => {
    it("should parse valid integer string", () => {
      expect(safeParseInt("123")).toBe(123);
      expect(safeParseInt("-456")).toBe(-456);
      expect(safeParseInt("0")).toBe(0);
    });

    it("should use custom radix", () => {
      expect(safeParseInt("ff", 16)).toBe(255);
      expect(safeParseInt("1010", 2)).toBe(10);
    });

    it("should return undefined for invalid string", () => {
      expect(safeParseInt("abc")).toBeUndefined();
      expect(safeParseInt("")).toBeUndefined();
    });

    it("should return undefined for null", () => {
      expect(safeParseInt(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(safeParseInt(undefined)).toBeUndefined();
    });
  });

  describe("safeParseFloat", () => {
    it("should parse valid float string", () => {
      expect(safeParseFloat("123.45")).toBe(123.45);
      expect(safeParseFloat("-456.78")).toBe(-456.78);
      expect(safeParseFloat("0.5")).toBe(0.5);
    });

    it("should parse integers as floats", () => {
      expect(safeParseFloat("123")).toBe(123);
    });

    it("should return undefined for invalid string", () => {
      expect(safeParseFloat("abc")).toBeUndefined();
      expect(safeParseFloat("")).toBeUndefined();
    });

    it("should return undefined for null", () => {
      expect(safeParseFloat(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(safeParseFloat(undefined)).toBeUndefined();
    });
  });
});
