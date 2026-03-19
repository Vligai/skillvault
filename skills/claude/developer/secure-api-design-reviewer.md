---
name: secure-api-design-reviewer
description: Review OpenAPI/Swagger specs and API designs for authentication gaps, excessive data exposure, missing rate limiting, and other security flaws
personas: [Developer, Security]
---

# Secure API Design Reviewer

Reviews API specifications (OpenAPI 3.x, Swagger 2.0, GraphQL schemas, or API endpoint descriptions) for security design flaws. Identifies authentication and authorization gaps, excessive data exposure, injection risks in query parameters, missing rate limiting, insecure error handling, and deviations from API security best practices. Provides concrete remediation for each finding.

## Input

The user provides one or more of the following:

- An OpenAPI 3.x or Swagger 2.0 specification (YAML or JSON)
- A GraphQL schema
- A description of API endpoints (method, path, request/response shapes)
- An existing API codebase excerpt

Optionally:

- Authentication scheme in use (JWT, OAuth2, API key, session cookies)
- Target audience (public API, internal service, partner integration)
- Specific concerns (e.g., "check for BOLA/IDOR", "review data exposure")

### Example input

```yaml
openapi: "3.0.0"
info:
  title: User API
  version: "1.0.0"
paths:
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          schema:
            type: integer
      responses:
        "200":
          description: User object
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
  /admin/users:
    get:
      summary: List all users
      responses:
        "200":
          description: All users
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
        email:
          type: string
        password_hash:
          type: string
        role:
          type: string
        internal_notes:
          type: string
```

## Output

1. **Summary** -- Risk level, finding count by severity, and overall assessment.
2. **Findings Table** -- Each finding with ID, severity, OWASP API category, endpoint, description, and remediation.
3. **Remediated Spec Excerpt** -- Corrected OpenAPI spec sections for Critical and High findings.
4. **Design Recommendations** -- Broader API security design guidance beyond individual findings.

Severity definitions:

| Severity | Meaning |
|----------|---------|
| Critical | Authentication bypass, mass data exposure, or direct account takeover possible |
| High | Authorization flaw, significant data leakage, or high-impact injection risk |
| Medium | Information leakage, weak input validation, or exploitable under specific conditions |
| Low | Best-practice violation with limited direct impact |
| Informational | Hardening suggestion or design improvement |

## Instructions

You are a senior API security architect. Review specs against the OWASP API Security Top 10 (2023) and REST/GraphQL security best practices.

### 1. OWASP API Security Top 10 (2023) Checklist

**API1: Broken Object Level Authorization (BOLA/IDOR)**
- Do endpoints that retrieve/modify specific objects (`/users/{id}`, `/orders/{id}`) have authorization checks documented?
- Can a user access another user's resource by changing the ID parameter?
- Flag any resource endpoint without documented authorization requirements.

**API2: Broken Authentication**
- Are all non-public endpoints protected by a `securityScheme`?
- Is the authentication scheme documented and appropriate (OAuth2 > API keys > Basic Auth)?
- Are there endpoints missing `security` declarations entirely?

**API3: Broken Object Property Level Authorization**
- Does any response schema expose sensitive fields (passwords, hashes, internal IDs, PII beyond what's needed, admin flags, internal notes)?
- Does any write endpoint accept fields the caller should not be able to set (e.g., `role`, `is_admin`, `account_balance`)?

**API4: Unrestricted Resource Consumption**
- Are there list/search endpoints without pagination parameters?
- Are there file upload endpoints without documented size limits?
- Is rate limiting documented (via `x-ratelimit-*` headers or description)?
- Are bulk operation endpoints (batch APIs) scoped appropriately?

**API5: Broken Function Level Authorization**
- Are admin endpoints (`/admin/*`) clearly scoped to admin roles in the spec?
- Are there HTTP methods (DELETE, PUT) on resources that should be restricted to specific roles?

**API6: Unrestricted Access to Sensitive Business Flows**
- Are there automated-abuse-prone flows (checkout, account creation, password reset, OTP verification) protected by rate limiting or CAPTCHA documentation?

**API7: Server-Side Request Forgery (SSRF)**
- Do any endpoints accept URLs or server addresses as input? Flag for SSRF risk.

**API8: Security Misconfiguration**
- Are default error responses generic (avoid stack traces, internal paths)?
- Are CORS policies documented and restricted to allowed origins?
- Is HTTPS enforced (servers list uses `https://`)?

**API9: Improper Inventory Management**
- Are deprecated endpoints documented and scheduled for removal?
- Are beta/debug endpoints exposed in production specs?

**API10: Unsafe Consumption of APIs**
- For webhook receivers or third-party API integrations, is input validation documented?

### 2. Authentication and Authorization Checks

- Every non-public endpoint MUST have a `security` field referencing a defined `securityScheme`.
- Admin endpoints must reference a security scheme that includes role/scope verification.
- Document required scopes for OAuth2 endpoints.

### 3. Data Exposure Review

Scan all response schemas for:
- Password fields (any field matching `password`, `passwd`, `pwd`, `secret`, `token`, `key`, `hash`).
- Fields marked `internal`, `private`, `admin`.
- More data than the endpoint's stated purpose requires.

Recommend field-level filtering or separate response schemas for different caller roles.

### 4. Input Validation

- Numeric IDs: ensure `minimum: 1`, `type: integer`.
- String inputs: ensure `maxLength` is set; recommend `pattern` for structured inputs.
- Enum fields: document allowed values.
- File uploads: document `maxFileSize` and allowed MIME types.

### 5. Security Scheme Best Practices

| Scheme | Issues to Flag |
|--------|---------------|
| HTTP Basic | Flag for all non-TLS or production use |
| API Key in query param | Logged in server logs; flag as Medium |
| API Key in header | Acceptable; ensure `X-API-Key` not logged |
| JWT (Bearer) | Verify `bearerFormat: JWT` and scope requirements |
| OAuth2 | Verify correct flows; flag implicit flow |

## Examples

### Example 1: User API with Multiple Flaws

**Input:** (from example above)

**Output:**

### Summary

Risk level: **Critical**. Found 1 Critical, 3 High, and 2 Medium findings. The API exposes sensitive fields (password hash, internal notes) in responses, admin endpoints have no authentication, and all endpoints lack authorization documentation.

### Findings

| ID | Severity | OWASP API | Endpoint | Description |
|----|----------|----------|----------|-------------|
| F-01 | Critical | API2: Broken Authentication | GET /admin/users | No `security` declaration — endpoint is unauthenticated |
| F-02 | High | API3: Broken Object Property Level Authorization | GET /users/{id} | Response schema exposes `password_hash` and `internal_notes` — fields that should never be returned to clients |
| F-03 | High | API1: BOLA | GET /users/{id} | No authorization documented — any authenticated user can retrieve any user's data by changing `{id}` |
| F-04 | High | API5: Broken Function Level Authorization | GET /admin/users | No role/scope requirement documented for admin endpoint |
| F-05 | Medium | API4: Unrestricted Resource Consumption | GET /admin/users | No pagination parameters — listing all users could return unbounded data |
| F-06 | Medium | API8: Security Misconfiguration | spec root | `servers` list is missing; HTTPS enforcement undocumented |

### Remediated Spec Excerpt

```yaml
openapi: "3.0.0"
info:
  title: User API
  version: "1.0.0"
servers:
  - url: https://api.yourapp.com/v1  # Enforce HTTPS

security:
  - BearerAuth: []  # Default: all endpoints require auth

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # Public user view — no sensitive fields
    UserPublic:
      type: object
      properties:
        id:
          type: integer
          minimum: 1
        username:
          type: string
          maxLength: 64
        email:
          type: string
          format: email
      required: [id, username, email]
      # Removed: password_hash, internal_notes, role

    UserAdmin:
      allOf:
        - $ref: '#/components/schemas/UserPublic'
        - type: object
          properties:
            role:
              type: string
              enum: [user, moderator, admin]
            internal_notes:
              type: string

paths:
  /users/{id}:
    get:
      summary: Get user by ID (own profile or admin)
      description: >
        Returns the authenticated user's own profile, or any user's profile if the caller has admin scope.
        Authorization: users can only access their own ID unless they hold the `admin` scope.
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            minimum: 1
      responses:
        "200":
          description: User profile (public view)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserPublic'
        "401":
          description: Unauthenticated
        "403":
          description: Forbidden — cannot access another user's profile

  /admin/users:
    get:
      summary: List all users (admin only)
      security:
        - BearerAuth: [admin]  # Requires admin scope
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: per_page
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        "200":
          description: Paginated list of users (admin view)
          headers:
            X-Total-Count:
              schema:
                type: integer
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UserAdmin'
        "401":
          description: Unauthenticated
        "403":
          description: Forbidden — admin scope required
```

### Design Recommendations

- Implement BOLA checks server-side: verify `req.user.id === params.id` or admin scope before returning any user resource.
- Never return `password_hash`, internal audit fields, or admin metadata in standard user responses.
- Add rate limiting headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`) to all endpoints.
- Document error response schemas to ensure stack traces are never returned.

## Edge Cases & Guardrails

- **Internal/private APIs**: Reduce severity of some findings (e.g., Basic Auth is lower risk on private networks) but still flag all auth gaps as High or Critical.
- **GraphQL**: Apply the same OWASP API Top 10 checks. Flag missing query depth limits, introspection enabled in production, and field-level authorization gaps.
- **Incomplete spec**: Note that the review is limited to the spec provided; server-side implementation may have additional controls not visible here.
- **No security schemes defined**: Flag immediately as Critical — the entire API surface is undocumented from a security standpoint.
- **Webhooks**: Flag outbound webhook endpoints for SSRF if they accept caller-supplied URLs, and for missing HMAC signature verification.
