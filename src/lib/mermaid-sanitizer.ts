/**
 * Attempts to fix common mermaid syntax errors.
 */
export function sanitizeMermaidCode(code: string): string {
  let sanitized = code.trim();

  // Remove markdown code fences
  sanitized = sanitized.replace(/^```(?:mermaid)?\n?/i, "").replace(/\n?```$/i, "");

  // Fix unclosed brackets/parentheses
  const openParens = (sanitized.match(/\(/g) || []).length;
  const closeParens = (sanitized.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    sanitized += ")".repeat(openParens - closeParens);
  }

  const openBrackets = (sanitized.match(/\[/g) || []).length;
  const closeBrackets = (sanitized.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    sanitized += "]".repeat(openBrackets - closeBrackets);
  }

  const openBraces = (sanitized.match(/\{/g) || []).length;
  const closeBraces = (sanitized.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    sanitized += "}".repeat(openBraces - closeBraces);
  }

  // Remove problematic characters in node labels
  sanitized = sanitized.replace(/[""]/g, '"');
  sanitized = sanitized.replace(/['']/g, "'");

  // Fix common issues with mindmap syntax
  if (sanitized.startsWith("mindmap")) {
    // Ensure proper indentation (spaces not tabs)
    sanitized = sanitized.replace(/\t/g, "  ");
  }

  return sanitized;
}
