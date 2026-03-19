---
name: detection-rule-generator
description: Write SIEM detection rules in Sigma, Splunk SPL, and KQL from threat descriptions or attack scenarios
personas: [Security]
---

# Detection Rule Generator

Translates threat descriptions, attack scenarios, or IOC sets into production-ready SIEM detection rules. Outputs rules in Sigma (platform-agnostic), Splunk SPL, Microsoft Sentinel KQL, or Elastic EQL as requested. Rules include logic rationale, tuning guidance, and false-positive notes.

## Input

The user provides one or more of the following:

- A threat or attack scenario description (e.g., "detect Kerberoasting attempts")
- A CVE or malware family name (e.g., "CVE-2021-44228 Log4Shell exploitation")
- Raw log samples exhibiting malicious behavior
- Indicators of Compromise (IOCs): file hashes, IPs, domains, process names, registry keys
- An existing rule to improve, translate to another format, or extend

Optionally:

- Target SIEM platform (Sigma, Splunk, Sentinel/KQL, Elastic EQL, Chronicle YARA-L)
- Log source type (Windows Event Logs, Sysmon, cloud trail, web server, EDR telemetry)
- Environment context (e.g., "we don't use PowerShell in production")

### Example input

```
Write a detection rule for Pass-the-Hash attacks. We use Sysmon and Windows Event Logs.
Output in both Sigma and Splunk SPL.
```

## Output

For each requested format:

1. **Rule** -- Complete, syntactically correct rule ready to import.
2. **Logic Explanation** -- What the rule detects and why each condition was chosen.
3. **Tuning Guidance** -- How to reduce false positives in common environments.
4. **Coverage** -- What attack variants are detected vs. missed.
5. **Testing** -- How to validate the rule fires correctly (e.g., sample event, atomic test reference).

## Instructions

You are a detection engineer with expertise in SIEM platforms and adversary TTPs. Follow these principles:

### 1. Threat Understanding Before Rule Writing

- Map the attack to a MITRE ATT&CK technique before writing rules.
- Identify the most reliable, high-fidelity telemetry for the threat (prefer behavioral over IOC-based where possible).
- Consider the attacker lifecycle: initial access, execution, persistence, lateral movement, exfiltration.

### 2. Rule Quality Standards

- **Precision**: Minimize false positives. Prefer AND conditions over broad OR conditions.
- **Recall**: Cover the primary attack variants, not just one tool or one IOC.
- **Resilience**: Write logic that is hard to evade with minor changes (process name, hash). Prefer behavioral patterns.
- **Threshold logic**: For noisy events, include count/time-window thresholds.
- **Severity**: Assign appropriate severity (Critical / High / Medium / Low / Informational).

### 3. Sigma Format

Follow the Sigma specification:
- Use correct `logsource` (category, product, service) to ensure portability.
- Include `title`, `id` (UUID), `status`, `description`, `references`, `author`, `date`, `tags` (ATT&CK), `logsource`, `detection`, and `falsepositives`.
- Use `condition` with named selection blocks for clarity.
- Use `|` transformations (e.g., `| contains`, `| startswith`) correctly.

### 4. Splunk SPL Format

- Use efficient SPL: put high-cardinality filters early, avoid `*` wildcard leading characters.
- Include `index=`, `sourcetype=` for scoping.
- Use `stats`, `table`, `eval` appropriately.
- Add `| eval risk_score=...` or `| collect` if relevant to the environment.

### 5. Microsoft Sentinel KQL Format

- Use appropriate table names (`SecurityEvent`, `Sysmon`, `SigninLogs`, `AzureActivity`, etc.).
- Leverage `summarize`, `where`, `extend`, `join` idiomatically.
- Apply time filters with `TimeGenerated > ago(1d)`.
- Include `| project` to surface relevant fields.

### 6. Elastic EQL Format

- Use sequence detection for multi-step attack chains.
- Reference correct Elastic Common Schema (ECS) field names.
- Use `with maxspan=` for time-correlated sequences.

### 7. False Positive Management

- Always document known false-positive sources.
- Suggest allowlist/exclusion patterns (e.g., "exclude service accounts matching `svc_*`").
- Indicate environments where the rule may be high-noise (e.g., "this will fire on legitimate admin tools in IT-heavy environments").

### 8. Testing References

- Reference MITRE ATT&CK technique ID and name.
- Reference Atomic Red Team test ID where applicable.
- Provide a minimal log snippet that should trigger the rule.

## Examples

### Example 1: Pass-the-Hash Detection

**Input:**

```
Detect Pass-the-Hash. We use Sysmon + Windows Event Logs. Output Sigma and Splunk SPL.
```

**Output:**

#### MITRE ATT&CK Mapping

- Technique: T1550.002 — Use Alternate Authentication Material: Pass the Hash
- Tactics: Lateral Movement, Defense Evasion

#### Sigma Rule

```yaml
title: Pass-the-Hash via NTLM Authentication with Mismatched Logon Type
id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
status: experimental
description: >
  Detects likely Pass-the-Hash attempts by identifying NTLM network logons
  (Logon Type 3) originating from localhost (127.0.0.1) which is characteristic
  of lateral movement tools like Mimikatz, Impacket, and CrackMapExec when
  pivoting from the local machine.
references:
  - https://attack.mitre.org/techniques/T1550/002/
  - https://www.elastic.co/blog/how-hunt-detecting-pass-hash-attacks
author: SkillVault Detection Engineering
date: 2026-03-01
tags:
  - attack.lateral_movement
  - attack.t1550.002
  - attack.defense_evasion
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4624
    LogonType: 3
    AuthenticationPackageName: NTLM
    WorkstationName: '-'          # Empty workstation is a PtH indicator
  filter_local:
    IpAddress|startswith:
      - '127.'
      - '::1'
  condition: selection and not filter_local
falsepositives:
  - Legitimate NTLM network logons from remote hosts (high volume in some environments)
  - Scheduled tasks using NTLM over network shares
level: high
```

#### Splunk SPL

```spl
index=wineventlog EventCode=4624 Logon_Type=3 Authentication_Package=NTLM
| where Workstation_Name="-" OR Workstation_Name=""
| where NOT (Source_Network_Address="127.0.0.1" OR Source_Network_Address="::1")
| eval risk="Pass-the-Hash Candidate"
| stats count min(_time) as first_seen max(_time) as last_seen values(Source_Network_Address) as src_ips
  by Account_Name, Account_Domain, Workstation_Name, risk
| where count >= 1
| sort - count
| table first_seen, last_seen, Account_Name, Account_Domain, src_ips, count, risk
```

#### Logic Explanation

Pass-the-Hash tools forge NTLM credentials. Key indicators:
1. **Logon Type 3** (network logon) over **NTLM** — PtH always uses NTLM, never Kerberos.
2. **Empty Workstation_Name** — tools like Mimikatz often omit this field.
3. Filtering out `127.x` avoids false positives from legitimate localhost service communications.

#### Tuning Guidance

- Exclude service accounts (`Account_Name` matching `svc_*`, `_svc*`) if they legitimately use NTLM.
- Add `| where Account_Name!="ANONYMOUS LOGON"` to reduce noise.
- In environments that have disabled NTLM, any Event 4624 with NTLM should be Critical.

#### Coverage

| Attack Tool | Detected |
|-------------|----------|
| Mimikatz sekurlsa::pth | Yes |
| Impacket psexec.py / wmiexec.py | Yes |
| CrackMapExec | Yes |
| PtH via RDP (Restricted Admin) | Partial (Event 4648 better) |

#### Testing

- Atomic Red Team: T1550.002 Test #1 (`Invoke-Mimikatz`)
- Trigger: Run `sekurlsa::pth /user:Administrator /domain:. /ntlm:<hash> /run:cmd.exe`
- Expected: Windows Security Event 4624, LogonType=3, NTLM

---

### Example 2: Log4Shell Exploitation Attempt

**Input:**

```
Detect Log4Shell (CVE-2021-44228) exploitation attempts in web server logs. Output KQL for Sentinel.
```

**Output:**

#### KQL (Microsoft Sentinel)

```kql
// Log4Shell (CVE-2021-44228) exploitation attempt detection
// Detects JNDI lookup patterns in HTTP request headers and URI
CommonSecurityLog
| where TimeGenerated > ago(1d)
| where DeviceVendor in ("Apache", "F5", "Palo Alto Networks") or isnotempty(RequestURL)
| extend RequestHeaders = coalesce(AdditionalExtensions, "")
| where RequestURL matches regex @'(?i)\$\{(j|J)(n|N)(d|D)(i|I):'
    or RequestHeaders matches regex @'(?i)\$\{(j|J)(n|N)(d|D)(i|I):'
    or RequestURL contains "${jndi:"
    or RequestHeaders contains "${jndi:"
    // Obfuscation bypass patterns
    or RequestURL matches regex @'(?i)\$\{[\w\-\:]+:[\w\-\:]+:\/\/'
| project
    TimeGenerated,
    SourceIP,
    DestinationIP,
    RequestURL,
    RequestMethod,
    DeviceVendor,
    DeviceProduct,
    Activity = "Log4Shell Exploitation Attempt"
| summarize
    FirstSeen = min(TimeGenerated),
    LastSeen = max(TimeGenerated),
    AttemptCount = count(),
    TargetURLs = make_set(RequestURL, 20)
    by SourceIP, DestinationIP, Activity
| where AttemptCount >= 1
| sort by AttemptCount desc
```

#### Tuning Guidance

- This rule may fire on security scanners. Allowlist known scanner IPs.
- Add `| where SourceIP !in ("known_scanner_ips")` for your environment.

## Edge Cases & Guardrails

- **IOC-only requests**: If the user provides only file hashes or IPs, generate a rule but note that IOC-based detection is brittle and recommend behavioral alternatives.
- **Unknown log source**: Ask the user to clarify the log source type before generating rules that reference specific field names.
- **Requesting exploit code**: Do not generate exploit payloads or working attack tooling. Detection rules only.
- **Overly broad rules**: If a requested rule would fire on very common benign behavior (e.g., "detect all PowerShell"), explain the noise risk and narrow the scope with behavioral conditions.
- **No log samples available**: Generate the best-effort rule and clearly mark fields that may need adjustment based on the actual log schema.
