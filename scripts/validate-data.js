#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const FILES = [
	'countries.json',
	'regions.json',
	'subregions.json',
	'states.json',
	'languages.json',
];

let hasErrors = false;
const loaded = {};

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

	// Check for duplicate ids
	const ids = data.map((r) => r.id).filter((id) => id !== undefined);
	const seenIds = new Set();
	const duplicateIds = [];
	ids.forEach((id) => {
		if (seenIds.has(id)) duplicateIds.push(id);
		else seenIds.add(id);
	});
	if (duplicateIds.length > 0) {
		console.error(
			`❌  data/${file}: duplicate id(s) found: ${duplicateIds.slice(0, 5).join(', ')}${duplicateIds.length > 5 ? ` … and ${duplicateIds.length - 5} more` : ''}`,
		);
		hasErrors = true;
	}

	// Check for empty names
	const emptyNames = data.reduce((acc, r, index) => {
		if (
			r.name === undefined ||
			r.name === null ||
			typeof r.name !== 'string' ||
			r.name.trim() === ''
		)
			acc.push(index);
		return acc;
	}, []);
	if (emptyNames.length > 0) {
		console.error(
			`❌  data/${file}: empty name at index(es): ${emptyNames.slice(0, 5).join(', ')}${emptyNames.length > 5 ? ` … and ${emptyNames.length - 5} more` : ''}`,
		);
		hasErrors = true;
	}

	if (duplicateIds.length === 0 && emptyNames.length === 0) {
		console.log(`✅  data/${file} — ${data.length} records`);
	}

	loaded[file] = data;
});

if (hasErrors) {
	console.error('\nValidation failed.');
	process.exit(1);
}

// Build id sets for relational checks
console.log('\n— Checking relational integrity —');

function buildIdSet(file) {
	return new Set((loaded[file] || []).map((r) => r.id));
}

function checkRelation(childFile, foreignKey, parentFile) {
	const children = loaded[childFile] || [];
	const parentIds = buildIdSet(parentFile);
	const broken = [];

	children.forEach((record, index) => {
		if (record[foreignKey] === undefined || record[foreignKey] === null) {
			broken.push(`index ${index}: missing ${foreignKey}`);
		} else if (!parentIds.has(record[foreignKey])) {
			broken.push(
				`index ${index} (${record.name}): ${foreignKey}=${record[foreignKey]} not found in ${parentFile}`,
			);
		}
	});

	if (broken.length > 0) {
		console.error(
			`❌  data/${childFile} → data/${parentFile} (${foreignKey}): ${broken.length} broken reference(s)`,
		);
		broken.slice(0, 5).forEach((msg) => console.error(`     • ${msg}`));
		if (broken.length > 5) console.error(`     … and ${broken.length - 5} more`);
		hasErrors = true;
	} else {
		console.log(`✅  data/${childFile} → data/${parentFile} (${foreignKey}): all references valid`);
	}
}

checkRelation('subregions.json', 'regionId', 'regions.json');
checkRelation('countries.json', 'subRegionId', 'subregions.json');
checkRelation('states.json', 'countryId', 'countries.json');

// Validate per-country city files in data/cities/
console.log('\n— Checking data/cities/ directory —');
const CITIES_DIR = path.join(DATA_DIR, 'cities');
if (!fs.existsSync(CITIES_DIR)) {
	console.warn('⚠️  data/cities/ directory not found. Run: node scripts/split-cities.js');
} else {
	const cityFiles = fs.readdirSync(CITIES_DIR).filter((f) => f.endsWith('.json'));
	const stateIds = buildIdSet('states.json');
	let cityFileErrors = 0;
	let totalCities = 0;

	const cityStateIdMissing = [];
	const cityStateIdInvalid = [];

	function getCityStateId(city) {
		if (city.stateId !== undefined && city.stateId !== null) return city.stateId;
		if (city.state_id !== undefined && city.state_id !== null) return city.state_id;
		return undefined;
	}

	for (const file of cityFiles) {
		const filePath = path.join(CITIES_DIR, file);
		let data;
		try {
			data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		} catch (err) {
			console.error(`❌  data/cities/${file}: invalid JSON — ${err.message}`);
			hasErrors = true;
			cityFileErrors++;
			continue;
		}
		if (!Array.isArray(data)) {
			console.error(`❌  data/cities/${file} must contain a JSON array`);
			hasErrors = true;
			cityFileErrors++;
			continue;
		}
		const broken = [];
		data.forEach((c) => {
			const stateId = getCityStateId(c);
			if (stateId === undefined) {
				broken.push(`id=${c.id} stateId=undefined`);
				cityStateIdMissing.push({ id: c.id, file });
				return;
			}
			if (!stateIds.has(stateId)) {
				broken.push(`id=${c.id} stateId=${stateId}`);
				cityStateIdInvalid.push({ id: c.id, file, stateId });
			}
		});
		if (broken.length > 0) {
			console.error(`❌  data/cities/${file}: ${broken.length} city/cities with invalid stateId`);
			broken.slice(0, 3).forEach((msg) => console.error(`     • ${msg}`));
			hasErrors = true;
			cityFileErrors++;
		}
		totalCities += data.length;
	}

	if (cityFileErrors === 0) {
		console.log(
			`✅  data/cities/ — ${cityFiles.length} country files, ${totalCities} cities total`,
		);
	} else {
		console.error(`❌  data/cities/ — ${cityFileErrors} file(s) with issues`);
	}
}

if (hasErrors) {
	console.error('\nValidation failed.');
	process.exit(1);
} else {
	console.log('\nAll data files are valid. ✔');
}
