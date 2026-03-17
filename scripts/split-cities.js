#!/usr/bin/env node
/**
 * Splits data/cities.json into per-country files under data/cities/{ISO2}.json
 * Each file contains all cities belonging to that country.
 *
 * Usage: node scripts/split-cities.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CITIES_DIR = path.join(DATA_DIR, 'cities');

function main() {
  console.log('Loading data files…');

  const countries = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'countries.json'), 'utf8'));
  const states = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'states.json'), 'utf8'));
  const cities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities.json'), 'utf8'));

  // Build map: countryId → iso2
  const countryIso2 = new Map();
  for (const country of countries) {
    countryIso2.set(country.id, country.iso2);
  }

  // Build map: stateId → iso2
  const stateToIso2 = new Map();
  for (const state of states) {
    const iso2 = countryIso2.get(state.countryId);
    if (iso2) {
      stateToIso2.set(state.id, iso2);
    }
  }

  // Group cities by country iso2
  const cityGroups = new Map();
  let skipped = 0;

  for (const city of cities) {
    const iso2 = stateToIso2.get(city.stateId);
    if (!iso2) {
      skipped++;
      continue;
    }
    if (!cityGroups.has(iso2)) {
      cityGroups.set(iso2, []);
    }
    cityGroups.get(iso2).push(city);
  }

  if (skipped > 0) {
    console.warn(`⚠️  ${skipped} cities could not be mapped to a country and were skipped.`);
  }

  // Create output directory
  if (!fs.existsSync(CITIES_DIR)) {
    fs.mkdirSync(CITIES_DIR, { recursive: true });
  }

  // Write per-country files
  let written = 0;
  for (const [iso2, citiesForCountry] of cityGroups) {
    const outPath = path.join(CITIES_DIR, `${iso2}.json`);
    fs.writeFileSync(outPath, JSON.stringify(citiesForCountry, null, 2), 'utf8');
    written++;
  }

  console.log(`✅  Written ${written} country city files to data/cities/`);
  console.log(`    Total cities distributed: ${cities.length - skipped}`);
}

main();
