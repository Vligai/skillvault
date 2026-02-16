---
name: incident-response-playbook-builder
description: Generate structured incident response playbooks for specific security scenarios
personas: [Security, Lead]
---

# Incident Response Playbook Builder

Generate comprehensive incident response (IR) playbooks tailored to specific security scenarios, environments, and team structures. Use this skill when establishing IR procedures for a new threat type, onboarding new team members, or formalizing ad-hoc response processes into documented runbooks. The playbooks follow the NIST SP 800-61 incident response lifecycle.

## Input

The user provides:

1. **Incident type** (required): The specific scenario to build a playbook for. Examples: ransomware, compromised credentials / API key leak, supply chain compromise, data breach, DDoS, insider threat, cloud account compromise, phishing campaign.
2. **Environment description** (optional): Technology stack, cloud providers, infrastructure details, critical systems, data classification.
3. **Team structure** (optional): Available roles (SOC analyst, incident commander, legal, PR, engineering leads, executive sponsor), on-call structure, external resources (DFIR firm, outside counsel).
4. **Compliance requirements** (optional): Applicable regulations (GDPR, HIPAA, PCI-DSS, SOX, SEC, state breach notification laws).

Example input:

> Build an IR playbook for a compromised API key scenario. We run on AWS with a microservices architecture on EKS. Our security team is 4 people, we have a CISO, and we use PagerDuty for on-call. We are subject to SOC 2 and GDPR.

## Output

A structured playbook document containing:

1. **Playbook metadata** -- title, incident type, severity classification guidance, last-reviewed date placeholder, owner.
2. **Scope and applicability** -- when this playbook applies, trigger conditions.
3. **Roles and responsibilities** -- RACI-style matrix for IR activities.
4. **Phase 1: Preparation** -- pre-incident readiness steps, tools, access, runbook prerequisites.
5. **Phase 2: Detection and Analysis** -- indicators of compromise (IOCs), detection sources, triage steps, severity classification, evidence collection.
6. **Phase 3: Containment** -- immediate (short-term) and extended (long-term) containment actions, decision tree for containment strategy.
7. **Phase 4: Eradication** -- root cause removal, system cleaning, vulnerability remediation.
8. **Phase 5: Recovery** -- service restoration steps, validation checks, monitoring for re-compromise.
9. **Phase 6: Post-Incident / Lessons Learned** -- post-mortem template, metrics to track, process improvements.
10. **Communication plan** -- internal notification templates, external notification guidance, regulatory reporting timelines.
11. **Decision trees** -- flowcharts or structured if/then logic for key decision points.
12. **Appendices** -- tool-specific commands, contact lists, reference links.

## Instructions

Follow these rules when generating incident response playbooks:

### 1. Structure and Format

- Use clear headings, numbered steps, and checklists (using `- [ ]` markdown checkboxes) so the playbook is actionable during a high-stress incident.
- Write in imperative mood ("Revoke the key", "Notify the CISO") not passive or advisory ("The key should be revoked", "Consider notifying").
- Include estimated time for each phase where reasonable (e.g., "Target: complete containment within 1 hour of detection").
- Use tables for role assignments, severity matrices, and communication timelines.
- Include decision trees as structured if/then blocks for critical branch points (e.g., "If the key was used to access production data -> escalate to Severity 1").

### 2. Tailor to the Environment

- If the user provides environment details, include specific commands, tool references, and service names. For example, if they use AWS, include AWS CLI commands for key rotation, CloudTrail log queries, etc.
- If no environment details are provided, write a generic playbook with placeholders clearly marked (e.g., `[CLOUD_PROVIDER]`, `[SIEM_TOOL]`, `[TICKETING_SYSTEM]`).
- Reference the user's stated tools (PagerDuty, Slack, Jira, etc.) in communication and workflow steps.

### 3. Tailor to the Team

- If team structure is provided, assign specific roles to playbook steps. Use role titles, not individual names.
- If no team structure is provided, use standard IR roles: Incident Commander, Triage Lead, Communications Lead, Technical Lead, Scribe.
- For small teams, note where one person may fill multiple roles and flag capacity risks.

### 4. Phase-Specific Guidance

**Preparation:**
- List pre-incident prerequisites: tools that must be deployed, access that must be provisioned, training that must be completed, tabletop exercises to run.
- Include a "go bag" of links, credentials, and tools needed during response (without including actual secrets).

**Detection and Analysis:**
- List specific IOCs and detection sources for the incident type.
- Provide a severity classification matrix with clear criteria (e.g., Sev 1: production credentials with evidence of unauthorized use; Sev 2: production credentials with no evidence of use; Sev 3: non-production credentials).
- Include evidence preservation steps -- what to collect, how to collect it, chain of custody considerations.
- Emphasize: never alert the threat actor that they have been detected before containment is ready.

**Containment:**
- Separate short-term containment (stop the bleeding immediately) from long-term containment (prevent re-exploitation while preserving evidence).
- Include a decision tree for whether to isolate systems, revoke credentials, block IPs, or take other actions based on the specific indicators observed.
- Emphasize: containment must be coordinated. Do not revoke one credential while others remain compromised.

**Eradication:**
- List specific remediation steps for the incident type.
- Include verification steps to confirm the threat actor's access has been fully removed.
- Address root cause -- not just the immediate issue but the underlying weakness that allowed it.

**Recovery:**
- Provide a phased recovery plan (restore from backup, rebuild from known-good, or clean and verify).
- Include monitoring steps to detect re-compromise during and after recovery.
- Define success criteria for closing the incident.

**Lessons Learned:**
- Provide a post-mortem template with specific questions to answer.
- Include metrics to track: time to detect (TTD), time to contain (TTC), time to recover (TTR), blast radius.
- Require documented action items with owners and deadlines.

### 5. Communication Plan

- Include internal notification templates for: initial alert, status updates, resolution notification.
- Include external notification guidance for: affected customers, regulatory bodies, law enforcement (when applicable).
- Reference specific regulatory timelines (GDPR: 72 hours to supervisory authority; SEC: 4 business days for material incidents; state breach laws vary).
- Emphasize: all external communications must be approved by legal and executive leadership. The IR team does not communicate externally without authorization.

### 6. Compliance Considerations

- If the user mentions specific regulations, integrate compliance requirements into the relevant phases.
- Include evidence preservation requirements for potential legal proceedings.
- Note documentation requirements for audit trails.

### 7. Safety and Ethical Boundaries

- Do not include offensive techniques, exploit details, or attacker TTPs beyond what is needed for detection.
- Do not recommend destroying evidence or covering up incidents.
- Always recommend engaging legal counsel before external notifications.
- Emphasize that regulatory notification obligations are legal requirements, not optional.

## Examples

### Example 1: Compromised API Key / Credential Leak

**Input:**

> Build an IR playbook for a credential leak scenario. Specifically, an API key or service account credential has been found exposed in a public GitHub repository. We run on AWS (EKS, RDS, S3, Lambda). Security team is 4 people plus a CISO. We use Slack for communication, PagerDuty for on-call, Jira for ticketing, and Datadog for monitoring. Subject to SOC 2 and GDPR.

**Output:**

---

# Incident Response Playbook: Credential Leak (Exposed API Key / Secret)

| Field | Value |
|-------|-------|
| **Playbook ID** | IR-CRED-001 |
| **Incident type** | Credential exposure in public repository or other public medium |
| **Owner** | Security Team Lead |
| **Last reviewed** | `[DATE]` |
| **Review cadence** | Quarterly or after each invocation |

---

## 1. Scope and Applicability

This playbook applies when any of the following are detected:

- AWS access keys, secret keys, or session tokens found in a public repository, paste site, or other public medium
- Service account credentials (database passwords, API tokens, OAuth client secrets) exposed publicly
- Internal credentials shared via insecure channels (unencrypted email, public Slack channel, etc.)
- Automated alerts from GitHub secret scanning, AWS Health, GitGuardian, or similar tools

This playbook does NOT cover: stolen credentials via phishing (see IR-PHISH-001) or compromised credentials via brute force (see IR-AUTH-001).

---

## 2. Severity Classification

| Severity | Criteria | Response SLA |
|----------|----------|-------------|
| **SEV-1 (Critical)** | Production AWS credentials with evidence of unauthorized use; or credentials with access to PII/customer data | Immediate: all hands on deck, 15-minute initial response |
| **SEV-2 (High)** | Production credentials exposed publicly, no evidence of unauthorized use yet | 30-minute initial response; assume compromise |
| **SEV-3 (Medium)** | Non-production credentials exposed, or internal credentials shared insecurely | 4-hour initial response |
| **SEV-4 (Low)** | Expired or already-rotated credentials found in historical commits | Next business day; verify rotation, clean up |

---

## 3. Roles and Responsibilities

| Role | Person/Team | Responsibilities |
|------|-------------|-----------------|
| **Incident Commander (IC)** | Security Team Lead or on-call security engineer | Owns the incident end-to-end; makes escalation decisions; coordinates all workstreams |
| **Technical Lead** | Senior security engineer | Leads investigation, containment, and eradication; executes technical remediation |
| **Scribe** | Assigned security engineer | Documents all actions, findings, and timeline in the incident ticket |
| **Communications Lead** | CISO or designated delegate | Manages internal/external communications; interfaces with legal and executive team |
| **Engineering Liaison** | On-call engineer for affected service | Provides context on the exposed credential's scope and usage; assists with rotation |

For a 4-person security team, the IC and Communications Lead roles may be combined. The CISO acts as executive escalation point.

---

## 4. Phase 1: Preparation (Pre-Incident)

Complete these prerequisites BEFORE an incident occurs:

- [ ] Enable GitHub secret scanning (or GitGuardian / TruffleHog) on all organization repositories
- [ ] Enable AWS CloudTrail in all regions with log delivery to a secured, immutable S3 bucket
- [ ] Enable AWS GuardDuty for anomalous API activity detection
- [ ] Configure PagerDuty escalation policies for security incidents
- [ ] Create a dedicated Slack channel template: `#incident-cred-YYYYMMDD` (channel creation is part of the response, but the naming convention is pre-agreed)
- [ ] Maintain an inventory of all service accounts, API keys, and their associated permissions (stored in a secrets manager, not a spreadsheet)
- [ ] Pre-authorize security team members for emergency IAM actions (key deactivation, policy changes) without requiring change approval
- [ ] Conduct a tabletop exercise for this playbook at least once per year
- [ ] Establish relationship with outside DFIR firm (on retainer if budget allows)
- [ ] Pre-draft customer notification template with legal review (see Communication Plan below)

**Go-bag (bookmarks and tools to have ready):**

- AWS Console: IAM, CloudTrail Event History, GuardDuty, S3
- AWS CLI configured with incident-response role credentials
- Datadog: pre-built dashboard for API key usage anomalies
- Jira: IR ticket template
- Slack: IR channel creation shortcut
- Contact list: CISO (phone), legal counsel (phone), AWS support (case URL)

---

## 5. Phase 2: Detection and Analysis

### 5.1 Detection Sources

| Source | Signal |
|--------|--------|
| GitHub secret scanning alert | Credential pattern matched in a public commit |
| GitGuardian / TruffleHog alert | Credential found in repo scan |
| AWS Health Dashboard | "Exposed access key" notification |
| AWS GuardDuty | Anomalous API calls from unusual IP/region |
| Datadog alert | Unexpected API call patterns |
| External report | Bug bounty, responsible disclosure, or social media |
| AWS CloudTrail | `GetCallerIdentity` from unknown IP (reconnaissance) |

### 5.2 Triage Steps

**Target: complete triage within 15 minutes of alert.**

- [ ] **1. Acknowledge the alert** in PagerDuty. Create Jira ticket using the IR template. Assign the ticket to yourself as IC.
- [ ] **2. Identify the exposed credential:**
  - What type? (AWS access key, database password, API token, OAuth secret, etc.)
  - What service/resource does it grant access to?
  - What permission level? (read-only, read-write, admin)
  - When was it exposed? (commit timestamp, not discovery timestamp)
  - Is it still active/valid?
- [ ] **3. Classify severity** using the matrix above.
- [ ] **4. Create the incident Slack channel** (`#incident-cred-YYYYMMDD`) and post the initial summary.
- [ ] **5. Determine blast radius:**
  - What resources can this credential access? Check IAM policies attached to the key's user/role.
  - What data could have been accessed? (S3 buckets with PII, RDS databases, etc.)

### 5.3 Evidence Collection

**Preserve evidence BEFORE taking containment actions.**

- [ ] **Screenshot / archive the public exposure** (GitHub commit, paste site). Use `git log --all --oneline` and save the commit hash. If the repo is public, archive the page (archive.org or local copy).
- [ ] **Pull CloudTrail logs** for the exposed credential's activity. Query for the last 90 days:

```bash
# Find all API calls made by the exposed access key
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIA_EXPOSED_KEY_ID \
  --start-time "2026-01-01T00:00:00Z" \
  --end-time "2026-02-16T23:59:59Z" \
  --output json > /secure-evidence/cloudtrail-AKIA_EXPOSED_KEY_ID.json
```

- [ ] **Export GuardDuty findings** related to the credential.
- [ ] **Check Datadog** for any anomalous patterns on services the credential accesses.
- [ ] **Store all evidence** in a dedicated, access-restricted S3 bucket or local encrypted volume. Do not store evidence in the incident Slack channel.

### 5.4 Unauthorized Usage Analysis

Determine if the credential was used by an unauthorized party:

```
IF CloudTrail shows API calls from:
  - Unknown source IPs (not your VPC, office, or VPN ranges)
  - Unusual regions (regions where you do not operate)
  - Unusual user agents
  - API calls you do not normally make (e.g., ListBuckets, GetCallerIdentity from an IP that is not your infrastructure)
THEN:
  -> Classify as SEV-1
  -> Assume data access / exfiltration occurred
  -> Proceed immediately to Containment with full scope
ELSE:
  -> Classify as SEV-2 (assume compromise until proven otherwise)
  -> Proceed to Containment
```

---

## 6. Phase 3: Containment

**Target: complete initial containment within 1 hour of detection for SEV-1/SEV-2.**

### 6.1 Short-Term Containment (Immediate)

- [ ] **Deactivate the exposed credential** (do NOT delete it yet -- you need it for forensic queries):

```bash
# For AWS access keys:
aws iam update-access-key \
  --user-name SERVICE_USER_NAME \
  --access-key-id AKIA_EXPOSED_KEY_ID \
  --status Inactive
```

- [ ] **If the credential is an IAM user password**, force a password reset and invalidate active sessions:

```bash
aws iam update-login-profile --user-name USERNAME --password-reset-required
```

- [ ] **Revoke active sessions** for the IAM role/user by adding an inline policy that denies all actions for tokens issued before now:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "DateLessThan": {
          "aws:TokenIssueTime": "2026-02-16T12:00:00Z"
        }
      }
    }
  ]
}
```

- [ ] **If unauthorized usage is confirmed**, also:
  - Block the attacker's source IPs in WAF/security groups (if identified)
  - Check if the attacker created any new IAM users, roles, access keys, or Lambda functions (persistence mechanisms)
  - Check for unauthorized S3 bucket policies, EC2 instances, or EKS workloads

### 6.2 Long-Term Containment

- [ ] **Rotate the credential** -- generate a new key/password/token:

```bash
aws iam create-access-key --user-name SERVICE_USER_NAME
# Update the new key in AWS Secrets Manager or your secrets management system
# Update all services that use this credential
```

- [ ] **Verify rotation** -- confirm all services are using the new credential and functioning normally. Check Datadog dashboards for errors.
- [ ] **Remove the exposed secret from the repository:**
  - Remove from the code and commit the fix
  - If the repo is public, consider the secret permanently compromised regardless of removal (Git history preserves it)
  - Do NOT force-push to rewrite history on shared branches during an active incident -- this can destroy evidence and cause confusion
- [ ] **Audit for additional exposed credentials** in the same repository and related repositories:

```bash
# Run TruffleHog against the repository
trufflehog git https://github.com/ORG/REPO --only-verified
```

- [ ] **Check for lateral movement** -- did the attacker use the compromised credential to access other credentials stored in Secrets Manager, Parameter Store, or environment variables?

---

## 7. Phase 4: Eradication

- [ ] **Remove any persistence mechanisms** the attacker created:
  - Delete unauthorized IAM users, roles, policies, and access keys
  - Remove unauthorized Lambda functions, EC2 instances, or EKS workloads
  - Revert unauthorized S3 bucket policy or ACL changes
  - Remove unauthorized VPC peering connections or security group rules
- [ ] **Delete the old (deactivated) access key** after forensic analysis is complete:

```bash
aws iam delete-access-key --user-name SERVICE_USER_NAME --access-key-id AKIA_EXPOSED_KEY_ID
```

- [ ] **Address root cause:**
  - Why was the secret in the repository? (Developer committed it accidentally? Template included a real key? CI/CD config had it hardcoded?)
  - Implement pre-commit hooks (e.g., `detect-secrets`, `gitleaks`) to prevent future commits of secrets
  - Move secrets to AWS Secrets Manager or SSM Parameter Store if not already
  - Review and enforce `.gitignore` patterns for secret files

---

## 8. Phase 5: Recovery

- [ ] **Verify service functionality** -- confirm all services using the rotated credential are operational. Check Datadog for error rates, latency, and availability.
- [ ] **Enable enhanced monitoring** for 30 days:
  - Add CloudTrail alerting for the new credential's usage from unexpected IPs
  - Add GuardDuty custom threat lists with the attacker's known IPs (if identified)
  - Lower alert thresholds on anomaly detection for affected services
- [ ] **Verify containment completeness:**
  - Re-run TruffleHog/GitGuardian scan to confirm no other secrets are exposed
  - Review IAM Access Analyzer for any remaining overly-permissive policies
  - Verify no unauthorized resources remain in the account

**Incident closure criteria:**
- [ ] All exposed credentials rotated and old ones deleted
- [ ] All attacker persistence mechanisms removed
- [ ] Root cause identified and remediated
- [ ] Enhanced monitoring in place
- [ ] All affected services operational
- [ ] Evidence preserved and documented

---

## 9. Phase 6: Post-Incident / Lessons Learned

Hold a blameless post-mortem within 5 business days of incident closure.

### Post-Mortem Template

| Question | Answer |
|----------|--------|
| **What happened?** | (Factual timeline) |
| **When was the credential exposed?** | (Commit timestamp) |
| **When was it detected?** | (Alert timestamp) |
| **How was it detected?** | (Tool/human/external report) |
| **Was the credential used by an unauthorized party?** | (Yes/No, with evidence) |
| **What data was accessed/exfiltrated?** | (Specific resources, data types) |
| **What was the blast radius?** | (Systems, data, customers affected) |
| **Time to detect (TTD):** | (Exposure to detection) |
| **Time to contain (TTC):** | (Detection to containment) |
| **Time to recover (TTR):** | (Containment to full recovery) |
| **Root cause:** | (Why the secret was exposed) |
| **What went well?** | |
| **What could be improved?** | |

### Action Items

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Implement pre-commit secret scanning hooks | Engineering Lead | `[DATE+14d]` | Open |
| Migrate remaining hardcoded secrets to Secrets Manager | Service owners | `[DATE+30d]` | Open |
| Update this playbook with lessons learned | Security Team Lead | `[DATE+7d]` | Open |
| Schedule tabletop exercise for next quarter | CISO | `[DATE+90d]` | Open |

---

## 10. Communication Plan

### Internal Notifications

**Initial alert (within 15 minutes of detection):**

> **Slack: #incident-cred-YYYYMMDD**
>
> :rotating_light: **Security Incident Declared: Credential Exposure**
> **Severity:** SEV-[1/2/3]
> **IC:** [Name]
> **Summary:** [Type of credential] found exposed in [location]. Containment in progress.
> **Bridge:** [Slack channel / video link]
> **Do not** discuss this incident outside this channel.

**Status update (every 30 minutes for SEV-1, every 2 hours for SEV-2):**

> **Status update #[N] -- [TIME]**
> **Phase:** [Containment / Eradication / Recovery]
> **Actions completed:** [List]
> **Actions in progress:** [List]
> **Blockers:** [List or "None"]
> **Next update:** [TIME]

**Resolution notification:**

> **Incident resolved -- [TIME]**
> **Duration:** [Total time]
> **Impact:** [Summary of impact / no impact confirmed]
> **Root cause:** [Brief description]
> **Post-mortem:** Scheduled for [DATE]

### External Notifications

**GDPR (if PII was accessed):**
- Notify supervisory authority within **72 hours** of becoming aware of the breach
- Notify affected data subjects "without undue delay" if the breach poses high risk to their rights
- All external notifications must be reviewed and approved by legal counsel and the CISO

**SOC 2:**
- Document the incident in the SOC 2 incident log
- Ensure remediation actions are tracked and completed for auditor review
- No external notification required unless customer data was affected (then per contract terms)

**Customer notification (if required):**
- Draft notification with legal review
- Include: what happened, what data was affected, what actions were taken, what the customer should do
- Do not speculate about attacker identity or motive

---

## 11. Appendices

### A. Useful AWS CLI Commands

```bash
# List all access keys for a user
aws iam list-access-keys --user-name USERNAME

# Get the last time an access key was used
aws iam get-access-key-last-used --access-key-id AKIAEXAMPLE

# Search CloudTrail for events from a specific IP
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventSource,AttributeValue=iam.amazonaws.com \
  --start-time "2026-01-01" --end-time "2026-02-16"

# List all IAM users (check for unauthorized users)
aws iam list-users

# List all roles (check for unauthorized roles)
aws iam list-roles --query 'Roles[?contains(RoleName, `attacker`) || CreateDate > `2026-02-15`]'
```

### B. Credential Exposure Quick Reference

| Credential type | Rotation method | Services to update |
|----------------|----------------|-------------------|
| AWS access key | `aws iam create-access-key` / deactivate old | All services using the key; update in Secrets Manager |
| RDS password | `aws rds modify-db-instance --master-user-password` | Application connection strings |
| API token (third-party) | Regenerate in the provider's dashboard | Application configs |
| OAuth client secret | Regenerate in the IdP | All OAuth client configurations |
| SSH key | Generate new keypair; update `authorized_keys` | CI/CD systems, bastion hosts |

---

*End of playbook. Review quarterly or after each invocation.*

## Edge Cases & Guardrails

- **Unknown incident type**: If the user requests a playbook for a scenario not well-defined (e.g., "something weird happened"), ask clarifying questions about what was observed before generating a playbook. Do not guess the incident type.
- **No environment details**: Generate a cloud-agnostic playbook with clearly marked placeholders. Do not assume AWS, GCP, or Azure.
- **Overlapping incidents**: Note that credential leaks often co-occur with other incident types (supply chain compromise, insider threat). Include cross-references to related playbooks.
- **Legal sensitivity**: Always include a step to engage legal counsel. Do not provide legal advice -- the playbook should prompt the team to seek it.
- **Do not include offensive content**: Do not describe how to exploit the compromised credentials, create persistence mechanisms, or exfiltrate data. Focus only on detection, containment, and recovery.
- **Do not recommend evidence destruction**: Always recommend preserving evidence, even if it is embarrassing. Destroying evidence may violate regulations and obstruct investigations.
- **Regulatory specifics**: If the user mentions specific regulations, include the notification timelines. If unsure about a specific regulation's requirements, say so and recommend consulting legal counsel rather than guessing.
- **Small teams**: If the security team is very small (1-2 people), explicitly note the risk of burnout during a sustained incident and recommend engaging external DFIR resources early.
- **Tabletop exercises**: Recommend that every generated playbook be tested in a tabletop exercise before it is needed in a real incident.
