// Supabase Edge Function: public-lead-intake
// Paste into Supabase Dashboard -> Edge Functions -> public-lead-intake -> replace all code -> Deploy.
// IMPORTANT: "Enforce JWT verification" should stay OFF -- this is
// meant to be called by anonymous website visitors with no login at all,
// AND to be hit as a plain GET link (no auth) when a customer clicks
// "Accept This Estimate" in their email.
// Secrets needed for the pricing email: GMAIL_USER, GMAIL_APP_PASSWORD
// (same ones send-notification already uses).
// Requires the SQL in add_lead_estimate_link.sql to have been run first
// (adds quotes.lead_id and quotes.public_token, makes quotes.customer_id
// nullable) and add_address_to_leads.sql (adds leads.address).
//
// CURRENT BEHAVIOR, main quote form (services selected):
//   1. Always creates a Lead (for Justen to review/manage).
//   2. If the customer picked at least one service, ALSO creates a real
//      Estimate ("quotes" row + "quote_items") linked to that Lead via
//      lead_id -- NOT to a Customer. customer_id stays null until Justen
//      manually converts the Lead to a Customer from the app (at which
//      point the app re-points this same estimate's customer_id at the
//      new Customer automatically -- see phone-app/supabase-api.js).
//   3. If they also gave an email, they get an instant pricing email with
//      an "Accept This Estimate" button. Clicking it is a plain GET back
//      to this same function (?accept=<public_token>) that flips the
//      estimate's status to "approved" (the same status the app already
//      uses for an accepted/converted estimate) and shows a small
//      confirmation page -- no login, no e-signature, just a status flip
//      so Justen knows to follow up and get them scheduled. This also
//      fires off a notification email to Justen himself (sent to
//      GMAIL_USER, the same account the app already sends from) the
//      moment someone accepts, so he doesn't have to go looking for it.
//   4. If no services were selected (just a general message), only the
//      Lead is created -- no estimate, no accept link.
//
// Both the main form and the free-catalog request require phone AND
// address; email is optional on the main form (no email = no automatic
// pricing email, but the Lead/Estimate are still created) but stays
// required on the catalog request specifically, since emailing a download
// link is the only way that feature can actually deliver the PDF.
//
// Yard-size / tier pricing (Budget-Friendly vs Premium, Small/Medium/Large)
// resolves exactly as before -- see resolveServices() below.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const FUNCTION_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/public-lead-intake`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function escapeHtml(str: string) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function currency(n: number) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function wrapEmail(heading: string, bodyHtml: string) {
  const html = `
    <div style="max-width:580px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#F5F5F0;background:#3A3A38;border-radius:12px;overflow:hidden;border:1px solid #5A5A55;">
      <div style="background:#3E7C98;padding:24px;text-align:center;color:#fff;">
        <div style="font-size:18px;font-weight:700;">EcoHaven Solutions LLC</div>
        <div style="font-size:12px;color:#D8E0CC;">SPRINKLER INSTALLS &middot; REPAIRS &middot; UPGRADES</div>
      </div>
      <div style="padding:24px;">
        <h2 style="margin-top:0;font-weight:700;">${escapeHtml(heading)}</h2>
        ${bodyHtml}
      </div>
      <div style="background:#2E2E2C;padding:14px;text-align:center;font-size:12px;color:#C4C4BC;">
        Call/Text 509-866-6388 &middot; ecohavenpro.com
      </div>
    </div>
  `;
  return html.replace(/\s+/g, ' ').trim();
}

// Small standalone HTML page for the accept-link click itself (not an
// email) -- same dark theme, no dependency on anything else loading.
function statusPage(heading: string, message: string) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(heading)} - EcoHaven Solutions</title></head>
<body style="margin:0;background:#2E2E2C;font-family:Helvetica,Arial,sans-serif;color:#F5F5F0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
  <div style="max-width:480px;width:100%;background:#3A3A38;border:1px solid #5A5A55;border-radius:12px;overflow:hidden;text-align:center;">
    <div style="background:#3E7C98;padding:22px;">
      <div style="font-size:17px;font-weight:700;">EcoHaven Solutions LLC</div>
    </div>
    <div style="padding:28px 24px;">
      <h1 style="margin:0 0 12px;font-size:22px;">${escapeHtml(heading)}</h1>
      <p style="margin:0;font-size:15px;color:#D8D8D2;line-height:1.5;">${escapeHtml(message)}</p>
    </div>
    <div style="background:#2E2E2C;padding:14px;font-size:12px;color:#C4C4BC;">
      Call/Text 509-866-6388 &middot; ecohavenpro.com
    </div>
  </div>
</body></html>`;
  return html;
}

async function sendMail(to: string, subject: string, html: string, attachments?: any[]) {
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!gmailUser || !gmailAppPassword) throw new Error('Gmail credentials not configured.');

  const client = new SMTPClient({
    connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: gmailUser, password: gmailAppPassword } },
  });
  await client.send({
    from: `EcoHaven Solutions LLC <${gmailUser}>`,
    to,
    subject,
    content: 'HTML email.',
    html,
    ...(attachments ? { attachments } : {}),
  });
  await client.close();
}

// Mirrors the app's own generateDocNumber() (phone-app/supabase-api.js) so
// estimates created from the website use the same style of 4-digit number
// and don't collide with ones created inside the app.
async function generateQuoteNumber() {
  const { data: existing } = await supabase.from('quotes').select('number');
  const taken = new Set((existing || []).map((r: any) => r.number).filter(Boolean));
  const digits = 4;
  while (true) {
    const candidate = String(Math.floor(Math.random() * 9 * 10 ** (digits - 1)) + 10 ** (digits - 1));
    if (!taken.has(candidate)) return candidate;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const acceptToken = url.searchParams.get('accept');

    // A customer clicked "Accept This Estimate" in their email.
    if (acceptToken) {
      try {
        const { data: quote } = await supabase.from('quotes').select('id, status, number, title, lead_id').eq('public_token', acceptToken).maybeSingle();
        if (!quote) {
          return new Response(
            statusPage('Link Not Found', "This estimate link is invalid or has expired. Please call/text 509-866-6388 and we'll help sort it out."),
            { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
          );
        }
        if (quote.status === 'approved') {
          return new Response(
            statusPage('Already Accepted', "This estimate was already accepted -- we'll be in touch soon to get you scheduled!"),
            { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
          );
        }
        await supabase.from('quotes').update({ status: 'approved' }).eq('id', quote.id);

        // Let Justen know right away, so he doesn't have to notice it on
        // his own by re-opening the Lead or the Estimates tab. Sent to the
        // same Gmail account the app already sends from (GMAIL_USER) --
        // sending to yourself from yourself works fine and lands in the
        // inbox. Never blocks the customer's confirmation page.
        try {
          const gmailUser = Deno.env.get('GMAIL_USER');
          if (gmailUser) {
            let leadLineHtml = '';
            if (quote.lead_id) {
              const { data: lead } = await supabase.from('leads').select('name, phone, address').eq('id', quote.lead_id).maybeSingle();
              if (lead) {
                leadLineHtml = `<p style="margin-top:0;"><strong>${escapeHtml(lead.name)}</strong>${lead.phone ? ' — ' + escapeHtml(lead.phone) : ''}${lead.address ? '<br>' + escapeHtml(lead.address) : ''}</p>`;
              }
            }
            const notifyBodyHtml = `
              ${leadLineHtml}
              <p>${quote.number ? `Estimate #${escapeHtml(quote.number)}` : 'An estimate'}${quote.title ? ` (${escapeHtml(quote.title)})` : ''} was just accepted online.</p>
              <p style="font-size:13px;color:#C4C4BC;">Open the Estimates tab (or the linked Lead) in the app to review it, convert the Lead to a Customer, and get them scheduled.</p>
            `;
            await sendMail(
              gmailUser,
              `Estimate Accepted${quote.number ? ' — #' + quote.number : ''}`,
              wrapEmail('An Estimate Was Accepted ✓', notifyBodyHtml)
            );
          }
        } catch (notifyErr) {
          // Don't fail the customer's accept flow just because the
          // notification email hiccuped -- the estimate's status is
          // already updated either way.
        }

        return new Response(
          statusPage(
            'Estimate Accepted!',
            `Thanks for accepting your estimate${quote.number ? ' (#' + quote.number + ')' : ''}. We'll be in touch soon to get you scheduled. Questions in the meantime? Call/text 509-866-6388.`
          ),
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      } catch (err) {
        return new Response(
          statusPage('Something Went Wrong', 'We could not process that right now. Please call/text 509-866-6388.'),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }
    }

    // Plain GET (no ?accept=): the form asks for the list of preset
    // services + categories to show. No price fields are sent to the
    // client here -- the public form never shows prices, by design.
    // Pricing is only resolved server-side.
    try {
      const { data: services } = await supabase.from('line_item_templates').select('id, description, notes, allow_quantity, category, has_tier_pricing, has_size_pricing').order('description');
      const { data: categories } = await supabase.from('service_categories').select('id, name, image_url').order('sort_order');
      return new Response(JSON.stringify({ ok: true, services: services || [], categories: categories || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  try {
    const body = await req.json();

    // Honeypot: a hidden field real visitors never fill in. If it's got
    // anything in it, it's almost certainly a bot -- pretend success and
    // silently drop it rather than tipping the bot off.
    if (body.website) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Free catalog request -- a separate, much simpler flow from the main
    // estimate form. No services, no tier/size pricing, no Estimate created.
    // Just: log a Lead so Justen sees who asked, then email the PDF as a
    // signed Storage link (never load the file into memory here -- Edge
    // Functions have a real memory ceiling and a multi-MB attachment blew
    // past it during testing). The PDF lives in a Storage bucket named
    // "catalogs", file "drought-tolerant-catalog.pdf".
    if (body.catalogRequest === true) {
      const catName = (body.name || '').toString().trim().slice(0, 200);
      const catEmail = (body.email || '').toString().trim().slice(0, 200);
      const catPhone = (body.phone || '').toString().trim().slice(0, 50);
      const catAddress = (body.address || '').toString().trim().slice(0, 300);

      if (!catName) {
        return new Response(JSON.stringify({ ok: false, error: 'Name is required.' }), { status: 400, headers: corsHeaders });
      }
      if (!catPhone) {
        return new Response(JSON.stringify({ ok: false, error: 'Phone number is required.' }), { status: 400, headers: corsHeaders });
      }
      if (!catAddress) {
        return new Response(JSON.stringify({ ok: false, error: 'Address is required.' }), { status: 400, headers: corsHeaders });
      }
      // Email stays required here (unlike the main form) since it's the only
      // way this feature can actually deliver the catalog -- no email, no
      // way to send the download link.
      if (!catEmail) {
        return new Response(JSON.stringify({ ok: false, error: 'Email is required so we can send the catalog.' }), { status: 400, headers: corsHeaders });
      }

      try {
        await supabase.from('leads').insert({
          name: catName,
          phone: catPhone,
          email: catEmail,
          address: catAddress,
          notes: 'Requested the free Drought-Tolerant Landscaping Catalog.',
          source: 'Website catalog request',
          status: 'new',
        });
      } catch (err) {
        // Don't block sending the catalog just because the Lead insert hiccuped.
      }

      try {
        const { data: signedData, error: signError } = await supabase.storage
          .from('catalogs')
          .createSignedUrl('drought-tolerant-catalog.pdf', 60 * 60 * 24 * 30); // link valid 30 days
        if (signError || !signedData?.signedUrl) throw new Error('Catalog file not found in storage.');

        const bodyHtml = `
          <p>Hi ${escapeHtml(catName)}, thanks for your interest! Your free Drought-Tolerant Landscaping Catalog is ready to download below.</p>
          <div style="text-align:center;margin:22px 0;">
            <a href="${signedData.signedUrl}" style="display:inline-block;background:#5FBF3E;color:#fff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Download Your Catalog (PDF)</a>
          </div>
          <p style="margin-top:16px;font-size:13px;color:#C4C4BC;">
            Ready to get started, or have a question about anything in the catalog?
            Just reply to this email or call/text 509-866-6388 -- we're happy to help.
          </p>
        `;
        await sendMail(
          catEmail,
          'Your Free Drought-Tolerant Landscaping Catalog',
          wrapEmail('Your Free Catalog Is Ready', bodyHtml)
        );

        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (err) {
        console.error('Catalog send failed:', err && err.message ? err.message : err);
        return new Response(
          JSON.stringify({ ok: false, error: 'Could not send the catalog email right now. Please call/text 509-866-6388 instead.' }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    const name = (body.name || '').toString().trim().slice(0, 200);
    const phone = (body.phone || '').toString().trim().slice(0, 50);
    const email = (body.email || '').toString().trim().slice(0, 200);
    const address = (body.address || '').toString().trim().slice(0, 300);
    const notes = (body.message || '').toString().trim().slice(0, 2000);
    // selectedServices: [{ id, quantity, tier, size }]. Also accept the older
    // selectedServiceIds format (plain array of ids, quantity 1 each,
    // budget tier, medium size) so nothing breaks if an older cached copy of
    // the form is still live.
    const rawSelections: any[] = Array.isArray(body.selectedServices)
      ? body.selectedServices
      : Array.isArray(body.selectedServiceIds)
        ? body.selectedServiceIds.map((id: any) => ({ id, quantity: 1 }))
        : [];
    const selections = rawSelections
      .slice(0, 50)
      .map((s) => ({
        id: Number(s.id),
        quantity: Math.max(0.01, Number(s.quantity) || 1),
        detail: (s.detail || '').toString().trim().slice(0, 300),
        tier: s.tier === 'budget' ? 'budget' : 'premium',
        size: ['small', 'medium', 'large'].includes(s.size) ? s.size : 'medium',
      }))
      .filter((s) => Number.isFinite(s.id));

    if (!name) {
      return new Response(JSON.stringify({ ok: false, error: 'Name is required.' }), { status: 400, headers: corsHeaders });
    }
    if (!phone) {
      return new Response(JSON.stringify({ ok: false, error: 'Phone number is required.' }), { status: 400, headers: corsHeaders });
    }
    if (!address) {
      return new Response(JSON.stringify({ ok: false, error: 'Address is required.' }), { status: 400, headers: corsHeaders });
    }

    let selectedServices: any[] = [];
    let totalMin = 0;
    let totalMax = 0;
    if (selections.length) {
      const { data } = await supabase.from('line_item_templates').select('*').in('id', selections.map((s) => s.id));
      selectedServices = (data || []).map((svc: any) => {
        const match = selections.find((s) => s.id === svc.id);
        const tier = match ? match.tier : 'premium';
        const size = match ? match.size : 'medium';
        // Step 1: resolve the tier price -- this is the "Medium" price for
        // whichever tier was picked. unit_price/unit_price_max are the
        // always-required Premium/standard range and are the default. Only
        // switch to the cheaper budget_price range when this item actually
        // offers tiering AND the customer picked Budget-Friendly AND a
        // distinct budget price was set.
        const useBudget = !!svc.has_tier_pricing && tier === 'budget' && svc.budget_price != null;
        let unit_price = useBudget ? Number(svc.budget_price) : Number(svc.unit_price || 0);
        let unit_price_max = useBudget
          ? (svc.budget_price_max != null ? Number(svc.budget_price_max) : Number(svc.budget_price))
          : (svc.unit_price_max != null ? Number(svc.unit_price_max) : Number(svc.unit_price || 0));

        // Step 2: apply a Small/Large override on top of that tier price, if
        // this item offers size pricing and the customer didn't pick Medium.
        // Each size override is itself per-tier (a Budget-Friendly item can
        // have different Small/Large prices than its Premium counterpart) --
        // if the specific size+tier price wasn't set, it quietly falls back
        // to the Medium price for that same tier.
        if (svc.has_size_pricing && size !== 'medium') {
          const sizePriceField = size === 'small' ? (useBudget ? 'small_budget_price' : 'small_price') : (useBudget ? 'large_budget_price' : 'large_price');
          const sizePriceMaxField = size === 'small' ? (useBudget ? 'small_budget_price_max' : 'small_price_max') : (useBudget ? 'large_budget_price_max' : 'large_price_max');
          if (svc[sizePriceField] != null) {
            unit_price = Number(svc[sizePriceField]);
            unit_price_max = svc[sizePriceMaxField] != null ? Number(svc[sizePriceMaxField]) : unit_price;
          }
        }

        return {
          ...svc,
          unit_price,
          unit_price_max,
          quantity: match ? match.quantity : 1,
          detail: match ? match.detail : '',
          tier,
          size,
        };
      });
      totalMin = selectedServices.reduce((s, i) => s + Number(i.unit_price || 0) * i.quantity, 0);
      totalMax = selectedServices.reduce((s, i) => s + Number(i.unit_price_max || i.unit_price || 0) * i.quantity, 0);
    }
    const isRangeTotal = totalMax > totalMin;
    const totalDisplay = isRangeTotal ? `${currency(totalMin)}–${currency(totalMax)}` : currency(totalMin);

    function priceDisplay(s: any) {
      return s.unit_price_max && s.unit_price_max > s.unit_price ? `${currency(s.unit_price)}–${currency(s.unit_price_max)}` : currency(s.unit_price);
    }

    function tierSuffix(s: any) {
      return s.tier === 'budget' ? ' [Budget-Friendly]' : '';
    }

    function sizeLabel(s: any) {
      return s.size === 'small' ? 'Small yard' : s.size === 'large' ? 'Large yard' : 'Medium yard';
    }

    function sizeSuffix(s: any) {
      return s.has_size_pricing && s.size !== 'medium' ? ` [${sizeLabel(s)}]` : '';
    }

    function lineDisplay(s: any) {
      const qtyLabel = s.quantity !== 1 ? ` x${s.quantity}` : '';
      const lineMin = s.unit_price * s.quantity;
      const lineMax = (s.unit_price_max || s.unit_price) * s.quantity;
      const lineTotal = lineMax > lineMin ? `${currency(lineMin)}–${currency(lineMax)}` : currency(lineMin);
      const detailNote = s.detail ? ` [${s.detail}]` : '';
      return `${s.description}${qtyLabel}${detailNote}${tierSuffix(s)}${sizeSuffix(s)} (${priceDisplay(s)} each) — ${lineTotal}`;
    }

    // Every submission becomes a Lead for Justen to review. When services
    // were selected, their resolved pricing is ALSO saved as a real
    // Estimate (quotes + quote_items) linked to this Lead via lead_id, so
    // it shows up directly in the Estimates tab -- customer_id stays null
    // until Justen converts the Lead to a Customer, at which point the app
    // re-points this same estimate at the new Customer automatically.
    const leadNotesParts: string[] = [];
    if (notes) leadNotesParts.push(notes);
    if (selectedServices.length) {
      leadNotesParts.push('Selected services:\n' + selectedServices.map((s) => `- ${lineDisplay(s)}`).join('\n'));
      leadNotesParts.push(`Estimated total: ${totalDisplay}`);
    }

    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name,
        phone,
        email: email || null,
        address,
        notes: leadNotesParts.join('\n\n') || null,
        source: 'Website form',
        status: 'new',
      })
      .select()
      .single();
    if (leadError) throw leadError;

    let createdQuote: any = null;
    if (selectedServices.length) {
      const number = await generateQuoteNumber();
      const publicToken = crypto.randomUUID();
      const { data: quoteRow, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          lead_id: newLead.id,
          customer_id: null,
          title: `${name} — Website estimate request`,
          status: 'sent',
          number,
          tax_rate: 0,
          notes: notes || null,
          public_token: publicToken,
        })
        .select()
        .single();
      if (!quoteError && quoteRow) {
        const itemRows = selectedServices.map((s, index) => ({
          quote_id: quoteRow.id,
          description: `${s.description}${tierSuffix(s)}${sizeSuffix(s)}${s.detail ? ` [${s.detail}]` : ''}`,
          quantity: s.quantity,
          unit_price: s.unit_price,
          sort_order: index,
          notes: s.unit_price_max && s.unit_price_max > s.unit_price ? `Range up to ${currency(s.unit_price_max)} each` : null,
        }));
        if (itemRows.length) await supabase.from('quote_items').insert(itemRows);
        createdQuote = quoteRow;
      } else if (quoteError) {
        console.error('Estimate creation failed (Lead was still saved):', quoteError.message);
      }
    }

    // If they gave us an email, send an automatic preliminary price
    // breakdown right away -- no waiting on a callback. Includes an
    // "Accept This Estimate" button when a real Estimate was created.
    if (email && selectedServices.length) {
      try {
        const rows = selectedServices
          .map((s) => {
            const lineMin = s.unit_price * s.quantity;
            const lineMax = (s.unit_price_max || s.unit_price) * s.quantity;
            const lineTotal = lineMax > lineMin ? `${currency(lineMin)}–${currency(lineMax)}` : currency(lineMin);
            // Budget-Friendly gets its OWN description (budget_notes) -- it
            // never falls back to the standard/Premium notes text, even if
            // budget_notes is blank, since the two tiers can be different
            // enough jobs that reusing the Premium description would be
            // misleading.
            const descriptionText = s.tier === 'budget' ? s.budget_notes : s.notes;
            const notesHtml = descriptionText ? `<div style="font-size:12px;color:#A9AC9E;margin-top:2px;">${escapeHtml(descriptionText)}</div>` : '';
            const detailHtml = s.detail ? `<div style="font-size:12px;color:#A9AC9E;margin-top:2px;">${escapeHtml(s.detail)}</div>` : '';
            const tierHtml = s.tier === 'budget' ? ' <span style="font-size:11px;color:#8FDB74;">(Budget-Friendly)</span>' : '';
            const sizeHtml = s.has_size_pricing && s.size !== 'medium' ? ` <span style="font-size:11px;color:#8FDB74;">(${sizeLabel(s)})</span>` : '';
            return `<tr><td style="padding:6px;">${escapeHtml(s.description)}${tierHtml}${sizeHtml}${notesHtml}${detailHtml}</td><td style="padding:6px;text-align:center;">${s.quantity}</td><td style="padding:6px;text-align:right;">${lineTotal}</td></tr>`;
          })
          .join('');
        const acceptButtonHtml = createdQuote
          ? `
          <div style="text-align:center;margin:22px 0;">
            <a href="${FUNCTION_URL}?accept=${createdQuote.public_token}" style="display:inline-block;background:#5FBF3E;color:#fff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:8px;">Accept This Estimate</a>
          </div>
          <p style="text-align:center;font-size:12px;color:#A9AC9E;margin-top:-12px;">Ready to move forward? Tap above and we'll get you scheduled.</p>
        `
          : '';
        const bodyHtml = `
          <p>Hi ${escapeHtml(name)}, thanks for reaching out! Here's a preliminary estimate based on what you selected:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead><tr style="background:#5FBF3E;"><th style="padding:6px;text-align:left;color:#fff;font-weight:700;">Service</th><th style="padding:6px;color:#fff;font-weight:700;">Qty</th><th style="padding:6px;text-align:right;color:#fff;font-weight:700;">Price</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:12px;font-size:16px;font-weight:700;">Estimated total: ${totalDisplay}</div>
          ${acceptButtonHtml}
          <p style="margin-top:16px;font-size:13px;color:#C4C4BC;">
            This is a preliminary estimate based on standard pricing -- actual
            pricing may vary once we've seen the site. Questions in the
            meantime? Call/text 509-866-6388.
          </p>
        `;
        await sendMail(email, 'Your preliminary estimate from EcoHaven Solutions', wrapEmail("Here's your estimate", bodyHtml));
      } catch (err) {
        // Don't fail the whole submission just because the email hiccuped --
        // the Lead/Estimate are already saved either way.
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
});
