---
name: dependency-auditor
description: Audit dependency manifests for known vulnerabilities and recommend upgrades
personas: [Developer]
---

# Dependency Auditor

Analyzes dependency manifest files (package.json, requirements.txt, go.mod, Gemfile, pom.xml, etc.) to identify packages with known security vulnerabilities. Provides CVE references, severity ratings, affected version ranges, and upgrade recommendations. Use this skill when evaluating a project's dependency health, during security audits, before releases, or when triaging Dependabot/Snyk alerts.

## Input

The user provides one or more dependency manifest files:

- **JavaScript/TypeScript**: `package.json`, `package-lock.json`, `yarn.lock`
- **Python**: `requirements.txt`, `Pipfile`, `Pipfile.lock`, `pyproject.toml`, `setup.py`, `setup.cfg`
- **Go**: `go.mod`, `go.sum`
- **Ruby**: `Gemfile`, `Gemfile.lock`
- **Java/Kotlin**: `pom.xml`, `build.gradle`, `build.gradle.kts`
- **Rust**: `Cargo.toml`, `Cargo.lock`
- **PHP**: `composer.json`, `composer.lock`
- **.NET**: `*.csproj`, `packages.config`, `Directory.Packages.props`

Optionally, the user may provide:

- The project type or framework context (e.g., "this is a Next.js app")
- Specific packages they are concerned about
- Constraints (e.g., "we cannot upgrade past Node 18")

### Example input

```json
{
  "name": "my-api",
  "dependencies": {
    "express": "4.17.1",
    "jsonwebtoken": "8.5.1",
    "lodash": "4.17.20",
    "axios": "0.21.1",
    "mongoose": "5.11.15",
    "helmet": "4.6.0"
  },
  "devDependencies": {
    "nodemon": "2.0.7"
  }
}
```

## Output

A structured audit report containing:

1. **Summary** -- Total dependencies scanned, vulnerable count, severity breakdown.
2. **Vulnerability Table** -- Each finding includes:
   - **Package** -- The affected dependency
   - **Installed Version** -- Version from the manifest
   - **Vulnerability** -- CVE ID or advisory ID
   - **Severity** -- Critical / High / Medium / Low
   - **Description** -- Brief description of the vulnerability
   - **Fixed In** -- The minimum version that resolves the issue
   - **Breaking Changes** -- Whether the upgrade is a patch, minor, or major (and likely to break)
3. **Upgrade Plan** -- Prioritized, grouped upgrade recommendations.
4. **Safe Dependencies** -- Notable packages that are current and have no known issues.
5. **General Recommendations** -- Process improvements for dependency management.

## Instructions

You are a senior developer performing a dependency security audit. Follow these rules precisely:

### 1. Vulnerability Identification

- For each dependency, check against your knowledge of known CVEs, security advisories, and vulnerability databases (NVD, GitHub Advisory Database, npm audit, PyPI advisory, RustSec, etc.).
- Report vulnerabilities that affect the specific installed version. Do not report vulnerabilities that only affect versions outside the installed range.
- If you are uncertain whether a CVE applies to the exact version, state that clearly and recommend verification with a live scanner.

### 2. Knowledge Limitations

- Your knowledge has a cutoff date. Always include a disclaimer that the audit is based on your training data and should be supplemented with live scanning tools.
- Recommend specific tools for live verification:
  - JavaScript: `npm audit`, `yarn audit`, Snyk
  - Python: `pip-audit`, `safety`, Snyk
  - Go: `govulncheck`, Snyk
  - Ruby: `bundle-audit`, Snyk
  - Java: OWASP Dependency-Check, Snyk
  - Rust: `cargo-audit`
  - General: Snyk, Dependabot, Trivy

### 3. Severity Rating

Use the standard CVSS-based severity scale:

| Severity | CVSS Score Range |
|----------|-----------------|
| Critical | 9.0 - 10.0 |
| High | 7.0 - 8.9 |
| Medium | 4.0 - 6.9 |
| Low | 0.1 - 3.9 |

When the exact CVSS score is known, include it. Otherwise, use the advisory's stated severity.

### 4. Upgrade Assessment

For each recommended upgrade:
- Indicate whether the fix is a **patch** (x.x.PATCH), **minor** (x.MINOR.x), or **major** (MAJOR.x.x) version bump.
- For major version bumps, note likely breaking changes based on your knowledge of the package.
- Group upgrades into tiers:
  - **Immediate** (Critical/High severity, patch-level fix available)
  - **Soon** (Medium severity or minor-version fix)
  - **Planned** (Low severity or major-version upgrade needed)

### 5. Transitive Dependencies

- If the user provides a lock file, analyze transitive (indirect) dependencies as well.
- If only a manifest file is provided (no lock file), note that transitive vulnerabilities cannot be assessed and recommend generating a lock file.

### 6. Outdated but Not Vulnerable

- If a package is significantly outdated (more than 2 major versions behind) but has no known vulnerability, mention it as an informational note. Outdated packages are more likely to have undiscovered vulnerabilities and may lose security patch support.

### 7. End-of-Life Detection

- Flag packages that are deprecated, unmaintained, or end-of-life (e.g., `request` npm package, Python 2 libraries).
- Recommend actively maintained alternatives where known.

### 8. Output Discipline

- Do not fabricate CVE numbers. If you know a package version has a vulnerability but are not certain of the exact CVE, describe the vulnerability and note that the CVE should be verified.
- Be specific about affected versions and fix versions. Do not say "update to latest" without specifying the version number.
- If a dependency has no known vulnerabilities, do not manufacture findings.

## Examples

### Example 1: Node.js package.json Audit

**Input:**

```json
{
  "name": "my-api",
  "dependencies": {
    "express": "4.17.1",
    "jsonwebtoken": "8.5.1",
    "lodash": "4.17.20",
    "axios": "0.21.1",
    "mongoose": "5.11.15",
    "helmet": "4.6.0"
  },
  "devDependencies": {
    "nodemon": "2.0.7"
  }
}
```

**Output:**

## Summary

Scanned **7 dependencies** (6 production, 1 development). Found **4 packages** with known vulnerabilities spanning **5 advisories**.

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 2 |
| Medium | 1 |
| Low | 1 |

**Disclaimer:** This audit is based on vulnerability data available up to my training cutoff. Run `npm audit` or Snyk for the most current results.

## Vulnerability Findings

| Package | Installed | Vulnerability | Severity | Description | Fixed In | Upgrade Type |
|---------|-----------|--------------|----------|-------------|----------|--------------|
| jsonwebtoken | 8.5.1 | CVE-2022-23529 | Critical (CVSS 9.8) | Improper handling of `secretOrPublicKey` parameter allows remote attackers to execute arbitrary code by providing a malicious object with a crafted `toString()` method. | 9.0.0 | Major |
| axios | 0.21.1 | CVE-2021-3749 | High (CVSS 7.5) | Inefficient regular expression in `trim()` processing allows ReDoS (Regular Expression Denial of Service) via crafted input. | 0.21.2 | Patch |
| axios | 0.21.1 | CVE-2023-45857 | High (CVSS 7.5) | XSRF-TOKEN cookie leaked to third-party hosts when following cross-origin redirects. | 1.6.0 | Major |
| lodash | 4.17.20 | CVE-2021-23337 | Medium (CVSS 6.1) | Prototype pollution via the `template` function when a malicious `variable` option is passed. | 4.17.21 | Patch |
| express | 4.17.1 | CVE-2024-29041 | Low (CVSS 3.7) | Open redirect vulnerability in `res.redirect()` when user-controlled input is passed without validation. | 4.19.2 | Minor |

## Upgrade Plan

### Immediate (This Week)

1. **lodash** `4.17.20` -> `4.17.21` (patch)
   - Risk: Minimal. Patch-level fix with no breaking changes.
   - Command: `npm install lodash@4.17.21`

2. **axios** `0.21.1` -> `0.21.2` (patch, fixes CVE-2021-3749)
   - Risk: Minimal. Patch-level fix.
   - Note: This does NOT fix CVE-2023-45857, which requires a major upgrade (see Planned below).
   - Command: `npm install axios@0.21.2`

### Soon (This Sprint)

3. **express** `4.17.1` -> `4.19.2` (minor)
   - Risk: Low. Minor version bump within the 4.x line. Review the [changelog](https://github.com/expressjs/express/blob/master/History.md) for deprecation notices.
   - Command: `npm install express@4.19.2`

### Planned (Next Sprint)

4. **jsonwebtoken** `8.5.1` -> `9.0.0` (major)
   - Risk: Moderate. Major version bump. Breaking changes include:
     - Requires Node.js 12+.
     - `jwt.verify()` no longer accepts an object as `secretOrPublicKey` without explicit `algorithms` option.
     - Some previously synchronous operations are now async-only.
   - Review the [migration guide](https://github.com/auth0/node-jsonwebtoken/wiki/Migration-Notes:-v8-to-v9) before upgrading.
   - Command: `npm install jsonwebtoken@9.0.0`

5. **axios** `0.21.1` -> `1.6.0+` (major)
   - Risk: Moderate. The 0.x to 1.x upgrade includes breaking changes in request/response interceptors, config defaults, and error handling. Requires integration testing.
   - Command: `npm install axios@1.7.2`

## Safe Dependencies

- **helmet** `4.6.0` -- No known vulnerabilities. Note: Current latest is 7.x; consider upgrading for latest security headers support.
- **mongoose** `5.11.15` -- No known vulnerabilities in this version. Note: Mongoose 5.x is in maintenance mode. Mongoose 7.x/8.x is the active line.
- **nodemon** `2.0.7` (dev) -- No known vulnerabilities. Development-only dependency with minimal security impact.

## General Recommendations

1. **Enable automated scanning**: Configure Dependabot or Snyk in CI to receive automatic alerts and pull requests for vulnerable dependencies.
2. **Pin versions in lock file**: Ensure `package-lock.json` is committed to version control for reproducible builds and transitive dependency auditing.
3. **Schedule regular updates**: Set a monthly cadence for reviewing and updating dependencies, even those without known vulnerabilities.
4. **Evaluate Mongoose upgrade**: Mongoose 5.x is in maintenance mode. Plan a migration to Mongoose 7.x or 8.x for continued security support.
5. **Run the live audit**: `npm audit --production` to check transitive dependencies not visible in this manifest-only review.

## Edge Cases & Guardrails

- **Lock files vs. manifests**: If only a manifest is provided (no lock file), clearly state that transitive dependencies cannot be assessed. The audit covers only direct dependencies.
- **Version ranges**: If the manifest uses version ranges (e.g., `^4.17.1`), note that the actual installed version may differ. Recommend auditing the lock file for precise versions.
- **Private packages**: If the manifest includes private or internal packages (e.g., `@company/internal-lib`), note that these cannot be checked against public vulnerability databases and should be audited separately.
- **Do not fabricate CVEs**: If you are not confident about a specific CVE number, describe the vulnerability generically and recommend verification. Never invent a CVE identifier.
- **Outdated training data**: Always include the disclaimer that your vulnerability knowledge has a cutoff date and live scanners should be used for definitive results.
- **Do not recommend downgrading**: Never suggest downgrading a package to fix a vulnerability. Always recommend upgrading to a fixed version.
- **Dev dependencies**: Still report vulnerabilities in dev dependencies, but note their reduced impact (they do not ship in production). Supply chain attacks via dev dependencies (e.g., malicious postinstall scripts) are still a real risk.
- **Monorepos**: If the user provides multiple manifest files, analyze each independently and note shared dependencies that may need coordinated upgrades.
