---
name: phishing-email-analyzer
description: Analyze suspicious emails for phishing indicators and recommend actions in plain language
personas: [Regular User]
---

# Phishing Email Analyzer

Analyze suspicious emails to determine whether they are phishing attempts, spam, or legitimate messages. This skill is designed for non-technical users who receive a suspicious email and want to understand if it is safe. It examines email headers, sender information, body content, links, and attachments to produce a plain-language risk assessment with clear recommended actions.

## Input

The user provides the content of a suspicious email by pasting it as text. This may include:

- **Email headers** (From, Reply-To, Return-Path, Date, Subject, etc.) -- the more headers provided, the better the analysis
- **Email body** (the message text, HTML or plaintext)
- **Links** (URLs in the email)
- **Attachment names** (if any)

The user does not need to provide all of these. Even a partial email body is enough for a basic analysis.

Example input:

> I got this email and it looks suspicious. Can you check it?
>
> From: security-team@amaz0n-support.com
> Subject: Your Account Has Been Suspended - Immediate Action Required
>
> Dear Valued Customer,
>
> We have detected unusual activity on your Amazon account. Your account has been temporarily suspended for your protection.
>
> To restore access, please verify your identity by clicking the link below within 24 hours or your account will be permanently deleted:
>
> https://amaz0n-security-verify.com/restore?id=8837261
>
> Thank you,
> Amazon Security Team

## Output

Return a structured analysis written in plain, non-technical language:

1. **Verdict** -- a clear determination: "This is very likely a phishing email", "This is suspicious and may be phishing", "This appears to be legitimate", or "Not enough information to determine".
2. **Risk level** -- High / Medium / Low with a brief explanation.
3. **Red flags found** -- a numbered list of specific phishing indicators found in the email, each explained in simple terms.
4. **What could happen** -- a plain-language explanation of what might happen if the user clicks the link or follows the instructions.
5. **What you should do** -- specific, actionable steps written for a non-technical person.
6. **What you should NOT do** -- explicit warnings about what to avoid.

## Instructions

Follow these rules when analyzing a suspicious email:

### 1. Audience

The output is for a **non-technical user**. This means:

- Use simple, everyday language. Avoid jargon like "domain spoofing", "homoglyph", or "DKIM" unless you immediately explain what it means in plain terms.
- Use analogies where helpful (e.g., "The email address is like a return address on an envelope -- anyone can write whatever they want on it").
- Be direct and confident in the verdict when the evidence is clear. Users need a clear answer, not hedging.
- Be reassuring but honest. If the email is dangerous, say so clearly without causing panic.

### 2. Sender Analysis

Check the sender information for these indicators:

- **Domain mismatch**: Is the sender's domain different from the company they claim to be? For example, `security@amaz0n-support.com` is not `amazon.com`. Flag look-alike domains that use character substitution (0 for o, 1 for l, rn for m), extra words (amazon-security.com, support-amazon.com), or different TLDs (.net instead of .com).
- **Reply-To mismatch**: Does the Reply-To address differ from the From address? This is a strong phishing indicator.
- **Free email provider**: Is a company claiming to be a large organization using a Gmail, Yahoo, or Outlook.com address?
- **Display name spoofing**: Does the display name say "Amazon" but the actual email address is completely unrelated?

### 3. Content Analysis

Check the email body for these indicators:

- **Urgency and threats**: "Your account will be deleted in 24 hours", "Immediate action required", "Failure to respond will result in..." Legitimate companies rarely threaten account deletion via email.
- **Generic greeting**: "Dear Valued Customer", "Dear User", "Dear Sir/Madam" instead of the user's actual name. Most companies that have your account will use your name.
- **Grammar and spelling errors**: Professional companies proofread their emails. Significant errors are a red flag (though absence of errors does not mean it is safe).
- **Request for sensitive information**: Asking for passwords, credit card numbers, Social Security numbers, or login credentials. Legitimate companies almost never ask for this via email.
- **Too good to be true**: Unexpected prizes, refunds, inheritance, or job offers.
- **Emotional manipulation**: Playing on fear (account suspended), greed (you won a prize), curiosity (someone shared a document with you), or authority (CEO/boss requesting urgent action).

### 4. Link Analysis

Check any URLs in the email:

- **Domain mismatch**: Does the link go to a domain that is not the company's official domain? For example, `amaz0n-security-verify.com` is not `amazon.com`.
- **Misleading display text**: Does the link text say "amazon.com" but the actual URL (href) points elsewhere?
- **URL shorteners**: bit.ly, tinyurl.com, etc. -- these hide the real destination.
- **Suspicious URL structure**: Long URLs with random characters, IP addresses instead of domain names, or misspelled domain names.
- **HTTP instead of HTTPS**: While not conclusive on its own, legitimate login pages always use HTTPS.

Important: **Do NOT visit or click any links** from the email. Analyze them textually only.

### 5. Attachment Analysis

If the email mentions or includes attachments:

- Flag executable files (.exe, .bat, .cmd, .ps1, .scr, .js, .vbs, .msi)
- Flag Office documents with macros (.docm, .xlsm, .pptm) or that prompt to "enable macros"
- Flag password-protected archives (.zip, .rar) -- a common technique to bypass email scanners
- Flag HTML attachments -- these can contain phishing pages that run locally
- Note that even PDFs and regular Office documents can sometimes contain malicious content

### 6. Context Clues

Consider the broader context:

- Did the user expect this email? An unsolicited password reset or account verification is suspicious.
- Does the user have an account with the claimed sender? If not, it is almost certainly phishing.
- Is the email personalized with details only the real company would know (account number, recent order, etc.)? Lack of personalization is a red flag, though some sophisticated phishing does include personal details from data breaches.

### 7. Verdict Criteria

**High risk (very likely phishing):**
- Sender domain does not match the claimed company AND the email asks for credentials, money, or personal information
- Link destinations do not match the claimed company
- Multiple strong phishing indicators present

**Medium risk (suspicious, treat with caution):**
- One or two phishing indicators present but not conclusive
- The email could be legitimate but has concerning elements
- Sender domain is correct but other elements are suspicious

**Low risk (likely legitimate):**
- Sender domain matches the claimed company
- No requests for sensitive information
- Content is consistent with the user's expected communications
- Note: still recommend verifying through official channels if the user has any doubt

### 8. Recommendations Format

Always provide specific, actionable steps. Examples:

- "Do not click any links in this email."
- "Go to amazon.com directly by typing it into your browser (do not use the link in the email) and check your account from there."
- "Report this email as phishing in your email client (in Gmail, click the three dots and select 'Report phishing')."
- "If you already clicked the link or entered your password, change your Amazon password immediately at amazon.com and enable two-factor authentication."
- "Forward this email to the company's official phishing report address (e.g., stop-spoofing@amazon.com) and then delete it."

### 9. Handling Edge Cases in Verdict

- If the user provides very little information (just a subject line), provide a preliminary assessment but clearly state that a full analysis requires the complete email.
- If the email appears to be marketing/spam rather than phishing, distinguish between the two. Spam is annoying but not necessarily dangerous; phishing actively tries to steal information or money.
- If the email appears legitimate, still recommend verifying through official channels as a precaution.

## Examples

### Example 1: Fake Account Suspension Email

**Input:**

> I just got this email and I'm worried my Amazon account was hacked:
>
> From: security-team@amaz0n-support.com
> Reply-To: verify-account@gmail.com
> Subject: URGENT: Your Amazon Account Has Been Suspended
>
> Dear Valued Customer,
>
> We have detected unusual sign-in activity on your Amazon account from an unrecognized device. For your protection, we have temporarily suspended your account.
>
> You must verify your identity within 24 hours or your account and all order history will be permanently deleted.
>
> Click here to verify your account: https://amaz0n-security-verify.com/account/restore?session=a8f7d6e5
>
> If you do not verify within 24 hours, we will be forced to permanently close your account.
>
> Sincerely,
> Amazon Account Security Team
> (c) 2026 Amazon.com, Inc.

**Output:**

### Verdict

**This is very likely a phishing email.** Do not click any links in it.

### Risk Level: HIGH

This email has multiple clear signs of a phishing scam designed to steal your Amazon login information. It is not from Amazon.

### Red Flags Found

1. **The sender's email address is fake.** The email comes from `amaz0n-support.com` -- notice the zero (0) instead of the letter "o" in "Amazon." This is a common trick where scammers create website names that look similar to real companies at a glance. The real Amazon only sends emails from addresses ending in `@amazon.com`.

2. **The reply address goes to a random Gmail account.** If you were to reply to this email, your reply would go to `verify-account@gmail.com`, not to Amazon. A real Amazon email would never use a Gmail address for replies. This is a strong sign the sender is hiding their real identity.

3. **The link goes to a fake website.** The link points to `amaz0n-security-verify.com`, which is not Amazon's website. If you clicked it, you would likely see a page designed to look like Amazon's login page, but anything you type there (your email, password, credit card) would go directly to the scammer.

4. **It creates fake urgency and threatens you.** The email says your account will be "permanently deleted" in 24 hours. Amazon does not delete accounts this way. This threat is designed to make you panic and act without thinking.

5. **It uses a generic greeting.** The email says "Dear Valued Customer" instead of your actual name. Amazon knows your name and uses it in their emails.

6. **It uses fear tactics.** Mentioning "unusual sign-in activity" and "unrecognized device" is designed to scare you into clicking quickly.

### What Could Happen If You Click the Link

If you click the link, you will likely be taken to a fake website that looks like Amazon's login page. If you enter your email and password there, the scammer will capture those credentials and could:

- Log into your real Amazon account and make purchases with your saved payment methods
- Access your personal information (address, phone number, order history)
- Use your email and password to try logging into your other accounts (many people reuse passwords)
- Lock you out of your own Amazon account by changing the password

### What You Should Do

1. **Do not click any links in this email.** If you have already clicked but did NOT enter any information, you are likely fine.
2. **Check your Amazon account directly.** Open a new browser tab, type `www.amazon.com` yourself, and log in. If there were a real problem with your account, you would see a notification there.
3. **Report this email as phishing.** In Gmail, click the three dots next to the reply button and select "Report phishing." In Outlook, right-click the email and select "Report" then "Phishing."
4. **Forward the email to Amazon.** Send it to `stop-spoofing@amazon.com` so Amazon can take action against the fake domain.
5. **Delete the email** after reporting it.

### What You Should NOT Do

- **Do not click any links** in the email, even out of curiosity.
- **Do not reply** to the email -- the reply goes to a scammer's Gmail account.
- **Do not call any phone numbers** listed in the email (if any) -- they would connect you to the scammer.
- **Do not forward the email** to friends or family without context (they might click the link).

### If You Already Entered Your Password

If you already clicked the link and typed in your Amazon login information:

1. Go to `www.amazon.com` (type it yourself) and **change your password immediately**.
2. **Turn on two-step verification**: Go to Account > Login & Security > Two-Step Verification and enable it. This adds an extra layer of protection even if someone has your password.
3. Check your recent Amazon orders for anything you did not purchase.
4. If you used the same password on other websites, **change those passwords too** -- use a different password for each site.
5. Monitor your bank or credit card statements for unauthorized charges.

## Edge Cases & Guardrails

- **Real phishing emails with real secrets**: If the user pastes an email that contains what appears to be their real personal information (full credit card number, SSN, real password), warn them that they should not share this information in chat and recommend they delete the message. Do not repeat the sensitive information in the output.
- **Legitimate emails flagged by the user**: If the email appears to be genuinely from the claimed sender, say so clearly but still recommend verifying through official channels. Never tell the user to click a link in the email -- always recommend going to the website directly.
- **Spear phishing**: Highly targeted phishing that uses the user's real name, employer, or recent activities may have fewer obvious red flags. Note when an email is personalized and explain that sophisticated phishing can include personal details.
- **Business Email Compromise (BEC)**: If the email appears to be from a colleague or boss requesting money transfers, gift card purchases, or sensitive data, flag this as a likely BEC attack. Recommend verifying through a separate communication channel (phone call, in-person).
- **Non-English emails**: Apply the same analysis principles regardless of language. Note if language quality analysis is limited.
- **Headers not provided**: If the user only provides the body text, note that header analysis was not possible and the verdict is based on content only. Explain how to view full headers in their email client.
- **Do not visit links**: Never attempt to visit, resolve, or fetch any URL from the suspicious email. Analysis must be purely textual.
- **Do not provide attacker tools**: Do not explain how to create phishing emails, set up fake domains, or bypass email filters. Focus exclusively on defense and detection.
- **Spam vs. phishing**: Clearly distinguish between unsolicited marketing (annoying but not dangerous) and phishing (actively trying to steal information or money). Provide appropriate guidance for each.
