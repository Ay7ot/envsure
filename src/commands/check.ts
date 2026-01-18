import chalk from 'chalk';
import { parseEnvFile, fileExists, findCaseMismatches } from '../parser.js';
import { header, error, warning, success, info, list, summary, outputJSON, code, symbols } from '../utils/output.js';
import type { CheckOptions, CheckResult } from '../types.js';

/**
 * Check command - validates environment consistency
 */
export function checkCommand(options: CheckOptions): void {
  const envPath = options.env || '.env';
  const examplePath = options.example || '.env.example';

  // Check if .env.example exists (required)
  if (!fileExists(examplePath)) {
    error(`Missing ${code(examplePath)} - this file is required as the source of truth`);
    process.exit(1);
  }

  // Check if .env exists (warning only)
  const envExists = fileExists(envPath);
  if (!envExists) {
    if (options.json) {
      outputJSON({ error: `Missing ${envPath}`, warning: true });
    } else {
      warning(`Missing ${code(envPath)} - nothing to validate`);
    }
    process.exit(options.strict ? 1 : 0);
  }

  // Parse both files
  const exampleParsed = parseEnvFile(examplePath);
  const envParsed = parseEnvFile(envPath);

  // Check for parse errors
  if (exampleParsed.errors.some(e => e.type === 'error')) {
    error(`Failed to parse ${code(examplePath)}`);
    exampleParsed.errors.filter(e => e.type === 'error').forEach(e => {
      console.log(`  Line ${e.line}: ${e.message}`);
    });
    process.exit(1);
  }

  const exampleKeys = Array.from(exampleParsed.variables.keys());
  const envKeys = Array.from(envParsed.variables.keys());

  // Build result
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

  // Check for duplicates in .env
  for (const dup of envParsed.duplicates) {
    result.duplicates.push(dup);
    result.warnings++;
  }

  // Check for whitespace issues
  for (const err of envParsed.errors) {
    if (err.message.includes('Whitespace')) {
      const match = err.message.match(/variable name: "(.+?)"/);
      if (match) {
        result.whitespaceIssues.push({ key: match[1], issue: 'leading/trailing whitespace' });
        result.warnings++;
      }
    }
  }

  // Output results
  if (options.json) {
    outputJSON(result);
  } else {
    printResults(result, envPath, examplePath);
  }

  // Exit with appropriate code
  const hasErrors = result.errors > 0;
  const hasWarnings = result.warnings > 0;
  
  if (hasErrors || (options.strict && hasWarnings)) {
    process.exit(1);
  }
  process.exit(0);
}

function printResults(result: CheckResult, envPath: string, examplePath: string): void {
  header(`Checking ${chalk.cyan(envPath)} against ${chalk.cyan(examplePath)}`);

  let hasPrintedIssue = false;

  // Missing variables (errors)
  if (result.missing.length > 0) {
    hasPrintedIssue = true;
    console.log(`${symbols.error} ${chalk.red('Missing variables:')}`);
    list(result.missing.map(k => chalk.red(k)));
    console.log();
  }

  // Case mismatches (errors)
  if (result.caseMismatches.length > 0) {
    hasPrintedIssue = true;
    console.log(`${symbols.error} ${chalk.red('Case mismatches:')}`);
    list(result.caseMismatches.map(({ envKey, exampleKey }) => 
      `${chalk.red(envKey)} should be ${chalk.green(exampleKey)}`
    ));
    console.log();
  }

  // Empty values (warnings)
  if (result.empty.length > 0) {
    hasPrintedIssue = true;
    console.log(`${symbols.warning} ${chalk.yellow('Empty values:')}`);
    list(result.empty.map(k => chalk.yellow(k)));
    console.log();
  }

  // Extra variables (warnings)
  if (result.extra.length > 0) {
    hasPrintedIssue = true;
    console.log(`${symbols.warning} ${chalk.yellow('Extra variables not in example:')}`);
    list(result.extra.map(k => chalk.yellow(k)));
    console.log();
  }

  // Duplicates (warnings)
  if (result.duplicates.length > 0) {
    hasPrintedIssue = true;
    console.log(`${symbols.warning} ${chalk.yellow('Duplicate variables:')}`);
    list(result.duplicates.map(({ key, lines }) => 
      `${chalk.yellow(key)} defined on lines ${lines.join(', ')}`
    ));
    console.log();
  }

  // Whitespace issues (warnings)
  if (result.whitespaceIssues.length > 0) {
    hasPrintedIssue = true;
    console.log(`${symbols.warning} ${chalk.yellow('Whitespace issues:')}`);
    list(result.whitespaceIssues.map(({ key, issue }) => 
      `${chalk.yellow(key)}: ${issue}`
    ));
    console.log();
  }

  if (!hasPrintedIssue) {
    success('All variables are correctly defined');
  }

  summary(result.errors, result.warnings);
}
