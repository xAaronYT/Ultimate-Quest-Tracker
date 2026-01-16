export const normalizeAssetName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')           // Spaces to underscores
    .replace(/-/g, '_')             // Fix for Shroud half-mask: dashes to underscores
    .replace(/[()]/g, '')           // Remove parentheses
    .replace(/['.#]/g, '')          // Remove apostrophes, dots, and hashtags
    .replace(/[^a-z0-9_]/g, '');    // Clean up anything else
};