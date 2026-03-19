const fs = require('fs');
const path = require('path');

const root = process.cwd();
const v1CountriesPath = path.join(root, 'data', 'v1', 'countries.json');
const v2CountriesPath = path.join(root, 'data', 'V2', 'countries.json');
const v1StatesPath = path.join(root, 'data', 'v1', 'states.json');
const dataCountriesPath = path.join(root, 'data', 'countries.json');
const dataStatesPath = path.join(root, 'data', 'states.json');

const v1CitiesDir = path.join(root, 'data', 'v1', 'cities');
const v2CitiesDir = path.join(root, 'data', 'V2', 'cities');
const outCitiesDir = path.join(root, 'data', 'cities');
const outCitiesPath = path.join(root, 'data', 'cities.json');

const v1Countries = JSON.parse(fs.readFileSync(v1CountriesPath, 'utf8'));
const v2Countries = JSON.parse(fs.readFileSync(v2CountriesPath, 'utf8'));
const v1States = JSON.parse(fs.readFileSync(v1StatesPath, 'utf8'));
const dataCountries = JSON.parse(fs.readFileSync(dataCountriesPath, 'utf8'));
const dataStates = JSON.parse(fs.readFileSync(dataStatesPath, 'utf8'));

const v1CountriesById = new Map(v1Countries.map((c) => [c.id, c]));
const v1CountriesByIso2 = new Map(v1Countries.map((c) => [c.iso2, c]));
const v2CountriesByIso2 = new Map(v2Countries.map((c) => [c.iso2, c]));
const dataCountriesByIso2 = new Map(dataCountries.map((c) => [c.iso2, c]));
const dataCountriesById = new Map(dataCountries.map((c) => [c.id, c]));

function normalizeKey(countryId, name, code) {
	const safeName = (name || '').trim().toLowerCase();
	const safeCode = (code || '').trim().toLowerCase();
	return `${countryId}::${safeName}::${safeCode}`;
}

const dataStatesById = new Map(dataStates.map((s) => [s.id, s]));
const dataStatesByKey = new Map();
for (const s of dataStates) {
	dataStatesByKey.set(normalizeKey(s.countryId, s.name, s.iso2), s);
}

const v1StateIdToDataStateId = new Map();
const v1StateMappingMissing = [];

for (const s of v1States) {
	const v1Country = v1CountriesById.get(s.countryId);
	const iso2 = v1Country ? v1Country.iso2 : null;
	const dataCountry = iso2 ? dataCountriesByIso2.get(iso2) : null;
	if (!dataCountry) {
		v1StateMappingMissing.push({ id: s.id, name: s.name, countryId: s.countryId, iso2 });
		continue;
	}
	const key = normalizeKey(dataCountry.id, s.name, s.stateCode);
	const dataState = dataStatesByKey.get(key);
	if (!dataState) {
		v1StateMappingMissing.push({ id: s.id, name: s.name, countryId: s.countryId, iso2 });
		continue;
	}
	v1StateIdToDataStateId.set(s.id, dataState.id);
}

function ensureOutDir() {
	if (!fs.existsSync(outCitiesDir)) {
		fs.mkdirSync(outCitiesDir, { recursive: true });
	}
	const existing = fs.readdirSync(outCitiesDir).filter((f) => f.endsWith('.json'));
	for (const file of existing) {
		fs.unlinkSync(path.join(outCitiesDir, file));
	}
}

function cityKey(stateId, name, lat, lon) {
	const safeName = (name || '').trim().toLowerCase();
	const safeLat = lat == null ? '' : String(lat).trim();
	const safeLon = lon == null ? '' : String(lon).trim();
	return `${stateId}::${safeName}::${safeLat}::${safeLon}`;
}

const outByCountry = new Map();
const keyByCountry = new Map();

function addCity(countryIso2, city) {
	if (!outByCountry.has(countryIso2)) {
		outByCountry.set(countryIso2, []);
		keyByCountry.set(countryIso2, new Set());
	}
	const set = keyByCountry.get(countryIso2);
	const key = cityKey(city.state_id, city.name, city.latitude, city.longitude);
	if (set.has(key)) return false;
	set.add(key);
	outByCountry.get(countryIso2).push(city);
	return true;
}

const v2InvalidState = [];
const v2CountryMismatch = [];
const v1MissingState = [];
let v2CitiesCount = 0;
let v1CitiesCount = 0;
let v1DuplicateCount = 0;

const v2Files = fs.readdirSync(v2CitiesDir).filter((f) => f.endsWith('.json'));
for (const file of v2Files) {
	const cities = JSON.parse(fs.readFileSync(path.join(v2CitiesDir, file), 'utf8'));
	for (const c of cities) {
		v2CitiesCount += 1;
		const stateId = c.state_id ?? c.stateId;
		if (!stateId || !dataStatesById.has(stateId)) {
			v2InvalidState.push({ id: c.id, name: c.name, stateId, file });
			continue;
		}
		const dataState = dataStatesById.get(stateId);
		const dataCountry = dataCountriesById.get(dataState.countryId);
		if (!dataCountry) {
			v2InvalidState.push({ id: c.id, name: c.name, stateId, file });
			continue;
		}
		const countryIso2 = dataCountry.iso2;
		if (c.country_code && c.country_code !== countryIso2) {
			v2CountryMismatch.push({
				id: c.id,
				name: c.name,
				country_code: c.country_code,
				expected: countryIso2,
			});
			continue;
		}
		const normalized = {
			...c,
			state_id: stateId,
			stateId: stateId,
			state_code: dataState.iso2 ?? c.state_code ?? null,
			state_name: dataState.name ?? c.state_name ?? null,
			country_id: dataCountry.id,
			country_code: dataCountry.iso2,
			country_name: dataCountry.name,
		};
		addCity(countryIso2, normalized);
	}
}

const v1Files = fs.readdirSync(v1CitiesDir).filter((f) => f.endsWith('.json'));
for (const file of v1Files) {
	const cities = JSON.parse(fs.readFileSync(path.join(v1CitiesDir, file), 'utf8'));
	for (const c of cities) {
		v1CitiesCount += 1;
		const dataStateId = v1StateIdToDataStateId.get(c.stateId);
		if (!dataStateId) {
			v1MissingState.push({ id: c.id, name: c.name, stateId: c.stateId, file });
			continue;
		}
		const dataState = dataStatesById.get(dataStateId);
		const dataCountry = dataCountriesById.get(dataState.countryId);
		if (!dataCountry) {
			v1MissingState.push({ id: c.id, name: c.name, stateId: c.stateId, file });
			continue;
		}
		const added = addCity(dataCountry.iso2, {
			id: c.id,
			name: c.name,
			state_id: dataStateId,
			stateId: dataStateId,
			state_code: dataState.iso2 ?? null,
			state_name: dataState.name ?? null,
			country_id: dataCountry.id,
			country_code: dataCountry.iso2,
			country_name: dataCountry.name,
			latitude: c.latitude ?? null,
			longitude: c.longitude ?? null,
			native: null,
			type: 'city',
			level: null,
			parent_id: null,
			population: null,
			timezone: null,
			translations: {},
			wikiDataId: null,
		});
		if (!added) v1DuplicateCount += 1;
	}
}

ensureOutDir();

const allCities = [];

for (const [countryIso2, cities] of outByCountry.entries()) {
	const country = dataCountriesByIso2.get(countryIso2);
	if (!country) continue;
	allCities.push(...cities);
}

let nextCityId = 1;
for (const city of allCities) {
	city.id = nextCityId;
	nextCityId += 1;
}

for (const [countryIso2, cities] of outByCountry.entries()) {
	const country = dataCountriesByIso2.get(countryIso2);
	if (!country) continue;
	const filePath = path.join(outCitiesDir, `${countryIso2}.json`);
	fs.writeFileSync(filePath, `${JSON.stringify(cities, null, '\t')}\n`, 'utf8');
}

fs.writeFileSync(outCitiesPath, `${JSON.stringify(allCities, null, '\t')}\n`, 'utf8');

const missingCountriesInV2 = [];
const missingCountriesInV1 = [];

for (const c of v1Countries) {
	if (!v2CountriesByIso2.has(c.iso2)) missingCountriesInV2.push(c.iso2);
}
for (const c of v2Countries) {
	if (!v1CountriesByIso2.has(c.iso2)) missingCountriesInV1.push(c.iso2);
}

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
console.log('Data states:', dataStates.length);
console.log('V1 states missing mapping:', v1StateMappingMissing.length);
console.log('V2 cities files:', v2Files.length, 'V1 cities files:', v1Files.length);
console.log('V2 cities processed:', v2CitiesCount);
console.log('V1 cities processed:', v1CitiesCount);
console.log('V1 duplicate cities skipped:', v1DuplicateCount);
console.log('V2 cities with invalid state:', v2InvalidState.length);
console.log('V2 cities country mismatch:', v2CountryMismatch.length);
console.log('V1 cities missing state mapping:', v1MissingState.length);
console.log('Output country files:', outByCountry.size);
console.log('Output cities total:', allCities.length);

if (v2InvalidState.length > 0) {
	console.log('Sample v2 invalid state:', v2InvalidState.slice(0, 5));
}
if (v2CountryMismatch.length > 0) {
	console.log('Sample v2 country mismatch:', v2CountryMismatch.slice(0, 5));
}
if (v1MissingState.length > 0) {
	console.log('Sample v1 missing state mapping:', v1MissingState.slice(0, 5));
}
