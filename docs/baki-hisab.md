# Baki hisab (design preview)

- Home card and bottom navigation entry for pending payments.
- Save receipt and Save PDF ask for an explicit Paid in full / Pending choice. No default silently records money as received.
- Pending supports an amount already paid. Zero means fully unpaid.
- Mark paid asks for confirmation, records the entire remaining balance, then moves the receipt to Paid.
- Part payment records only the amount received and keeps the rest pending. Whole and fractional paise, negative, zero and excessive payments are rejected.
- Existing receipts are classified from their actual billing fields without a migration. Refund/overpayment is preserved.
- Reads and transaction writes use the existing `users/{uid}/history/{receiptId}` path. Existing Firestore rules apply. Local mode retains browser-only storage.
- Receipt saves and payment writes increment a revision. Cloud transactions reject stale edits and duplicate/stale payment attempts. Old app versions do not enforce revisions; users should reload the released build on all devices.
- Payment updates change the saved receipt (and a later reopened PDF), but do not append to or change existing Google Sheet rows. Receipt-save mirroring remains as before.
- Paid tab is a list of paid receipts, not a chronological payment-event ledger. Undo and per-payment history can be added later.

## Validation

47 Node tests: all original tests plus payment math, explicit choice, partial/full payment, malformed values, legacy amounts/refunds, revision conflict, per-user storage paths, creation timestamp preservation, offline failure and missing records. Cloud tests use a transaction harness; no live production receipt was created or modified.

Production and GitHub Pages-path builds pass. Existing large-chunk warning remains. Existing dependency audit reports four high-severity findings in the Firebase / gRPC dependency chain; no dependency or lockfile changes in this feature.

Rendered at 390x844 with Chrome: explicit choice, pending with partial amount, pending list, part payment, mark-paid confirmation, paid list, and stale editor rejection. No console errors or horizontal overflow in this flow. Dark header, cream cards, amounts and buttons visually inspected.

This is a draft. No merge or production deployment until design review and separate go-live approval.
