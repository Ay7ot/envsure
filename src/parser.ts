import fs from 'fs';
import path from 'path';
import type { EnvVariable, ParsedEnvFile, ParseError } from './types.js';

/**
 * Parse a .env file and extract all variables with their metadata
 */
export function parseEnvFile(filePath: string): ParsedEnvFile {
    const absolutePath = path.resolve(filePath);
    const variables = new Map<string, EnvVariable>();
    const duplicates: Array<{ key: string; lines: number[] }> = [];
    const errors: ParseError[] = [];
    const keyLines = new Map<string, number[]>();

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
        return {
            variables,
            duplicates,
            errors: [{ line: 0, message: `File not found: ${filePath}`, type: 'error' }],
            filePath: absolutePath,
        };
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split('\n');

    let pendingComments: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i];
        const trimmedLine = line.trim();

        // Skip empty lines (but clear pending comments)
        if (trimmedLine === '') {
            pendingComments = [];
            continue;
        }

        // Collect comments
        if (trimmedLine.startsWith('#')) {
            pendingComments.push(trimmedLine.slice(1).trim());
            continue;
        }

        // Parse variable assignment
        const match = line.match(/^([^=]+)=(.*)$/);
        if (!match) {
            // Line has content but isn't a valid assignment
            if (trimmedLine !== '') {
                errors.push({
                    line: lineNumber,
                    message: `Invalid syntax: "${trimmedLine.substring(0, 50)}${trimmedLine.length > 50 ? '...' : ''}"`,
                    type: 'warning',
                });
            }
            pendingComments = [];
            continue;
        }

        const rawKey = match[1];
        const rawValue = match[2];
        const key = rawKey.trim();

        // Check for whitespace issues in key
        if (rawKey !== key) {
            errors.push({
                line: lineNumber,
                message: `Whitespace in variable name: "${rawKey}"`,
                type: 'warning',
            });
        }

        // Parse value (handle quotes and inline comments)
        const { value, hasQuotes, quoteChar } = parseValue(rawValue);

        // Track duplicates
        if (keyLines.has(key)) {
            keyLines.get(key)!.push(lineNumber);
        } else {
            keyLines.set(key, [lineNumber]);
        }

        // Store variable (last occurrence wins for the value)
        variables.set(key, {
            key,
            value,
            line: lineNumber,
            comments: [...pendingComments],
            hasQuotes,
            quoteChar,
        });

        pendingComments = [];
    }

    // Collect duplicates
    for (const [key, lines] of keyLines) {
        if (lines.length > 1) {
            duplicates.push({ key, lines });
            errors.push({
                line: lines[lines.length - 1],
                message: `Duplicate variable: ${key} (also defined on line${lines.length > 2 ? 's' : ''} ${lines.slice(0, -1).join(', ')})`,
                type: 'warning',
            });
        }
    }

    return {
        variables,
        duplicates,
        errors,
        filePath: absolutePath,
    };
}

/**
 * Parse a value, handling quotes and inline comments
 */
function parseValue(rawValue: string): { value: string; hasQuotes: boolean; quoteChar?: '"' | "'" } {
    const trimmed = rawValue.trim();

    // Check for quoted values
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        const quoteChar = trimmed[0] as '"' | "'";
        // Remove quotes and handle escaped quotes inside
        let value = trimmed.slice(1, -1);
        if (quoteChar === '"') {
            value = value.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        }
        return { value, hasQuotes: true, quoteChar };
    }

    // Check for multiline quoted values (incomplete)
    if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
        // Just return as-is for now (multiline values are complex)
        return { value: trimmed, hasQuotes: false };
    }

    // Unquoted value - handle inline comments
    const commentIndex = trimmed.indexOf(' #');
    if (commentIndex !== -1) {
        return { value: trimmed.substring(0, commentIndex).trim(), hasQuotes: false };
    }

    return { value: trimmed, hasQuotes: false };
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
    return fs.existsSync(path.resolve(filePath));
}

/**
 * Infer the type of a value
 */
export function inferType(value: string): string {
    if (value === '') return 'empty';
    if (value === 'true' || value === 'false') return 'boolean';
    if (/^-?\d+$/.test(value)) return 'integer';
    if (/^-?\d+\.\d+$/.test(value)) return 'number';
    if (/^https?:\/\//.test(value)) return 'url';
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return 'email';
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) return 'ip address';
    if (value.includes(':') && value.includes('//')) return 'connection string';
    return 'string';
}

/**
 * Find case mismatches between two sets of keys
 */
export function findCaseMismatches(
    keysA: string[],
    keysB: string[]
): Array<{ keyA: string; keyB: string }> {
    const mismatches: Array<{ keyA: string; keyB: string }> = [];
    const lowerKeysB = new Map(keysB.map((k) => [k.toLowerCase(), k]));

    for (const keyA of keysA) {
        const lowerA = keyA.toLowerCase();
        const matchingKeyB = lowerKeysB.get(lowerA);
        if (matchingKeyB && matchingKeyB !== keyA) {
            mismatches.push({ keyA, keyB: matchingKeyB });
        }
    }

    return mismatches;
}
