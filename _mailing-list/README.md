# Mailing list

The "Stay connected" sign-up (`assets/signup.js`) posts to a Google Apps Script
web app (`Code.gs`). The script adds each new address to the
[Stella mailing list](https://docs.google.com/spreadsheets/d/1WE-27F-u52qT6yU6dMpqL08jeHiQz7XOctSMBF1vdXU/edit)
sheet and sends one thank-you email with links to the three summer pieces.

This folder starts with `_`, so GitHub Pages does not publish it.

## Set up the backend (about 5 minutes)

1. Open the sheet, then **Extensions → Apps Script**.
2. Replace the editor's contents with `Code.gs`. Fill in the three `PIECES`
   (title and link) near the top. Save.
3. Choose `previewEmail` in the function menu and press **Run**. Approve the
   permissions it asks for (edit this sheet, send email as you). The thank-you
   email arrives in your inbox. Check how it reads.
4. **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   Copy the web app URL (it ends in `/exec`).

## Put it on the site

1. Paste the `/exec` URL into `ENDPOINT` at the top of `assets/signup.js`.
2. Add this line just before `</body>` on each page that should show it:

   ```html
   <script src="/assets/signup.js" defer></script>
   ```

## How it behaves

- Bottom-left corner on laptops and phones. "Stay connected" opens a single
  email field; pressing → or Enter signs up. Escape or clicking away closes an
  empty field.
- Repeat sign-ups are not added twice or emailed twice.
- A hidden field catches simple bots.
- Column D of the sheet shows whether the thank-you email went out.
- On the home page it fades out while the About panel is open.

## Notes

- Emails are sent from the account that deploys the script, with replies going
  to info@stella.earth. To send *from* info@stella.earth, add it as a
  "Send mail as" address in that Gmail account and switch `MailApp.sendEmail`
  to `GmailApp.sendEmail(..., { from: 'info@stella.earth', ... })`.
- Google Workspace allows about 1,500 script emails a day.
- Unsubscribing is by reply for now. If the list grows into a regular
  newsletter, move it to a dedicated email tool and import the sheet.
- Changing `Code.gs` later needs **Deploy → Manage deployments → Edit →
  New version**, or the live URL keeps running the old code.
