export const normalizeAssetName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[()]/g, '')           // Remove parentheses
    .replace(/['.#]/g, '')          // Remove apostrophes, dots, and hashtags
    .replace(/[^a-z0-9_]/g, '');    // Remove any other non-alphanumeric characters
};