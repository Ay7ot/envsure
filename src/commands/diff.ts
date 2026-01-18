import chalk from 'chalk';
import { parseEnvFile, fileExists } from '../parser.js';
import { header, error, info, list, outputJSON, code, symbols } from '../utils/output.js';
import type { DiffOptions, DiffResult } from '../types.js';

/**
 * Diff command - compares two .env files
 */
export function diffCommand(fileA: string, fileB: string, options: DiffOptions): void {
  // Check if files exist
  if (!fileExists(fileA)) {
    error(`File not found: ${code(fileA)}`);
    process.exit(1);
  }

  if (!fileExists(fileB)) {
    error(`File not found: ${code(fileB)}`);
    process.exit(1);
  }

  // Parse both files
  const parsedA = parseEnvFile(fileA);
  const parsedB = parseEnvFile(fileB);

  // Check for parse errors
  for (const [parsed, path] of [[parsedA, fileA], [parsedB, fileB]] as const) {
    if (parsed.errors.some(e => e.type === 'error')) {
      error(`Failed to parse ${code(path)}`);
      parsed.errors.filter(e => e.type === 'error').forEach(e => {
        console.log(`  Line ${e.line}: ${e.message}`);
      });
      process.exit(1);
    }
  }

  const keysA = new Set(parsedA.variables.keys());
  const keysB = new Set(parsedB.variables.keys());

  // Build result
  const result: DiffResult = {
    onlyInA: [],
    onlyInB: [],
    valueDifferences: [],
  };

  // Find variables only in A
  for (const key of keysA) {
    if (!keysB.has(key)) {
      result.onlyInA.push(key);
    }
  }

  // Find variables only in B
  for (const key of keysB) {
    if (!keysA.has(key)) {
      result.onlyInB.push(key);
    }
  }

  // Find value differences (if requested)
  if (options.values) {
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

  // Output results
  if (options.json) {
    outputJSON(result);
  } else {
    printDiffResults(result, fileA, fileB, options);
  }

  // Exit with code 1 if there are differences
  const hasDifferences = result.onlyInA.length > 0 || result.onlyInB.length > 0 || result.valueDifferences.length > 0;
  process.exit(hasDifferences ? 1 : 0);
}

function printDiffResults(result: DiffResult, fileA: string, fileB: string, options: DiffOptions): void {
  header(`Comparing ${chalk.cyan(fileA)} and ${chalk.cyan(fileB)}`);

  const hasDifferences = result.onlyInA.length > 0 || result.onlyInB.length > 0 || result.valueDifferences.length > 0;

  if (!hasDifferences) {
    console.log(`${symbols.success} ${chalk.green('Files are identical')}`);
    return;
  }

  // Variables only in file A
  if (result.onlyInA.length > 0) {
    console.log(`${symbols.arrow} ${chalk.cyan(`Only in ${fileA}:`)} ${chalk.dim(`(${result.onlyInA.length})`)}`);
    list(result.onlyInA.map(k => chalk.red(`- ${k}`)));
    console.log();
  }

  // Variables only in file B
  if (result.onlyInB.length > 0) {
    console.log(`${symbols.arrow} ${chalk.cyan(`Only in ${fileB}:`)} ${chalk.dim(`(${result.onlyInB.length})`)}`);
    list(result.onlyInB.map(k => chalk.green(`+ ${k}`)));
    console.log();
  }

  // Value differences
  if (options.values && result.valueDifferences.length > 0) {
    console.log(`${symbols.arrow} ${chalk.cyan('Value differences:')} ${chalk.dim(`(${result.valueDifferences.length})`)}`);
    console.log();
    for (const { key, valueA, valueB } of result.valueDifferences) {
      console.log(`  ${chalk.bold(key)}`);
      console.log(`    ${chalk.red(`- ${maskSensitive(key, valueA)}`)}`);
      console.log(`    ${chalk.green(`+ ${maskSensitive(key, valueB)}`)}`);
      console.log();
    }
  }

  // Summary
  console.log();
  const parts: string[] = [];
  if (result.onlyInA.length > 0) parts.push(`${result.onlyInA.length} only in ${fileA}`);
  if (result.onlyInB.length > 0) parts.push(`${result.onlyInB.length} only in ${fileB}`);
  if (result.valueDifferences.length > 0) parts.push(`${result.valueDifferences.length} different values`);
  
  info(`Differences: ${parts.join(', ')}`);
}

/**
 * Mask potentially sensitive values (passwords, keys, secrets)
 */
function maskSensitive(key: string, value: string): string {
  const sensitivePatterns = ['password', 'secret', 'key', 'token', 'auth', 'credential', 'private'];
  const lowerKey = key.toLowerCase();
  
  if (sensitivePatterns.some(pattern => lowerKey.includes(pattern))) {
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '*'.repeat(Math.min(value.length - 4, 20)) + value.substring(value.length - 2);
  }
  
  return value;
}
