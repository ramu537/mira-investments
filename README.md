# Mira Investment Manager

A standalone React application containing only Mira's investment portfolio experience. The existing backend and every current frontend application remain separate and unchanged.

## Product scope

- Portfolio overview using only user-entered values
- Current value, invested amount, unrealised gain or loss, allocation, and institution exposure
- Estimated fixed-income interest and recorded monthly mutual-fund contributions
- Valuation freshness, maturity dates, and bond payout reminders
- Searchable and sortable holdings for stocks, mutual funds, bonds, fixed deposits, and cash
- Adaptive create and edit forms with backend-aligned validation
- Responsive table and card layouts, accessible chart tables, dark mode, and reduced motion

The app intentionally does not download market prices, infer historical performance, recommend trades, or present its summaries as investment advice.

## Existing backend contract

- `GET /api/investments`
- `POST /api/investments`
- `PUT /api/investments/:id`
- `DELETE /api/investments/:id`

Requests use the existing fields: `assetType`, `name`, `symbol`, `category`, `institution`, `quantity`, `averageCost`, `currentPrice`, `annualRate`, `secondaryRate`, `recurringAmount`, `maturityDate`, `nextPayoutDate`, `valuedOn`, and `notes`.

## Authentication

Authentication UI, SDKs, token handling, and Firebase are intentionally omitted, ready for you to integrate separately.

## Later setup

Install the declared packages only when you are ready to run the project. No dependency installation, build, preview, application execution, deployment, or test execution was performed while this source was created.

