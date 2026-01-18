import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseEnvFile, findCaseMismatches } from '../parser.js';
import type { CheckResult, DiffResult } from '../types.js';

// Test directory setup
let testDir: string;

function setupTestDir(): void {
    testDir = path.join(os.tmpdir(), `envsure-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
}

function cleanupTestDir(): void {
    if (testDir && fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
}

function writeTestFile(filename: string, content: string): string {
    const filePath = path.join(testDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
}

// Simulate check command logic
function runCheck(envPath: string, examplePath: string): CheckResult {
    const exampleParsed = parseEnvFile(examplePath);
    const envParsed = parseEnvFile(envPath);

    const exampleKeys = Array.from(exampleParsed.variables.keys());
    const envKeys = Array.from(envParsed.variables.keys());

    const result: CheckResult = {
        missing: [],
        empty: [],
        extra: [],
        caseMismatches: [],
        duplicates: [],
        whitespaceIssues: [],
        errors: 0,
        warnings: 0,
    };

    // Check for case mismatches first (to exclude from missing/extra)
    const caseMismatches = findCaseMismatches(envKeys, exampleKeys);
    const caseMismatchEnvKeys = new Set(caseMismatches.map(m => m.keyA));
    const caseMismatchExampleKeys = new Set(caseMismatches.map(m => m.keyB));

    for (const { keyA, keyB } of caseMismatches) {
        result.caseMismatches.push({ envKey: keyA, exampleKey: keyB });
        result.errors++;
    }

    // Check for missing variables (excluding case mismatches)
    for (const key of exampleKeys) {
        if (!envParsed.variables.has(key) && !caseMismatchExampleKeys.has(key)) {
            result.missing.push(key);
            result.errors++;
        }
    }

    // Check for empty values
    for (const key of exampleKeys) {
        const envVar = envParsed.variables.get(key);
        if (envVar && envVar.value === '') {
            result.empty.push(key);
            result.warnings++;
        }
    }

    // Check for extra variables (excluding case mismatches)
    for (const key of envKeys) {
        if (!exampleParsed.variables.has(key) && !caseMismatchEnvKeys.has(key)) {
            result.extra.push(key);
            result.warnings++;
        }
    }

    // Check for duplicates
    for (const dup of envParsed.duplicates) {
        result.duplicates.push(dup);
        result.warnings++;
    }

    return result;
}

// Simulate diff command logic
function runDiff(fileA: string, fileB: string, showValues: boolean = false): DiffResult {
    const parsedA = parseEnvFile(fileA);
    const parsedB = parseEnvFile(fileB);

    const keysA = new Set(parsedA.variables.keys());
    const keysB = new Set(parsedB.variables.keys());

    const result: DiffResult = {
        onlyInA: [],
        onlyInB: [],
        valueDifferences: [],
    };

    for (const key of keysA) {
        if (!keysB.has(key)) {
            result.onlyInA.push(key);
        }
    }

    for (const key of keysB) {
        if (!keysA.has(key)) {
            result.onlyInB.push(key);
        }
    }

    if (showValues) {
        for (const key of keysA) {
            if (keysB.has(key)) {
                const valueA = parsedA.variables.get(key)!.value;
                const valueB = parsedB.variables.get(key)!.value;
                if (valueA !== valueB) {
                    result.valueDifferences.push({ key, valueA, valueB });
                }
            }
        }
    }

    return result;
}

describe('Check Command Logic', () => {
    beforeEach(() => setupTestDir());
    afterEach(() => cleanupTestDir());

    it('should detect missing variables', () => {
        const examplePath = writeTestFile('.env.example', `DATABASE_URL=postgres://localhost
API_KEY=your-key
SECRET=your-secret`);

        const envPath = writeTestFile('.env', `DATABASE_URL=postgres://localhost
API_KEY=actual-key`);

        const result = runCheck(envPath, examplePath);

        assert.deepStrictEqual(result.missing, ['SECRET']);
        assert.strictEqual(result.errors, 1);
    });

    it('should detect empty values', () => {
        const examplePath = writeTestFile('.env.example', `DATABASE_URL=postgres://localhost
API_KEY=your-key`);

        const envPath = writeTestFile('.env', `DATABASE_URL=postgres://localhost
API_KEY=`);

        const result = runCheck(envPath, examplePath);

        assert.deepStrictEqual(result.empty, ['API_KEY']);
        assert.strictEqual(result.warnings, 1);
    });

    it('should detect extra variables', () => {
        const examplePath = writeTestFile('.env.example', `DATABASE_URL=postgres://localhost`);

        const envPath = writeTestFile('.env', `DATABASE_URL=postgres://localhost
DEBUG=true
EXTRA_VAR=value`);

        const result = runCheck(envPath, examplePath);

        assert.deepStrictEqual(result.extra.sort(), ['DEBUG', 'EXTRA_VAR'].sort());
        assert.strictEqual(result.warnings, 2);
    });

    it('should detect case mismatches', () => {
        const examplePath = writeTestFile('.env.example', `DATABASE_URL=postgres://localhost
API_KEY=your-key`);

        const envPath = writeTestFile('.env', `database_url=postgres://localhost
api_key=actual-key`);

        const result = runCheck(envPath, examplePath);

        assert.strictEqual(result.caseMismatches.length, 2);
        assert.strictEqual(result.errors, 2);
    });

    it('should detect duplicate keys', () => {
        const examplePath = writeTestFile('.env.example', `API_KEY=your-key`);

        const envPath = writeTestFile('.env', `API_KEY=first
API_KEY=second`);

        const result = runCheck(envPath, examplePath);

        assert.strictEqual(result.duplicates.length, 1);
        assert.strictEqual(result.duplicates[0].key, 'API_KEY');
    });

    it('should pass when env matches example exactly', () => {
        const examplePath = writeTestFile('.env.example', `DATABASE_URL=postgres://localhost
API_KEY=your-key
PORT=3000`);

        const envPath = writeTestFile('.env', `DATABASE_URL=postgres://localhost
API_KEY=actual-key
PORT=3000`);

        const result = runCheck(envPath, examplePath);

        assert.strictEqual(result.errors, 0);
        assert.strictEqual(result.warnings, 0);
        assert.strictEqual(result.missing.length, 0);
        assert.strictEqual(result.extra.length, 0);
    });
});

describe('Diff Command Logic', () => {
    beforeEach(() => setupTestDir());
    afterEach(() => cleanupTestDir());

    it('should find variables only in file A', () => {
        const fileA = writeTestFile('.env.prod', `DATABASE_URL=postgres://prod
API_KEY=prod-key
SENTRY_DSN=https://sentry.io`);

        const fileB = writeTestFile('.env.staging', `DATABASE_URL=postgres://staging
API_KEY=staging-key`);

        const result = runDiff(fileA, fileB);

        assert.deepStrictEqual(result.onlyInA, ['SENTRY_DSN']);
    });

    it('should find variables only in file B', () => {
        const fileA = writeTestFile('.env.prod', `DATABASE_URL=postgres://prod`);

        const fileB = writeTestFile('.env.staging', `DATABASE_URL=postgres://staging
DEBUG_MODE=true`);

        const result = runDiff(fileA, fileB);

        assert.deepStrictEqual(result.onlyInB, ['DEBUG_MODE']);
    });

    it('should find value differences when enabled', () => {
        const fileA = writeTestFile('.env.prod', `DATABASE_URL=postgres://prod
PORT=8080`);

        const fileB = writeTestFile('.env.staging', `DATABASE_URL=postgres://staging
PORT=3000`);

        const result = runDiff(fileA, fileB, true);

        assert.strictEqual(result.valueDifferences.length, 2);

        const dbDiff = result.valueDifferences.find(d => d.key === 'DATABASE_URL');
        assert.strictEqual(dbDiff?.valueA, 'postgres://prod');
        assert.strictEqual(dbDiff?.valueB, 'postgres://staging');
    });

    it('should not show value differences when disabled', () => {
        const fileA = writeTestFile('.env.prod', `DATABASE_URL=postgres://prod`);
        const fileB = writeTestFile('.env.staging', `DATABASE_URL=postgres://staging`);

        const result = runDiff(fileA, fileB, false);

        assert.strictEqual(result.valueDifferences.length, 0);
    });

    it('should report no differences for identical files', () => {
        const content = `DATABASE_URL=postgres://localhost
API_KEY=secret`;

        const fileA = writeTestFile('.env.a', content);
        const fileB = writeTestFile('.env.b', content);

        const result = runDiff(fileA, fileB, true);

        assert.strictEqual(result.onlyInA.length, 0);
        assert.strictEqual(result.onlyInB.length, 0);
        assert.strictEqual(result.valueDifferences.length, 0);
    });
});
