import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseEnvFile, inferType, findCaseMismatches } from '../parser.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper to create temp files for testing
function createTempFile(content: string): string {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(filePath, content);
  return filePath;
}

function cleanupTempFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('parseEnvFile', () => {
  it('should parse simple key=value pairs', () => {
    const content = `DATABASE_URL=postgres://localhost:5432/myapp
API_KEY=secret123
PORT=3000`;
    const filePath = createTempFile(content);
    
    try {
      const result = parseEnvFile(filePath);
      
      assert.strictEqual(result.variables.size, 3);
      assert.strictEqual(result.variables.get('DATABASE_URL')?.value, 'postgres://localhost:5432/myapp');
      assert.strictEqual(result.variables.get('API_KEY')?.value, 'secret123');
      assert.strictEqual(result.variables.get('PORT')?.value, '3000');
      assert.strictEqual(result.errors.length, 0);
    } finally {
      cleanupTempFile(filePath);
    }
  });

  it('should handle quoted values', () => {
    const content = `MESSAGE="Hello World"
SINGLE='Single quoted'
ESCAPED="Value with \\"quotes\\""`;
    const filePath = createTempFile(content);
    
    try {
      const result = parseEnvFile(filePath);
      
      assert.strictEqual(result.variables.get('MESSAGE')?.value, 'Hello World');
      assert.strictEqual(result.variables.get('MESSAGE')?.hasQuotes, true);
      assert.strictEqual(result.variables.get('SINGLE')?.value, 'Single quoted');
      assert.strictEqual(result.variables.get('ESCAPED')?.value, 'Value with "quotes"');
    } finally {
      cleanupTempFile(filePath);
    }
  });

  it('should extract comments', () => {
    const content = `# This is a database connection string
# It should be a valid PostgreSQL URL
DATABASE_URL=postgres://localhost:5432/myapp

# API configuration
API_KEY=secret`;
    const filePath = createTempFile(content);
    
    try {
      const result = parseEnvFile(filePath);
      
      const dbVar = result.variables.get('DATABASE_URL');
      assert.strictEqual(dbVar?.comments.length, 2);
      assert.strictEqual(dbVar?.comments[0], 'This is a database connection string');
      assert.strictEqual(dbVar?.comments[1], 'It should be a valid PostgreSQL URL');
      
      const apiVar = result.variables.get('API_KEY');
      assert.strictEqual(apiVar?.comments.length, 1);
      assert.strictEqual(apiVar?.comments[0], 'API configuration');
    } finally {
      cleanupTempFile(filePath);
    }
  });

  it('should detect duplicate keys', () => {
    const content = `API_KEY=first
DATABASE_URL=postgres://localhost
API_KEY=second`;
    const filePath = createTempFile(content);
    
    try {
      const result = parseEnvFile(filePath);
      
      assert.strictEqual(result.duplicates.length, 1);
      assert.strictEqual(result.duplicates[0].key, 'API_KEY');
      assert.deepStrictEqual(result.duplicates[0].lines, [1, 3]);
      // Last value wins
      assert.strictEqual(result.variables.get('API_KEY')?.value, 'second');
    } finally {
      cleanupTempFile(filePath);
    }
  });

  it('should handle empty values', () => {
    const content = `EMPTY_VAR=
ANOTHER_EMPTY=`;
    const filePath = createTempFile(content);
    
    try {
      const result = parseEnvFile(filePath);
      
      assert.strictEqual(result.variables.get('EMPTY_VAR')?.value, '');
      assert.strictEqual(result.variables.get('ANOTHER_EMPTY')?.value, '');
    } finally {
      cleanupTempFile(filePath);
    }
  });

  it('should detect whitespace issues in key names', () => {
    const content = ` LEADING_SPACE=value
TRAILING_SPACE =value`;
    const filePath = createTempFile(content);
    
    try {
      const result = parseEnvFile(filePath);
      
      const whitespaceWarnings = result.errors.filter(e => 
        e.message.includes('Whitespace')
      );
      assert.strictEqual(whitespaceWarnings.length, 2);
    } finally {
      cleanupTempFile(filePath);
    }
  });

  it('should handle inline comments in unquoted values', () => {
    const content = `PORT=3000 # default port
DEBUG=true # enable debugging`;
    const filePath = createTempFile(content);
    
    try {
      const result = parseEnvFile(filePath);
      
      assert.strictEqual(result.variables.get('PORT')?.value, '3000');
      assert.strictEqual(result.variables.get('DEBUG')?.value, 'true');
    } finally {
      cleanupTempFile(filePath);
    }
  });

  it('should return error for non-existent file', () => {
    const result = parseEnvFile('/non/existent/path/.env');
    
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0].type, 'error');
    assert.ok(result.errors[0].message.includes('File not found'));
  });

  it('should handle empty lines correctly', () => {
    const content = `VAR1=value1

VAR2=value2


VAR3=value3`;
    const filePath = createTempFile(content);
    
    try {
      const result = parseEnvFile(filePath);
      
      assert.strictEqual(result.variables.size, 3);
    } finally {
      cleanupTempFile(filePath);
    }
  });
});

describe('inferType', () => {
  it('should detect boolean values', () => {
    assert.strictEqual(inferType('true'), 'boolean');
    assert.strictEqual(inferType('false'), 'boolean');
  });

  it('should detect integer values', () => {
    assert.strictEqual(inferType('42'), 'integer');
    assert.strictEqual(inferType('-10'), 'integer');
    assert.strictEqual(inferType('0'), 'integer');
  });

  it('should detect number values', () => {
    assert.strictEqual(inferType('3.14'), 'number');
    assert.strictEqual(inferType('-2.5'), 'number');
  });

  it('should detect URL values', () => {
    assert.strictEqual(inferType('https://example.com'), 'url');
    assert.strictEqual(inferType('http://localhost:3000'), 'url');
  });

  it('should detect email values', () => {
    assert.strictEqual(inferType('user@example.com'), 'email');
  });

  it('should detect IP address values', () => {
    assert.strictEqual(inferType('192.168.1.1'), 'ip address');
    assert.strictEqual(inferType('127.0.0.1'), 'ip address');
  });

  it('should detect connection strings', () => {
    assert.strictEqual(inferType('postgres://user:pass@localhost:5432/db'), 'connection string');
    assert.strictEqual(inferType('redis://localhost:6379'), 'connection string');
  });

  it('should default to string for unknown types', () => {
    assert.strictEqual(inferType('some random text'), 'string');
    assert.strictEqual(inferType('API_KEY_12345'), 'string');
  });

  it('should detect empty values', () => {
    assert.strictEqual(inferType(''), 'empty');
  });
});

describe('findCaseMismatches', () => {
  it('should find case mismatches', () => {
    const keysA = ['DB_URL', 'api_key', 'Port'];
    const keysB = ['db_url', 'API_KEY', 'PORT'];
    
    const mismatches = findCaseMismatches(keysA, keysB);
    
    assert.strictEqual(mismatches.length, 3);
  });

  it('should not report exact matches', () => {
    const keysA = ['DATABASE_URL', 'API_KEY'];
    const keysB = ['DATABASE_URL', 'API_KEY'];
    
    const mismatches = findCaseMismatches(keysA, keysB);
    
    assert.strictEqual(mismatches.length, 0);
  });

  it('should handle empty arrays', () => {
    assert.deepStrictEqual(findCaseMismatches([], ['KEY']), []);
    assert.deepStrictEqual(findCaseMismatches(['KEY'], []), []);
    assert.deepStrictEqual(findCaseMismatches([], []), []);
  });
});
