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
// Public API – language lookup helper
// ---------------------------------------------------------------------------

/**
 * Returns all countries where the given language is spoken.
 *
 * The function accepts:
 *   - An ISO 639-3 three-letter code (e.g. "eng", "spa") — as stored in the
 *     `languages` field of each country record.
 *   - An ISO 639-1 two-letter code (e.g. "en", "es") — as stored in
 *     `data/languages.json`.  The code is first resolved to a language name
 *     via that list and then matched against country records.
 *   - A language name (e.g. "English", "Spanish") — matched
 *     case-insensitively against the language values in each country record.
 *
 * Countries that do not have the requested language in their `languages` map
 * are excluded from the result.
 *
 * @param {string} languageIso - ISO 639-3 code, ISO 639-1 code, or language name.
 * @returns {object[]} Array of country objects that speak the given language.
 *
 * @example
 * // By ISO 639-3 code (as stored in country data)
 * const countries = getCountriesByLanguage('eng');
 * // [{ id, name: "United States", … }, { id, name: "United Kingdom", … }, …]
 *
 * @example
 * // By ISO 639-1 code (as stored in languages.json)
 * const countries = getCountriesByLanguage('en');
 *
 * @example
 * // By language name
 * const countries = getCountriesByLanguage('Spanish');
 */
function getCountriesByLanguage(languageIso) {
  if (!languageIso || typeof languageIso !== 'string') return [];
  const input = languageIso.toLowerCase().trim();
  if (!input) return [];

  const countries = getCountries();

  // For two-letter ISO 639-1 codes, resolve to a language name first via
  // languages.json, then fall through to name-based matching below.
  let resolvedName = null;
  if (input.length === 2) {
    const languages = getLanguages();
    const lang = languages.find((l) => l.iso.toLowerCase() === input);
    if (lang) resolvedName = lang.name.toLowerCase();
  }

  return countries.filter((c) => {
    if (!c.languages || typeof c.languages !== 'object') return false;

    for (const key in c.languages) {
      // Direct key match — handles ISO 639-3 keys (most countries) as well as
      // the small number of country records that use ISO 639-1 keys (e.g. "ar", "cs").
      if (key.toLowerCase() === input) return true;

      // Name match — also handles 2-letter codes resolved to a name above.
      const valueLower = c.languages[key].toLowerCase();
      if (resolvedName !== null) {
        if (valueLower === resolvedName) return true;
      } else if (input.length !== 2 && input.length !== 3) {
        // Treat input as a language name — exact case-insensitive match.
        if (valueLower === input) return true;
      }
    }

    return false;
  });
}

// ---------------------------------------------------------------------------
// Public API – country query helpers (REST Countries v3.1-style)
// ---------------------------------------------------------------------------

/**
 * Returns all countries, optionally picking only the specified fields.
 *
 * When `fields` is omitted or empty the full country objects are returned.
 *
 * @param {string[]} [fields] - Optional list of field names to include
 *   (e.g. `["name", "flags"]`).
 * @returns {object[]} Array of country objects (filtered when `fields` is given).
 *
 * @example
 * const all = getAllCountries(["name", "flags"]);
 * // [{ name: "Afghanistan", flags: { … } }, …]
 */
function getAllCountries(fields) {
  const countries = getCountries();
  if (!fields || !Array.isArray(fields) || fields.length === 0) return countries;
  return countries.map((c) => {
    const obj = {};
    for (const f of fields) {
      if (f in c) obj[f] = c[f];
    }
    return obj;
  });
}

/**
 * Returns the country that matches the given code.
 *
 * The function tries to match the code against:
 *   - ISO 3166-1 alpha-2 (cca2, e.g. "CO")
 *   - ISO 3166-1 alpha-3 (cca3, e.g. "COL")
 *   - ISO 3166-1 numeric  (ccn3, e.g. "170")
 *
 * @param {string} code - Country code (alpha-2, alpha-3, or numeric).
 * @returns {object|null} The country object, or null if not found.
 *
 * @example
 * getCountryByCode("co");  // Colombia (iso2)
 * getCountryByCode("col"); // Colombia (iso3)
 * getCountryByCode("170"); // Colombia (numericCode)
 */
function getCountryByCode(code) {
  if (!code || typeof code !== 'string') return null;
  const input = code.trim();
  if (!input) return null;
  const upper = input.toUpperCase();
  const countries = getCountries();
  return (
    countries.find(
      (c) => c.iso2 === upper || c.iso3 === upper || c.numericCode === input
    ) || null
  );
}

/**
 * Returns all countries that match the given subregion name
 * (case-insensitive exact match).
 *
 * @param {string} subregion - Subregion name (e.g. "Northern Europe").
 * @returns {object[]} Array of country objects.
 *
 * @example
 * const countries = getCountriesBySubregion("Northern Europe");
 */
function getCountriesBySubregion(subregion) {
  if (!subregion || typeof subregion !== 'string') return [];
  const input = subregion.toLowerCase().trim();
  if (!input) return [];
  const subregions = getSubregions();
  const matched = subregions.find((s) => s.name.toLowerCase() === input);
  if (!matched) return [];
  const countries = getCountries();
  return countries.filter((c) => c.subRegionId === matched.id);
}

/**
 * Returns all countries whose translated name matches the given value
 * (case-insensitive exact match across all translation keys).
 *
 * @param {string} translation - Translated country name (e.g. "alemania").
 * @returns {object[]} Array of matching country objects.
 *
 * @example
 * const countries = getCountriesByTranslation("alemania");
 * // [{ id, name: "Germany", … }]
 */
function getCountriesByTranslation(translation) {
  if (!translation || typeof translation !== 'string') return [];
  const input = translation.toLowerCase().trim();
  if (!input) return [];
  const countries = getCountries();
  return countries.filter((c) => {
    if (!c.translations || typeof c.translations !== 'object') return false;
    for (const key in c.translations) {
      if (c.translations[key].toLowerCase() === input) return true;
    }
    return false;
  });
}

/**
 * Returns all countries that belong to the given region
 * (case-insensitive exact match on region name).
 *
 * Countries are linked to regions through their subregion:
 * country.subRegionId → subregion.regionId → region.id.
 *
 * @param {string} region - Region name (e.g. "europe", "Asia").
 * @returns {object[]} Array of country objects.
 *
 * @example
 * const countries = getCountriesByRegion("europe");
 */
function getCountriesByRegion(region) {
  if (!region || typeof region !== 'string') return [];
  const input = region.toLowerCase().trim();
  if (!input) return [];
  const regions = getRegions();
  const matched = regions.find((r) => r.name.toLowerCase() === input);
  if (!matched) return [];
  const subregions = getSubregions();
  const subregionIds = new Set(
    subregions.filter((s) => s.regionId === matched.id).map((s) => s.id)
  );
  const countries = getCountries();
  return countries.filter((c) => subregionIds.has(c.subRegionId));
}

/**
 * Returns countries that match any of the given codes.
 *
 * Each code is resolved using the same logic as `getCountryByCode`
 * (iso2, iso3, or numericCode).  Codes that do not resolve are silently
 * skipped.
 *
 * @param {string[]} codes - Array of country codes.
 * @returns {object[]} Array of matched country objects (order follows `codes`).
 *
 * @example
 * const countries = getCountriesByCodes(["170", "no", "est", "pe"]);
 */
function getCountriesByCodes(codes) {
  if (!codes || !Array.isArray(codes) || codes.length === 0) return [];
  return codes.map((c) => getCountryByCode(String(c))).filter(Boolean);
}

/**
 * Returns the country whose common name or any translation is an exact match
 * (case-insensitive).
 *
 * @param {string} name - Full country name (e.g. "aruba").
 * @returns {object|null} The country object, or null if not found.
 *
 * @example
 * const country = getCountryByFullName("aruba");
 * // { id, name: "Aruba", iso2: "AW", … }
 */
function getCountryByFullName(name) {
  if (!name || typeof name !== 'string') return null;
  const input = name.toLowerCase().trim();
  if (!input) return null;
  const countries = getCountries();
  return (
    countries.find((c) => {
      if (c.name.toLowerCase() === input) return true;
      if (c.translations && typeof c.translations === 'object') {
        for (const key in c.translations) {
          if (c.translations[key].toLowerCase() === input) return true;
        }
      }
      return false;
    }) || null
  );
}

/**
 * Returns all countries whose common name or any translation contains the
 * given query string (case-insensitive substring match).
 *
 * @param {string} name - Search term (e.g. "eesti", "united").
 * @returns {object[]} Array of matching country objects.
 *
 * @example
 * const countries = getCountriesByName("united");
 */
function getCountriesByName(name) {
  if (!name || typeof name !== 'string') return [];
  const input = name.toLowerCase().trim();
  if (!input) return [];
  const countries = getCountries();
  return countries.filter((c) => {
    if (c.name.toLowerCase().includes(input)) return true;
    if (c.translations && typeof c.translations === 'object') {
      for (const key in c.translations) {
        if (c.translations[key].toLowerCase().includes(input)) return true;
      }
    }
    return false;
  });
}

// ---------------------------------------------------------------------------
// Public API – helpers
// ---------------------------------------------------------------------------

/**
 * Returns the country that matches the given numeric ID.
 *
 * @param {number} id - Numeric country ID as stored in countries.json.
 * @returns {object|null} The country object, or null if not found.
 *
 * @example
 * const country = getCountryById(101);
 * // { id, name, iso2, iso3, ... }
 */
function getCountryById(id) {
  if (id == null || typeof id !== 'number') return null;
  const countries = getCountries();
  return countries.find((c) => c.id === id) || null;
}

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
 * The code must follow the format "<countryIso2>-<stateIso2>" (e.g. "US-CA", "MX-JAL").
 *
 * @param {string} code - Combined code in the format "COUNTRY-STATE" (e.g. "US-CA").
 * @returns {object|null} The state object, or null if not found.
 *
 * @example
 * const state = getStateByCode("US-CA");
 * // { id, name, countryId, iso2, latitude, longitude, timezone, translations }
 */
function getStateByCode(code) {
  if (!code || typeof code !== 'string') return null;
  const dashIndex = code.indexOf('-');
  if (dashIndex === -1) return null;
  const countryIso2 = code.slice(0, dashIndex).toUpperCase();
  const stateIso2 = code.slice(dashIndex + 1).toUpperCase();
  if (!countryIso2 || !stateIso2) return null;
  const country = getCountryByIso2(countryIso2);
  if (!country) return null;
  const states = getStates();
  return states.find((s) => s.countryId === country.id && s.iso2 === stateIso2) || null;
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
 * Returns all states that belong to the country with the given numeric ID.
 *
 * @param {number} countryId - Numeric country ID as stored in countries.json.
 * @returns {object[]} Array of state objects, or an empty array if not found.
 *
 * @example
 * const states = getStatesOfCountryById(101);
 * // [{ id, name, countryId, iso2, latitude, longitude, timezone, translations }, …]
 */
function getStatesOfCountryById(countryId) {
  if (countryId == null || typeof countryId !== 'number') return [];
  const states = getStates();
  return states.filter((s) => s.countryId === countryId);
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
 * Returns all cities that belong to a given state.
 *
 * Internally, this looks up the state to find its country, loads that country's
 * city file, and then filters by stateId.
 *
 * @param {number} stateId - Numeric state ID as stored in states.json.
 * @returns {object[]} Array of city objects, or an empty array if not found.
 *
 * @example
 * const cities = getCitiesOfState(1462);
 * // [{ id, name, stateId, latitude, longitude }, …]
 */
function getCitiesOfState(stateId) {
  if (stateId == null || typeof stateId !== 'number') return [];
  const states = getStates();
  const state = states.find((s) => s.id === stateId);
  if (!state) return [];
  const country = getCountryById(state.countryId);
  if (!country) return [];
  const cities = _loadCitiesForCountry(country.iso2);
  return cities.filter((c) => c.stateId === stateId);
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
  getCountriesByLanguage,
  getCountryById,
  getCountryByIso2,
  getCountryByIso3,
  getAllCountries,
  getCountryByCode,
  getCountriesBySubregion,
  getCountriesByTranslation,
  getCountriesByRegion,
  getCountriesByCodes,
  getCountryByFullName,
  getCountriesByName,
  getStateByCode,
  getStatesOfCountry,
  getStatesOfCountryById,
  getCitiesOfCountry,
  getCitiesOfState,
  searchCity,
  calculateDistance,
  getNearestCities,
};
