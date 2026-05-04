/**
 * geo.ts — SETX 360 Regional Weighting Utility
 *
 * Provides client-side sorting so that content from the user's home county
 * floats to the top of the feed without hiding any other regional content.
 *
 * SETX Region: Jefferson, Orange, Hardin, Jasper counties (Southeast Texas)
 */

export const SETX_COUNTIES = ['Jefferson', 'Orange', 'Hardin', 'Jasper'];

/** Normalise a county string (remove "County" suffix, trim, lower-case) */
const normalise = (county?: string | null): string =>
  (county || '').replace(/\s*county$/i, '').trim().toLowerCase();

/**
 * weightByCounty
 *
 * Sorts an array of content items so items matching the user's home county
 * appear first, followed by all other items in their original order.
 *
 * @param items       - Array of any objects that contain geographic data
 * @param userCounty  - The logged-in user's county (from their profile)
 * @param countyField - Dot-path to the county field on each item.
 *                      Supports nested paths like "author.county".
 *                      Defaults to "author_county".
 */
export function weightByCounty<T>(
  items: T[],
  userCounty?: string | null,
  countyField: string = 'author_county'
): T[] {
  if (!userCounty || items.length === 0) return items;

  const userNorm = normalise(userCounty);

  const getFieldValue = (item: any, path: string): string => {
    return path.split('.').reduce((obj, key) => obj?.[key], item) as string;
  };

  const home: T[] = [];
  const rest: T[] = [];

  for (const item of items) {
    const itemCounty = normalise(getFieldValue(item, countyField));
    if (itemCounty === userNorm) {
      home.push(item);
    } else {
      rest.push(item);
    }
  }

  return [...home, ...rest];
}

/**
 * isSETXTheme
 * Convenience helper so components don't need to import theme themselves.
 */
export const isSETXTheme = (theme: string): boolean => theme.startsWith('setx-');

/**
 * setxCountyFilter
 * Returns a PostgREST `.in()` compatible list for filtering all 4 SETX counties.
 * Uses both "Jefferson" and "Jefferson County" forms for safety.
 */
export const SETX_COUNTY_LIST = [
  'Jefferson', 'Orange', 'Hardin', 'Jasper',
  'Jefferson County', 'Orange County', 'Hardin County', 'Jasper County'
];
