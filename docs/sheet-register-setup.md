# SAB TOOLS Google Form mirror

Current destination: published form "sab tool resid", one short-answer question "Receipt data".
https://docs.google.com/forms/d/e/1FAIpQLSc9xQyk-4_lkGYsMaZIBWA2l7pIST6w0aw6WdmthUcltINyOQ/viewform?usp=publish-editor

No Apps Script, register key or GitHub webhook secret is used. The old Apps Script workflow is retired.

## Owner setup

1. Open the Form's EDITOR, not the public respondent link, in the owning Google account. Use the existing form in Google Forms or Drive. In Chrome on a phone, Desktop site may make controls easier to see.
2. Tap Responses. Tap Link to Sheets (the green Sheets icon / Select destination for responses). Choose Select existing spreadsheet, then Select. Choose SAB TOOLS Rasid Register and confirm Select. Labels can vary by screen size; Google's current guide describes Responses > Summary > More > Select destination for responses as the alternate path.
3. This creates a NEW Form Responses tab in that spreadsheet. It has Timestamp and Receipt data columns. It does NOT fill the original nine-column Receipts tab. Each saved receipt's nine values are one tab-separated text cell. Keep the destination spreadsheet private. Splitting those values into separate columns is a separate follow-up.
4. Keep the Form published and accepting responses without requiring sign-in, verified emails, one-response-per-person or restrictive field validation. The app's background request sends no Google cookies. If settings change, check a labelled test again.
5. Review PR #8 and approve go-live separately. No secret is required for this public endpoint. After deployment, each shop user opens Shared shop register setup and taps Enable automatic sharing on this device once. Every subsequent Save receipt or Save PDF/print sends automatically after its primary save succeeds. Setup is per signed-in account/browser; Stop automatic sharing disables it.
6. With the owner's approval, save one labelled TEST receipt, then check Responses and the new linked Form Responses tab. Compare all nine values. Real end-to-end reception is not tested in this PR.

## Limits

- This is best-effort append-only mirroring, not a reliable accounting ledger. The app's Firestore/local receipts stay the main record. No Sheet/Form success message is shown because no-cors responses are opaque.
- No keys are used or sent. The public form may receive spam from anyone; responses are not proof of an app user's identity.
- Re-saving and printing can create duplicates. No dedupe, automatic retry or replay of offline/missing sends. Drafts do not transmit. No PDF upload.
- Field order: date, receipt no, customer, village, total CFT (4 decimals), rate, total amount (2 decimals), paid (2 decimals), balance (2 decimals). Names' tabs/newlines become spaces to preserve nine fields. Mixed older rates show Mixed. Total includes labour/transport; overpayment gives negative balance.
- One-time device enable is an explicit choice to send customer/payment data into the owner's shared register. Past saved receipts are not backfilled.

Sources: https://support.google.com/docs/answer/2917686?hl=en ; https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
