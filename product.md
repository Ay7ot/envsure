# Product Doc: envsure

## 1. Overview

**envsure** is a lightweight, opinionated CLI tool for validating and comparing `.env` files.

It helps developers ensure that environment variables are:

* Present
* Consistent
* Non-empty
* Correctly named
* Safe to deploy

envsure focuses strictly on **file-based environment validation**, not runtime inspection, cloud syncing, or secret storage.

---

## 2. Problem Statement

Environment variables are a common source of silent failures.

Typical issues include:

* `.env` and `.env.example` drifting over time
* Production having variables that development does not
* Variables existing but being empty
* Case mismatches (`DB_url` vs `DB_URL`)
* Old variables lingering with no usage

Most tooling either:

* Only loads environment variables
* Is tightly coupled to a framework
* Is part of a larger platform that adds unnecessary complexity

There is no small, focused CLI that treats `.env` files as first-class configuration artifacts.

---

## 3. Goals and Non-Goals

### Goals

* Detect environment variable drift early
* Provide clear, human-readable output
* Work with any project that uses `.env` files
* Run locally with no network access
* Be usable with zero configuration

### Non-Goals

* Managing cloud environments
* Syncing secrets
* Providing dashboards or UIs
* Framework-specific behavior
* Replacing dotenv or similar libraries

---

## 4. Target Users

* Developers working with `.env` files
* Small to mid-sized engineering teams
* Solo developers deploying frequently
* Teams that want safer deploys without extra infrastructure

envsure is language-agnostic and can be used with Node, Python, Go, Ruby, PHP, Docker-based projects, or any workflow that relies on `.env` files.

---

## 5. Core Use Cases

### Use Case 1: Local environment validation

A developer wants to confirm that the local environment is correctly configured before running or deploying an application.

```bash
envsure check
```

---

### Use Case 2: Environment parity check

A developer wants to compare assumptions between two environments, such as development and production.

```bash
envsure diff .env.production .env.example
```

---

### Use Case 3: Environment variable documentation lookup

A developer wants to understand what a variable is for without opening files.

```bash
envsure explain DB_POOL_SIZE
```

---

## 6. Features

### 6.1 `envsure check`

Validates environment consistency in the current directory.

**Behavior**

* Treats `.env.example` as the source of truth
* Compares it against `.env`
* Outputs a clear report

**Checks performed**

* Missing variables
* Empty values
* Extra variables not defined in the example
* Case mismatches
* Duplicate keys
* Leading or trailing whitespace issues

**Exit codes**

* `0` → No issues found
* `1` → Warnings or errors detected

---

### 6.2 `envsure diff <fileA> <fileB>`

Compares two `.env` files and highlights differences.

**Output includes**

* Variables only present in file A
* Variables only present in file B
* Variables present in both but with different values (optional flag)

**Example**

```bash
envsure diff .env.production .env.example
```

---

### 6.3 `envsure explain <VAR_NAME>`

Explains an environment variable using comments from `.env.example`.

**Rules**

* Reads comments directly above the variable
* Supports inline comments
* Does not infer behavior beyond comments

**Example**

```env
# Maximum number of database connections
# Must be a positive integer
DB_POOL_SIZE=10
```

Command:

```bash
envsure explain DB_POOL_SIZE
```

Output:

```
DB_POOL_SIZE
Purpose: Maximum number of database connections
Expected type: number
Example: 10
```

---

## 7. UX Principles

* No configuration files
* No interactive prompts by default
* Clear color-coded output
* Plain, direct language
* Deterministic output suitable for automation

---

## 8. CLI Interface

```bash
envsure <command> [options]
```

### Commands

* `check`
* `diff`
* `explain`

### Global Flags

* `--strict`
  Treat warnings as errors

* `--json`
  Output results as machine-readable JSON

* `--no-color`
  Disable colored output

---

## 9. Technical Design

### Language

* Node.js (ESM)

### Dependencies

* CLI framework: `commander` or `yargs`
* Output styling: `chalk`
* File system access via native Node APIs

### Parsing Strategy

* Line-by-line parsing
* Ignore commented-out variables
* Preserve variable order
* Support quoted and unquoted values
* Do not read from runtime environment variables

---

## 10. Error Handling

* Missing `.env.example` → hard error
* Missing `.env` → warning
* Invalid formatting → explicit error message
* No silent failures

---

## 11. Distribution

envsure is distributed as an npm package.

Global installation:

```bash
npm install -g envsure
```

The tool itself is language-agnostic; Node.js is only required for installation and execution.

---

## 12. Out of Scope (Explicitly)

* Cloud provider integrations
* GitHub Actions
* CI annotations
* Encrypted secret storage
* Framework presets

These are intentionally excluded from v1.

---

## 13. Success Criteria

* Can be implemented in under 48 hours
* Detects real-world env issues in a sample project
* Requires no configuration to be useful
* Produces output a developer can act on immediately

---

## 14. Positioning Statement

envsure is a small CLI that helps developers ensure their environment variables are correct before they ship.

No dashboards.
No magic.
Just fewer broken deploys.