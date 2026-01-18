import { Command } from 'commander';
import chalk from 'chalk';
import { checkCommand } from './commands/check.js';
import { diffCommand } from './commands/diff.js';
import { explainCommand } from './commands/explain.js';

const program = new Command();

program
  .name('envsure')
  .description('A lightweight CLI tool for validating and comparing .env files')
  .version('1.0.0');

// Global options
program
  .option('--strict', 'Treat warnings as errors')
  .option('--json', 'Output results as machine-readable JSON')
  .option('--no-color', 'Disable colored output');

// Handle --no-color globally
program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    chalk.level = 0;
  }
});

// Check command
program
  .command('check')
  .description('Validate environment consistency in the current directory')
  .option('-e, --env <file>', 'Path to .env file', '.env')
  .option('-x, --example <file>', 'Path to .env.example file', '.env.example')
  .action((options) => {
    const globalOpts = program.opts();
    checkCommand({ ...options, ...globalOpts });
  });

// Diff command
program
  .command('diff <fileA> <fileB>')
  .description('Compare two .env files and highlight differences')
  .option('-v, --values', 'Show value differences for common variables')
  .action((fileA: string, fileB: string, options) => {
    const globalOpts = program.opts();
    diffCommand(fileA, fileB, { ...options, ...globalOpts });
  });

// Explain command
program
  .command('explain <varName>')
  .description('Explain an environment variable using comments from .env.example')
  .option('-x, --example <file>', 'Path to .env.example file', '.env.example')
  .action((varName: string, options) => {
    const globalOpts = program.opts();
    explainCommand(varName, { ...options, ...globalOpts });
  });

program.parse();
