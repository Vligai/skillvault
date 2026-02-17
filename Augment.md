# Security Skills for Augment Code

Apply these guidelines when generating, editing, or reviewing code. Security is a first-class constraint on all suggestions.

*Content aligned with [Claude.md](Claude.md); tailored for Augment Code guidelines format.*

---

## Principles

1. **Zero trust input** — Validate and parameterize all external data.
2. **Least privilege** — Minimal permissions; explicit allow over implicit.
3. **Secrets never in code** — Environment variables, vaults, secure config only.
4. **Fail closed** — Default deny; require explicit authorization.
5. **Defense in depth** — Multiple controls; never rely on a single safeguard.

---

## Input & Injection

### Validation

- Validate **all** input: type, length, format, allowed characters.
- Use allowlists, not blocklists.
- Reject invalid input; do not try to "fix" malicious payloads.
- Validate server-side; client-side alone is insufficient.

### Mitigations by Attack

| Attack | Mitigation |
|--------|------------|
| SQL injection | Parameterized queries / prepared statements only |
| Command injection | Prefer APIs; avoid shelling out with user input |
| XSS | Context-aware encoding; CSP; avoid `dangerouslySetInnerHTML` / `innerHTML` with user content |
| Path traversal | Validate paths; avoid user input in file paths |
| NoSQL injection | Parameterized queries; strict schema validation |

---

## Auth & Access Control

- Distinguish authentication (identity) and authorization (permission).
- Use established auth libraries (bcrypt/Argon2, OAuth2/OIDC).
- Enforce rate limiting on login/registration.
- Log auth events (success/failure).
- Validate authorization on every protected endpoint; never trust client assertions alone.

---

## Secrets

- **Never** suggest hardcoded API keys, passwords, or tokens.
- Use env vars, secret managers, or vaults.
- Redact secrets from logs and error messages.
- Different secrets per environment (dev/stage/prod).

---

## Cryptography

- Prefer standard libraries; avoid custom crypto.
- Use strong algorithms: AES-256-GCM, Argon2/bcrypt, SHA-256.
- Avoid: MD5, SHA1, DES, ECB.
- TLS 1.3 preferred; minimum 1.2. No SSLv3, TLS 1.0/1.1.

---

## OWASP Top 10 Checklist

*OWASP Top 10 2021 base. See [owasp.org/Top10](https://owasp.org/Top10) for 2024+ updates.*

1. **A01 Access Control** — Every sensitive action authorized?
2. **A02 Crypto** — Data and secrets protected at rest and in transit?
3. **A03 Injection** — Inputs parameterized and validated?
4. **A04 Design** — Risky features threat-modeled?
5. **A05 Misconfiguration** — Secure defaults; debug off in prod?
6. **A06 Components** — Dependencies up to date and scanned?
7. **A07 Auth** — Strong auth; MFA where appropriate?
8. **A08 Data Integrity** — Integrity checks where tampering is a risk?
9. **A09 Logging** — Security events logged; no secrets/PII in logs?
10. **A10 SSRF** — Outbound requests validated?

---

## Error Handling & Logging

- Do not expose stack traces, paths, or internals to users.
- Log security-relevant events (auth, access, errors).
- Never log secrets or PII in plaintext.

---

## Dependencies

- Pin versions; prefer lock files.
- Use dependency scanning (Snyk, Dependabot, npm audit).
- Remove unused dependencies.

---

## Code Review Checklist

- [ ] All user input validated and parameterized
- [ ] No secrets in code or committed config
- [ ] Authorization enforced on every sensitive action
- [ ] Sensitive operations logged
- [ ] Error messages production-safe
- [ ] Dependencies checked for CVEs

---

## Never Generate

- Hardcoded credentials, API keys, tokens
- `eval()` or similar with user-controlled input
- Disabling security features without clear justification
- String concatenation for SQL/commands with user input
- Weak crypto (MD5, DES, ECB)
- Debug/profiling enabled in production

---

*Append to `augment-guidelines.md` or place in `augment-skills/` for project-wide use.*
