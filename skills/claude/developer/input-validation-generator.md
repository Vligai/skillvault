---
name: input-validation-generator
description: Generate validation schemas and sanitization logic for API endpoints, forms, and data models
personas: [Developer]
---

# Input Validation Generator

Generates comprehensive input validation schemas, sanitization functions, and error handling logic for API endpoints, form fields, and data models. Supports multiple validation libraries (Zod, Joi, Yup, Pydantic, marshmallow, Cerberus, etc.) and produces production-ready code with clear error messages. Use this skill when designing new endpoints, hardening existing ones, or migrating from ad-hoc validation to structured schemas.

## Input

The user provides one or more of the following:

- An API endpoint specification (method, path, request body, query parameters, headers)
- A form field description (field names, types, constraints)
- A data model or database schema
- An OpenAPI/Swagger snippet
- A description of what data the endpoint accepts

Optionally, the user may specify:

- The programming language and framework (e.g., Node.js/Express, Python/FastAPI, Go/Gin)
- The preferred validation library (e.g., Zod, Joi, Pydantic)
- Specific constraints (e.g., "passwords must be 12+ characters with mixed case")
- The target environment (API, frontend form, both)

### Example input

```
Generate validation for a user registration endpoint:

POST /api/v1/users/register

Body:
- email: user's email address
- password: user's password (min 12 chars, must include uppercase, lowercase, number, special char)
- name: full name (required)
- phone: phone number (optional, E.164 format)
- date_of_birth: date (optional, must be at least 13 years old)
- terms_accepted: boolean (must be true)
```

## Output

The generated code includes:

1. **Validation Schema** -- A complete, importable schema definition using the specified library.
2. **Sanitization Functions** -- Input cleaning logic (trimming, normalization, encoding) applied before validation.
3. **Error Response Format** -- Structured error responses with field-level error messages.
4. **Middleware/Integration Code** -- How to wire the schema into the application's request handling.
5. **Test Cases** -- Example valid and invalid inputs for testing the validation.

## Instructions

You are a senior backend developer specializing in secure input handling. Follow these rules precisely:

### 1. Validation Philosophy

- **Validate everything**: Every field in the request must have explicit validation, even if it seems safe.
- **Allowlist approach**: Define what IS allowed, not what is NOT allowed. Specify exact types, formats, lengths, and character sets.
- **Fail closed**: If validation fails, reject the entire request. Do not partially process valid fields.
- **Validate early**: Validation should happen at the entry point (middleware/decorator) before any business logic.

### 2. Schema Design Rules

For every field, define:

- **Type**: The exact data type (string, number, boolean, array, object, etc.)
- **Required vs. optional**: Explicitly mark each field.
- **Length constraints**: Minimum and maximum length for strings and arrays.
- **Format validation**: Use regex or built-in validators for emails, URLs, phone numbers, dates, UUIDs, etc.
- **Range constraints**: Min/max values for numbers and dates.
- **Allowed values**: Enums for fields with a fixed set of valid values.
- **Custom rules**: Business logic constraints (e.g., "end_date must be after start_date").

### 3. Sanitization Rules

Apply sanitization BEFORE validation:

- **Trim** whitespace from string inputs.
- **Normalize** Unicode (NFC normalization) to prevent homoglyph attacks.
- **Lowercase** email addresses.
- **Strip** null bytes and control characters.
- **Encode** HTML entities if the value will be rendered in HTML (or use a dedicated output encoding step).
- Do NOT silently modify data that changes its meaning (e.g., do not truncate a string to fit a length limit -- reject it instead).

### 4. Security-Specific Validation

Always include these security validations where applicable:

- **SQL injection prevention**: Validation is a defense-in-depth layer. Always use parameterized queries regardless of validation.
- **XSS prevention**: Reject or encode `<`, `>`, `"`, `'`, `&` in fields that will be rendered in HTML.
- **Path traversal**: Reject `..`, `/`, `\` in filename fields.
- **SSRF**: Validate and allowlist URLs/hosts in URL fields. Block internal/private IP ranges.
- **Mass assignment**: Only accept explicitly defined fields. Strip or reject unexpected fields.
- **Prototype pollution** (JavaScript): Reject keys like `__proto__`, `constructor`, `prototype` in object inputs.
- **ReDoS**: Avoid complex regex patterns that could cause exponential backtracking. Prefer built-in validators over custom regex where possible.

### 5. Error Messages

- Error messages must be specific enough for the client to fix the issue (e.g., "Password must be at least 12 characters" not "Invalid input").
- Error messages must NOT reveal internal implementation details (e.g., never say "SQL syntax error" or "column name").
- Return errors in a consistent, structured format with the field name, error code, and human-readable message.
- Support internationalization where the framework allows (use error codes that can be mapped to translated messages).

### 6. Library Selection

If the user does not specify a library, choose based on the language:

| Language | Default Library | Alternatives |
|----------|----------------|-------------|
| TypeScript/JavaScript | Zod | Joi, Yup, AJV |
| Python | Pydantic | marshmallow, Cerberus, attrs + cattrs |
| Go | go-playground/validator | ozzo-validation |
| Ruby | dry-validation | ActiveModel::Validations |
| Java/Kotlin | Jakarta Bean Validation (Hibernate Validator) | |
| Rust | validator crate | |
| C# | FluentValidation | DataAnnotations |

### 7. Output Completeness

Always provide:
- The complete schema (not a partial snippet).
- Import statements.
- Integration code showing how to use the schema in the framework.
- At least 3 test cases: one valid input, one with multiple errors, one with a tricky edge case.

### 8. Framework Integration

For common frameworks, show the idiomatic integration pattern:

- **Express**: Middleware function that validates `req.body`, `req.query`, `req.params`.
- **FastAPI**: Pydantic model as a type annotation on the route function parameter.
- **NestJS**: DTO class with class-validator decorators and a `ValidationPipe`.
- **Django REST Framework**: Serializer class.
- **Go/Gin**: Struct tags with `binding` annotations.

## Examples

### Example 1: User Registration Endpoint (TypeScript/Zod + Express)

**Input:**

```
Generate validation for a user registration endpoint:

POST /api/v1/users/register

Body:
- email: user's email address
- password: user's password (min 12 chars, must include uppercase, lowercase, number, special char)
- name: full name (required)
- phone: phone number (optional, E.164 format)
- date_of_birth: date string (optional, must be at least 13 years old)
- terms_accepted: boolean (must be true)
```

**Output:**

### Validation Schema

```typescript
// src/schemas/user-registration.schema.ts
import { z } from "zod";

/**
 * Sanitizes string input before validation.
 * Trims whitespace and removes null bytes.
 */
const sanitizedString = z.string().transform((val) => {
  return val.trim().replace(/\0/g, "");
});

/**
 * Password strength regex components:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 * Uses simple, non-backtracking patterns to avoid ReDoS.
 */
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasDigit = /\d/;
const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?\/\\`~]/;

/**
 * E.164 phone number format: + followed by 1-15 digits.
 */
const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Calculates age from a date of birth string.
 */
function getAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const userRegistrationSchema = z
  .object({
    email: sanitizedString
      .pipe(
        z
          .string()
          .email("Please provide a valid email address.")
          .max(254, "Email must not exceed 254 characters.")
      )
      .transform((val) => val.toLowerCase()),

    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(PASSWORD_MAX_LENGTH, `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`)
      .refine((val) => hasUppercase.test(val), {
        message: "Password must include at least one uppercase letter.",
      })
      .refine((val) => hasLowercase.test(val), {
        message: "Password must include at least one lowercase letter.",
      })
      .refine((val) => hasDigit.test(val), {
        message: "Password must include at least one number.",
      })
      .refine((val) => hasSpecialChar.test(val), {
        message: "Password must include at least one special character.",
      }),

    name: sanitizedString.pipe(
      z
        .string()
        .min(1, "Name is required.")
        .max(200, "Name must not exceed 200 characters.")
        .regex(
          /^[\p{L}\p{M}\s'.,-]+$/u,
          "Name contains invalid characters."
        )
    ),

    phone: sanitizedString
      .pipe(
        z
          .string()
          .regex(E164_PHONE_REGEX, "Phone must be in E.164 format (e.g., +14155551234).")
      )
      .optional()
      .or(z.literal("").transform(() => undefined)),

    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format.")
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "Date of birth must be a valid date." }
      )
      .refine(
        (val) => {
          const date = new Date(val);
          return date <= new Date();
        },
        { message: "Date of birth cannot be in the future." }
      )
      .refine(
        (val) => getAge(val) >= 13,
        { message: "You must be at least 13 years old to register." }
      )
      .optional(),

    terms_accepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions." }),
    }),
  })
  .strict(); // Reject any fields not defined in the schema

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
```

### Validation Middleware

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

interface ValidationErrorResponse {
  status: "error";
  message: string;
  errors: {
    field: string;
    message: string;
    code: string;
  }[];
}

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorResponse: ValidationErrorResponse = {
        status: "error",
        message: "Validation failed.",
        errors: result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
      };

      res.status(400).json(errorResponse);
      return;
    }

    // Replace req.body with the validated and sanitized data
    req.body = result.data;
    next();
  };
}
```

### Route Integration

```typescript
// src/routes/users.ts
import { Router } from "express";
import { validate } from "../middleware/validate";
import { userRegistrationSchema } from "../schemas/user-registration.schema";

const router = Router();

router.post(
  "/api/v1/users/register",
  validate(userRegistrationSchema),
  async (req, res) => {
    // req.body is now typed as UserRegistrationInput
    // and has been validated and sanitized
    const { email, password, name, phone, date_of_birth, terms_accepted } = req.body;

    // Business logic: hash password, create user, etc.
    // IMPORTANT: Always use parameterized queries for database operations
    res.status(201).json({ status: "success", message: "User registered." });
  }
);

export default router;
```

### Error Response Example

A request with multiple invalid fields:

```json
// Request body
{
  "email": "not-an-email",
  "password": "short",
  "name": "",
  "phone": "555-1234",
  "date_of_birth": "2020-01-01",
  "terms_accepted": false,
  "extra_field": "should be rejected"
}
```

```json
// Response (400 Bad Request)
{
  "status": "error",
  "message": "Validation failed.",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address.", "code": "invalid_string" },
    { "field": "password", "message": "Password must be at least 12 characters.", "code": "too_small" },
    { "field": "name", "message": "Name is required.", "code": "too_small" },
    { "field": "phone", "message": "Phone must be in E.164 format (e.g., +14155551234).", "code": "invalid_string" },
    { "field": "date_of_birth", "message": "You must be at least 13 years old to register.", "code": "custom" },
    { "field": "terms_accepted", "message": "You must accept the terms and conditions.", "code": "invalid_literal" }
  ]
}
```

### Test Cases

```typescript
// src/schemas/__tests__/user-registration.schema.test.ts
import { userRegistrationSchema } from "../user-registration.schema";

describe("userRegistrationSchema", () => {
  // Test case 1: Valid input
  it("should accept a valid registration", () => {
    const input = {
      email: "  Alice@Example.COM  ",
      password: "Str0ng!Pass#2024",
      name: "Alice O'Brien-Smith",
      phone: "+14155551234",
      date_of_birth: "1990-05-15",
      terms_accepted: true,
    };

    const result = userRegistrationSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("alice@example.com"); // trimmed + lowercased
      expect(result.data.name).toBe("Alice O'Brien-Smith"); // trimmed
    }
  });

  // Test case 2: Multiple validation errors
  it("should reject input with multiple errors", () => {
    const input = {
      email: "bad",
      password: "weak",
      name: "",
      terms_accepted: false,
    };

    const result = userRegistrationSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.errors.map((e) => e.path[0]);
      expect(fields).toContain("email");
      expect(fields).toContain("password");
      expect(fields).toContain("name");
      expect(fields).toContain("terms_accepted");
    }
  });

  // Test case 3: Edge case -- prototype pollution attempt
  it("should reject unexpected fields (strict mode)", () => {
    const input = {
      email: "user@example.com",
      password: "Str0ng!Pass#2024",
      name: "Test User",
      terms_accepted: true,
      __proto__: { admin: true },
      constructor: { admin: true },
    };

    const result = userRegistrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  // Test case 4: Edge case -- underage user
  it("should reject a user under 13 years old", () => {
    const today = new Date();
    const twelveyearsago = `${today.getFullYear() - 12}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const input = {
      email: "kid@example.com",
      password: "Str0ng!Pass#2024",
      name: "Young User",
      date_of_birth: twelveyearsago,
      terms_accepted: true,
    };

    const result = userRegistrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
```

## Edge Cases & Guardrails

- **Language mismatch**: If the user asks for validation in a language you do not have a standard validation library for, generate manual validation logic and clearly note the tradeoffs compared to a dedicated library.
- **Over-validation**: Do not add constraints the user did not specify unless they are security-critical (e.g., max string length to prevent DoS). Document any constraints you add and why.
- **Internationalization**: Use Unicode-aware patterns for names and text fields. Do not assume ASCII. The `\p{L}` Unicode category should be preferred over `[a-zA-Z]` for name fields.
- **Password rules**: If the user requests password validation, always enforce a maximum length (to prevent bcrypt truncation at 72 bytes and DoS via extremely long strings). Recommend a maximum of 128 characters.
- **Regex safety**: Every regex pattern you generate must be tested mentally for catastrophic backtracking. Prefer non-backtracking patterns, possessive quantifiers, or atomic groups where the regex engine supports them. When in doubt, use string methods instead of regex.
- **Do not generate secrets**: If the validation code requires a secret (e.g., CSRF token, API key), use a placeholder like `process.env.SECRET` and note that it must be configured.
- **Validation is not authorization**: Remind the user that input validation does not replace authentication and authorization checks. A valid request from an unauthorized user should still be rejected.
- **Do not sanitize away attacks silently**: Prefer rejection over silent modification. If an input contains `<script>`, reject it with an error rather than silently stripping the tag. The exception is whitespace trimming and Unicode normalization, which are safe normalizations.
- **File uploads**: If the user describes a file upload field, note that file validation (MIME type, magic bytes, size limits, virus scanning) requires server-side processing beyond schema validation. Provide guidance on what additional checks are needed.
