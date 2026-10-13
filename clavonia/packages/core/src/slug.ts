/**
 * Turns free text into a URL-friendly slug.
 * Example: "Café Dulce Methow!" -> "cafe-dulce-methow"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
