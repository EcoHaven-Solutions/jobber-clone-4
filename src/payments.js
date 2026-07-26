const db = require('./db');

const STRIPE_API = 'https://api.stripe.com/v1';

function authHeader() {
  const secretKey = db.getSetting('stripe_secret_key');
  if (!secretKey) {
    throw new Error('No Stripe secret key set. Add one in Settings before creating payment links.');
  }
  return {
    Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

async function stripePost(path, params) {
  const response = await fetch(`${STRIPE_API}/${path}`, {
    method: 'POST',
    headers: authHeader(),
    body: new URLSearchParams(params).toString(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Stripe request failed (${response.status})`);
  }
  return data;
}

// Stripe Payment Links require a Price object (not an ad-hoc amount), so we
// create a one-off Product + Price behind the scenes, then the Link itself.
// The link doesn't expire, unlike Checkout Sessions — a better fit since
// customers may not pay the same day the invoice is sent.
async function createPaymentLinkForInvoice(invoiceId) {
  const invoice = db.getInvoice(invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.total <= 0) throw new Error('Invoice total must be greater than $0.');

  const product = await stripePost('products', {
    name: `Invoice I-${invoice.number}: ${invoice.title}`,
  });

  const price = await stripePost('prices', {
    product: product.id,
    unit_amount: String(Math.round(invoice.total * 100)),
    currency: 'usd',
  });

  const link = await stripePost('payment_links', {
    'line_items[0][price]': price.id,
    'line_items[0][quantity]': '1',
    'metadata[invoice_id]': String(invoice.id),
  });

  return db.setInvoicePaymentLink(invoice.id, link.url, price.id);
}

module.exports = { createPaymentLinkForInvoice };
