'use strict';

/**
 * Generate shared/data/*.json from the private repo's string XML.
 *
 *   node tools/compile-data.js [--source=<private repo root>]
 *
 * Produces, per language:
 *   shared/data/countries.<lang>.json   [{ value, label, code }]
 *   shared/data/options.<lang>.json     { sfilters: { <fid>: [{value,label}] } }
 *
 * The client binder reads shared/data/<name>.json, so the default language
 * files are also written without a suffix.
 */

const fs = require('fs');
const path = require('path');
const { parseXmlToObject } = require('./xml');

const ROOT = path.join(__dirname, '..');
const LANGS = ['ar', 'en'];

function parseArgs(argv) {
    const args = { source: null };
    for (const arg of argv.slice(2)) {
        if (arg.startsWith('--source=')) args.source = arg.slice(9);
    }
    return args;
}

function readXml(filePath) {
    return parseXmlToObject(fs.readFileSync(filePath, 'utf8'), { preserveAttrs: true });
}

function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}

function attrOf(item, name) {
    if (item && item.$attrs && item.$attrs[name] !== undefined) return item.$attrs[name];
    return undefined;
}

function textOf(item) {
    if (typeof item === 'string') return item;
    if (item && typeof item.$text === 'string') return item.$text;
    return '';
}

function buildCountries(sourceRoot, lang) {
    const file = path.join(sourceRoot, 'v3', 'text', lang, 'countries.xml');
    if (!fs.existsSync(file)) return null;

    const tree = readXml(file);
    const options = asArray(tree.option);
    return options
        .map((opt) => ({
            value: attrOf(opt, 'value'),
            label: attrOf(opt, 'name') || '',
            code: attrOf(opt, 'code') || ''
        }))
        .filter((item) => item.value !== undefined && item.value !== '0');
}

function buildOptions(sourceRoot, lang) {
    const file = path.join(sourceRoot, 'v3', 'text', lang, 'options.xml');
    if (!fs.existsSync(file)) return null;

    const tree = readXml(file);
    const sfilters = tree.sfilters || {};
    const out = { sfilters: {} };

    for (const fid of Object.keys(sfilters)) {
        const group = sfilters[fid];
        const options = asArray(group && group.option);
        out.sfilters[fid] = options
            .map((opt) => ({
                value: attrOf(opt, 'value'),
                label: textOf(opt)
            }))
            .filter((item) => item.value !== undefined && item.value !== '0');
    }
    return out;
}

function compileData(options) {
    const sourceRoot = options.source || path.join(ROOT, '..', 'kobool');
    const outDir = options.outDir || path.join(ROOT, 'shared', 'data');
    fs.mkdirSync(outDir, { recursive: true });

    const report = [];
    for (const lang of LANGS) {
        const countries = buildCountries(sourceRoot, lang);
        if (countries) {
            fs.writeFileSync(path.join(outDir, `countries.${lang}.json`), JSON.stringify(countries), 'utf8');
            report.push({ name: `countries.${lang}`, count: countries.length });
        }

        const opts = buildOptions(sourceRoot, lang);
        if (opts) {
            fs.writeFileSync(path.join(outDir, `options.${lang}.json`), JSON.stringify(opts), 'utf8');
            report.push({ name: `options.${lang}`, count: Object.keys(opts.sfilters).length });
        }
    }

    // Default (unsuffixed) copies for the binder's simple data-options="countries".
    const defaultCountries = path.join(outDir, 'countries.ar.json');
    if (fs.existsSync(defaultCountries)) {
        fs.copyFileSync(defaultCountries, path.join(outDir, 'countries.json'));
    }
    const defaultOptions = path.join(outDir, 'options.ar.json');
    if (fs.existsSync(defaultOptions)) {
        fs.copyFileSync(defaultOptions, path.join(outDir, 'options.json'));
    }

    // Birth years: the original page generated 16..100 years before the current year.
    const currentYear = new Date().getFullYear();
    const birthYears = [];
    for (let age = 16; age <= 100; age++) {
        const year = currentYear - age;
        birthYears.push({ value: String(year), label: String(year) });
    }
    fs.writeFileSync(path.join(outDir, 'birth_years.json'), JSON.stringify(birthYears), 'utf8');
    report.push({ name: 'birth_years', count: birthYears.length });

    return report;
}

if (require.main === module) {
    const report = compileData(parseArgs(process.argv));
    for (const item of report) {
        console.log(`Wrote ${item.name}.json (${item.count} entries)`);
    }
}

module.exports = { compileData, buildCountries, buildOptions, parseArgs };
