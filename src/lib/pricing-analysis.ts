// Convert the pricing service's Markdown prose to text; React still escapes
// the result normally. Do not interpret generated content as HTML or MDX.
export function pricingAnalysisText(markdown: string): string {
  return markdown
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*(`{3,}|~{3,})[^\n]*$/gm, '')
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, '')
    .replace(/^\s{0,3}#{1,6}\s+(.+?)(?:\s+#+)?$/gm, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^[ \t]*[-+*][ \t]+(?:\[[ xX]\][ \t]+)?/gm, '• ')
    .replace(/!?\[([^\]\n]+)\]\([^\n]*?\)/g, '$1')
    .replace(/(\*{1,3})([^*\n]+)\1/g, '$2')
    .replace(/(?<![\p{L}\p{N}_])(_{1,3})([^_\n]+)\1(?![\p{L}\p{N}_])/gu, '$2')
    .replace(/~~([^~\n]+)~~/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
