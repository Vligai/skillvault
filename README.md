# SkillVault

*Security skills for AI coding agents.*

A collection of security skills for AI coding agents: Claude, Cursor, and other major platforms. These skills guide agents to follow secure coding practices, prevent common vulnerabilities (OWASP Top 10), and avoid security anti-patterns.

---

## Security Guardrails

| Platform | File | How to Use |
|----------|------|------------|
| **Claude** (Anthropic) | [Claude.md](Claude.md) | Add to Claude projects, custom instructions, or prompt library |
| **Cursor** | [Cursor.md](Cursor.md) | Add to `.cursor/rules/`, `.cursorrules`, or adapt as a Cursor skill |

---

## Skills

Specialized security skill prompts organized by persona. Each skill is a standalone system prompt with structured I/O, detailed instructions, and worked examples.

### Developer Skills

| Skill | Description | File |
|-------|-------------|------|
| **Code Security Reviewer** | Scan code for OWASP Top 10 vulnerabilities, secrets, and insecure patterns | [code-security-reviewer.md](skills/claude/developer/code-security-reviewer.md) |
| **Secret Scanner** | Detect hardcoded secrets, API keys, and credentials in code and config | [secret-scanner.md](skills/claude/developer/secret-scanner.md) |
| **Dependency Auditor** | Audit dependency manifests for known vulnerabilities and suggest upgrades | [dependency-auditor.md](skills/claude/developer/dependency-auditor.md) |
| **Input Validation Generator** | Generate validation schemas and sanitization logic for endpoints and forms | [input-validation-generator.md](skills/claude/developer/input-validation-generator.md) |
| **CI/CD Security Hardener** | Review pipeline configs for secret leaks, injection risks, and excessive permissions | [cicd-security-hardener.md](skills/claude/developer/cicd-security-hardener.md) |

### Security Skills

| Skill | Description | File |
|-------|-------------|------|
| **Threat Model Generator** | Produce structured threat models (STRIDE) from architecture descriptions | [threat-model-generator.md](skills/claude/security/threat-model-generator.md) |
| **Incident Response Playbook Builder** | Generate IR runbooks for specific incident scenarios | [incident-response-playbook-builder.md](skills/claude/security/incident-response-playbook-builder.md) |
| **Hardening Checklist Generator** | Produce CIS-benchmark-style hardening checklists for OS/service/cloud configs | [hardening-checklist-generator.md](skills/claude/security/hardening-checklist-generator.md) |

### Cloud / Infrastructure Skills

| Skill | Description | File |
|-------|-------------|------|
| **IAM Policy Analyzer** | Review AWS/GCP/Azure IAM policies for over-permissive access | [iam-policy-analyzer.md](skills/claude/cloud/iam-policy-analyzer.md) |

### User Skills

| Skill | Description | File |
|-------|-------------|------|
| **Phishing Email Analyzer** | Analyze suspicious emails for phishing indicators and recommend actions | [phishing-email-analyzer.md](skills/claude/user/phishing-email-analyzer.md) |

---

## Project Structure

```
skillvault/
├── Claude.md                  # General security guardrails (Claude)
├── Cursor.md                  # General security guardrails (Cursor)
├── ideation.md                # Roadmap and planned skills by persona
├── README.md
└── skills/
    └── claude/
        ├── developer/         # Developer-focused skills
        ├── security/          # Security professional skills
        ├── cloud/             # Cloud/infrastructure skills
        └── user/              # Non-technical user skills
```

See [ideation.md](ideation.md) for the full roadmap and 40+ planned skills across 5 personas.

---

## Contributing

Contributions welcome. Keep skills concise, actionable, and platform-appropriate. Each skill should follow the [standard template](ideation.md#prioritized-top-10-skills) with Input, Output, Instructions, Examples, and Edge Cases sections.

---

## License

[MIT](LICENSE)
