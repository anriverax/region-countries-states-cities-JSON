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

## 🧪 Testing Locally (without publishing)

You can test this package in another local project **without** publishing it to npm by using either `npm link` or `npm pack`.

### Option 1 — `npm link` (live symlink)

1. In this repository's root, register the package globally:

   ```bash
   npm link
   ```

2. In the project where you want to consume it, link to the registered package:

   ```bash
   cd /path/to/your-project
   npm link countries-states-cities-database
   ```

3. Now you can import the data just as you would from a published package:

   ```js
   const countries = require('countries-states-cities-database/data/countries.json');
   ```

4. When you're done, unlink from both sides:

   ```bash
   # inside your-project
   npm unlink countries-states-cities-database

   # inside this repository
   npm unlink
   ```

### Option 2 — `npm pack` (install a local tarball)

1. From this repository's root, create a tarball:

   ```bash
   npm pack
   # produces countries-states-cities-database-1.0.0.tgz
   ```

2. In the project where you want to test it, install the tarball:

   ```bash
   cd /path/to/your-project
   npm install /path/to/countries-states-cities-database-1.0.0.tgz
   ```

3. Use it exactly as you would the published version:

   ```js
   const countries = require('countries-states-cities-database/data/countries.json');
   ```

### Option 3 — `file:` dependency (install from local path)

Add the package directly from the filesystem in your project's `package.json`:

```json
{
  "dependencies": {
    "countries-states-cities-database": "file:/path/to/countries-states-cities-database"
  }
}
```

Then run:

```bash
npm install
```

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first for major changes.

---

## 📄 License

[MIT](LICENSE)