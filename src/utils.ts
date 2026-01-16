/**
 * Original normalizeAssetName logic from Stable 1.1.
 * Ensures compatibility with underscores and specific character stripping.
 */
export const normalizeAssetName = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '_')           // Spaces to underscores
        .replace(/-/g, '_')             // Fix for Shroud half-mask: dashes to underscores
        .replace(/[()]/g, '')           // Remove parentheses
        .replace(/['.#]/g, '')          // Remove apostrophes, dots, and hashtags
        .replace(/[^a-z0-9_]/g, '');    // Clean up anything else
};

export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
};

export const calculatePercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
};