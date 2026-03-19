#!/usr/bin/env node
/**
 * Splits city datasets into per-country files.
 *
 * Supported inputs:
 * - data/cities.json -> data/cities/{ISO2}.json
 * - data/V2/cities1.json -> data/V2/cities/{ISO2}.json
 *
 * Usage: node scripts/split-cities.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DATA_DIR = path.join(__dirname, '..', 'data');

const DATASETS = [
  {
    label: 'data',
    baseDir: ROOT_DATA_DIR,
    countriesFile: 'countries.json',
    statesFile: 'states.json',
    citiesFile: 'cities.json',
    outputDir: 'cities',
    cityStateKey: 'stateId'
  },
  {
    label: 'data/V2',
    baseDir: path.join(ROOT_DATA_DIR, 'V2'),
    countriesFile: 'countries.json',
    statesFile: 'states.json',
    citiesFile: 'cities1.json',
    outputDir: 'cities',
    cityCountryKey: 'country_code'
  }
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function clearJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  for (const entry of fs.readdirSync(dirPath)) {
    if (entry.endsWith('.json')) {
      fs.unlinkSync(path.join(dirPath, entry));
    }
  }
}

function buildStateToIso2(countries, states) {
  const countryIso2 = new Map();
  for (const country of countries) {
    countryIso2.set(country.id, country.iso2);
  }

  const stateToIso2 = new Map();
  for (const state of states) {
    const iso2 = countryIso2.get(state.countryId);
    if (iso2) {
      stateToIso2.set(state.id, iso2);
    }
  }

  return stateToIso2;
}

function splitDataset(config) {
  const countriesPath = path.join(config.baseDir, config.countriesFile);
  const statesPath = path.join(config.baseDir, config.statesFile);
  const citiesPath = path.join(config.baseDir, config.citiesFile);

  if (!fs.existsSync(citiesPath)) {
    console.log(`Skipping ${config.label}: ${config.citiesFile} not found.`);
    return null;
  }

  console.log(`Loading ${config.label}...`);

  const countries = readJson(countriesPath);
  const states = fs.existsSync(statesPath) ? readJson(statesPath) : [];
  const cities = readJson(citiesPath);
  const stateToIso2 = config.cityCountryKey ? null : buildStateToIso2(countries, states);

  const cityGroups = new Map();
  let skipped = 0;

  for (const city of cities) {
    const iso2 = config.cityCountryKey
      ? city[config.cityCountryKey]
      : stateToIso2.get(city[config.cityStateKey]);

    if (!iso2) {
      skipped += 1;
      continue;
    }

    if (!cityGroups.has(iso2)) {
      cityGroups.set(iso2, []);
    }

    cityGroups.get(iso2).push(city);
  }

  const outputDir = path.join(config.baseDir, config.outputDir);
  ensureDir(outputDir);
  clearJsonFiles(outputDir);

  let written = 0;
  for (const [iso2, citiesForCountry] of cityGroups) {
    const outPath = path.join(outputDir, `${iso2}.json`);
    fs.writeFileSync(outPath, JSON.stringify(citiesForCountry, null, 2), 'utf8');
    written += 1;
  }

  console.log(`Written ${written} country files to ${config.label}/${config.outputDir}/`);
  console.log(`Total cities distributed: ${cities.length - skipped}`);

  if (skipped > 0) {
    console.warn(`${skipped} cities could not be mapped to a country and were skipped.`);
  }

  return {
    label: config.label,
    written,
    distributed: cities.length - skipped,
    skipped
  };
}

function main() {
  const results = DATASETS.map(splitDataset).filter(Boolean);

  if (results.length === 0) {
    console.error('No supported city datasets were found.');
    process.exitCode = 1;
  }
}

main();