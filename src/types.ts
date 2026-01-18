/**
 * Core types for envsure
 */

export interface EnvVariable {
  key: string;
  value: string;
  line: number;
  comments: string[];
  hasQuotes: boolean;
  quoteChar?: '"' | "'";
}

export interface ParsedEnvFile {
  variables: Map<string, EnvVariable>;
  duplicates: Array<{ key: string; lines: number[] }>;
  errors: ParseError[];
  filePath: string;
}

export interface ParseError {
  line: number;
  message: string;
  type: 'error' | 'warning';
}

export interface CheckResult {
  missing: string[];
  empty: string[];
  extra: string[];
  caseMismatches: Array<{ envKey: string; exampleKey: string }>;
  duplicates: Array<{ key: string; lines: number[] }>;
  whitespaceIssues: Array<{ key: string; issue: string }>;
  errors: number;
  warnings: number;
}

export interface DiffResult {
  onlyInA: string[];
  onlyInB: string[];
  valueDifferences: Array<{ key: string; valueA: string; valueB: string }>;
}

export interface ExplainResult {
  variable: string;
  found: boolean;
  purpose?: string;
  comments?: string[];
  exampleValue?: string;
  inferredType?: string;
}

export interface GlobalOptions {
  strict?: boolean;
  json?: boolean;
  color?: boolean;
}

export interface CheckOptions extends GlobalOptions {
  env?: string;
  example?: string;
}

export interface DiffOptions extends GlobalOptions {
  values?: boolean;
}

export interface ExplainOptions extends GlobalOptions {
  example?: string;
}
