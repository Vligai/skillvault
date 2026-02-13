# Security Skills for Claude

Use these guidelines whenever you write, review, or refactor code. Prioritize security by default in all outputs.

---

## Core Principles

1. **Never trust user input** — Validate, sanitize, and parameterize all external data.
2. **Least privilege** — Run with minimal permissions; require only what's needed.
3. **Defense in depth** — Use multiple layers of protection, not a single control.
4. **Fail secure** — Default to deny; explicit allow over implicit.
5. **Never hardcode secrets** — Use environment variables, vaults, or secure config.

---

## Input Handling

### Validation

- Validate **all** input: type, length, format, and allowed characters.
- Reject invalid input; do not attempt to "fix" or sanitize malicious payloads.
- Use allowlists (whitelists) over blocklists (blacklists).
- Validate on both client and server; client-side validation can be bypassed.

### Injection Prevention

| Attack type | Mitigation |
|------------|------------|
| SQL injection | Parameterized queries / prepared statements only |
| Command injection | Avoid shell execution; use APIs or safe libraries |
| XSS | Encode output context (HTML, JS, URL, CSS); use CSP |
| LDAP / NoSQL injection | Parameterized queries; strict input validation |
| Path traversal | Validate paths; avoid user input in file operations |

---

## Authentication & Authorization

- **Authentication**: Verify identity (passwords, MFA, OAuth).
- **Authorization**: Verify permission to perform an action.
- Use established libraries (e.g., bcrypt/Argon2 for passwords, OAuth2/OIDC for federated auth).
- Enforce strong password policies and rate limiting on auth endpoints.
- Log authentication events (success/failure) for auditing.
- Use session tokens with secure, HttpOnly, SameSite cookies or equivalent secure storage.

---

## Secrets & Sensitive Data

- **Never** commit API keys, passwords, or tokens to version control.
- Store secrets in environment variables, secret managers, or vaults.
- Mask or redact secrets in logs and error messages.
- Use different secrets for development, staging, and production.
- Rotate secrets on compromise or regularly per policy.

---

## Cryptography

- Prefer standard libraries over custom implementations.
- Use strong algorithms: AES-256-GCM, ChaCha20-Poly1305, SHA-256/384, Argon2/bcrypt.
- Avoid: MD5, SHA1 for security, DES, ECB mode, custom crypto.
- Use TLS 1.2+ for transport; avoid SSLv3, TLS 1.0/1.1.

---

## OWASP Top 10 Checklist

When writing or reviewing code, consider:

1. **A01 Broken Access Control** — Is every endpoint/action properly authorized?
2. **A02 Cryptographic Failures** — Are data and secrets protected at rest and in transit?
3. **A03 Injection** — Are all inputs parameterized and validated?
4. **A04 Insecure Design** — Is there threat modeling for risky features?
5. **A05 Security Misconfiguration** — Defaults secure? Debug disabled in prod?
6. **A06 Vulnerable Components** — Are dependencies up to date and scanned?
7. **A07 Auth Failures** — Strong auth, MFA where appropriate, session handling?
8. **A08 Data Integrity** — Are signatures/checksums used where tampering is a risk?
9. **A09 Logging Failures** — Security events logged, sensitive data excluded?
10. **A10 SSRF** — Are outbound requests validated? Internal networks protected?

---

## Error Handling & Logging

- Avoid revealing stack traces, paths, or implementation details to users.
- Log security-relevant events (auth, access, errors) with sufficient context.
- Never log passwords, tokens, or PII in plaintext.
- Use structured logging for analysis and alerting.

---

## Dependencies

- Pin versions in lock files; review updates for security impact.
- Run dependency scanners (e.g., Snyk, Dependabot, npm audit).
- Prefer well-maintained, widely used libraries.
- Remove unused dependencies.

---

## Code Review Focus

- [ ] All user input validated and parameterized
- [ ] No secrets in code or config files
- [ ] Access control enforced on every sensitive action
- [ ] Sensitive operations logged
- [ ] Error messages safe for production
- [ ] Dependencies reviewed for known vulnerabilities

---

## Red Lines

**Never suggest or generate:**

- Hardcoded credentials, API keys, or tokens
- `eval()` or equivalent with user-controlled input
- Disabling security features without explicit justification
- SQL/command string concatenation with user input
- Weak crypto (MD5, DES, ECB)
- Debug mode enabled in production config

---

*Use with Claude projects, custom instructions, or prompt library.*
