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
 * // { id, name, iso2, iso3, ... }
 */
function getCountryByIso2(iso2) {
  if (!iso2 || typeof iso2 !== 'string') return null;
  const upper = iso2.toUpperCase();
  const countries = getCountries();
  return countries.find((c) => c.iso2 === upper) || null;
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
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  getCountries,
  getStates,
  getRegions,
  getSubregions,
  getLanguages,
  getCountryByIso2,
  getStateByCode,
  getStatesOfCountry,
  getCitiesOfCountry,
  searchCity,
};
