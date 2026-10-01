# SAB TOOLS shared receipt register

This is an optional, best-effort mirror. The app's saved receipts remain the main record. PDF files are not uploaded. Missing mirror rows need manual checking; there is no delivery acknowledgement or automatic replay of offline/failed sends.

## Owner setup

1. Open the private "SAB TOOLS Rasid Register" spreadsheet in the Google account that owns it. Keep it private; do not use "Anyone with the link" sharing.
2. Use Extensions > Apps Script. On a phone, request Desktop site in Chrome if Extensions is not visible.
3. Replace the starter Code.gs with the contents of SAB-TOOLS-Register.gs and save.
4. Open Project Settings > Script Properties > Add script property. Name: REGISTER_KEY. Value: a unique random key of at least 24 characters. Create it privately with a password manager. Do not send it in a chat or put it in GitHub.
5. Deploy > New deployment > select Web app. Execute as: Me. Who has access: Anyone. Authorize the exact script you pasted and your own Google account. If Google shows an unverified-app warning, inspect the project/account and requested permissions; stop if they are unexpected. Keep the Sheet itself private. This endpoint is public, but rejects missing/wrong keys and never returns stored data.
6. Copy the deployed Web app URL ending /exec. The /dev test URL will not work for other users. Give only the /exec URL to the person wiring the app; no key is needed in GitHub.
7. In repository Settings > Secrets and variables > Actions, add VITE_SHEET_WEBHOOK_URL with that URL. Adding a secret alone does not alter the existing live app. Merge/deploy only after reviewing the PR and authorizing go-live.
8. Trusted shop users open Shared shop register setup, read what is shared, enter the key privately on their own trusted device and choose Enable automatic sharing on this device. Future saves mirror automatically. Setup is per signed-in account and browser. Stop automatic sharing removes the local key.
9. Save one clearly labelled test receipt after deployment and open the Sheet to confirm its row. Save or print the same receipt again: the existing row should update, not duplicate. Compare paid, balance and totals. Only then use for shop work.

## Boundaries

- All configured shop users write to the same Sheet without gaining read access to it.
- Date, receipt number, customer, village, CFT, rate, total, paid and balance are transmitted. The endpoint stores no app email or full PDF.
- Total includes labour/transport. Balance can be negative for overpayment. Historical individual-rate receipts say Mixed.
- A UUID stored in an A-cell note identifies a receipt. Do not delete these notes or edit header names. Copies/removal of notes can break duplicate prevention.
- Save draft does not transmit. Save receipt and Save PDF/print transmit only after the normal primary save succeeds.
- Runtime shared keys are light access control, not authenticated user identity. Anyone with the key can submit/update rows and consume script quotas. They can inspect a saved key on their device. Share only with trusted staff, rotate REGISTER_KEY if exposed, then set the new key on their devices.
- A public VITE_ key would be readable by everyone, so this build never embeds one. VITE_SHEET_WEBHOOK_URL is public after build, even if supplied using GitHub Secrets.
- no-cors responses are opaque. The app makes no "saved to Sheet" claim and no automatic retries. Network failure, bad key, script quotas or stopped requests may leave a missing row. This is not a reliable accounting ledger or offline sync system.
- After editing a deployed script, use Deploy > Manage deployments > Edit > New version > Deploy.

References: https://developers.google.com/apps-script/guides/web ; https://developers.google.com/apps-script/guides/content ; https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
