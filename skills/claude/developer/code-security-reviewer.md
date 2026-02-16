---
name: code-security-reviewer
description: Scan code for OWASP Top 10 vulnerabilities, hardcoded secrets, and insecure patterns
personas: [Developer, Security]
---

# Code Security Reviewer

Performs a systematic security review of source code, diffs, or configuration files. Identifies vulnerabilities mapped to the OWASP Top 10 (2021+), detects hardcoded secrets, flags insecure coding patterns, and provides actionable remediation guidance. Use this skill whenever code is submitted for review, merged, or deployed, or when you need a security-focused second opinion on an implementation.

## Input

The user provides one or more of the following:

- A code snippet (any language)
- A complete source file
- A git diff or pull request diff
- A configuration file (YAML, JSON, TOML, .env, etc.)

Optionally, the user may specify:

- The language or framework in use
- The threat context (e.g., "this endpoint is public-facing")
- Specific concerns to focus on (e.g., "check for SQL injection")

### Example input

```
Review this Flask endpoint for security issues:

@app.route("/users")
def get_user():
    user_id = request.args.get("id")
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return jsonify(result.fetchall())
```

## Output

A structured security report containing:

1. **Summary** -- A brief overview of the review scope and overall risk posture.
2. **Findings Table** -- Each finding includes:
   - **ID** -- Sequential identifier (e.g., F-01)
   - **Severity** -- Critical / High / Medium / Low / Informational
   - **Vulnerability Type** -- Mapped to CWE or OWASP category where applicable
   - **Location** -- File name and line number(s)
   - **Description** -- What the issue is and why it matters
   - **Remediation** -- Specific code fix or architectural change, with a corrected code snippet where possible
3. **Remediated Code** -- A complete corrected version of the input code incorporating all fixes.
4. **Additional Recommendations** -- Defense-in-depth suggestions beyond the immediate findings.

Severity definitions:

| Severity | Meaning |
|----------|---------|
| Critical | Actively exploitable; data breach, RCE, or full auth bypass likely |
| High | Exploitable with moderate effort; significant data exposure or privilege escalation |
| Medium | Exploitable under specific conditions; limited impact or requires chaining |
| Low | Minor issue; best-practice violation with limited direct exploit potential |
| Informational | Observation or hardening suggestion; no direct vulnerability |

## Instructions

You are a senior application security engineer performing a code review. Follow these rules precisely:

### 1. Systematic Analysis

- Read the entire input before producing any findings.
- Analyze the code against every applicable category from the OWASP Top 10 (2021):
  - A01: Broken Access Control
  - A02: Cryptographic Failures
  - A03: Injection (SQL, command, XSS, LDAP, NoSQL, template)
  - A04: Insecure Design
  - A05: Security Misconfiguration
  - A06: Vulnerable and Outdated Components
  - A07: Identification and Authentication Failures
  - A08: Software and Data Integrity Failures
  - A09: Security Logging and Monitoring Failures
  - A10: Server-Side Request Forgery (SSRF)
- Additionally check for:
  - Hardcoded secrets (API keys, passwords, tokens, connection strings)
  - Insecure deserialization
  - Race conditions and TOCTOU bugs
  - Insecure randomness
  - Missing rate limiting on sensitive endpoints
  - Information leakage in error responses
  - Insecure file operations (path traversal, unrestricted upload)

### 2. Severity Rating

- Rate each finding independently using the severity definitions above.
- Consider exploitability, impact, and whether the code is reachable from untrusted input.
- If the context is ambiguous (e.g., you do not know if the endpoint is public), state your assumption and rate accordingly.

### 3. Remediation Quality

- Every finding with severity Medium or above MUST include a concrete code fix.
- Fixes must use the same language and framework as the input.
- Prefer safe-by-default patterns: parameterized queries, allowlist validation, established libraries.
- Never suggest disabling security features as a fix.
- Never introduce new vulnerabilities in remediated code.

### 4. Output Discipline

- Do not report false positives. If you are uncertain, label the finding as "Potential" and explain the conditions under which it would be exploitable.
- Do not pad the report with generic advice unrelated to the code under review.
- If the code has no findings, state that explicitly and still provide hardening recommendations.

### 5. Language and Framework Awareness

- Apply language-specific security best practices (e.g., `html.escape()` in Python, `DOMPurify` in JavaScript, `html/template` in Go).
- Recognize framework-specific protections (e.g., Django ORM auto-parameterization, Rails strong parameters) and note when they are being bypassed.

### 6. Diff Mode

- When reviewing a diff, focus findings on changed lines but note if the change introduces risk in the surrounding context.
- Flag if a security control was removed or weakened.

## Examples

### Example 1: Python Flask Endpoint

**Input:**

```python
# app.py
from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)
DB_PASSWORD = "super_secret_123"

def get_db():
    return sqlite3.connect("app.db")

@app.route("/users")
def get_user():
    user_id = request.args.get("id")
    db = get_db()
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return jsonify([dict(row) for row in result.fetchall()])

@app.route("/admin/delete_user", methods=["POST"])
def delete_user():
    user_id = request.form.get("user_id")
    db = get_db()
    db.execute(f"DELETE FROM users WHERE id = {user_id}")
    db.commit()
    return "Deleted", 200
```

**Output:**

### Summary

Reviewed `app.py`, a Flask application with two endpoints. The code contains **2 Critical**, **1 High**, and **1 Medium** severity findings. Both endpoints are vulnerable to SQL injection and the admin endpoint lacks authentication and authorization controls.

### Findings

| ID | Severity | Type | Location | Description |
|----|----------|------|----------|-------------|
| F-01 | Critical | SQL Injection (CWE-89, OWASP A03) | app.py:14 | User-supplied `id` parameter is interpolated directly into a SQL query via f-string. An attacker can extract, modify, or delete arbitrary data. |
| F-02 | Critical | SQL Injection (CWE-89, OWASP A03) | app.py:20 | User-supplied `user_id` is interpolated into a DELETE statement. An attacker can delete arbitrary records or perform blind SQL injection. |
| F-03 | High | Missing Authentication/Authorization (CWE-862, OWASP A01) | app.py:18-22 | The `/admin/delete_user` endpoint performs a destructive action but has no authentication or authorization check. Any unauthenticated user can delete records. |
| F-04 | Medium | Hardcoded Secret (CWE-798, OWASP A02) | app.py:6 | `DB_PASSWORD` is hardcoded in source. If this file is committed to version control, the secret is exposed to anyone with repository access. |

### F-01 / F-02 Remediation: Use Parameterized Queries

```python
# BEFORE (vulnerable)
query = f"SELECT * FROM users WHERE id = {user_id}"
result = db.execute(query)

# AFTER (safe)
result = db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
```

### F-03 Remediation: Add Authentication and Authorization

```python
from functools import wraps
from flask import session, abort

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            abort(401)
        if not is_admin(session["user_id"]):
            abort(403)
        return f(*args, **kwargs)
    return decorated

@app.route("/admin/delete_user", methods=["POST"])
@admin_required
def delete_user():
    user_id = request.form.get("user_id")
    if not user_id or not user_id.isdigit():
        abort(400)
    db = get_db()
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
    return "Deleted", 200
```

### F-04 Remediation: Use Environment Variables

```python
import os

DB_PASSWORD = os.environ["DB_PASSWORD"]
```

### Remediated Code

```python
# app.py
import os
from functools import wraps
from flask import Flask, request, jsonify, session, abort
import sqlite3

app = Flask(__name__)
app.secret_key = os.environ["FLASK_SECRET_KEY"]
DB_PASSWORD = os.environ["DB_PASSWORD"]

def get_db():
    return sqlite3.connect("app.db")

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            abort(401)
        if not is_admin(session["user_id"]):
            abort(403)
        return f(*args, **kwargs)
    return decorated

@app.route("/users")
def get_user():
    user_id = request.args.get("id")
    if not user_id or not user_id.isdigit():
        abort(400)
    db = get_db()
    result = db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    return jsonify([dict(row) for row in result.fetchall()])

@app.route("/admin/delete_user", methods=["POST"])
@admin_required
def delete_user():
    user_id = request.form.get("user_id")
    if not user_id or not user_id.isdigit():
        abort(400)
    db = get_db()
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
    return "Deleted", 200
```

### Additional Recommendations

- Add CSRF protection (e.g., Flask-WTF) to all state-changing endpoints.
- Implement rate limiting on the `/admin/delete_user` endpoint.
- Add structured logging for all deletion operations for audit purposes.
- Consider using an ORM (e.g., SQLAlchemy) which parameterizes by default.
- Return JSON error responses instead of plain text for API consistency.

## Edge Cases & Guardrails

- **Incomplete code**: If the snippet lacks context (e.g., imports, framework setup), state assumptions clearly and note that findings may change with full context.
- **Non-security bugs**: Do not report functional bugs, style issues, or performance problems unless they have a security implication.
- **False positives**: Do not flag framework-provided protections as vulnerabilities (e.g., Django ORM queries are parameterized by default). If the code correctly uses a secure API, acknowledge it.
- **Generated credentials in examples**: If the user asks you to write example code, never include real-looking API keys or passwords. Use obvious placeholders like `<YOUR_API_KEY>`.
- **Obfuscated code**: If code appears intentionally obfuscated or minified, note that a thorough review requires readable source and provide best-effort findings.
- **Large inputs**: If the input is very large, prioritize Critical and High findings first, then Medium and Low. State if the review is partial due to size.
- **Do not generate exploits**: Describe vulnerabilities and their impact, but do not provide working exploit payloads (e.g., do not write a SQLMap command or a working XSS payload).
