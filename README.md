# envsure

A lightweight CLI tool for validating and comparing `.env` files.

**Stop shipping broken env files.**

[![npm version](https://img.shields.io/npm/v/envsure.svg)](https://www.npmjs.com/package/envsure)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## Why envsure?

Environment variables are a common source of silent failures:

- `.env` and `.env.example` drifting over time
- Production having variables that development does not
- Variables existing but being empty
- Case mismatches (`DB_url` vs `DB_URL`)
- Old variables lingering with no usage

**envsure** catches these issues before they hit production.

---

## Installation

```bash
npm install -g envsure
```

---

## Quick Start

```bash
# Navigate to your project
cd your-project

# Run the check
envsure check
```

That's it. No configuration needed.

---

## Commands

### `envsure check`

Validates environment consistency by comparing `.env` against `.env.example`.

```bash
envsure check
```

**Checks performed:**
- Missing variables
- Empty values
- Extra variables not defined in the example
- Case mismatches
- Duplicate keys
- Whitespace issues

**Options:**
- `-e, --env <file>` - Path to .env file (default: `.env`)
- `-x, --example <file>` - Path to .env.example file (default: `.env.example`)

**Exit codes:**
- `0` - No issues found
- `1` - Warnings or errors detected

---

### `envsure diff <fileA> <fileB>`

Compares two `.env` files and highlights differences.

```bash
envsure diff .env.production .env.staging
```

**Output includes:**
- Variables only in file A
- Variables only in file B
- Value differences (with `--values` flag)

**Options:**
- `-v, --values` - Show value differences for common variables

---

### `envsure explain <VAR_NAME>`

Explains an environment variable using comments from `.env.example`.

```bash
envsure explain DB_POOL_SIZE
```

**Example `.env.example`:**
```env
# Maximum number of database connections
# Must be a positive integer
DB_POOL_SIZE=10
```

**Output:**
```
DB_POOL_SIZE

Purpose: Maximum number of database connections Must be a positive integer
Expected type: integer
Example: 10
```

**Options:**
- `-x, --example <file>` - Path to .env.example file (default: `.env.example`)

---

## Global Options

These options work with all commands:

| Option | Description |
|--------|-------------|
| `--strict` | Treat warnings as errors |
| `--json` | Output results as machine-readable JSON |
| `--no-color` | Disable colored output |

---

## Examples

### CI/CD Integration

```bash
# In your CI pipeline
envsure check --strict --json
```

### Compare environments

```bash
# See what's different between production and staging
envsure diff .env.production .env.staging --values
```

### Document your variables

```bash
# Get info about a specific variable
envsure explain API_SECRET
```

---

## Philosophy

envsure is intentionally minimal:

- **No configuration files** - works out of the box
- **No network access** - runs entirely locally
- **No framework coupling** - works with any project
- **No magic** - does exactly what you expect

---

## Language Agnostic

envsure works with any project that uses `.env` files:

- Node.js
- Python
- Go
- Ruby
- PHP
- Docker
- And anything else

---

## License

MIT © [Ay7ot](https://github.com/Ay7ot)

---

**No dashboards. No magic. Just fewer broken deploys.**
