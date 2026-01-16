
export const normalizeAssetName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[\s-]/g, '_')           // Spaces and hyphens to underscores
    .replace(/['",;:!#]/g, '')       // Remove punctuation like ', ;, :, ,, !, #
    .replace(/[()]/g, '')            // Remove parentheses
    .replace(/_+/g, '_')             // Prevent double underscores
    .trim();
};
