# 🌍 Countries States Cities Database

[![npm](https://img.shields.io/npm/v/countries-states-cities-database)](https://www.npmjs.com/package/countries-states-cities-database)
[![npm downloads](https://img.shields.io/npm/dm/countries-states-cities-database)](https://www.npmjs.com/package/countries-states-cities-database)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An open-source dataset containing countries, states, and cities in JSON format.

**Includes:**
- ✔ 250+ countries
- ✔ 5000+ states
- ✔ 150k+ cities
- ✔ ISO codes
- ✔ Latitude and longitude
- ✔ Regions and subregions

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
│   ├── cities.json       — Cities per state (full flat file)
│   ├── languages.json    — Language list with ISO codes
│   └── cities/           — Per-country city files (split from cities.json)
│       ├── SV.json       — Cities in El Salvador
│       ├── US.json       — Cities in the United States
│       ├── MX.json       — Cities in Mexico
│       └── …             — One file per country (ISO2 code)
│
├── types
│   ├── country.ts        — TypeScript interface for a Country record
│   ├── state.ts          — TypeScript interface for a State record
│   └── city.ts           — TypeScript interface for a City record
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

### Use the helper API (recommended)

```js
const {
  getCountries,
  getStates,
  getRegions,
  getSubregions,
  getLanguages,
  getCountryById,
  getCountryByIso2,
  getStateByCode,
  getStatesOfCountry,
  getStatesOfCountryById,
  getCitiesOfCountry,
  getCitiesOfState,
  searchCity,
} = require('countries-states-cities-database');
```

#### `getCountries()`

Returns the full list of all countries (249 records).

```js
const countries = getCountries();
// [{ id, name, iso2, iso3, phoneCode, capital, timezones, latlng, emoji, … }, …]
```

#### `getCountryById(id)`

Returns the country matching the given numeric ID, or `null` if not found.

```js
const country = getCountryById(101);
// { id: 101, name: "Indonesia", iso2: "ID", … }
```

#### `getCountryByIso2(iso2)`

Returns the country matching the given ISO 3166-1 alpha-2 code, or `null` if not found.

```js
const country = getCountryByIso2('SV');
// { id, name, iso2, iso3, phoneCode, capital, timezones, latlng, emoji, … }
```

#### `getStateByCode(code)`

Returns the state matching the given combined `"<countryIso2>-<stateCode>"` code, or `null` if not found.

```js
const state = getStateByCode('US-CA');
// { id, name, countryId, stateCode, latitude, longitude }
```

#### `getStatesOfCountry(iso2)`

Returns all states/provinces for a given country ISO2 code.

```js
import { getStatesOfCountry } from 'countries-states-cities-database';

const states = getStatesOfCountry('US');
// [{ id, name, countryId, stateCode, latitude, longitude }, …]
```

#### `getStatesOfCountryById(countryId)`

Returns all states/provinces for a given numeric country ID.

```js
const states = getStatesOfCountryById(101);
// [{ id, name, countryId, stateCode, latitude, longitude }, …]
```

#### `getCitiesOfCountry(iso2)`

Returns all cities for a given country ISO2 code (loaded from the per-country file).

```js
const cities = getCitiesOfCountry('MX');
// [{ id, name, stateId, latitude, longitude }, …]
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

Ultra-fast city search engine. Returns all cities whose name contains the query string
(case-insensitive). The city index is built once on the first call and cached in memory.

```js
const results = searchCity('san');
// Each result includes a `countryIso2` field:
// [{ id, name, stateId, latitude, longitude, countryIso2 }, …]
```

### Use the data directly

```js
const countries = require('./data/countries.json');
const states    = require('./data/states.json');
const cities    = require('./data/cities.json');

// Per-country cities (lightweight – loads only one country at a time)
const svCities = require('./data/cities/SV.json');
```

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

### Re-generate per-country city files

```bash
npm run split-cities
```

---

## 🌐 Language Support

The **names** of countries, states and cities in this database are provided in **English only**.
Full multilingual translation of 150 000+ place names is outside the scope of this dataset.

What the package **does** include is language *metadata*:

- `data/languages.json` - list of 22 languages with ISO 639-1 codes (`en`, `es`, `fr`, ...)
- Each country record includes a `languages` field that maps ISO codes to language names spoken
  in that country.

```js
const { getLanguages, getCountryByIso2 } = require('countries-states-cities-database');

// List all 22 supported language codes
const langs = getLanguages();
// [{ name: "English", iso: "en" }, { name: "Spanish", iso: "es" }, …]

// Languages spoken in Mexico
const mx = getCountryByIso2('MX');
console.log(mx.languages);
// { spa: "Spanish" }
```

If your application needs localised place names, you can use the `id` / `iso2` / `iso3` fields
from this dataset as keys to look up translations in a third-party i18n library or your own
translation files.

---

## 📦 Data Files

| File | Description | Records |
|---|---|---|
| `data/countries.json` | Countries with ISO2/ISO3, phone code, capital, TLD, timezones, coordinates, emoji flag, languages | 250 |
| `data/regions.json` | World regions | 8 |
| `data/subregions.json` | Sub-regions linked to a region | 27 |
| `data/states.json` | States / provinces / territories | 5,000 + |
| `data/cities.json` | Cities with coordinates (full flat file) | 150,000 + |
| `data/cities/{ISO2}.json` | Per-country city files — one file per country | 150,000 + total |
| `data/languages.json` | Languages with ISO codes | 22 |

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first for major changes.

---

## 📄 License

[MIT](LICENSE)