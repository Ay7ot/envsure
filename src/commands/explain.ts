import chalk from 'chalk';
import { parseEnvFile, fileExists, inferType } from '../parser.js';
import { header, error, warning, table, outputJSON, code, symbols } from '../utils/output.js';
import type { ExplainOptions, ExplainResult } from '../types.js';

/**
 * Explain command - explains an environment variable using comments
 */
export function explainCommand(varName: string, options: ExplainOptions): void {
  const examplePath = options.example || '.env.example';

  // Check if .env.example exists
  if (!fileExists(examplePath)) {
    error(`File not found: ${code(examplePath)}`);
    process.exit(1);
  }

  // Parse the example file
  const parsed = parseEnvFile(examplePath);

  // Check for parse errors
  if (parsed.errors.some(e => e.type === 'error')) {
    error(`Failed to parse ${code(examplePath)}`);
    parsed.errors.filter(e => e.type === 'error').forEach(e => {
      console.log(`  Line ${e.line}: ${e.message}`);
    });
    process.exit(1);
  }

  // Look for the variable
  const variable = parsed.variables.get(varName);

  // Build result
  const result: ExplainResult = {
    variable: varName,
    found: !!variable,
  };

  if (variable) {
    result.exampleValue = variable.value;
    result.inferredType = inferType(variable.value);
    result.comments = variable.comments;
    
    // Extract purpose from comments (first non-empty comment)
    if (variable.comments.length > 0) {
      result.purpose = variable.comments.join(' ');
    }
  }

  // Output results
  if (options.json) {
    outputJSON(result);
  } else {
    printExplainResult(result, examplePath);
  }

  // Exit with code 1 if variable not found
  process.exit(result.found ? 0 : 1);
}

function printExplainResult(result: ExplainResult, examplePath: string): void {
  if (!result.found) {
    warning(`Variable ${code(result.variable)} not found in ${code(examplePath)}`);
    console.log();
    console.log(chalk.dim('Make sure the variable is defined in your .env.example file.'));
    return;
  }

  header(result.variable);

  const rows: [string, string][] = [];

  // Purpose (from comments)
  if (result.purpose) {
    rows.push(['Purpose', result.purpose]);
  } else {
    rows.push(['Purpose', chalk.dim('No description available')]);
  }

  // Expected type
  if (result.inferredType) {
    rows.push(['Expected type', formatType(result.inferredType)]);
  }

  // Example value
  if (result.exampleValue !== undefined) {
    if (result.exampleValue === '') {
      rows.push(['Example', chalk.dim('(empty)')]);
    } else {
      rows.push(['Example', chalk.cyan(result.exampleValue)]);
    }
  }

  table(rows, 0);

  // Show all comments if there are multiple
  if (result.comments && result.comments.length > 1) {
    console.log();
    console.log(chalk.dim('Documentation:'));
    result.comments.forEach(comment => {
      console.log(`  ${chalk.gray('#')} ${comment}`);
    });
  }
}

function formatType(type: string): string {
  const typeColors: Record<string, (s: string) => string> = {
    'string': chalk.green,
    'integer': chalk.blue,
    'number': chalk.blue,
    'boolean': chalk.magenta,
    'url': chalk.cyan,
    'email': chalk.cyan,
    'ip address': chalk.yellow,
    'connection string': chalk.yellow,
    'empty': chalk.dim,
  };

  const colorFn = typeColors[type] || chalk.white;
  return colorFn(type);
}
