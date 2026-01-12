import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeObject,
  normalizeWhitespace,
  sanitize,
  hasDangerousContent,
  zodSafeString,
  zodSanitize,
  zodStripHtml,
} from "./sanitize";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns input unchanged if no special characters", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });
});

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
  });

  it("removes self-closing tags", () => {
    expect(stripHtml("Hello<br/>World")).toBe("HelloWorld");
  });

  it("decodes HTML entities", () => {
    expect(stripHtml("&lt;script&gt;")).toBe("<script>");
    expect(stripHtml("&amp;&quot;")).toBe('&"');
  });

  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("sanitizeString", () => {
  it("removes script tags", () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe("");
  });

  it("removes script tags with attributes", () => {
    expect(
      sanitizeString('<script type="text/javascript">alert(1)</script>'),
    ).toBe("");
  });

  it("removes event handlers", () => {
    expect(sanitizeString('<img src="x" onerror="alert(1)">')).toBe(
      '<img src="x" >',
    );
  });

  it("removes javascript: URLs", () => {
    expect(sanitizeString('<a href="javascript:alert(1)">click</a>')).toBe(
      '<a href="alert(1)">click</a>',
    );
  });

  it("removes vbscript: URLs", () => {
    expect(sanitizeString('<a href="vbscript:msgbox">click</a>')).toBe(
      '<a href="msgbox">click</a>',
    );
  });

  it("removes dangerous data: URLs but allows safe images", () => {
    // Dangerous data URLs are sanitized (leaves trailing comma from regex)
    expect(sanitizeString('<img src="data:text/html,<script>alert(1)</script>">')).toBe(
      '<img src=",">',
    );
    // Safe image data URLs should be preserved
    expect(sanitizeString('<img src="data:image/png;base64,ABC">')).toBe(
      '<img src="data:image/png;base64,ABC">',
    );
  });

  it("removes CSS expression()", () => {
    // Expression content is removed (leaves trailing paren from regex)
    expect(sanitizeString("width: expression(alert(1))")).toBe("width: )");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeString("")).toBe("");
  });
});

describe("sanitizeObject", () => {
  it("sanitizes string values", () => {
    const input = { name: "<script>alert(1)</script>", count: 42 };
    const result = sanitizeObject(input);
    expect(result.name).toBe("");
    expect(result.count).toBe(42);
  });

  it("sanitizes nested objects", () => {
    const input = { nested: { value: '<a onclick="bad()">link</a>' } };
    const result = sanitizeObject(input);
    expect(result.nested.value).toBe("<a >link</a>");
  });

  it("sanitizes arrays", () => {
    const input = { items: ["<script>bad</script>", "safe", 123] };
    const result = sanitizeObject(input);
    expect(result.items).toEqual(["", "safe", 123]);
  });

  it("handles null and undefined", () => {
    expect(sanitizeObject(null as unknown as Record<string, unknown>)).toBe(null);
    expect(sanitizeObject(undefined as unknown as Record<string, unknown>)).toBe(undefined);
  });

  it("allows custom sanitizer", () => {
    const input = { name: "  hello  " };
    const result = sanitizeObject(input, (s) => s.trim());
    expect(result.name).toBe("hello");
  });
});

describe("normalizeWhitespace", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeWhitespace("  Hello   World  \n\n Test  ")).toBe(
      "Hello World Test",
    );
  });

  it("returns empty string for empty input", () => {
    expect(normalizeWhitespace("")).toBe("");
  });
});

describe("sanitize", () => {
  it("combines sanitizeString and normalizeWhitespace", () => {
    expect(sanitize("  <script>alert(1)</script>  Hello   World  ")).toBe(
      "Hello World",
    );
  });
});

describe("hasDangerousContent", () => {
  it("detects script tags", () => {
    expect(hasDangerousContent("<script>alert(1)</script>")).toBe(true);
  });

  it("detects javascript: URLs", () => {
    expect(hasDangerousContent('href="javascript:alert(1)"')).toBe(true);
  });

  it("detects vbscript: URLs", () => {
    expect(hasDangerousContent('href="vbscript:msgbox"')).toBe(true);
  });

  it("detects event handlers", () => {
    expect(hasDangerousContent('onclick="alert(1)"')).toBe(true);
    expect(hasDangerousContent("onerror = bad()")).toBe(true);
  });

  it("detects dangerous data: URLs", () => {
    expect(hasDangerousContent("data:text/html,<script>")).toBe(true);
  });

  it("detects CSS expression", () => {
    expect(hasDangerousContent("expression(alert(1))")).toBe(true);
  });

  it("returns false for safe content", () => {
    expect(hasDangerousContent("Hello World")).toBe(false);
    expect(hasDangerousContent("<p>Normal HTML</p>")).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(hasDangerousContent("")).toBe(false);
  });
});

describe("Zod helpers", () => {
  describe("zodSafeString", () => {
    it("returns true for safe strings", () => {
      const [validator] = zodSafeString;
      expect(validator("Hello World")).toBe(true);
    });

    it("returns false for dangerous strings", () => {
      const [validator] = zodSafeString;
      expect(validator("<script>bad</script>")).toBe(false);
    });

    it("has correct error message", () => {
      const [, options] = zodSafeString;
      expect(options.message).toBe("Input contains potentially dangerous content");
    });
  });

  describe("zodSanitize", () => {
    it("sanitizes input", () => {
      expect(zodSanitize("  <script>bad</script>  Hello  ")).toBe("Hello");
    });
  });

  describe("zodStripHtml", () => {
    it("strips HTML and normalizes whitespace", () => {
      expect(zodStripHtml("  <p>Hello</p>  <b>World</b>  ")).toBe("Hello World");
    });
  });
});
