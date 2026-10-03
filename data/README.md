# Wireless provider data workflow

This folder powers time-sensitive provider comparisons on YourTechSave.

## Rules

1. Use an official provider source whenever possible.
2. Record a `last_verified` date for every provider.
3. The public comparison script treats provider data as stale after 7 days.
4. When any provider record is stale, specific provider prices are hidden automatically.
5. Standard plan prices and temporary promotions are different data. Do not overwrite a standard price with a promotional price.
6. A promotion must have an official source and known expiration/eligibility terms before it is displayed as current.
7. Affiliate links are stored separately from provider facts. Commission size must not determine ranking or comparison order.
8. If an official source is unclear or contradictory, suppress the claim until reviewed.
9. Re-check the public page after every update.

## Current provider records

- Visible
- Verizon
- US Mobile
- Mint Mobile
- AT&T
- T-Mobile

Current live comparisons: Visible vs. Verizon, Visible vs. US Mobile, Visible vs. Mint Mobile, Visible vs. AT&T, and Visible vs. T-Mobile.

The provider JSON intentionally uses no affiliate URLs yet.