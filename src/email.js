const db = require('./db');
const nodemailer = require('nodemailer');

const LOGO = 'https://static.wixstatic.com/media/cc8077_c8066fddcbcb4253bb3844bd7fffac68~mv2.png';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function currency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function emailHeader() {
  return `
    <div style="background:#4F5C36;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <img src="${LOGO}" width="90" alt="EcoHaven Solutions LLC" style="display:block;margin:0 auto 10px;" />
      <div style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:0.3px;">EcoHaven Solutions LLC</div>
      <div style="font-size:12px;color:#D8E0CC;margin-top:2px;letter-spacing:0.4px;">SPRINKLER INSTALLS &middot; REPAIRS &middot; UPGRADES</div>
    </div>
  `;
}

function emailFooter() {
  return `
    <div style="background:#EFEEE7;padding:16px 24px;border-radius:0 0 12px 12px;text-align:center;border-top:2px solid #4F5C36;">
      <div style="font-size:12px;color:#5B6152;">509-866-6388 &nbsp;&middot;&nbsp; ecohavenpro.com</div>
    </div>
  `;
}

function lineItemsTable(items) {
  const rows = (items || [])
    .map(
      (item, index) => `
        <tr style="background:${index % 2 === 0 ? '#FFFFFF' : '#F7F6F1'};">
          <td style="padding:10px 8px;border-bottom:1px solid #E3E1D5;">
            ${escapeHtml(item.description)}
            ${item.notes ? `<div style="font-size:12px;color:#8A9080;margin-top:2px;">${escapeHtml(item.notes)}</div>` : ''}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #E3E1D5;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #E3E1D5;text-align:right;">${currency(item.unit_price)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #E3E1D5;text-align:right;font-weight:600;">${currency(item.quantity * item.unit_price)}</td>
        </tr>`
    )
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#23261F;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#EAEDE0;">
          <th style="text-align:left;padding:10px 8px;color:#4F5C36;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Description</th>
          <th style="text-align:center;padding:10px 8px;color:#4F5C36;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Qty</th>
          <th style="text-align:right;padding:10px 8px;color:#4F5C36;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Price</th>
          <th style="text-align:right;padding:10px 8px;color:#4F5C36;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function wrapEmail({ heading, intro, itemsHtml, subtotal, taxRate, total, notes, footer, paymentLinkUrl, reviewUrl, extraHtml }) {
  const tax = total - subtotal;
  return `
    <div style="max-width:580px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#23261F;background:#FFFFFF;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-radius:12px;overflow:hidden;">
      ${emailHeader()}
      <div style="padding:28px 24px;">
        <div style="border-left:4px solid #4F5C36;padding-left:14px;margin-bottom:18px;">
          <h2 style="margin:0;font-family:Georgia,serif;font-size:20px;">${escapeHtml(heading)}</h2>
          ${footer ? `<div style="font-size:12px;color:#8A9080;font-family:monospace;margin-top:2px;">${escapeHtml(footer)}</div>` : ''}
        </div>
        <p style="line-height:1.5;">${escapeHtml(intro)}</p>
        ${itemsHtml}
        <div style="margin-top:16px;background:#F7F6F1;border-radius:8px;padding:14px 18px;">
          <div style="display:flex;justify-content:space-between;color:#6B7263;font-size:13px;padding:2px 0;"><span>Subtotal</span><span>${currency(subtotal)}</span></div>
          <div style="display:flex;justify-content:space-between;color:#6B7263;font-size:13px;padding:2px 0;"><span>Tax${taxRate ? ` (${taxRate}%)` : ''}</span><span>${currency(tax)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;color:#4F5C36;margin-top:8px;padding-top:8px;border-top:1px solid #DCDACC;"><span>Total</span><span>${currency(total)}</span></div>
        </div>
        ${
          paymentLinkUrl
            ? `<div style="text-align:center;margin-top:22px;">
                 <a href="${paymentLinkUrl}" style="background:#4F5C36;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;display:inline-block;font-weight:600;font-size:15px;">Pay now</a>
               </div>`
            : ''
        }
        ${extraHtml || ''}
        ${notes ? `<p style="margin-top:22px;color:#6B7263;font-size:13px;background:#F7F6F1;border-radius:8px;padding:12px 14px;">${escapeHtml(notes)}</p>` : ''}
        ${
          reviewUrl
            ? `<div style="text-align:center;margin-top:24px;padding-top:20px;border-top:1px dashed #DCDACC;">
                 <p style="font-size:13px;color:#6B7263;margin:0 0 10px;">Enjoyed the service? A quick review really helps our small business.</p>
                 <a href="${reviewUrl}" style="color:#4F5C36;text-decoration:underline;font-size:13px;font-weight:600;">Leave a review</a>
               </div>`
            : ''
        }
      </div>
      ${emailFooter()}
    </div>
  `;
}

async function sendViaGmail({ to, subject, html }) {
  const gmailUser = db.getSetting('gmail_user');
  const gmailAppPassword = db.getSetting('gmail_app_password');

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Gmail address or app password not set. Add both in Settings before sending emails.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: `EcoHaven Solutions LLC <${gmailUser}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    throw new Error(err.message || 'Email failed to send via Gmail.');
  }

  return { ok: true };
}

function buildAcceptDeclineHtml(quote, estimateTag) {
  const gmailUser = db.getSetting('gmail_user');
  if (!gmailUser) return '';

  const acceptSubject = encodeURIComponent(`Estimate ${estimateTag} — ACCEPTED`);
  const acceptBody = encodeURIComponent(`Hi, I'd like to accept estimate ${estimateTag} (${quote.title}). Please go ahead and schedule it.`);
  const declineSubject = encodeURIComponent(`Estimate ${estimateTag} — Declined`);
  const declineBody = encodeURIComponent(`Hi, I won't be moving forward with estimate ${estimateTag} (${quote.title}) at this time.`);

  return `
    <div style="text-align:center;margin-top:22px;">
      <a href="mailto:${gmailUser}?subject=${acceptSubject}&body=${acceptBody}" style="background:#4F5C36;color:#fff;text-decoration:none;padding:13px 24px;border-radius:8px;display:inline-block;font-weight:600;font-size:15px;margin:0 6px;">Accept estimate</a>
      <a href="mailto:${gmailUser}?subject=${declineSubject}&body=${declineBody}" style="background:transparent;color:#6B7263;text-decoration:underline;padding:13px 10px;display:inline-block;font-size:14px;margin:0 6px;">Not right now</a>
    </div>
    <p style="text-align:center;color:#8A9080;font-size:11px;margin-top:8px;">Clicking a button opens a reply email — nothing is final until we confirm.</p>
  `;
}

async function sendEstimateEmail(quoteId) {
  const quote = db.getQuote(quoteId);
  if (!quote) throw new Error('Estimate not found');
  const customer = db.getCustomer(quote.customer_id);
  if (!customer || !customer.email) throw new Error('This customer has no email on file.');

  const estimateTag = `E-${quote.number}`;
  const acceptDeclineHtml = buildAcceptDeclineHtml(quote, estimateTag);

  const html = wrapEmail({
    heading: `Estimate: ${quote.title}`,
    intro: `Hi ${customer.name}, here is your estimate from EcoHaven Solutions LLC.`,
    itemsHtml: lineItemsTable(quote.items),
    subtotal: quote.subtotal,
    taxRate: quote.tax_rate,
    total: quote.total,
    notes: quote.notes,
    footer: `Estimate #${estimateTag}`,
    extraHtml: acceptDeclineHtml,
  });

  const result = await sendViaGmail({
    to: customer.email,
    subject: `Estimate from EcoHaven Solutions LLC — ${quote.title}`,
    html,
  });
  db.markQuoteSent(quoteId);
  return result;
}

async function sendInvoiceEmail(invoiceId) {
  const invoice = db.getInvoice(invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  const customer = db.getCustomer(invoice.customer_id);
  if (!customer || !customer.email) throw new Error('This customer has no email on file.');

  const dueText = invoice.due_date ? ` Payment is due by ${invoice.due_date}.` : '';

  const html = wrapEmail({
    heading: `Invoice: ${invoice.title}`,
    intro: `Hi ${customer.name}, here is your invoice from EcoHaven Solutions LLC.${dueText}`,
    itemsHtml: lineItemsTable(invoice.items),
    subtotal: invoice.subtotal,
    taxRate: invoice.tax_rate,
    total: invoice.total,
    notes: invoice.notes,
    footer: `Invoice #I-${invoice.number}`,
    paymentLinkUrl: invoice.payment_link_url,
    reviewUrl: db.getSetting('google_review_url'),
  });

  return sendViaGmail({
    to: customer.email,
    subject: `Invoice from EcoHaven Solutions LLC — ${invoice.title}`,
    html,
  });
}

function wrapSimpleEmail({ heading, bodyHtml, ctaText, ctaUrl }) {
  return `
    <div style="max-width:580px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#23261F;background:#FFFFFF;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-radius:12px;overflow:hidden;">
      ${emailHeader()}
      <div style="padding:28px 24px;">
        <div style="border-left:4px solid #4F5C36;padding-left:14px;margin-bottom:18px;">
          <h2 style="margin:0;font-family:Georgia,serif;font-size:20px;">${escapeHtml(heading)}</h2>
        </div>
        <div style="line-height:1.5;">${bodyHtml}</div>
        ${
          ctaUrl
            ? `<div style="text-align:center;margin-top:22px;">
                 <a href="${ctaUrl}" style="background:#4F5C36;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;display:inline-block;font-weight:600;font-size:15px;">${escapeHtml(ctaText || 'Click here')}</a>
               </div>`
            : ''
        }
      </div>
      ${emailFooter()}
    </div>
  `;
}

async function sendJobReminderEmail(jobId) {
  const job = db.getJob(jobId);
  if (!job) throw new Error('Job not found');
  const customer = db.getCustomer(job.customer_id);
  if (!customer || !customer.email) throw new Error('This customer has no email on file.');

  let heading, bodyHtml, subject;

  if (job.scheduled_date) {
    const dateLabel = new Date(`${job.scheduled_date}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const timeLabel = job.scheduled_time
      ? new Date(`2000-01-01T${job.scheduled_time}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : null;
    const timeEndLabel = job.scheduled_time_end
      ? new Date(`2000-01-01T${job.scheduled_time_end}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : null;
    const timeText = timeLabel ? (timeEndLabel ? `between ${timeLabel} and ${timeEndLabel}` : `at ${timeLabel}`) : ' — time to be confirmed';

    heading = 'See you soon!';
    bodyHtml = `<p>Hi ${escapeHtml(customer.name)}, just a reminder that we have you scheduled for:</p>
      <p style="font-size:16px;font-weight:600;">${escapeHtml(job.title)}</p>
      <p>${dateLabel}${timeLabel ? ` ${timeText}` : timeText}</p>`;
    subject = `Reminder: ${job.title} — ${dateLabel}`;
  } else {
    heading = "We'll be in touch to schedule";
    bodyHtml = `<p>Hi ${escapeHtml(customer.name)}, we have you down for:</p>
      <p style="font-size:16px;font-weight:600;">${escapeHtml(job.title)}</p>
      <p>We'll follow up soon to lock in a date and time.</p>`;
    subject = `Upcoming: ${job.title}`;
  }

  const html = wrapSimpleEmail({ heading, bodyHtml });

  const result = await sendViaGmail({
    to: customer.email,
    subject,
    html,
  });
  db.markReminderSent(jobId);
  return result;
}

async function sendReviewRequestEmail(jobId) {
  const job = db.getJob(jobId);
  if (!job) throw new Error('Job not found');
  const customer = db.getCustomer(job.customer_id);
  if (!customer || !customer.email) throw new Error('This customer has no email on file.');

  const reviewUrl = db.getSetting('google_review_url');
  if (!reviewUrl) throw new Error('No Google review link set. Add one in Settings first.');

  const html = wrapSimpleEmail({
    heading: 'How did we do?',
    bodyHtml: `<p>Hi ${escapeHtml(customer.name)}, thanks for choosing EcoHaven Solutions LLC for "${escapeHtml(job.title)}"!</p>
      <p>If you have a minute, a quick review really helps our small business.</p>`,
    ctaText: 'Leave a review',
    ctaUrl: reviewUrl,
  });

  const result = await sendViaGmail({
    to: customer.email,
    subject: `Thanks from EcoHaven Solutions LLC!`,
    html,
  });
  db.markReviewRequested(jobId);
  return result;
}

async function sendEstimateFollowupEmail(quoteId, stage) {
  const quote = db.getQuote(quoteId);
  if (!quote) throw new Error('Estimate not found');
  const customer = db.getCustomer(quote.customer_id);
  if (!customer || !customer.email) throw new Error('This customer has no email on file.');

  const estimateTag = `E-${quote.number}`;
  const acceptDeclineHtml = buildAcceptDeclineHtml(quote, estimateTag);

  const heading = stage === 2 ? 'Still interested?' : 'Just checking in';
  const intro =
    stage === 2
      ? `Hi ${customer.name}, following up one more time on the estimate below — happy to answer any questions or make adjustments if needed.`
      : `Hi ${customer.name}, just a friendly follow-up on the estimate we sent a couple weeks ago.`;

  const html = wrapEmail({
    heading,
    intro,
    itemsHtml: lineItemsTable(quote.items),
    subtotal: quote.subtotal,
    taxRate: quote.tax_rate,
    total: quote.total,
    notes: quote.notes,
    footer: `Estimate #${estimateTag}`,
    extraHtml: acceptDeclineHtml,
  });

  const result = await sendViaGmail({
    to: customer.email,
    subject: stage === 2 ? `Final follow-up: ${quote.title}` : `Following up: ${quote.title}`,
    html,
  });
  db.markQuoteFollowupSent(quoteId, stage);
  return result;
}

module.exports = {
  sendEstimateEmail,
  sendInvoiceEmail,
  sendJobReminderEmail,
  sendReviewRequestEmail,
  sendEstimateFollowupEmail,
};
