#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const FILES = [
  'countries.json',
  'regions.json',
  'subregions.json',
  'states.json',
  'cities.json',
  'languages.json',
];

let hasErrors = false;

FILES.forEach((file) => {
  const filePath = path.join(DATA_DIR, file);

  if (!fs.existsSync(filePath)) {
    console.error(`❌  Missing file: data/${file}`);
    hasErrors = true;
    return;
  }

  let data;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`❌  Invalid JSON in data/${file}: ${err.message}`);
    hasErrors = true;
    return;
  }

  if (!Array.isArray(data)) {
    console.error(`❌  data/${file} must contain a JSON array`);
    hasErrors = true;
    return;
  }

  console.log(`✅  data/${file} — ${data.length} records`);
});

if (hasErrors) {
  console.error('\nValidation failed.');
  process.exit(1);
} else {
  console.log('\nAll data files are valid. ✔');
}
