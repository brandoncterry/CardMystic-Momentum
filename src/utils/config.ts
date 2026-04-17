/**
 * Central configuration for remote resources.
 * Change IMAGE_CDN_BASE when migrating from GitHub Pages to R2/CloudFront.
 */

/** Base URL for hosted card art images (no trailing slash) */
export const IMAGE_CDN_BASE =
  'https://github.com/brandoncterry/mtg-art'

/** Scryfall API base URL */
export const SCRYFALL_API_BASE = 'https://api.scryfall.com'

/** Default dominant color when none is pre-computed */
export const DEFAULT_DOMINANT_COLOR = '#1a1a2e'

/** Default vertical offset for image centering */
export const DEFAULT_VERTICAL_OFFSET = 50
