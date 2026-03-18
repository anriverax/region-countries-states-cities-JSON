'use strict';

// ---------------------------------------------------------------------------
// Lazy-loaded singletons
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Lazy-loaded singletons
// ---------------------------------------------------------------------------

let _countries = null;
let _states = null;
let _regions = null;
let _subregions = null;
let _languages = null;

// Cache for per-country city arrays (keyed by ISO2)
const _citiesCache = Object.create(null);

// Flat city index used by searchCity (built on first call)
let _cityIndex = null;

// ---------------------------------------------------------------------------
// Internal loaders
// ---------------------------------------------------------------------------

function _loadCitiesForCountry(iso2) {
  const key = iso2.toUpperCase();
  if (!_citiesCache[key]) {
    try {
      _citiesCache[key] = require(`./data/cities/${key}.json`);
    } catch (e) {
      _citiesCache[key] = [];
    }
  }
  return _citiesCache[key];
}

/**
 * Build the flat city index used by searchCity.
 * Each entry is a city object with an additional `countryIso2` field.
 * The index is sorted by lowercase name to allow binary-search prefix lookups.
 */
function _buildCityIndex() {
  if (_cityIndex) return _cityIndex;

  const countries = getCountries();
  const all = [];

  for (const country of countries) {
    const iso2 = country.iso2;
    const cities = _loadCitiesForCountry(iso2);
    for (const city of cities) {
      all.push({ ...city, countryIso2: iso2 });
    }
  }

  // Sort once so binary search works for prefix queries
  all.sort((a, b) => {
    const an = a.name.toLowerCase();
    const bn = b.name.toLowerCase();
    return an < bn ? -1 : an > bn ? 1 : 0;
  });

  _cityIndex = all;
  return _cityIndex;
}

// ---------------------------------------------------------------------------
// Public API – data accessors
// ---------------------------------------------------------------------------

/**
 * Returns the full list of countries.
 * @returns {object[]}
 */
function getCountries() {
  if (!_countries) _countries = require('./data/countries.json');
  return _countries;
}

/**
 * Returns the full list of states/provinces.
 * @returns {object[]}
 */
function getStates() {
  if (!_states) _states = require('./data/states.json');
  return _states;
}

/**
 * Returns the full list of regions.
 * @returns {object[]}
 */
function getRegions() {
  if (!_regions) _regions = require('./data/regions.json');
  return _regions;
}

/**
 * Returns the full list of sub-regions.
 * @returns {object[]}
 */
function getSubregions() {
  if (!_subregions) _subregions = require('./data/subregions.json');
  return _subregions;
}

/**
 * Returns the full list of languages.
 * @returns {object[]}
 */
function getLanguages() {
  if (!_languages) _languages = require('./data/languages.json');
  return _languages;
}

// ---------------------------------------------------------------------------
// Public API – helpers
// ---------------------------------------------------------------------------

/**
 * Returns the country that matches the given ISO 3166-1 alpha-2 code.
 *
 * @param {string} iso2 - Two-letter ISO 3166-1 country code (e.g. "US", "SV").
 * @returns {object|null} The country object, or null if not found.
 *
 * @example
 * const country = getCountryByIso2("SV");
 * // { id, name, iso2, iso3, phoneCode, capital, timezones, latlng, emoji, … }
 */
function getCountryByIso2(iso2) {
  if (!iso2 || typeof iso2 !== 'string') return null;
  const upper = iso2.toUpperCase();
  const countries = getCountries();
  return countries.find((c) => c.iso2 === upper) || null;
}

/**
 * Returns the country that matches the given ISO 3166-1 alpha-3 code.
 *
 * @param {string} iso3 - Three-letter ISO 3166-1 country code (e.g. "USA", "SLV").
 * @returns {object|null} The country object, or null if not found.
 *
 * @example
 * const country = getCountryByIso3("SLV");
 * // { id, name, iso2, iso3, phoneCode, capital, timezones, latlng, emoji, … }
 */
function getCountryByIso3(iso3) {
  if (!iso3 || typeof iso3 !== 'string') return null;
  const upper = iso3.toUpperCase();
  const countries = getCountries();
  return countries.find((c) => c.iso3 === upper) || null;
}

/**
 * Returns the state that matches the given combined country-state code.
 * The code must follow the format "<countryIso2>-<stateCode>" (e.g. "US-CA", "MX-JAL").
 *
 * @param {string} code - Combined code in the format "COUNTRY-STATE" (e.g. "US-CA").
 * @returns {object|null} The state object, or null if not found.
 *
 * @example
 * const state = getStateByCode("US-CA");
 * // { id, name, countryId, stateCode, latitude, longitude }
 */
function getStateByCode(code) {
  if (!code || typeof code !== 'string') return null;
  const dashIndex = code.indexOf('-');
  if (dashIndex === -1) return null;
  const countryIso2 = code.slice(0, dashIndex).toUpperCase();
  const stateCode = code.slice(dashIndex + 1).toUpperCase();
  if (!countryIso2 || !stateCode) return null;
  const country = getCountryByIso2(countryIso2);
  if (!country) return null;
  const states = getStates();
  return states.find((s) => s.countryId === country.id && s.stateCode === stateCode) || null;
}

/**
 * Returns all states that belong to a given country.
 *
 * @param {string} iso2 - Two-letter ISO 3166-1 country code (e.g. "US", "MX").
 * @returns {object[]} Array of state objects, or an empty array if not found.
 *
 * @example
 * import { getStatesOfCountry } from "countries-states-cities-database";
 * const states = getStatesOfCountry("US");
 */
function getStatesOfCountry(iso2) {
  if (!iso2 || typeof iso2 !== 'string') return [];
  const upper = iso2.toUpperCase();
  const countries = getCountries();
  const country = countries.find((c) => c.iso2 === upper);
  if (!country) return [];
  const states = getStates();
  return states.filter((s) => s.countryId === country.id);
}

/**
 * Returns all cities that belong to a given country.
 *
 * @param {string} iso2 - Two-letter ISO 3166-1 country code (e.g. "US", "MX").
 * @returns {object[]} Array of city objects, or an empty array if not found.
 *
 * @example
 * const cities = getCitiesOfCountry("SV");
 */
function getCitiesOfCountry(iso2) {
  if (!iso2 || typeof iso2 !== 'string') return [];
  return _loadCitiesForCountry(iso2);
}

/**
 * Fast city search engine.
 * Searches all cities whose name contains the given query string (case-insensitive).
 *
 * The city index is built once on the first call and cached for subsequent calls.
 * Prefix queries additionally use binary search to skip non-matching entries.
 *
 * @param {string} query - Search term (e.g. "san", "new york").
 * @returns {object[]} Array of matching city objects, each augmented with a
 *   `countryIso2` field indicating the country.
 *
 * @example
 * const results = searchCity("san");
 */
function searchCity(query) {
  if (!query || typeof query !== 'string') return [];
  const term = query.toLowerCase().trim();
  if (!term) return [];

  const index = _buildCityIndex();

  // Binary search to find the first city whose lowercase name >= term
  let lo = 0;
  let hi = index.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (index[mid].name.toLowerCase() < term) lo = mid + 1;
    else hi = mid;
  }

  const results = [];

  // Collect prefix matches starting from lo
  for (let i = lo; i < index.length; i++) {
    const lower = index[i].name.toLowerCase();
    if (!lower.startsWith(term)) break;
    results.push(index[i]);
  }

  // Scan the full index for substring (non-prefix) matches, avoiding duplicates
  if (results.length === 0 || !index[lo] || !index[lo].name.toLowerCase().startsWith(term)) {
    // All are substring matches – scan everything
    for (const city of index) {
      const lower = city.name.toLowerCase();
      if (lower.includes(term) && !lower.startsWith(term)) {
        results.push(city);
      }
    }
  } else {
    // Prefix matches already collected; add remaining substring matches
    const prefixIds = new Set(results.map((c) => c.id));
    for (const city of index) {
      const lower = city.name.toLowerCase();
      if (!prefixIds.has(city.id) && lower.includes(term)) {
        results.push(city);
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Public API – geo calculations
// ---------------------------------------------------------------------------

/**
 * Calculates the great-circle distance in kilometers between two points using
 * the Haversine formula.
 *
 * @param {object} pointA - Object with `latitude` and `longitude` string or number fields.
 * @param {object} pointB - Object with `latitude` and `longitude` string or number fields.
 * @returns {number} Distance in kilometers, rounded to two decimal places.
 *
 * @example
 * const cityA = { latitude: "14.0918", longitude: "-89.7220" }; // San Salvador
 * const cityB = { latitude: "14.6349", longitude: "-90.5069" }; // Guatemala City
 * const km = calculateDistance(cityA, cityB);
 * // 102.41
 */
function calculateDistance(pointA, pointB) {
  if (!pointA || !pointB) return null;
  const lat1 = parseFloat(pointA.latitude);
  const lon1 = parseFloat(pointA.longitude);
  const lat2 = parseFloat(pointB.latitude);
  const lon2 = parseFloat(pointB.longitude);
  if ([lat1, lon1, lat2, lon2].some(isNaN)) return null;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Returns the N nearest cities to a given geographic point.
 *
 * The city index (all countries) is built once on the first call and cached.
 * For country-specific searches pass the optional `iso2` parameter to avoid
 * loading the full 148k-city index.
 *
 * @param {number} lat  - Latitude of the reference point.
 * @param {number} lng  - Longitude of the reference point.
 * @param {number} [limit=5] - Maximum number of results to return.
 * @param {string} [iso2]    - Optional ISO2 country code to restrict the search.
 * @returns {Array<object & { distance: number }>} Nearest cities sorted by
 *   distance ascending, each augmented with a `distance` field (km) and
 *   a `countryIso2` field.
 *
 * @example
 * // 3 nearest cities to San Salvador
 * const nearest = getNearestCities(13.6929, -89.2182, 3);
 * // [{ id, name, stateId, latitude, longitude, countryIso2, distance }, …]
 *
 * @example
 * // Restrict search to El Salvador
 * const nearest = getNearestCities(13.6929, -89.2182, 5, "SV");
 */
function getNearestCities(lat, lng, limit, iso2) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return [];
  const n = typeof limit === 'number' && limit > 0 ? Math.floor(limit) : 5;
  const ref = { latitude: String(lat), longitude: String(lng) };

  let pool;
  if (iso2 && typeof iso2 === 'string') {
    const cities = _loadCitiesForCountry(iso2.toUpperCase());
    pool = cities.map((c) => ({ ...c, countryIso2: iso2.toUpperCase() }));
  } else {
    pool = _buildCityIndex();
  }

  return pool
    .map((city) => ({ ...city, distance: calculateDistance(ref, city) }))
    .filter((city) => city.distance !== null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  getCountries,
  getStates,
  getRegions,
  getSubregions,
  getLanguages,
  getCountryByIso2,
  getCountryByIso3,
  getStateByCode,
  getStatesOfCountry,
  getCitiesOfCountry,
  searchCity,
  calculateDistance,
  getNearestCities,
};
