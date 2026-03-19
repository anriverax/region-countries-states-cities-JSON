# 🌍 Countries States Cities Database

[![npm](https://img.shields.io/npm/v/countries-states-cities-database)](https://www.npmjs.com/package/countries-states-cities-database)
[![npm downloads](https://img.shields.io/npm/dm/countries-states-cities-database)](https://www.npmjs.com/package/countries-states-cities-database)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An open-source dataset containing countries, states, and cities in JSON format.

**Includes:**

- ✔ 250+ countries
- ✔ 5000+ states
- ✔ 150k+ cities
- ✔ ISO codes (ISO2, ISO3, numeric)
- ✔ Latitude and longitude
- ✔ Regions and subregions
- ✔ Timezones
- ✔ Phone / dial codes
- ✔ Emoji flags

---

## 📁 Repository Structure

```
countries-states-cities-database
│
├── index.js              — Main entry point with helper functions
│
├── data
│   ├── countries.json    — All countries with ISO codes, phone codes, timezones, flags …
│   ├── regions.json      — World regions (Africa, Americas, Asia, Europe, Oceania …)
│   ├── subregions.json   — Sub-regions linked to regions
│   ├── states.json       — States / provinces / territories per country
│   ├── cities.json       — Optional flat file (if generated)
│   ├── languages.json    — Language list with ISO codes
│   └── cities/           — Per-country city files (split from cities.json)
│       ├── SV.json       — Cities in El Salvador
│       ├── US.json       — Cities in the United States
│       ├── MX.json       — Cities in Mexico
│       └── …             — One file per country (ISO2 code)
│
├── types
│   ├── index.d.ts        — TypeScript function declarations
│   ├── country.d.ts      — TypeScript interface for a Country record
│   ├── state.d.ts        — TypeScript interface for a State record
│   └── city.d.ts         — TypeScript interface for a City record
│
├── scripts
│   ├── validate-data.js  — Node.js script to validate all data files
│   └── split-cities.js   — Script to (re)generate data/cities/ from data/cities.json
│
├── demo
│   └── index.html        — Browser demo (country → state → cities)
│
├── README.md
└── LICENSE
```

---

## 🚀 Quick Start

### Install

```bash
npm install countries-states-cities-database
```

### Use the helper API (recommended)

```js
const {
	// Data accessors
	getCountries,
	getStates,
	getRegions,
	getSubregions,
	getLanguages,
	// Country lookups
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
	// State lookups
	getStateByCode,
	getStatesOfCountry,
	getStatesOfCountryById,
	// City lookups
	getCitiesOfCountry,
	getCitiesOfState,
	searchCity,
	// Geo calculations
	calculateDistance,
	getNearestCities,
} = require('countries-states-cities-database');
```

---

## 📘 API Reference

### Data Accessors

#### `getCountries()`

Returns the full list of all countries.

```js
const countries = getCountries();
// [
//   { id, name, iso2, iso3, numericCode, phoneCode, capital, tld,
//     timezones, latlng, emoji, languages, flag, flags, maps, coatOfArms },
//   …
// ]
console.log(countries.length); // 249
```

#### `getStates()`

Returns the full list of states / provinces / territories.

```js
const states = getStates();
// [{ id, name, countryId, iso2, latitude, longitude, timezone, translations }, …]
console.log(states.length); // ~5000
```

#### `getRegions()`

Returns the 8 world regions.

```js
const regions = getRegions();
// [{ id: 1, name: "Africa" }, { id: 2, name: "Americas" }, …]
```

#### `getSubregions()`

Returns all sub-regions, each linked to a region via `regionId`.

```js
const subregions = getSubregions();
// [{ id, regionId, name }, …]
```

#### `getLanguages()`

Returns all supported languages with their ISO 639-1 codes.

```js
const languages = getLanguages();
// [{ name: "English", iso: "en" }, { name: "Spanish", iso: "es" }, …]
```

---

### Country Lookups

#### `getCountryByIso2(iso2)`

Returns the country matching the given ISO 3166-1 **alpha-2** code, or `null` if not found.

```js
const country = getCountryByIso2('SV');
// {
//   id: 65,
//   name: "El Salvador",
//   iso2: "SV",
//   iso3: "SLV",
//   phoneCode: "+503",
//   capital: "San Salvador",
//   timezones: { zoneName: "America/El_Salvador", … },
//   latlng: ["13.83333333", "-88.91666666"],
//   …
// }

getCountryByIso2('xx'); // null
```

#### `getCountryByIso3(iso3)`

Returns the country matching the given ISO 3166-1 **alpha-3** code, or `null` if not found.

```js
const country = getCountryByIso3('SLV');
// { id: 65, name: "El Salvador", iso2: "SV", iso3: "SLV", … }

const us = getCountryByIso3('USA');
// { id: 235, name: "United States", iso2: "US", iso3: "USA", … }

getCountryByIso3('XXX'); // null
```

#### `getCountryById(id)`

Returns the country matching the given numeric ID, or `null` if not found.

```js
const country = getCountryById(235);
// { id: 235, name: "United States", iso2: "US", iso3: "USA", … }

getCountryById(9999); // null
```

#### `getCountriesByLanguage(languageIso)`

Returns all countries where the given language is spoken. Countries that do not
list the language are excluded from the result.

The function accepts:

- An **ISO 639-3** three-letter code (e.g. `"eng"`, `"spa"`) — as stored in the
  `languages` field of each country record.
- An **ISO 639-1** two-letter code (e.g. `"en"`, `"es"`) — as stored in
  `data/languages.json`.
- A **language name** (e.g. `"English"`, `"Spanish"`) — matched
  case-insensitively.

```js
// By ISO 639-3 code (as stored in country records)
const englishCountries = getCountriesByLanguage('eng');
// [{ id, name: "United States", … }, { id, name: "United Kingdom", … }, …]

// By ISO 639-1 code (as in languages.json)
const spanishCountries = getCountriesByLanguage('es');
// All countries where Spanish is spoken

// By language name
const frenchCountries = getCountriesByLanguage('French');
```

#### `getAllCountries(fields?)`

Returns all countries. When `fields` is provided, only those properties are included in each object.

```js
// All countries, all fields
const all = getAllCountries();

// All countries, only name and flags
const summary = getAllCountries(['name', 'flags']);
// [{ name: "Afghanistan", flags: { png: "…", svg: "…" } }, …]
```

#### `getCountryByCode(code)`

Returns the country matching the given code. The function tries ISO 3166-1 alpha-2 (`iso2`), alpha-3 (`iso3`), and numeric (`numericCode`) codes.

```js
getCountryByCode('co');  // Colombia (iso2)
getCountryByCode('col'); // Colombia (iso3)
getCountryByCode('170'); // Colombia (numericCode)

getCountryByCode('ZZZ'); // null
```

#### `getCountriesByRegion(region)`

Returns all countries that belong to a given region (case-insensitive).

```js
const european = getCountriesByRegion('europe');
// [{ name: "Aland Islands", … }, { name: "Albania", … }, …]

const asian = getCountriesByRegion('Asia');
```

#### `getCountriesBySubregion(subregion)`

Returns all countries belonging to a given subregion (case-insensitive exact match).

```js
const nordic = getCountriesBySubregion('Northern Europe');
// [{ name: "Aland Islands", … }, { name: "Denmark", … }, …]
```

#### `getCountriesByTranslation(translation)`

Returns all countries whose translated name (in any language) matches the given value (case-insensitive).

```js
const result = getCountriesByTranslation('alemania');
// [{ name: "Germany", … }]

const col = getCountriesByTranslation('Colombie');
// [{ name: "Colombia", … }]
```

#### `getCountriesByCodes(codes)`

Returns countries matching any of the given codes. Each code is resolved using the same logic as `getCountryByCode`. Unmatched codes are skipped.

```js
const countries = getCountriesByCodes(['170', 'no', 'est', 'pe']);
// [Colombia, Norway, Estonia, Peru]
```

#### `getCountryByFullName(name)`

Returns the country whose common name or any translation is an exact match (case-insensitive). Returns `null` if not found.

```js
const aruba = getCountryByFullName('aruba');
// { id, name: "Aruba", iso2: "AW", … }

const germany = getCountryByFullName('Alemania');
// { id, name: "Germany", … } — matched via Spanish translation

getCountryByFullName('aru'); // null (partial match not allowed)
```

#### `getCountriesByName(name)`

Returns all countries whose common name or any translation contains the query string (case-insensitive substring match).

```js
const united = getCountriesByName('united');
// [{ name: "United Arab Emirates" }, { name: "United Kingdom" }, { name: "United States" }, …]

const estland = getCountriesByName('estland');
// [{ name: "Estonia", … }] — matched via German/Dutch translation
```

---

### State Lookups

#### `getStateByCode(code)`

Returns the state matching the given combined `"<countryIso2>-<stateIso2>"` code, or `null` if not found.

```js
const state = getStateByCode('US-CA');
// { id: 681, name: "California", countryId: 235, iso2: "CA",
//   latitude: "36.77826100", longitude: "-119.41793240", timezone: "America/Los_Angeles", translations: { … } }

const jalisco = getStateByCode('MX-JAL');
// { id, name: "Jalisco", countryId, iso2: "JAL", latitude, longitude, timezone, translations }
```

#### `getStatesOfCountry(iso2)`

Returns all states/provinces for a given country ISO2 code.

```js
const states = getStatesOfCountry('US');
// [{ id, name, countryId, iso2, latitude, longitude, timezone, translations }, …]  (~50 entries)

const svStates = getStatesOfCountry('SV');
// All departments of El Salvador
```

#### `getStatesOfCountryById(countryId)`

Returns all states/provinces for a given numeric country ID.

```js
const states = getStatesOfCountryById(101);
// [{ id, name, countryId, iso2, latitude, longitude, timezone, translations }, …]
```

#### `getCitiesOfCountry(iso2)`

Returns all cities for a given country ISO2 code (loaded from the per-country file — lightweight).

```js
const cities = getCitiesOfCountry('SV');
// [{ id, name, stateId, latitude, longitude }, …]

const mxCities = getCitiesOfCountry('MX');
// ~4,000 cities in Mexico
```

#### `getCitiesOfState(stateId)`

Returns all cities/municipalities that belong to a given state, identified by its numeric ID.

```js
// First get the state to know its id
const state = getStateByCode('US-CA'); // { id: 681, … }
const cities = getCitiesOfState(681);
// [{ id, name, stateId, latitude, longitude }, …]
```

#### `searchCity(query)`

Fast city search — returns all cities whose name contains the query string (case-insensitive).
The city index is built once on the first call and cached in memory.

```js
const results = searchCity('san');
// Each result includes a `countryIso2` field:
// [{ id, name, stateId, latitude, longitude, countryIso2 }, …]

const nyc = searchCity('new york');
// [{ id, name: "New York City", stateId, latitude, longitude, countryIso2: "US" }]
```

---

### Geo Calculations

#### `calculateDistance(pointA, pointB)`

Calculates the great-circle distance in **kilometers** between two geographic points using the **Haversine formula**.

Both arguments must be objects with `latitude` and `longitude` fields (strings or numbers),
which matches the shape of city and state objects in this dataset.

```js
const sanSalvador = { latitude: '13.6929', longitude: '-89.2182' };
const guatemalaCity = { latitude: '14.6349', longitude: '-90.5069' };

const km = calculateDistance(sanSalvador, guatemalaCity);
// 174

// Works directly with city/state objects from the dataset:
const cities = getCitiesOfCountry('SV');
const [cityA, cityB] = cities;
const dist = calculateDistance(cityA, cityB);
```

#### `getNearestCities(lat, lng, limit?, iso2?)`

Returns the **N nearest cities** to a given geographic point, sorted by distance ascending.
Each result is augmented with a `distance` field (km) and a `countryIso2` field.

| Parameter | Type     | Default | Description                                          |
| --------- | -------- | ------- | ---------------------------------------------------- |
| `lat`     | `number` | —       | Latitude of the reference point                      |
| `lng`     | `number` | —       | Longitude of the reference point                     |
| `limit`   | `number` | `5`     | Maximum number of results                            |
| `iso2`    | `string` | —       | Optional ISO2 code to restrict search to one country |

```js
// 3 nearest cities to San Salvador (globally)
const nearest = getNearestCities(13.6929, -89.2182, 3);
// [
//   { id, name: "San Salvador",       …, countryIso2: "SV", distance: 3.37 },
//   { id, name: "Antiguo Cuscatlán",  …, countryIso2: "SV", distance: 4.9  },
//   { id, name: "Mejicanos",          …, countryIso2: "SV", distance: 5.3  },
// ]

// Restrict search to El Salvador (faster — avoids loading all cities)
const svNearest = getNearestCities(13.6929, -89.2182, 5, 'SV');
```

---

## 🗂️ Data Properties

Note: For Polar region entries (AQ, BV, HM), subRegionId is mapped to the
"Antarctica" subregion (id 23) under the "Polar" region.

### Country properties

Each country object has the following properties:

| Property       | Type               | Example                                                                    |
| -------------- | ------------------ | -------------------------------------------------------------------------- |
| `id`           | `number`           | `65`                                                                       |
| `name`         | `string`           | `"El Salvador"`                                                            |
| `iso2`         | `string`           | `"SV"`                                                                     |
| `iso3`         | `string`           | `"SLV"`                                                                    |
| `numericCode`  | `string`           | `"222"`                                                                    |
| `phoneCode`    | `string`           | `"+503"`                                                                   |
| `capital`      | `string`           | `"San Salvador"`                                                           |
| `tld`          | `string`           | `".sv"`                                                                    |
| `timezones`    | `object`           | `{ zoneName: "America/El_Salvador", … }`                                   |
| `latlng`       | `[string, string]` | `["13.83", "-88.91"]`                                                      |
| `emoji`        | `[string, string]` | `["🇸🇻", "U+1F1F8 U+1F1FB"]`                                                |
| `languages`    | `object`           | `{ "spa": "Spanish" }`                                                     |
| `flag`         | `string`           | `"🇸🇻"`                                                                     |
| `flags`        | `object`           | `{ png: "…", svg: "…" }`                                                   |
| `maps`         | `object`           | `{ googleMaps: "…", openStreetMaps: "…" }`                                 |
| `coatOfArms`   | `object`           | `{ png: "…", svg: "…" }`                                                   |
| `currency`     | `string`           | `"USD"` _(optional — when present)_                                        |
| `translations` | `object`           | `{ "es": "El Salvador", "fr": "Le Salvador" }` _(optional — when present)_ |

#### 🌍 Timezones

```json
{
	"name": "El Salvador",
	"timezones": {
		"zoneName": "America/El_Salvador",
		"gmtOffset": -21600,
		"gmtOffsetName": "UTC-06:00",
		"abbreviation": "CST",
		"tzName": "Central Standard Time (North America)"
	}
}
```

#### 💰 Currency _(optional field)_

```json
{
	"name": "El Salvador",
	"currency": "USD"
}
```

#### 📞 Phone code

```json
{
	"name": "El Salvador",
	"phoneCode": "+503"
}
```

#### 🌐 Translations _(optional field)_

Country names can optionally include translations keyed by ISO 639-1 language code:

```json
{
	"name": "Germany",
	"translations": {
		"es": "Alemania",
		"fr": "Allemagne",
		"pt": "Alemanha",
		"de": "Deutschland"
	}
}
```

### State properties

| Property       | Type             | Example                                         |
| -------------- | ---------------- | ----------------------------------------------- |
| `id`           | `number`         | `1416`                                          |
| `name`         | `string`         | `"California"`                                  |
| `countryId`    | `number`         | `235`                                           |
| `iso2`         | `string`         | `"CA"`                                          |
| `latitude`     | `string`         | `"36.77826100"`                                 |
| `longitude`    | `string`         | `"-119.41793240"`                               |
| `timezone`     | `string \| null` | `"America/Los_Angeles"`                         |
| `translations` | `object`         | `{ "es": "California", "fr": "Californie", … }` |

### City properties

| Property    | Type     | Example          |
| ----------- | -------- | ---------------- |
| `id`        | `number` | `131`            |
| `name`      | `string` | `"Abbeville"`    |
| `stateId`   | `number` | `113`            |
| `latitude`  | `string` | `"31.57184000"`  |
| `longitude` | `string` | `"-85.25049000"` |

---

## 📦 Data Files

| File                      | Description                                                                                       | Records         |
| ------------------------- | ------------------------------------------------------------------------------------------------- | --------------- |
| `data/countries.json`     | Countries with ISO2/ISO3, phone code, capital, TLD, timezones, coordinates, emoji flag, languages | 250             |
| `data/regions.json`       | World regions                                                                                     | 8               |
| `data/subregions.json`    | Sub-regions linked to a region                                                                    | 27              |
| `data/states.json`        | States / provinces / territories                                                                  | 5,000 +         |
| `data/cities.json`        | Cities with coordinates (full flat file)                                                          | 150,000 +       |
| `data/cities/{ISO2}.json` | Per-country city files — one file per country                                                     | 150,000 + total |
| `data/languages.json`     | Languages with ISO codes                                                                          | 23              |

### Use the data directly

```js
const countries = require('./data/countries.json');
const states = require('./data/states.json');

// Per-country cities (lightweight – loads only one country at a time)
const svCities = require('./data/cities/SV.json');
```

---

## 🛠 Scripts

### Run the demo

Serve the repository root with any static server, e.g.:

```bash
npx serve .
# then open http://localhost:3000/demo/index.html
```

### Validate data files

```bash
npm run validate
```

Note: validation uses the per-country files in data/cities/. The flat data/cities.json
file is optional and not required for validation.

### Re-generate per-country city files

```bash
npm run split-cities
```

---

## 🌐 Language Support

The **names** of countries, states and cities in this database are provided in **English only**.
Full multilingual translation of 150 000+ place names is outside the scope of this dataset.

What the package **does** include is language _metadata_:

- `data/languages.json` - list of 23 languages with ISO 639-1 codes (`en`, `es`, `fr`, ...)
- Each country record includes a `languages` field that maps ISO 639-3 codes to language names
  spoken in that country.

```js
const {
	getLanguages,
	getCountryByIso2,
	getCountriesByLanguage,
} = require('countries-states-cities-database');

// List all supported language codes
const langs = getLanguages();
// [{ name: "English", iso: "en" }, { name: "Spanish", iso: "es" }, …]

// Languages spoken in Mexico
const mx = getCountryByIso2('MX');
console.log(mx.languages);
// { spa: "Spanish" }

// All English-speaking countries (~91 countries)
const englishSpeaking = getCountriesByLanguage('eng'); // by ISO 639-3
// or: getCountriesByLanguage('en')                     // by ISO 639-1
// or: getCountriesByLanguage('English')                // by name
console.log(englishSpeaking.map((c) => c.name));
// ["American Samoa", "Anguilla", "Australia", "Belize", "Canada", "United States", …]
```

If your application needs localised place names, you can use the `id` / `iso2` / `iso3` fields
from this dataset as keys to look up translations in a third-party i18n library or your own
translation files.

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first for major changes.

---

## 📄 License

[MIT](LICENSE)
