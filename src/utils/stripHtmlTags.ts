// Removes HTML/JSX tags from a string, leaving only text content
export function stripHtmlTags(input: string): string {
  if (!input) return '';
  // Remove tags like <div ...>, <span ...>, </div>, etc.
  return input.replace(/<[^>]+>/g, '');
}
