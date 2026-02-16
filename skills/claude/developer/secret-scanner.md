---
name: secret-scanner
description: Detect hardcoded secrets, API keys, and credentials in code and configuration files
personas: [Developer, DevSecOps]
---

# Secret Scanner

Scans source code, configuration files, and repository contents for hardcoded secrets, API keys, credentials, tokens, and other sensitive data that should not be committed to version control. Use this skill during code review, pre-commit checks, repository audits, or whenever you need to verify that a codebase does not contain exposed secrets.

## Input

The user provides one or more of the following:

- Source code files (any language)
- Configuration files (.env, YAML, JSON, TOML, XML, .properties, etc.)
- Docker/container files (Dockerfile, docker-compose.yml)
- CI/CD pipeline files (.github/workflows/*.yml, .gitlab-ci.yml, Jenkinsfile, etc.)
- Infrastructure-as-code files (Terraform, CloudFormation, Pulumi, etc.)
- A description of files to scan or a repository structure

Optionally, the user may specify:

- Known false positives to ignore (e.g., "the value `example_key` in tests is a placeholder")
- Specific secret types to focus on

### Example input

```
Scan this project for hardcoded secrets:

// config.js
const config = {
  db_host: "prod-db.example.com",
  db_password: "Pr0d_P@ssw0rd!2024",
  stripe_key: "sk_live_4eC39HqLyjWDarjtT1zdp7dc",
  jwt_secret: "my-jwt-secret-do-not-change"
};

// .env (committed to repo)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

## Output

A structured scan report containing:

1. **Summary** -- Total findings, severity breakdown, and overall assessment.
2. **Findings Table** -- Each finding includes:
   - **ID** -- Sequential identifier (e.g., S-01)
   - **Severity** -- Critical / High / Medium / Low
   - **Secret Type** -- Category of the detected secret
   - **Location** -- File and line number
   - **Confidence** -- High / Medium / Low (how certain the detection is)
   - **Value Preview** -- First and last 4 characters with masking (e.g., `sk_l...7dc`)
   - **Remediation** -- How to fix this specific finding
3. **Remediation Plan** -- Steps to rotate exposed secrets and prevent recurrence.
4. **Prevention Recommendations** -- Tooling and process improvements.

### Severity Definitions

| Severity | Criteria |
|----------|----------|
| Critical | Production credentials, payment API keys, cloud provider keys with broad access |
| High | API keys for external services, database passwords, JWT signing keys |
| Medium | Internal service tokens, development/staging credentials that could lead to lateral movement |
| Low | Test/example credentials that appear to be placeholders, low-privilege tokens |

## Instructions

You are a security engineer performing a secrets audit. Follow these rules precisely:

### 1. Detection Patterns

Scan for the following categories of secrets:

**Cloud Provider Keys:**
- AWS Access Key IDs (pattern: `AKIA[0-9A-Z]{16}`)
- AWS Secret Access Keys (40-character base64 strings near AWS context)
- GCP service account keys (JSON with `"type": "service_account"`)
- Azure connection strings, storage keys, SAS tokens

**API Keys and Tokens:**
- Stripe keys (`sk_live_`, `sk_test_`, `pk_live_`, `pk_test_`, `rk_live_`, `rk_test_`)
- SendGrid (`SG.` followed by base64)
- Twilio (`SK` followed by 32 hex characters)
- Slack tokens (`xoxb-`, `xoxp-`, `xoxo-`, `xapp-`)
- GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`)
- GitLab tokens (`glpat-`)
- npm tokens (`npm_`)
- PyPI tokens (`pypi-`)
- Generic Bearer tokens in headers

**Cryptographic Secrets:**
- Private keys (RSA, EC, DSA, Ed25519 -- detect `-----BEGIN ... PRIVATE KEY-----`)
- JWT signing secrets (look for `jwt`, `secret`, `signing` in variable names with string values)
- Encryption keys and initialization vectors

**Database Credentials:**
- Connection strings with embedded passwords (e.g., `postgresql://user:pass@host/db`)
- Password fields in config files
- MongoDB connection strings with credentials

**Other:**
- OAuth client secrets
- SMTP passwords
- Webhook secrets
- SSH keys and passphrases
- Password fields in any configuration format

### 2. Confidence Assessment

Rate each finding's confidence:

- **High**: The value matches a known secret format (e.g., `AKIA` prefix, `sk_live_` prefix, PEM-formatted key) and is in a relevant context.
- **Medium**: The value appears to be a secret based on variable name and value characteristics (e.g., `password = "something-complex"`) but does not match a known format.
- **Low**: The value might be a secret but could also be a placeholder, example, or false positive (e.g., `password = "changeme"`, values in test files, documentation examples).

### 3. Value Handling

- NEVER reproduce the full secret value in the output. Always mask the middle characters.
- Show format: first 4 characters + `...` + last 4 characters (e.g., `AKIA...MPLE`).
- For short secrets (under 12 characters), show only the first 2 and last 2 characters.
- For private keys, show only the header line (e.g., `-----BEGIN RSA PRIVATE KEY-----`) and note the approximate key length.

### 4. Context Analysis

- Check variable names, comments, and surrounding code for context clues.
- Distinguish between secrets in production config vs. test fixtures vs. documentation.
- Note if a secret is in a file that should be gitignored (e.g., `.env`, `*.pem`).
- Check if the repository has a `.gitignore` that excludes secret-bearing files.

### 5. Remediation Specificity

For each finding, provide:
- The immediate fix (how to remove the secret from code)
- The rotation step (how to invalidate the exposed secret with the specific provider)
- The prevention step (how to store this type of secret going forward)

### 6. False Positive Handling

- If a value is clearly a placeholder (e.g., `YOUR_API_KEY_HERE`, `changeme`, `TODO`, `xxx`), classify it as Low severity and note it is likely a placeholder.
- If a value appears in a test file and is obviously fake, note the low confidence.
- Still report placeholders if they are in production configuration files, as they indicate missing secret management.

## Examples

### Example 1: Node.js Project Scan

**Input:**

```javascript
// src/config/database.js
module.exports = {
  production: {
    host: "prod-db-cluster.us-east-1.rds.amazonaws.com",
    port: 5432,
    username: "app_user",
    password: "K8s#Prod$ecret_2024!",
    database: "ecommerce_prod"
  }
};

// src/services/email.js
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey("SG.abCdEfGhIjKlMnOp.QrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz1234");

// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = "super-secret-jwt-key-do-not-share-2024";

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
}

// .env (committed to repository)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_SECRET_KEY=sk_live_51HG4eC39HqLyjWDarjtT1zdp7dc

// docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: "DevP@ss123"
  redis:
    image: redis:7
    command: redis-server --requirepass "R3dis$ecret"

// tests/auth.test.js
const TEST_JWT_SECRET = "test-secret-not-real";
```

**Output:**

## Summary

Scanned 5 files in a Node.js project. Found **8 secrets** across production configuration, application code, environment files, and container configuration.

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 3 |
| Medium | 2 |
| Low | 0 |

**Overall Assessment:** This codebase has multiple hardcoded production secrets that require immediate rotation and remediation. The `.env` file is committed to the repository, and secrets are embedded directly in source code with no secret management in place.

## Findings

| ID | Severity | Secret Type | Location | Confidence | Value Preview | Remediation |
|----|----------|-------------|----------|------------|---------------|-------------|
| S-01 | Critical | AWS Access Key | .env:1 | High | `AKIA...MPLE` | Deactivate this key in AWS IAM console immediately. Generate a new key pair and store in AWS Secrets Manager or SSM Parameter Store. Remove `.env` from version control. |
| S-02 | Critical | AWS Secret Key | .env:2 | High | `wJal...EKEY` | This key is paired with S-01. Deactivating the access key invalidates both. Review CloudTrail logs for unauthorized usage since the key was committed. |
| S-03 | Critical | Stripe Live Secret Key | .env:3 | High | `sk_l...7dc` | Roll the key in the Stripe Dashboard under Developers > API Keys. Update the new key in your secret manager. The `sk_live_` prefix confirms this is a production key with full API access. |
| S-04 | High | Database Password | src/config/database.js:5 | High | `K8s#...24!` | Change the PostgreSQL password immediately. Move to environment variable: `password: process.env.DB_PASSWORD`. |
| S-05 | High | SendGrid API Key | src/services/email.js:2 | High | `SG.a...234` | Revoke this key in SendGrid under Settings > API Keys. Generate a new restricted key with minimum required permissions. Load via `process.env.SENDGRID_API_KEY`. |
| S-06 | High | JWT Signing Secret | src/middleware/auth.js:2 | Medium | `supe...024` | Rotate immediately: generate a new cryptographically random secret (min 256 bits). Existing sessions will be invalidated. Store in environment variable: `process.env.JWT_SECRET`. |
| S-07 | Medium | PostgreSQL Password | docker-compose.yml:5 | High | `DevP...123` | Move to `.env` file (excluded from git): `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}`. Even for development, avoid committed passwords. |
| S-08 | Medium | Redis Password | docker-compose.yml:8 | High | `R3di...ret` | Same approach as S-07. Use `--requirepass ${REDIS_PASSWORD}` with environment variable substitution. |

**Note:** `tests/auth.test.js` contains `TEST_JWT_SECRET = "test-secret-not-real"`. This is a test placeholder and is not flagged as a finding, but ensure it is never used in production code paths.

## Remediation Plan

### Immediate Actions (Today)

1. **Rotate all Critical secrets:**
   - Deactivate AWS access key `AKIA...MPLE` in IAM. Check CloudTrail for unauthorized use.
   - Roll the Stripe live key in the Stripe Dashboard.
   - Change the production database password and update connection configuration.

2. **Remove secrets from repository history:**
   ```bash
   # Add .env to .gitignore
   echo ".env" >> .gitignore

   # Use git-filter-repo or BFG Repo Cleaner to purge secrets from history
   # WARNING: This rewrites history and requires force-push
   bfg --replace-text secrets.txt  # where secrets.txt contains the literal values
   git reflog expire --expire=now --all && git gc --prune=now
   ```

3. **Move all secrets to environment variables or a secret manager.**

### Prevention Recommendations

1. **Add a `.gitignore` entry** for `.env`, `*.pem`, `*.key`, and other secret-bearing files.
2. **Install pre-commit hooks** to catch secrets before they are committed:
   - [git-secrets](https://github.com/awslabs/git-secrets)
   - [detect-secrets](https://github.com/Yelp/detect-secrets)
   - [truffleHog](https://github.com/trufflesecurity/trufflehog)
3. **Use a secret manager** in production (AWS Secrets Manager, HashiCorp Vault, Doppler).
4. **Enable GitHub secret scanning** (or equivalent) on the repository.
5. **Conduct regular audits** of the codebase using automated secret scanning in CI/CD.

## Edge Cases & Guardrails

- **Encrypted or encoded secrets**: If a value appears to be base64-encoded or encrypted, note it as a finding with Medium confidence and recommend verifying whether it is a secret or ciphertext.
- **Environment variable references**: Values like `process.env.SECRET` or `${SECRET}` are NOT findings -- they indicate proper secret management. Do not flag them.
- **Documentation and comments**: If a secret-like pattern appears in a comment or documentation string, flag it with Low confidence and note the context.
- **Test files**: Secrets in test files are lower severity unless they point to real services. Note the context and recommend using environment variables even in tests.
- **Binary files**: This skill operates on text files. If the user mentions binary files, note that binary scanning requires specialized tools (e.g., truffleHog with `--entropy` flag).
- **Never output full secrets**: Always mask values as described in the instructions. If the user asks you to show the full value, decline and explain that reproducing secrets increases exposure risk.
- **Git history**: Note that removing a secret from the current code does not remove it from git history. Always recommend history rewriting for Critical and High findings.
- **Scope**: Only scan what is provided. Do not assume the existence of files not shown. If the scan appears incomplete (e.g., only 1-2 files from a large project), note that a comprehensive scan requires all files.
