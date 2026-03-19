const fs = require('fs');
const path = require('path');

const root = process.cwd();
const v1CountriesPath = path.join(root, 'data', 'v1', 'countries.json');
const v2CountriesPath = path.join(root, 'data', 'V2', 'countries.json');
const v1StatesPath = path.join(root, 'data', 'v1', 'states.json');
const v2StatesPath = path.join(root, 'data', 'V2', 'states.json');
const dataCountriesPath = path.join(root, 'data', 'countries.json');
const dataStatesPath = path.join(root, 'data', 'states.json');

const v1Countries = JSON.parse(fs.readFileSync(v1CountriesPath, 'utf8'));
const v2Countries = JSON.parse(fs.readFileSync(v2CountriesPath, 'utf8'));
const v1States = JSON.parse(fs.readFileSync(v1StatesPath, 'utf8'));
const v2States = JSON.parse(fs.readFileSync(v2StatesPath, 'utf8'));
const dataCountries = JSON.parse(fs.readFileSync(dataCountriesPath, 'utf8'));

const v1CountriesById = new Map(v1Countries.map((c) => [c.id, c]));
const v1CountriesByIso2 = new Map(v1Countries.map((c) => [c.iso2, c]));
const v2CountriesByIso2 = new Map(v2Countries.map((c) => [c.iso2, c]));
const dataCountriesByIso2 = new Map(dataCountries.map((c) => [c.iso2, c]));
const dataCountriesById = new Map(dataCountries.map((c) => [c.id, c]));

const missingCountriesInV2 = [];
const missingCountriesInV1 = [];

for (const c of v1Countries) {
	if (!v2CountriesByIso2.has(c.iso2)) missingCountriesInV2.push(c.iso2);
}
for (const c of v2Countries) {
	if (!v1CountriesByIso2.has(c.iso2)) missingCountriesInV1.push(c.iso2);
}

function normalizeKey(countryId, name, code) {
	const safeName = (name || '').trim().toLowerCase();
	const safeCode = (code || '').trim().toLowerCase();
	return `${countryId}::${safeName}::${safeCode}`;
}

const v2Keys = new Set();
const v2StatesByKey = new Map();
let maxId = 0;

for (const s of v2States) {
	if (s.id > maxId) maxId = s.id;
	const key = normalizeKey(s.countryId, s.name, s.iso2);
	v2Keys.add(key);
	v2StatesByKey.set(key, s);
}

const v1OnlyStates = [];
const v2OnlyStates = [];
const v1StateKeySet = new Set();

for (const s of v1States) {
	const v1Country = v1CountriesById.get(s.countryId);
	const iso2 = v1Country ? v1Country.iso2 : null;
	const dataCountry = iso2 ? dataCountriesByIso2.get(iso2) : null;
	const mappedCountryId = dataCountry ? dataCountry.id : null;
	const key = normalizeKey(mappedCountryId, s.name, s.stateCode);
	v1StateKeySet.add(key);
	if (!v2Keys.has(key)) {
		v1OnlyStates.push({ state: s, mappedCountryId, countryIso2: iso2 });
	}
}

for (const s of v2States) {
	const key = normalizeKey(s.countryId, s.name, s.iso2);
	if (!v1StateKeySet.has(key)) {
		v2OnlyStates.push(s);
	}
}

const missingCountryForState = [];
const mergedStates = [...v2States];

for (const entry of v1OnlyStates) {
	const s = entry.state;
	if (!entry.mappedCountryId) {
		missingCountryForState.push({
			id: s.id,
			name: s.name,
			countryId: s.countryId,
			iso2: entry.countryIso2,
		});
		continue;
	}

	const key = normalizeKey(entry.mappedCountryId, s.name, s.stateCode);
	if (v2Keys.has(key)) continue;

	maxId += 1;
	mergedStates.push({
		id: maxId,
		name: s.name,
		countryId: entry.mappedCountryId,
		iso2: s.stateCode,
		latitude: s.latitude ?? null,
		longitude: s.longitude ?? null,
		timezone: null,
		translations: {},
	});
	v2Keys.add(key);
}

const invalidCountryIds = [];
for (const s of mergedStates) {
	if (!dataCountriesById.has(s.countryId)) {
		invalidCountryIds.push({ id: s.id, name: s.name, countryId: s.countryId });
	}
}

fs.writeFileSync(dataStatesPath, `${JSON.stringify(mergedStates, null, '\t')}\n`, 'utf8');

console.log('V1 countries:', v1Countries.length);
console.log('V2 countries:', v2Countries.length);
console.log(
	'Missing countries in V2:',
	missingCountriesInV2.length,
	missingCountriesInV2.slice(0, 10),
);
console.log(
	'Missing countries in V1:',
	missingCountriesInV1.length,
	missingCountriesInV1.slice(0, 10),
);
console.log('V1 states:', v1States.length);
console.log('V2 states:', v2States.length);
console.log('V1-only states:', v1OnlyStates.length);
console.log('V2-only states:', v2OnlyStates.length);
console.log('Added states to data/states.json:', mergedStates.length - v2States.length);
console.log('States missing country mapping:', missingCountryForState.length);
if (missingCountryForState.length > 0) {
	console.log('Sample missing country mapping:', missingCountryForState.slice(0, 5));
}
console.log('States with invalid countryId after merge:', invalidCountryIds.length);
if (invalidCountryIds.length > 0) {
	console.log('Sample invalid countryId:', invalidCountryIds.slice(0, 5));
}
