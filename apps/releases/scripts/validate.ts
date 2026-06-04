#!/usr/bin/env tsx
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import { validateCompatList } from './lib/rules.js';
import { buildVersionIndex, loadAllReleaseFiles, SCHEMA_PATH } from './lib/utils.js';
import { formatAjvErrors, validateReleaseIdentity } from './lib/helpers.js';

const strict = process.argv.includes('--strict');

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

const files = loadAllReleaseFiles();
if (files.length === 0) {
  console.error('No release YAML files found under content/');
  process.exit(1);
}

const versionIndex = buildVersionIndex(files);

const errors: string[] = [];
const warnings: string[] = [];

for (const { stream, version, filePath, data } of files) {
  errors.push(...validateReleaseIdentity(filePath, stream, version, data));

  if (!validateSchema(data)) {
    errors.push(`${filePath}: JSON Schema validation failed:`);
    errors.push(...formatAjvErrors(validateSchema.errors).map((line) => `  ${line}`));
    continue;
  }

  const compatResult = validateCompatList(filePath, stream, data.compat, versionIndex);
  errors.push(...compatResult.errors);
  warnings.push(...compatResult.warnings);
}

if (warnings.length) {
  console.warn('\nWarnings:');
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}

if (errors.length) {
  console.error('\nValidation failed:');
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}

if (strict && warnings.length) {
  console.error('\n--strict: treating warnings as errors.');
  process.exit(1);
}

console.log(`Validated ${files.length} release file(s).`);
