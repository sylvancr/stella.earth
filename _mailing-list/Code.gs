/**
 * Stella mailing list — Apps Script web app.
 *
 * The site's "Stay connected" form POSTs { email, page, website } here.
 * Each new address is added to the "Stella mailing list" sheet and sent one
 * thank-you email from info@stella.earth. Repeat sign-ups are not added or
 * emailed twice. `website` is a hidden honeypot field: bots fill it, people
 * don't.
 *
 * Every email carries a personal unsubscribe link. Opening it shows a page
 * with one button; pressing it dates the "Unsubscribed" column for that
 * address. (A button rather than the link itself, so email scanners that
 * open links don't unsubscribe people by accident.)
 *
 * Setup: see README.md in this folder.
 */

var SHEET_ID = '15dFKkvGaMw-iPr8LrtvJpqGXOQy6epfc26YdutYwNUU';

// The web app URL (ends in /exec), filled in after the first deployment.
// Used for unsubscribe links; if empty, the script asks Apps Script for it.
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby5J10zNbXjeEf4mF88yqtsQZyxyhByiUOPRI3otK3-OUvaFBpki0aZf_adHLd0FjMu/exec';

var FROM = 'info@stella.earth';
var SENDER_NAME = 'Stella Matutina';
var SUBJECT = 'Successful Stella Connection';

// "…read about Stella's summer, written up here, here and here."
// Names are kept for reference only; the email links each "here".
var WRITE_UPS = [
  { name: 'Sarah', url: 'https://sarahdrinkwater.substack.com/p/stella-july-2026' },
  { name: 'Louis', url: 'https://nationofartisans.substack.com/p/artisanal-intelligence-at-stella' },
  { name: 'Libby', url: 'https://theonebodyproblem.substack.com/p/stella-matutina' }
];

// Sheet columns (1-based).
var COL = { date: 1, email: 2, page: 3, sent: 4, unsub: 5 };

// ---------- sign-up ----------

function doPost(e) {
  var data = {};
  try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }

  // Honeypot filled in: pretend all is well, store nothing.
  if (data.website) return json_({ ok: true });

  var email = String(data.email || '').trim().toLowerCase();
  // Must start with a letter or digit, so the sheet never reads it as a formula.
  if (email.length > 254 || !/^[a-z0-9][^\s@<>"',;=]*@[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}$/i.test(email)) {
    return json_({ ok: false, error: 'invalid' });
  }
  var page = String(data.page || '/').replace(/[^\w\/\-.]/g, '').slice(0, 60) || '/';

  var sheet = sheet_();
  var row;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    row = findRow_(sheet, email);
    if (row && !sheet.getRange(row, COL.unsub).getValue()) {
      return json_({ ok: true, already: true });
    }
    if (row) {
      // Signing up again after unsubscribing: back on the list.
      sheet.getRange(row, COL.unsub).clearContent();
      sheet.getRange(row, COL.date).setValue(new Date());
      sheet.getRange(row, COL.sent).setValue('sending');
    } else {
      sheet.appendRow([new Date(), email, page, 'sending', '']);
      row = sheet.getLastRow();
    }
  } finally {
    lock.releaseLock();
  }

  var status = 'sent';
  try { sendThanks_(email); } catch (err) { status = 'failed: ' + err.message; }
  sheet.getRange(row, COL.sent).setValue(status);
  return json_({ ok: true });
}

// ---------- unsubscribe ----------

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!p.u) return json_({ ok: true, service: 'stella-mailing-list' });

  var t = HtmlService.createTemplateFromFile('Unsubscribe');
  t.email = String(p.u);
  t.token = String(p.t || '');
  t.valid = token_(t.email) === t.token;
  return t.evaluate()
    .setTitle('Unsubscribe — Stella Matutina')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Called from the unsubscribe page's button.
function unsubscribe(email, token) {
  email = String(email || '').trim().toLowerCase();
  if (token_(email) !== token) throw new Error('This link is not valid.');
  var sheet = sheet_();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var row = findRow_(sheet, email);
    if (row && !sheet.getRange(row, COL.unsub).getValue()) {
      sheet.getRange(row, COL.unsub).setValue(new Date());
    }
  } finally {
    lock.releaseLock();
  }
  return true;
}

function unsubscribeUrl_(email) {
  var base = WEB_APP_URL || ScriptApp.getService().getUrl();
  return base + '?u=' + encodeURIComponent(email) + '&t=' + token_(email);
}

// A short signature of the address, so links can't be made up for other people.
function token_(email) {
  var bytes = Utilities.computeHmacSha256Signature(String(email).toLowerCase(), secret_());
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '').slice(0, 22);
}

function secret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('UNSUBSCRIBE_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('UNSUBSCRIBE_SECRET', s);
  }
  return s;
}

// ---------- email ----------

function sendThanks_(email) {
  var unsub = unsubscribeUrl_(email);
  var text = [
    'Hello,',
    '',
    'You’re now on the Stella Matutina mailing list, and we’ll be sending updates soon.',
    '',
    'In the meantime, read about Stella’s summer, written up here:',
    ''
  ].concat(WRITE_UPS.map(function (w) { return w.url; })).concat([
    '',
    'Warm regards,',
    'Your Friends at Stella',
    '',
    '—',
    'https://stella.earth',
    'Unsubscribe: ' + unsub
  ]).join('\n');

  var a = function (w) {
    return '<a href="' + w.url + '" style="color:#111;text-decoration:underline;text-underline-offset:3px;">here</a>';
  };
  var linked = WRITE_UPS.slice(0, -1).map(a).join(', ') + ' and ' + a(WRITE_UPS[WRITE_UPS.length - 1]);
  var font = "font-family:'SF Mono',Menlo,Consolas,'Courier New',monospace;";
  var html =
    '<div style="' + font + 'font-size:13px;line-height:1.65;color:#111;max-width:480px;">' +
    '<p style="margin:0 0 14px;">Hello,</p>' +
    '<p style="margin:0 0 14px;">You’re now on the Stella Matutina mailing list, and we’ll be sending updates soon.</p>' +
    '<p style="margin:0 0 14px;">In the meantime, read about Stella’s summer, written up ' + linked + '.</p>' +
    '<p style="margin:20px 0 0;">Warm regards,<br>Your Friends at Stella</p>' +
    '<p style="margin:28px 0 0;padding-top:14px;border-top:1px solid #ddd;font-size:11px;color:#777;">' +
    '<a href="https://stella.earth" style="color:#777;">stella.earth</a><br>' +
    '<a href="' + unsub + '" style="color:#777;">Unsubscribe</a></p>' +
    '</div>';

  var options = { htmlBody: html, name: SENDER_NAME };
  var me = Session.getEffectiveUser().getEmail().toLowerCase();
  if (me !== FROM) {
    if (GmailApp.getAliases().map(function (x) { return x.toLowerCase(); }).indexOf(FROM) < 0) {
      throw new Error(FROM + ' is not a "Send mail as" address of ' + me);
    }
    options.from = FROM;
  }
  GmailApp.sendEmail(email, SUBJECT, text, options);
}

// Run once from the editor: approves permissions and sends you the email.
function previewEmail() {
  sendThanks_(Session.getActiveUser().getEmail());
}

// ---------- helpers ----------

function sheet_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
}

function findRow_(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var values = sheet.getRange(2, COL.email, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase() === email) return i + 2;
  }
  return 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function escape_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
