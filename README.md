# AI-SaaS School Management

You are building Module 1 of a modular school transparency platform.

Module 1: School Fee Collection Transparency Tool
Future Module (NOT to be built now): Exam & Academic Transparency App (will reuse the same School + Student database later)

This product is not a school ERP and not a payment processing app.

The goal is to reduce parent anxiety and school admin workload by providing a clear, trustworthy view of school fees.

Core Problem

Fee-related conflict exists because:

Information is scattered (circulars, WhatsApp, diaries)

Parents don’t have a single source of truth

Due dates are unclear

Records feel unreliable

The problem is fee visibility and confidence, not payments.

Primary Users & Personas
1. Parent (Primary – “Anxious Payer”)

Wants to quickly know:

Total fee

What’s paid

What’s pending

What’s due next

Does NOT want:

Logins

Complexity

Embarrassment or disputes

2. School Admin / Teacher (Secondary – “Overloaded Collector”)

Manages fee records

Answers repetitive parent queries

Non-technical user

Wants simplicity and reliability

Platform & Architecture Requirements
Multi-School Setup

One app supports multiple schools

Each school has:

Its own secure admin login

Fully isolated data

No school can see another school’s data

Core Entities (Design for Future)

School

Student

Academic Year

Student Academic Record (per year)

Fee Categories (Tuition, Transport, Activities)

Fee Structures

Installments

Payment Records

Design this so future modules (like Exams) can reuse the same School + Student data without migration.

Admin Capabilities (School Side)

Admins log in securely and can:

Create and manage students

Create academic years (e.g., 2025–26)

Assign students to an academic year (manual; no promotion logic)

Define fee categories: (make it customisable)

Tuition

Transport

Activities

Mark categories as mandatory or optional

Create fee structures per academic year

Create installments with clear due dates

Manually mark payments as received

Configure:

School UPI ID

Static QR code for payments

Admins should NOT deal with:

Payment gateways

Automation complexity

Parent authentication issues

Parent Access (Critical Requirement)

Parents:

Access via secure, unique links (one per student)

No login required

Read-only access only

Can view only their own child’s data

Parent View Must Show

Student name

Academic year

Total annual fee

Paid amount

Pending amount

Installment-wise breakdown

Clear due dates

Status labels:

Upcoming

Due

Overdue

Parents should understand their fee status in under 10 seconds.

Payment Support (Strict Constraints)

Do NOT integrate any payment gateway

Payments happen outside the app

The app should only:

Display static QR code

Display UPI intent links (GPay / PhonePe / Paytm)

Payment confirmation is manual, done by admin

UX & Design Principles (Very Important)

Mobile-first

Extremely simple and calm

Respectful, non-judgmental language

No threatening or guilt-inducing copy

Clear visual hierarchy:

Fee status

Amounts

Details

Tone should feel:

Informative, reassuring, professional

Explicitly Out of Scope (Do NOT Build)

No payment processing

No accounting features

No parent login/password system

No exam or academic features

No automatic student promotion between academic years

Success Criteria

This product is successful if:

Parents stop calling the school about fees

Admins feel confident sharing links with parents

Fee disputes reduce significantly

The app feels trustworthy and professional

Output Expectation

Create:

A clean, modern, production-ready UI

Separate admin and parent experiences

Fully functional flows for:

Fee setup

Parent viewing

A system that is easy to extend later with new modules

Important Future Note (Do NOT Implement Now)

Future automation (e.g., reminders, syncing, notifications, Excelsheet export) may later use Make.com, but NOT in this version.

Build this as a polished MVP that a real school can pilot immediately.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://easykiwi.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1f7903cc-7810-41ff-b990-d9eb6c0d02e5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
