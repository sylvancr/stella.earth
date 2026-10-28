/**
 * Stella mailing list — Apps Script web app.
 *
 * The site's "Stay connected" form POSTs { email, page, website } here.
 * Each new address is added to the "Stella mailing list" sheet and sent one
 * thank-you email. Repeat sign-ups are acknowledged but not re-added or
 * re-emailed. `website` is a hidden honeypot field: bots fill it, people don't.
 *
 * Setup: see README.md in this folder.
 */

var SHEET_ID = '1WE-27F-u52qT6yU6dMpqL08jeHiQz7XOctSMBF1vdXU';

// The three pieces written about the summer, linked in the thank-you email.
var PIECES = [
  { title: 'TITLE OF PIECE ONE',   url: 'https://example.com/one' },
  { title: 'TITLE OF PIECE TWO',   url: 'https://example.com/two' },
  { title: 'TITLE OF PIECE THREE', url: 'https://example.com/three' }
];

var SENDER_NAME = 'Stella Matutina';
var REPLY_TO = 'info@stella.earth';
var SUBJECT = 'Thank you for staying connected';

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
  var page = String(data.page || '').replace(/[^\w\/\-.]/g, '').slice(0, 60);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    var last = sheet.getLastRow();
    if (last > 1) {
      var existing = sheet.getRange(2, 2, last - 1, 1).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i][0]).toLowerCase() === email) return json_({ ok: true, already: true });
      }
    }
    sheet.appendRow([new Date(), email, page || '/', 'sending']);
    var row = sheet.getLastRow();
    lock.releaseLock();

    var status = 'sent';
    try { sendThanks_(email); } catch (err) { status = 'failed: ' + err.message; }
    sheet.getRange(row, 4).setValue(status);
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
  return json_({ ok: true });
}

// Visiting the /exec URL in a browser just confirms it is live.
function doGet() {
  return json_({ ok: true, service: 'stella-mailing-list' });
}

function sendThanks_(email) {
  var text = [
    'Thank you for staying connected with Stella Matutina.',
    '',
    'This July, 150 people lived and worked with us on Lake Lucerne for a month. Three pieces have been written about it:',
    ''
  ].concat(PIECES.map(function (p) { return p.title + '\n' + p.url; })).concat([
    '',
    'We will write occasionally with news of our research labs, events, and the first fellowship cohort in autumn 2027.',
    '',
    'Stella Matutina',
    'Hertenstein, Lake Lucerne',
    'https://stella.earth',
    '',
    'To stop hearing from us, reply with "unsubscribe".'
  ]).join('\n');

  var font = "font-family:'SF Mono',Menlo,Consolas,monospace;";
  var links = PIECES.map(function (p) {
    return '<p style="margin:0 0 10px;"><a href="' + p.url + '" style="color:#111;text-decoration:underline;">' +
      escape_(p.title) + '</a></p>';
  }).join('');
  var html =
    '<div style="' + font + 'font-size:13px;line-height:1.65;color:#111;max-width:480px;">' +
    '<p style="margin:0 0 16px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Stella Matutina</p>' +
    '<p style="margin:0 0 14px;">Thank you for staying connected.</p>' +
    '<p style="margin:0 0 14px;">This July, 150 people lived and worked with us on Lake Lucerne for a month. Three pieces have been written about it:</p>' +
    links +
    '<p style="margin:14px 0;">We will write occasionally with news of our research labs, events, and the first fellowship cohort in autumn 2027.</p>' +
    '<p style="margin:24px 0 0;padding-top:14px;border-top:1px solid #ddd;font-size:11px;color:#666;">' +
    'Hertenstein, Lake Lucerne · <a href="https://stella.earth" style="color:#666;">stella.earth</a><br>' +
    'To stop hearing from us, reply with “unsubscribe”.</p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: SUBJECT,
    body: text,
    htmlBody: html,
    name: SENDER_NAME,
    replyTo: REPLY_TO
  });
}

// Run once from the editor to send yourself the thank-you email as a preview.
function previewEmail() {
  sendThanks_(Session.getActiveUser().getEmail());
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function escape_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
