# 🌍 Countries States Cities Database

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
├── data
│   ├── countries.json    — All countries with ISO codes, phone codes, timezones, flags …
│   ├── regions.json      — World regions (Africa, Americas, Asia, Europe, Oceania …)
│   ├── subregions.json   — Sub-regions linked to regions
│   ├── states.json       — States / provinces / territories per country
│   ├── cities.json       — Cities per state
│   └── languages.json    — Language list with ISO codes
│
├── types
│   ├── country.ts        — TypeScript interface for a Country record
│   ├── state.ts          — TypeScript interface for a State record
│   └── city.ts           — TypeScript interface for a City record
│
├── scripts
│   └── validate-data.js  — Node.js script to validate all data files
│
├── demo
│   └── index.html        — Browser demo (country → state → cities)
│
├── README.md
└── LICENSE
```

---

## 🚀 Quick Start

### Use the data directly

```js
const countries = require('./data/countries.json');
const states    = require('./data/states.json');
const cities    = require('./data/cities.json');
```

### Run the demo

Serve the repository root with any static server, e.g.:

```bash
npx serve .
# then open http://localhost:3000/demo/index.html
```

### Validate data files

```bash
node scripts/validate-data.js
```

---

## 📦 Data Files

| File | Description | Records |
|---|---|---|
| `data/countries.json` | Countries with ISO2/ISO3, phone code, capital, TLD, timezones, coordinates, emoji flag, languages | 250 |
| `data/regions.json` | World regions | 8 |
| `data/subregions.json` | Sub-regions linked to a region | 22 |
| `data/states.json` | States / provinces / territories | 5,000 + |
| `data/cities.json` | Cities with coordinates | 150,000 + |
| `data/languages.json` | Languages with ISO codes | 100 + |

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first for major changes.

---

## 📄 License

[MIT](LICENSE)