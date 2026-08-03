/*
 * Formats a category string for display:
 * - Replaces underscores with spaces
 * - Capitalizes each word
 */
export function formatCategoryLabel(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bAi\b/g, 'AI');
}