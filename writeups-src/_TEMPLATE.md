# Write-up title goes here

**Author:** Jordan Lanham
**Event:** Some CTF 2026
**Category:** web
**Date:** Jan 15, 2026
**Read Time:** 8 minutes
**Summary:** One-sentence hook shown on the index card and under the title.

<!-- For a disclosure, add:  **CVE:** CVE-2026-XXXXX  -->

---

## Overview

Everything above the `---` is metadata and is stripped from the rendered page —
the title becomes the page heading, and the fields populate the byline, date,
category pill, and summary. Write the actual article below.

## Recon

What you looked at first and what stood out.

## The vulnerability

Explain the root cause. Fenced code blocks render with syntax styling:

```http
GET /api/v1/orders/1042 HTTP/1.1
Authorization: Bearer <token>
```

## Exploitation

Walk through the working path to impact, step by step.

## Impact

What an attacker could actually achieve, and why it matters.

## Remediation & disclosure

The fix, the disclosure timeline, and any credit / CVE assignment.
