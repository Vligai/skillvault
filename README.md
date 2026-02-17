# SkillVault

[![CI](https://github.com/Vligai/skillvault/actions/workflows/ci.yml/badge.svg)](https://github.com/Vligai/skillvault/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node 18+](https://img.shields.io/badge/node-18+-blue.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)

*Security skills for AI coding agents.*

A collection of security skills for AI coding agents: Claude Code, Cursor, Copilot, Windsurf, Cline, Codex, and other major platforms. These skills guide agents to follow secure coding practices, prevent common vulnerabilities (OWASP Top 10), and avoid security anti-patterns.

---

## Installation

The fastest way to add security skills to your project:

```bash
npx skillvault init
```

This will detect your platform (Claude Code or Cursor), let you pick which skills to install, and copy the files into your project.

### Commands

```bash
npx skillvault init       # Install skills (interactive)
npx skillvault list       # Show installed and available skills
npx skillvault update     # Re-copy installed skills (pick up new versions)
npx skillvault remove     # Uninstall selected skills
```

### Options

```bash
npx skillvault init --all              # Install everything, no prompts
npx skillvault init --claude           # Target Claude Code only
npx skillvault init --cursor           # Target Cursor only
npx skillvault init --no-guardrails    # Skip guardrail files
npx skillvault init --category developer  # Filter by category (repeatable)
npx skillvault init --dry-run          # Preview without writing files
npx skillvault init --json             # Machine-readable JSON output
npx skillvault init --save             # Save selections to .skillvaultrc
npx skillvault remove --all            # Remove all installed skills
npx skillvault update --category security # Update only security skills
```

### `.skillvaultrc` config

Save your selections with `--save` so `skillvault init` is reproducible across team members:

```json
{
  "skills": ["review", "scan-secrets"],
  "platform": "claude",
  "includeGuardrails": true
}
```

### Manual installation

Clone the repo and copy the files you need:

```bash
git clone https://github.com/Vligai/skillvault.git
cp -r skillvault/.claude/commands/ your-project/.claude/commands/
cp skillvault/Claude.md your-project/CLAUDE.md
```

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

## Testing

Tests use the Node.js built-in test runner (`node:test` + `node:assert`) — zero dependencies required.

```bash
npm test
```

Tests run automatically on every push and PR via GitHub Actions across Node 18, 20, and 22.

---

## Project Structure

```
skillvault/
├── Claude.md                  # General security guardrails (Claude)
├── Cursor.md                  # General security guardrails (Cursor)
├── bin/cli.js                 # CLI entry point
├── lib/installer.js           # Core install logic (testable)
├── test/cli.test.js           # Unit tests
├── .github/workflows/ci.yml   # CI pipeline
├── ideation.md                # Roadmap and planned skills by persona
├── README.md
└── skills/
    └── claude/
        ├── developer/         # Developer-focused skills
        ├── security/          # Security professional skills
        ├── cloud/             # Cloud/infrastructure skills
        └── user/              # Non-technical user skills
```

See [ideation.md](ideation.md) for the full skill ideation map with 40+ planned skills across 5 personas.

---

## Roadmap

### More Platforms

SkillVault currently supports Claude Code and Cursor. Planned:

| Platform | Config location | Status |
|----------|----------------|--------|
| **Claude Code** | `.claude/commands/` + `CLAUDE.md` | Shipped |
| **Cursor** | `.cursor/rules/` | Shipped |
| **Windsurf** | `.windsurfrules` | Planned |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Planned |
| **Cline** | `.clinerules` | Planned |
| **Roo Code** | `.roo/rules/` | Planned |
| **Continue** | `.continue/config.yaml` rules | Planned |
| **Codex CLI** | `AGENTS.md` | Planned |
| **Amazon Q Developer** | `.q/rules/` | Planned |
| **Sourcegraph Cody** | `.cody/cody.json` instructions | Planned |
| **JetBrains AI** | `.junie/guidelines.md` | Planned |
| **Tabnine** | `.tabnine/` config | Planned |
| **Aider** | `.aider.conf.yml` conventions | Planned |
| **Augment Code** | `augment-guidelines.md` | Planned |
| **Generic** | `.rules/` (flat markdown) | Planned |

Auto-detection will expand — `skillvault init` will detect any of these and offer the right installer.

### CLI Improvements

| Feature | Description | Status |
|---------|-------------|--------|
| `skillvault list` | Show installed and available skills | Shipped |
| `skillvault update` | Re-copy skills to pick up new versions | Shipped |
| `skillvault remove` | Uninstall selected skills cleanly | Shipped |
| `--category <name>` | Filter by category (repeatable) | Shipped |
| `.skillvaultrc` config | Project-level config for reproducible installs | Shipped |
| `--dry-run` | Preview without writing files | Shipped |
| `--json` | Machine-readable output for CI/scripting | Shipped |

### Community & Ecosystem

| Feature | Description |
|---------|-------------|
| **Skill authoring template** | `skillvault create-skill` scaffolds a new skill with the standard sections (Input, Output, Instructions, Examples, Edge Cases) |
| **Custom skill directories** | Point to a local folder or git repo of custom skills via `.skillvaultrc` |
| **Composable skill packs** | Publish themed skill bundles as npm packages (`@skillvault/devsecops`, `@skillvault/cloud`) that plug into the CLI |
| **Severity profiles** | `--profile strict` vs `--profile standard` — strict adds extra guardrails, blocks more patterns |
| **Team sharing** | `skillvault export` / `skillvault import` to share curated skill sets as portable JSON configs |

### Next Skills (from [ideation.md](ideation.md))

| Skill | Persona | Priority |
|-------|---------|----------|
| Auth Flow Scaffolder | Developer | High |
| Dockerfile Security Linter | Developer | High |
| Detection Rule Generator (Sigma/SPL/KQL) | Security | High |
| IaC Scanner (Terraform/CloudFormation) | Cloud | High |
| SBOM Generator | Developer | Medium |
| CVE Analyzer | Security | Medium |
| Secure API Design Reviewer | Developer | Medium |
| PR Security Review Checklist | Team Lead | Medium |

---

## Contributing

Contributions welcome. Keep skills concise, actionable, and platform-appropriate. Each skill should follow the [standard template](ideation.md#prioritized-top-10-skills) with Input, Output, Instructions, Examples, and Edge Cases sections.

---

## License

[MIT](LICENSE)
