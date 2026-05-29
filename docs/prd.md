# Product Requirements Document

## Product Summary

ChurchCore Care is a web-first SaaS for Christian counseling practices that need scheduling, clinical documentation, document management, intake workflows, secure client collaboration, and basic billing support in a single tenant-scoped platform.

## Release Goal

Ship a first release for solo and group practices that can safely handle:

- staff administration
- client intake and charting
- scheduling and reminders
- document templates, signing workflows, and inventories
- invoice and superbill foundations
- secure client portal access
- Christian counseling-specific templates and configurable faith-integrated workflows

## Target Customers

- solo Christian counselors
- group counseling practices
- multi-location clinics
- hybrid practices that support remote sessions

## Roles

- platform admin
- practice owner
- practice admin
- counselor
- intern or supervisee
- scheduler or biller
- client

## Core Workflows

### Staff and practice setup

- create tenant and practice profile
- define locations and rooms
- onboard staff and assign roles
- define counselor supervision relationships
- configure availability, appointment types, and permissions

### Client intake and chart lifecycle

- capture demographics and emergency contacts
- collect consents and release forms
- assign intake packets and inventories
- create treatment plans and progress notes
- track case status and discharge

### Scheduling and operations

- schedule in-person and remote appointments
- manage counselor and location calendars
- detect conflicts and enforce timezone handling
- send reminders and track intake completion status

### Document and assessment workflows

- manage tenant-owned templates and versions
- assign documents to clients or staff
- capture access history and completion status
- store structured assessment responses and scores

### Billing foundations

- define service codes and fee schedules
- generate invoices and superbills
- record payments and balances
- prepare for later clearinghouse integration

### Client portal

- authenticate clients into a limited-scope portal
- complete forms and sign documents
- review balances and permitted resources
- send and receive secure messages

## First Release Inclusions

- one practice per tenant
- multiple locations per tenant
- in-office and remote session support
- shared forms and document system
- structured inventories and assessments
- role-based permissions and audit trails
- client portal for limited self-service
- configurable Christian counseling content and templates

## First Release Exclusions

- embedded telehealth video stack
- e-prescribing
- full claim submission automation
- church management product features
- public marketplace or referral exchange
- native mobile apps

## Success Criteria

- a solo counselor can onboard a new client and complete intake through signed consent and first session note
- a group practice can manage multiple counselors, calendars, and office locations in one tenant
- staff access is limited by role, tenant, and workflow responsibility
- PHI-sensitive actions are auditable and reviewable
- practices can choose more or less explicit faith-integrated templates without branching the product
