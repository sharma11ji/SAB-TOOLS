# SAB TOOLS Google Form mirror

Destination: published form "sab tool resid".
https://docs.google.com/forms/d/e/1FAIpQLSc9xQyk-4_lkGYsMaZIBWA2l7pIST6w0aw6WdmthUcltINyOQ/viewform

Linked spreadsheet: "Sab tool Rasid register", tab "Form responses 1".
https://docs.google.com/spreadsheets/d/1WhPFCiMNQ6LXUml-FsvOeDqtxb7hay4j6f2BaL2bDhE/edit

No Apps Script, register key or GitHub webhook secret is used. The old Apps Script workflow is retired.

## Current layout

Timestamp, Receipt data (legacy), Date, Receipt no., Customer, Village, Item, CFT, Rate (INR/CFT), Total (INR), Paid (INR), Balance (INR), Labour (INR), Transport (INR).

The form now has twelve optional short-answer questions, with their published entry IDs mapped in `src/sheetMirror.js`. The original Receipt data question remains so older deployed clients keep working until the new code goes live. New code does not populate that legacy cell.

The existing response was copied into the matching columns while retaining its original cell. Item, Labour and Transport were not present in the old transmission and remain blank on that historical row. Blank is not zero. Do not guess missing values.

## Go-live and verification

1. Review the separate-column PR and obtain owner approval before merge/deploy.
2. Keep the form published and accepting anonymous responses. Do not require sign-in, verified email, one response per person or restrictive validation: the background request sends no Google cookies.
3. After approved deployment, each shop user opens Shared shop register setup and taps Enable automatic sharing on this device once. Existing enabled setups remain enabled because the endpoint is unchanged. Stop automatic sharing disables it for that account/browser.
4. Each successful cloud Save receipt or Save PDF/print sends the twelve fields. Local-only saves and drafts do not transmit.
5. With owner approval, save a labelled test receipt and compare all fields in the linked sheet. This change was validated with tests, build, published form IDs and sheet reads; no new end-to-end response was submitted during PR preparation.

## Limits

- Best-effort append-only mirroring, not a reliable accounting ledger. Primary receipts stay the main record. An opaque no-cors response is not a delivery acknowledgement.
- The public form may receive spam; responses are not proof of an app user's identity.
- Re-saving and printing can create duplicates. No dedupe, automatic retry or replay of missing sends. No PDF upload.
- CFT uses four decimals; money uses two decimals. Total includes Labour and Transport. Overpayment produces a negative Balance. Mixed historical rates display Mixed.
- Item contains distinct wood names from the receipt rows, separated by commas. Missing wood names stay blank. Tabs/newlines in names become spaces; URL encoding preserves Unicode and special characters.
- One-time device enable explicitly shares customer/payment data with this register. Past receipts are not automatically backfilled.
