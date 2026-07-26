const db = require('./db');

const TWILIO_API = 'https://api.twilio.com/2010-04-01';

// Twilio requires E.164 format (+1XXXXXXXXXX). Customers' phone numbers are
// stored however they were typed in (e.g. "509-866-6388"), so normalize
// before sending -- assumes US/Canada if no country code is present.
function normalizePhoneToE164(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (phone.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

async function sendSms({ to, body }) {
  const accountSid = db.getSetting('twilio_account_sid');
  const authToken = db.getSetting('twilio_auth_token');
  const fromNumber = db.getSetting('twilio_phone_number');

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio isn\'t set up yet. Add your Account SID, Auth Token, and phone number in Settings.');
  }

  const response = await fetch(`${TWILIO_API}/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: body }).toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Text failed to send (${response.status})`);
  }
  return data;
}

function formatCurrency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

async function sendEstimateText(quoteId) {
  const quote = db.getQuote(quoteId);
  if (!quote) throw new Error('Estimate not found');
  const customer = db.getCustomer(quote.customer_id);
  if (!customer || !customer.phone) throw new Error('This customer has no phone number on file.');

  const estimateTag = `E-${quote.number}`;
  const itemsText = quote.items.map((i) => `${i.description} x${i.quantity}`).join(', ');

  const body =
    `EcoHaven Solutions LLC — Estimate ${estimateTag}: ${quote.title}\n` +
    `${itemsText}\n` +
    `Total: ${formatCurrency(quote.total)}\n\n` +
    `Reply YES to accept, or call/text us with questions. — 509-866-6388`;

  const toNumber = normalizePhoneToE164(customer.phone);
  if (!toNumber) throw new Error('This customer has no usable phone number on file.');

  return sendSms({ to: toNumber, body });
}

module.exports = { sendSms, sendEstimateText };
