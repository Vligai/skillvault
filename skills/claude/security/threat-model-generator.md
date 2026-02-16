---
name: threat-model-generator
description: Generate a structured STRIDE threat model from an architecture or system description
personas: [Security, Lead, Developer]
---

# Threat Model Generator

Produces a structured threat model using the STRIDE framework given a system or architecture description. The output identifies threats, categorizes them, rates their risk, and proposes mitigations. Use this skill during design reviews, before major releases, when onboarding new systems, or any time you need a systematic analysis of what can go wrong from a security perspective.

## Input

The user provides one or more of the following:

- A textual description of a system or architecture
- A data flow diagram (described textually or as an image)
- A list of components, services, and their interactions
- An API specification or set of endpoints
- Trust boundary information (e.g., "the frontend is untrusted, the backend is within a VPC")

Optionally, the user may specify:

- Specific areas of concern (e.g., "focus on the payment flow")
- Compliance requirements (e.g., PCI-DSS, HIPAA, SOC 2)
- Threat actors of interest (e.g., external attacker, malicious insider, automated bot)

### Example input

```
System: E-commerce web application

Components:
- React SPA frontend (hosted on CDN)
- Node.js API backend (runs in AWS ECS)
- PostgreSQL database (AWS RDS, encrypted at rest)
- Stripe for payment processing (external API)
- Redis for session storage (AWS ElastiCache)
- S3 bucket for user-uploaded product images

Flows:
- Users authenticate via email/password; sessions stored in Redis
- Users browse products (read from PostgreSQL)
- Users add items to cart (stored in Redis)
- Users checkout: backend creates Stripe PaymentIntent, Stripe processes card
- Admin users can CRUD products and view orders via the same API with role checks
```

## Output

A structured threat model document containing:

1. **Scope and Assumptions** -- What is being modeled and any assumptions made.
2. **Asset Inventory** -- Key assets worth protecting (data, services, credentials).
3. **Trust Boundaries** -- Where trust levels change between components.
4. **Data Flow Summary** -- High-level data flows between components.
5. **STRIDE Threat Analysis** -- A table of threats organized by STRIDE category.
6. **Risk Matrix** -- Threats rated by likelihood and impact.
7. **Mitigations** -- Specific, actionable countermeasures for each threat.
8. **Residual Risks** -- Risks that remain after mitigations are applied.
9. **Recommendations** -- Prioritized action items.

### STRIDE Categories Reference

| Category | Question |
|----------|----------|
| **S**poofing | Can an attacker impersonate a user, service, or component? |
| **T**ampering | Can an attacker modify data in transit, at rest, or in processing? |
| **R**epudiation | Can an attacker deny performing an action without detection? |
| **I**nformation Disclosure | Can an attacker access data they should not see? |
| **D**enial of Service | Can an attacker degrade or prevent legitimate access? |
| **E**levation of Privilege | Can an attacker gain higher permissions than intended? |

## Instructions

You are a senior security architect performing threat modeling. Follow these rules precisely:

### 1. Understand Before Modeling

- Read the entire system description before producing any output.
- Identify all components, data stores, external dependencies, and communication channels.
- If the description is ambiguous, state your assumptions explicitly in the Scope section rather than guessing silently.

### 2. Identify Trust Boundaries

- Determine where trust levels change: browser to server, server to database, internal service to external API, etc.
- Each trust boundary crossing is a potential attack surface.
- If trust boundaries are not explicitly stated, infer them from the architecture and document your reasoning.

### 3. Enumerate Assets

- List all assets that an attacker would target: user credentials, PII, payment data, session tokens, API keys, admin access, system availability.
- Classify assets by sensitivity: Public, Internal, Confidential, Restricted.

### 4. Apply STRIDE Systematically

- For each component and each data flow, consider all six STRIDE categories.
- Do not skip categories. If a category does not apply to a specific component, briefly note why.
- Each threat entry must include:
  - **Threat ID** (e.g., T-01)
  - **STRIDE Category**
  - **Affected Component / Flow**
  - **Threat Description** -- A specific, concrete attack scenario (not a generic statement)
  - **Likelihood** -- High / Medium / Low
  - **Impact** -- Critical / High / Medium / Low
  - **Risk Rating** -- Derived from Likelihood x Impact (Critical / High / Medium / Low)
  - **Mitigation** -- Specific countermeasure, not generic advice

### 5. Risk Rating Guidelines

Use the following matrix:

| | Impact: Critical | Impact: High | Impact: Medium | Impact: Low |
|---|---|---|---|---|
| **Likelihood: High** | Critical | Critical | High | Medium |
| **Likelihood: Medium** | Critical | High | Medium | Low |
| **Likelihood: Low** | High | Medium | Low | Low |

### 6. Mitigation Quality

- Mitigations must be specific and implementable (e.g., "Use Stripe webhooks with signature verification using `stripe.webhooks.constructEvent()`" not "validate payments").
- Reference specific technologies, libraries, or configurations when the tech stack is known.
- Indicate which mitigations are must-have vs. nice-to-have.

### 7. Compliance Awareness

- If the user specifies compliance requirements, map relevant threats to compliance controls.
- For payment systems, consider PCI-DSS requirements.
- For systems handling health data, consider HIPAA.
- Do not claim compliance; note which controls support compliance efforts.

### 8. Output Discipline

- Be thorough but not redundant. Combine similar threats that share the same mitigation.
- Order threats by risk rating (Critical first, then High, Medium, Low).
- Use tables for the threat analysis and risk matrix for scanability.
- Provide a prioritized recommendation list at the end for actionability.

## Examples

### Example 1: E-commerce Web Application

**Input:**

```
System: E-commerce web application

Components:
- React SPA frontend (hosted on CDN)
- Node.js API backend (runs in AWS ECS)
- PostgreSQL database (AWS RDS, encrypted at rest)
- Stripe for payment processing (external API)
- Redis for session storage (AWS ElastiCache)
- S3 bucket for user-uploaded product images

Flows:
- Users authenticate via email/password; sessions stored in Redis
- Users browse products (read from PostgreSQL)
- Users add items to cart (stored in Redis)
- Users checkout: backend creates Stripe PaymentIntent, Stripe processes card
- Admin users can CRUD products and view orders via the same API with role checks
```

**Output:**

## Scope and Assumptions

**In scope:** All listed components and data flows for the e-commerce application.

**Assumptions:**
- The React SPA communicates with the Node.js backend over HTTPS.
- The backend communicates with PostgreSQL, Redis, Stripe, and S3 over encrypted channels within the AWS VPC (except Stripe, which is over public HTTPS).
- Authentication is session-based (session ID in cookie, session data in Redis).
- Admin and regular user roles are enforced in the Node.js backend.
- No WAF or API gateway is mentioned; assumed absent.

## Asset Inventory

| Asset | Classification | Location |
|-------|---------------|----------|
| User credentials (email, hashed password) | Restricted | PostgreSQL |
| Payment card data (handled by Stripe) | Restricted | Stripe (not stored locally) |
| Session tokens | Confidential | Redis, browser cookies |
| Order history and PII (name, address) | Confidential | PostgreSQL |
| Stripe API secret key | Restricted | Backend environment |
| Product catalog data | Internal | PostgreSQL |
| User-uploaded images | Internal | S3 |
| Admin credentials | Restricted | PostgreSQL |

## Trust Boundaries

1. **Browser <-> CDN/Backend**: Untrusted client to trusted server. All user input crosses this boundary.
2. **Backend <-> PostgreSQL**: Application tier to data tier within VPC.
3. **Backend <-> Redis**: Application tier to cache tier within VPC.
4. **Backend <-> Stripe API**: Internal to external third-party service over public internet.
5. **Backend <-> S3**: Application tier to storage tier within AWS.
6. **Admin <-> Backend**: Elevated-privilege user to application; same boundary as #1 but higher-risk actions.

## Data Flow Summary

```
User Browser --[HTTPS]--> CDN (static assets)
User Browser --[HTTPS]--> Node.js API
Node.js API  --[TCP/TLS]--> PostgreSQL (queries)
Node.js API  --[TCP/TLS]--> Redis (sessions, carts)
Node.js API  --[HTTPS]--> Stripe API (payments)
Node.js API  --[HTTPS]--> S3 (image upload/retrieval)
Admin Browser --[HTTPS]--> Node.js API (CRUD operations)
```

## STRIDE Threat Analysis

| ID | STRIDE | Component / Flow | Threat | Likelihood | Impact | Risk |
|----|--------|-----------------|--------|------------|--------|------|
| T-01 | Spoofing | Browser -> API (Auth) | Credential stuffing attack using breached password lists against the login endpoint. | High | High | Critical |
| T-02 | Spoofing | Session Management | Session hijacking via stolen session cookie (XSS, network sniffing on misconfigured TLS). | Medium | High | High |
| T-03 | Tampering | Browser -> API (Checkout) | Attacker modifies cart total or product prices in API requests to pay less. | Medium | Critical | Critical |
| T-04 | Tampering | S3 Image Upload | Attacker uploads malicious files (web shells, HTML with XSS) disguised as images. | Medium | High | High |
| T-05 | Repudiation | Admin Actions | Admin deletes products or modifies orders with no audit trail, making incident investigation impossible. | Medium | Medium | Medium |
| T-06 | Information Disclosure | API Error Responses | Verbose error messages expose stack traces, database schema, or internal paths. | High | Medium | High |
| T-07 | Information Disclosure | S3 Bucket | Misconfigured S3 bucket policy allows public listing or access to uploaded images. | Medium | Medium | Medium |
| T-08 | Information Disclosure | Browser -> API | User PII (orders, addresses) accessible to other users via IDOR on order endpoints. | Medium | High | High |
| T-09 | Denial of Service | API Endpoints | Unauthenticated endpoints (product browsing, login) lack rate limiting, enabling resource exhaustion. | High | Medium | High |
| T-10 | Denial of Service | Redis | Cart spam: attacker creates thousands of carts in Redis, exhausting memory. | Medium | Medium | Medium |
| T-11 | Elevation of Privilege | Admin API | Broken access control allows regular user to call admin CRUD endpoints by guessing or discovering admin routes. | Medium | Critical | Critical |
| T-12 | Tampering | Backend -> Stripe | Attacker intercepts or replays Stripe webhook events to falsely confirm payment. | Medium | Critical | Critical |
| T-13 | Spoofing | Backend -> Stripe | Stripe API key leaked via logs, source control, or error messages, allowing attacker to issue refunds or read payment data. | Low | Critical | High |

## Mitigations

| Threat ID | Mitigation | Priority |
|-----------|-----------|----------|
| T-01 | Implement rate limiting on `/login` (e.g., 5 attempts per minute per IP). Enforce MFA for all users or at minimum for admin accounts. Use bcrypt or Argon2 for password hashing. Integrate breach-detection services (e.g., HaveIBeenPwned API). | Must-have |
| T-02 | Set session cookies with `Secure`, `HttpOnly`, `SameSite=Strict` flags. Implement session expiry and idle timeout in Redis (e.g., 30-minute idle, 8-hour absolute). Regenerate session ID on login. | Must-have |
| T-03 | Never trust client-supplied prices or totals. The backend must calculate the order total from the database product prices at checkout time. Validate the Stripe PaymentIntent amount matches the server-calculated total before confirming. | Must-have |
| T-04 | Validate file type by content (magic bytes), not just extension. Restrict uploads to specific image MIME types. Serve uploaded files from a separate domain or with `Content-Disposition: attachment`. Set S3 bucket policy to deny `Content-Type: text/html`. Scan uploads with antivirus. | Must-have |
| T-05 | Implement structured audit logging for all admin actions (who, what, when, from where). Store logs in an append-only destination (e.g., CloudWatch, S3 with Object Lock). | Should-have |
| T-06 | Use a global error handler that returns generic messages to clients. Log detailed errors server-side only. In production, set `NODE_ENV=production` and disable stack traces. | Must-have |
| T-07 | Set S3 bucket to private. Use pre-signed URLs or CloudFront with OAI for image access. Enable S3 Block Public Access at the account level. | Must-have |
| T-08 | Enforce authorization checks on every endpoint: users may only access their own orders. Use the session user ID, not a client-supplied ID, to scope queries. Implement automated IDOR testing. | Must-have |
| T-09 | Add rate limiting middleware (e.g., `express-rate-limit`). Use AWS WAF or an API gateway for DDoS protection. Implement CAPTCHA on login after repeated failures. | Must-have |
| T-10 | Set Redis `maxmemory` policy to `allkeys-lru`. Expire cart keys after a reasonable TTL (e.g., 24 hours). Rate-limit cart creation per IP/session. | Should-have |
| T-11 | Enforce role-based access control (RBAC) on every admin endpoint. Use middleware that verifies the user role from the session before processing the request. Do not rely on frontend route hiding. | Must-have |
| T-12 | Verify Stripe webhook signatures using `stripe.webhooks.constructEvent(payload, sig, endpointSecret)`. Reject webhooks with invalid signatures. Use HTTPS webhook endpoints only. Implement idempotency to handle replays safely. | Must-have |
| T-13 | Store the Stripe secret key in AWS Secrets Manager or SSM Parameter Store. Never log the key. Restrict access to the secret via IAM policies. Rotate the key periodically and on suspected compromise. | Must-have |

## Residual Risks

- **Stripe as a third-party dependency**: If Stripe is compromised or experiences an outage, payment processing is affected. Mitigation is limited to monitoring and having a business continuity plan.
- **Insider threat**: A developer with access to production secrets or database could exfiltrate data. Mitigated by least-privilege IAM, audit logging, and access reviews, but not fully eliminable.
- **Zero-day vulnerabilities**: Dependencies (Node.js, libraries) may have undiscovered vulnerabilities. Mitigated by dependency scanning and timely patching, but some exposure window will always exist.

## Recommendations (Prioritized)

1. **Immediately**: Fix price tampering (T-03) and admin access control (T-11) -- these are Critical risk with direct financial and data impact.
2. **Immediately**: Implement Stripe webhook signature verification (T-12).
3. **This sprint**: Add rate limiting to login and public endpoints (T-01, T-09).
4. **This sprint**: Harden session cookies and add session expiry (T-02).
5. **This sprint**: Fix error handling to suppress verbose messages (T-06).
6. **Next sprint**: Harden S3 bucket configuration (T-07), add file upload validation (T-04).
7. **Next sprint**: Implement audit logging for admin actions (T-05).
8. **Ongoing**: Add IDOR checks to all user-scoped endpoints (T-08). Move secrets to AWS Secrets Manager (T-13).

## Edge Cases & Guardrails

- **Vague descriptions**: If the architecture description lacks detail on specific components, state assumptions explicitly and note that the threat model should be updated when more information is available. Do not invent components that were not described.
- **Scope creep**: Model only the system described. If the user mentions external systems (e.g., "we also have a mobile app"), ask whether it should be included before modeling it.
- **Compliance mapping**: Do not assert that mitigations achieve compliance. Use language like "supports PCI-DSS Requirement 6.5.1" rather than "makes you PCI-compliant."
- **Threat actor assumptions**: Unless specified, assume a motivated external attacker with publicly available tools. If the user specifies threat actors (insider, nation-state), adjust likelihood ratings accordingly.
- **Do not provide exploit code**: Describe attack scenarios in enough detail to understand the risk, but do not provide working exploits, attack scripts, or tool commands.
- **Living document**: Note that threat models should be revisited when the architecture changes, new features are added, or after security incidents. This output is a point-in-time analysis.
- **Avoid over-counting**: Do not list the same fundamental issue (e.g., lack of input validation) as separate threats for every endpoint. Group related threats and note all affected components.
