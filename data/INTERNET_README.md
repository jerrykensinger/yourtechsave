# Home internet provider data workflow

This file documents the workflow for `internet-providers.json`.

## Scope

The structured provider file currently covers broad/national options that can reasonably be monitored from one official source set:

- T-Mobile 5G Home Internet
- Verizon 5G Home Internet
- Starlink Residential
- Hughesnet
- Viasat

Local fiber, cable and DSL providers are **not** treated as nationally available. Exact local discovery belongs in the FCC National Broadband Map and provider address checkers.

## Rules

1. Use official provider sources for pricing, plan names, speed claims, equipment, contracts and data policies.
2. Every provider must have a `last_verified` date.
3. Time-sensitive plan data is stale after 7 days.
4. The public renderer hides specific prices when data is stale.
5. Temporary promotions, bundle discounts, gift cards and switching offers stay in `promotions`; they do not replace standard pricing.
6. Address-specific prices that cannot be verified cleanly should use a null standard price and direct the visitor to the provider's address checker.
7. Never claim a provider serves a specific home from ZIP code alone.
8. Affiliate URLs remain separate from provider facts and do not affect ordering or recommendations.
9. If official pages conflict, use the more conservative claim or suppress the disputed field until reviewed.
10. After a data update, verify the JSON parses and test the public provider page.

## Monitoring output

For each material change, record:

Provider | What changed | Old | New | Official source | Date | Affected YourTechSave page | Proposed wording
