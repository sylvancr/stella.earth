# Mailing list

The "Stay connected" sign-up (`assets/signup.js`) posts to a Google Apps Script
web app (`Code.gs` + `Unsubscribe.html`). The script adds each new address to
the [Stella mailing list](https://docs.google.com/spreadsheets/d/15dFKkvGaMw-iPr8LrtvJpqGXOQy6epfc26YdutYwNUU/edit)
sheet (Drive › Contacts) and sends one thank-you email from info@stella.earth:

> Hello,
>
> You’re now on the Stella Matutina mailing list, and we’ll be sending updates soon.
> In the meantime, read about Stella’s summer, written up here, here and here.
>
> Warm regards,
> Your Friends at Stella

Subject: “Successfully connected to Stella Matutina”.

This folder starts with `_`, so GitHub Pages does not publish it.

## Sheet

| Signed up | Email | Page | Thank-you email | Unsubscribed |
|---|---|---|---|---|

- **Thank-you email** reads `sent`, or `failed: …` with the reason.
- **Unsubscribed** gets a date when someone uses the link in their email.
  Leave out anyone with a date here when writing to the list. Someone who
  signs up again is put back on the list and the date is cleared.
- To remove someone by hand, type today's date in their Unsubscribed cell.

## Live setup

- Apps Script project: [Stella mailing list](https://script.google.com/d/1KiOOfE79SM9AOde_Ei3KmbYByVN4eNa4NpApUVLjBnxvoyIyTkOlW5M3/edit),
  attached to the sheet. `.clasp.json` here points at it.
- Web app (deployment "Stella mailing list"):
  `https://script.google.com/macros/s/AKfycby5J10zNbXjeEf4mF88yqtsQZyxyhByiUOPRI3otK3-OUvaFBpki0aZf_adHLd0FjMu/exec`
- Update from this folder with [clasp](https://github.com/google/clasp):
  `clasp push`, `clasp create-version`, then
  `clasp update-deployment AKfycby5J10zNbXjeEf4mF88yqtsQZyxyhByiUOPRI3otK3-OUvaFBpki0aZf_adHLd0FjMu -V <version>`
  so the URL stays the same.

## Set up the backend by hand (original steps)

The emails come from the account that deploys, so either:
- deploy while signed in as **info@stella.earth**, or
- deploy as yourself, if info@stella.earth is a "Send mail as" address in
  your Gmail (Settings › Accounts › Send mail as).

1. Open the sheet › **Extensions › Apps Script**. Name the project
   "Stella mailing list".
2. Replace the contents of `Code.gs` with `Code.gs` from the Contacts folder.
3. **+ › HTML**, name it `Unsubscribe`, and paste in `Unsubscribe.html`.
4. **Project Settings** › tick "Show appsscript.json", then replace that
   file's contents with `appsscript.json` from this folder (optional; it sets
   the time zone to Zurich and the web app defaults).
5. Choose `previewEmail` in the function menu › **Run** › approve the
   permissions. The thank-you email arrives in your inbox.
6. **Deploy › New deployment › Web app**. Execute as **Me**, access
   **Anyone**. Copy the URL ending in `/exec`.
7. Paste that URL into `WEB_APP_URL` near the top of `Code.gs`, save, then
   **Deploy › Manage deployments › Edit › Version: New version › Deploy**.

## Put it on the site

1. Paste the same `/exec` URL into `ENDPOINT` at the top of `assets/signup.js`
   (until then the sign-up stays hidden).
2. The home page loads it with:

   ```html
   <script src="/assets/signup.js" defer></script>
   ```

## How it behaves

- Bottom-left corner on laptops and phones. "Stay connected" opens a single
  email field; → or Enter signs up. Escape or clicking away closes an empty
  field.
- Repeat sign-ups are not added or emailed twice. A hidden field catches
  simple bots.
- The unsubscribe link opens a page with one button, so email scanners that
  open links can't unsubscribe people by accident.
- On the home page it fades out while the About panel is open.

## Notes

- Google Workspace allows about 1,500 script emails a day.
- After changing `Code.gs`, use **Deploy › Manage deployments › Edit › New
  version**, or the live URL keeps running the old code.
