# Security Skills Ideation Map

Mapping skills that different personas can use with AI agents (Claude, Cursor, Copilot, etc.) to stay secure.

---

## Table of Contents

- [Persona 1: Security Professional / Pentester](#persona-1-security-professional--pentester)
- [Persona 2: Software Developer](#persona-2-software-developer)
- [Persona 3: Regular User / Non-Technical Person](#persona-3-regular-user--non-technical-person)
- [Persona 4: Team Lead / Engineering Manager](#persona-4-team-lead--engineering-manager)
- [Persona 5: Cloud / Infrastructure Engineer](#persona-5-cloud--infrastructure-engineer)
- [Cross-Cutting Skill Ideas](#cross-cutting-skill-ideas)
- [Prioritization Criteria](#prioritization-criteria)
- [Next Steps](#next-steps)

---

## Persona 1: Security Professional / Pentester

### Offensive Skills
- **Threat Model Generator** — Given an architecture diagram or description, produce a structured threat model (STRIDE, DREAD, attack trees)
- **Attack Surface Mapper** — Analyze a codebase or API spec and enumerate attack surfaces, entry points, and trust boundaries
- **Exploit Proof-of-Concept Writer** — Generate safe, scoped PoC code for known vulnerability classes (with guardrails)
- **CVE Analyzer** — Summarize a CVE, assess impact on a specific stack, and suggest mitigations
- **Security Report Writer** — Structure pentest findings into professional reports with severity, evidence, and remediation

### Defensive Skills
- **Incident Response Playbook Builder** — Generate IR runbooks for specific scenarios (ransomware, credential leak, supply chain compromise)
- **Detection Rule Generator** — Write SIEM rules (Sigma, Splunk SPL, KQL) from threat descriptions
- **Log Analysis Assistant** — Parse and correlate security logs to identify anomalies or indicators of compromise
- **Hardening Checklist Generator** — Produce CIS-benchmark-style hardening guides for specific OS/service/cloud configs
- **Policy & Compliance Drafter** — Draft security policies aligned to frameworks (SOC 2, ISO 27001, NIST CSF)

---

## Persona 2: Software Developer

### Secure Coding Skills
- **Code Security Reviewer** — Scan code for OWASP Top 10 vulnerabilities, secrets, and insecure patterns
- **Input Validation Generator** — Generate validation schemas and sanitization logic for endpoints/forms
- **Auth Flow Scaffolder** — Scaffold secure authentication and authorization flows (OAuth2, OIDC, JWT with best practices)
- **Parameterized Query Converter** — Refactor raw SQL/NoSQL string concatenation into parameterized queries
- **Secure API Design Reviewer** — Review OpenAPI specs for auth gaps, excessive data exposure, rate limiting

### Dependency & Supply Chain Skills
- **Dependency Auditor** — Audit package.json / requirements.txt / go.mod for known vulnerabilities and suggest upgrades
- **Lock File Validator** — Verify lock file integrity and flag unexpected changes
- **SBOM Generator** — Produce a Software Bill of Materials for compliance and vulnerability tracking
- **License Compliance Checker** — Flag dependencies with incompatible or risky licenses

### DevSecOps Skills
- **CI/CD Security Hardener** — Review pipeline configs (GitHub Actions, GitLab CI) for secret leaks, injection risks, excessive permissions
- **Dockerfile Security Linter** — Analyze Dockerfiles for running as root, unnecessary packages, unverified base images
- **Infrastructure-as-Code Scanner** — Review Terraform/CloudFormation for misconfigs (public S3 buckets, open security groups)
- **Secret Scanner** — Detect hardcoded secrets, API keys, and credentials in code and config files
- **Git Hook Installer** — Set up pre-commit hooks that block secrets, lint for security, and enforce conventions

### Error Handling & Logging
- **Safe Error Handler Generator** — Replace stack trace leaks and verbose errors with production-safe messages
- **Structured Security Logger** — Add security event logging (auth, access control, data changes) without leaking PII

---

## Persona 3: Regular User / Non-Technical Person

### Personal Security Skills
- **Password Strength Checker** — Evaluate password strength and suggest improvements (without transmitting the password)
- **Phishing Email Analyzer** — Paste a suspicious email and get a breakdown of red flags and recommended actions
- **Privacy Settings Advisor** — Get guidance on tightening privacy settings for specific apps/platforms
- **Data Breach Checker** — Check if an email/domain appears in known breaches and advise next steps
- **Secure Setup Guide** — Step-by-step instructions for enabling MFA, password managers, encrypted backups

### Communication Security
- **Secure Messaging Advisor** — Compare messaging apps on encryption, metadata, and privacy features
- **Link Safety Checker** — Analyze a URL for phishing indicators, domain reputation, and redirect chains
- **File Sharing Security Guide** — Advise on secure ways to share sensitive files (encrypted archives, expiring links)

### Device & Account Security
- **Device Hardening Walkthrough** — OS-specific guides for firewall, disk encryption, auto-updates, and screen lock
- **Account Recovery Planner** — Help set up and document recovery options for critical accounts
- **App Permission Auditor** — Review which apps have access to camera, location, contacts and advise what to revoke

---

## Persona 4: Team Lead / Engineering Manager

### Governance Skills
- **Security Champions Program Builder** — Design a security champions program with roles, training, and incentives
- **Secure SDLC Integrator** — Map security activities to each phase of the development lifecycle
- **Risk Register Generator** — Create and maintain a risk register with likelihood, impact, and mitigation status
- **Security Training Recommender** — Recommend training paths based on team roles and tech stack
- **Vendor Security Assessor** — Generate security questionnaires and evaluate third-party vendor responses

### Process Skills
- **PR Security Review Checklist** — Auto-generate security-focused review checklists tailored to the diff
- **Post-Incident Review Facilitator** — Structure blameless post-mortems with security lessons learned
- **Compliance Gap Analyzer** — Compare current practices against a target framework and list gaps

---

## Persona 5: Cloud / Infrastructure Engineer

### Cloud Security Skills
- **IAM Policy Analyzer** — Review AWS/GCP/Azure IAM policies for over-permissive access
- **Network Security Reviewer** — Analyze VPC configs, security groups, and firewall rules for exposure
- **Cloud Misconfiguration Scanner** — Flag common misconfigs: public buckets, unencrypted volumes, default credentials
- **Secrets Rotation Automator** — Generate scripts/configs for automated secret rotation via vault integrations
- **Zero Trust Architecture Planner** — Design network segmentation and access policies following zero trust principles

### Monitoring & Response
- **Alert Tuning Assistant** — Reduce alert fatigue by analyzing alert volumes and suggesting threshold adjustments
- **Cloud Trail Analyzer** — Parse cloud audit logs for suspicious API calls or privilege escalation patterns
- **Backup & DR Validator** — Verify backup configurations and disaster recovery runbooks

---

## Cross-Cutting Skill Ideas

| Skill | Description | Personas |
|-------|-------------|----------|
| **Threat Intel Summarizer** | Digest threat feeds into actionable briefs | Security, Lead |
| **Security Jargon Translator** | Explain security concepts in plain language | All |
| **Regulatory Change Tracker** | Monitor and summarize changes in privacy/security regulations | Lead, Security |
| **AI Prompt Injection Detector** | Detect prompt injection attempts in LLM-integrated apps | Developer, Security |
| **Security Decision Logger** | Document security decisions with rationale for future reference | All |
| **Secure Defaults Enforcer** | Auto-apply secure defaults when scaffolding new projects | Developer |
| **Attack Simulation Narrator** | Walk through attack scenarios step-by-step for training | Security, Developer |
| **Data Classification Helper** | Classify data assets by sensitivity and suggest handling rules | All |

---

## Prioritization Criteria

When deciding which skills to build first, consider:

1. **Frequency** — How often would this skill be used?
2. **Impact** — How much damage does it prevent?
3. **Automation potential** — Can the agent reliably perform this without expert oversight?
4. **Persona reach** — Does it serve multiple personas?
5. **Existing gaps** — Is this already solved well by existing tools?

---

## Prioritized Top 10 Skills

Ranked by frequency x impact x automation potential x persona reach x gap in existing tools:

| # | Skill | Persona(s) | File |
|---|-------|-----------|------|
| 1 | **Code Security Reviewer** | Developer, Security | [skills/claude/developer/code-security-reviewer.md](skills/claude/developer/code-security-reviewer.md) |
| 2 | **Threat Model Generator** | Security, Lead, Developer | [skills/claude/security/threat-model-generator.md](skills/claude/security/threat-model-generator.md) |
| 3 | **Secret Scanner** | Developer, DevSecOps | [skills/claude/developer/secret-scanner.md](skills/claude/developer/secret-scanner.md) |
| 4 | **Dependency Auditor** | Developer | [skills/claude/developer/dependency-auditor.md](skills/claude/developer/dependency-auditor.md) |
| 5 | **Input Validation Generator** | Developer | [skills/claude/developer/input-validation-generator.md](skills/claude/developer/input-validation-generator.md) |
| 6 | **CI/CD Security Hardener** | Developer, Cloud/Infra | [skills/claude/developer/cicd-security-hardener.md](skills/claude/developer/cicd-security-hardener.md) |
| 7 | **IAM Policy Analyzer** | Cloud/Infra, Security | [skills/claude/cloud/iam-policy-analyzer.md](skills/claude/cloud/iam-policy-analyzer.md) |
| 8 | **Incident Response Playbook Builder** | Security, Lead | [skills/claude/security/incident-response-playbook-builder.md](skills/claude/security/incident-response-playbook-builder.md) |
| 9 | **Phishing Email Analyzer** | Regular User | [skills/claude/user/phishing-email-analyzer.md](skills/claude/user/phishing-email-analyzer.md) |
| 10 | **Hardening Checklist Generator** | Security, Cloud/Infra | [skills/claude/security/hardening-checklist-generator.md](skills/claude/security/hardening-checklist-generator.md) |

---

## Next Steps

- [x] Prioritize top 10 skills across personas
- [x] Define input/output format for each skill (what does the user provide, what does the agent return?)
- [x] Build prototype prompts for highest-priority skills
- [ ] Test against real-world scenarios and edge cases
- [ ] Package as reusable Claude.md instructions or project-level skill files
