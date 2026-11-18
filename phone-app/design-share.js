// ============================================================================
// design-share.js — Customer presentation link for a design.
//
// Builds a private web page for the customer containing: the plan, 3D views
// (including a night view), photo mockups with before/after, the plant list,
// and Good / Better / Best options with prices. The customer taps a button to
// approve an option; you get an email, and (if Stripe is set up on the
// server) they get a deposit payment link right away.
// Pictures are uploaded to the same storage the app already uses. The page
// itself is quote-page/design.html and the approval handling is the Supabase
// function "design-share" (see the setup file that came with the installer).
// ============================================================================
(function () {
  'use strict';
  const DPRO = window.DPRO;
  if (!DPRO) return;
  const $ = (id) => document.getElementById(id);
  const esc = DPRO.esc;
  const CATP = window.DESIGN_CATALOG;

  const css = document.createElement('style');
  css.textContent = `
  #dpro-share{position:fixed;inset:0;z-index:5000;background:rgba(8,10,14,.86);overflow:auto;padding:18px 10px;font-family:inherit}
  #dpro-share[hidden]{display:none}
  .sh-card{max-width:860px;margin:0 auto;background:#1a1f26;color:#EDEDED;border:1px solid #2f3742;border-radius:14px;padding:18px}
  .sh-card h2{margin:0 0 4px;font-size:19px} .sh-card h3{margin:20px 0 8px;font-size:14px;color:#9fb0c3;text-transform:uppercase;letter-spacing:.05em}
  .sh-card p.sm{color:#9fb0c3;font-size:13px;margin:2px 0 8px}
  .sh-card label{display:block;font-size:12px;color:#9fb0c3;margin:8px 0 3px}
  .sh-card input[type=text],.sh-card input[type=email],.sh-card input[type=number],.sh-card textarea,.sh-card select{width:100%;box-sizing:border-box;background:#232a34;color:#EDEDED;border:1px solid #37404d;border-radius:8px;padding:8px;font-size:14px;font-family:inherit}
  .sh-card textarea{min-height:64px;resize:vertical}
  .sh-btn{background:#232a34;color:#EDEDED;border:1px solid #37404d;border-radius:8px;padding:9px 14px;font-size:14px;cursor:pointer}
  .sh-btn.pri{background:#3E8E41;border-color:#5FBF3E;color:#fff;font-weight:700} .sh-btn[disabled]{opacity:.5}
  .sh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
  .sh-tier{border:1px solid #37404d;border-radius:10px;padding:10px;background:#20262e}
  .sh-tier.off{opacity:.5}
  .sh-src{display:flex;gap:8px;align-items:flex-start;padding:7px 8px;border:1px solid #2f3742;border-radius:8px;margin-bottom:6px;background:#20262e;font-size:13px}
  .sh-src input{margin-top:3px} .sh-src small{display:block;color:#9fb0c3}
  .sh-status{background:#16301f;border:1px solid #2f6a3d;border-radius:10px;padding:10px;margin:10px 0;font-size:13px}
  .sh-status.warn{background:#3a2d12;border-color:#7a5a1d}
  .sh-link{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px}
  .sh-link input{flex:1;min-width:200px}
  .sh-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  `;
  document.head.appendChild(css);
  const modal = document.createElement('div');
  modal.id = 'dpro-share'; modal.hidden = true; document.body.appendChild(modal);

  let existing = null, busy = false, tableMissing = false;
  const THREE_PRESETS = [
    { id: 'aerial-install', label: 'Aerial view: at install', sub: 'Shows how the yard looks right after planting', opts: { view: 'aerial', growth: 'install', hour: 16, month: 5 }, def: false },
    { id: 'aerial-mature', label: 'Aerial view: mature', sub: 'The finished, grown-in look', opts: { view: 'aerial', growth: 'mature', hour: 16, month: 5 }, def: true },
    { id: 'front', label: 'Front view at eye level', sub: 'Looks across the yard toward the house', opts: { view: 'front', growth: 'yr5', hour: 17, month: 5 }, def: true },
    { id: 'night', label: 'Night view with lighting', sub: 'Only useful if the design has lights', opts: { view: 'aerial', growth: 'yr5', night: true }, def: true },
  ];

  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const linkFor = (token) => new URL('../quote-page/design.html?t=' + encodeURIComponent(token), window.location.href).href;
  function newToken() { const a = new Uint8Array(18); crypto.getRandomValues(a); return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join(''); }

  function hasLights() { return elements.some((e) => e.type === 'lightrun' || e.type === 'lightpoint'); }
  // The plan itself (shapes, plants, lights) so the customer page can rebuild the 3D model and let them move around in it.
  function sceneData() {
    const els = JSON.parse(JSON.stringify(elements)).filter((e) => !JSON.stringify(e).includes('data:image'));
    const sc = { elements: els, pxPerFt, northDeg: Number(DPRO.extras && DPRO.extras.northDeg) || 0, night: !!(DPRO.extras && DPRO.extras.night) };
    if (JSON.stringify(sc).length > 1800000) throw new Error('This design is too big to share in 3D. Turn off the 3D walk-around option, or remove some unused shapes.');
    return sc;
  }
  function plantRows() {
    const m = new Map(); elements.filter((e) => e.type === 'plant').forEach((e) => m.set(e.plantKey, (m.get(e.plantKey) || 0) + 1));
    const out = []; m.forEach((qty, k) => { const p = CATP.PLANT_CATALOG.find((x) => x.key === k); if (p) out.push({ code: p.code, name: p.name, qty, size: `${p.heightFt}' tall x ${p.spreadFt}' wide`, sun: p.sun, water: p.water, category: p.category }); });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  // ---------- plan image ----------
  function flatten(dataUrl, w, h) {
    return new Promise((res) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0); res(c.toDataURL('image/jpeg', 0.9)); }; im.src = dataUrl; });
  }
  async function planImage() {
    const st = stage; if (!st || !elements.length) return null;
    const old = { sx: st.scaleX(), sy: st.scaleY(), x: st.x(), y: st.y(), w: st.width(), h: st.height() };
    DPRO.hideHandles && DPRO.hideHandles();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const add = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
    elements.forEach((e) => {
      if (e.points && e.points.length >= 4) { for (let i = 0; i < e.points.length; i += 2) add(e.points[i], e.points[i + 1], 2); }
      else if (typeof e.x === 'number' && typeof e.y === 'number') {
        let r = 14; if (e.type === 'plant') { const pl = CATP.PLANT_CATALOG.find((p) => p.key === e.plantKey); if (pl) r = Math.max(14, (pl.spreadFt / 2) * pxPerFt * 1.1); }
        else if (e.type === 'head') r = Math.max(14, (typeof e.radiusFt === 'number' ? e.radiusFt : 8) * pxPerFt);
        add(e.x, e.y, r);
      } else if (e.type === 'dimension') { add(e.x1, e.y1, 2); add(e.x2, e.y2, 2); }
    });
    if (x0 > x1) return null;
    const pad = 40; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const bw = x1 - x0, bh = y1 - y0; const k = Math.min(1600 / bw, 1100 / bh); const W = Math.round(bw * k), H = Math.round(bh * k);
    const grid = gridLayer && gridLayer.visible() && DPRO.extras.exportGrid !== true;
    try {
      if (grid) gridLayer.visible(false);
      st.size({ width: W, height: H }); st.scale({ x: k, y: k }); st.position({ x: -x0 * k, y: -y0 * k }); st.draw();
      const url = st.toDataURL({ pixelRatio: 1 });
      return await flatten(url);
    } finally {
      st.size({ width: old.w, height: old.h }); st.scale({ x: old.sx, y: old.sy }); st.position({ x: old.x, y: old.y });
      if (grid) gridLayer.visible(true); st.draw();
    }
  }

  // ---------- modal ----------
  async function loadExisting() {
    tableMissing = false; existing = null;
    try {
      const { data, error } = await sb.from('design_shares').select('*').eq('design_id', currentDesign.id).order('created_at', { ascending: false }).limit(1);
      if (error) { tableMissing = /relation|does not exist|schema cache/i.test(error.message || ''); if (!tableMissing) throw error; return; }
      existing = data && data[0] || null;
    } catch (e) { tableMissing = true; }
  }
  async function customerInfo() {
    if (!currentDesign.customer_id) return { name: '', email: '', phone: '' };
    try { const { data } = await sb.from('customers').select('name,email,phone').eq('id', currentDesign.customer_id).single(); return data || {}; } catch (e) { return {}; }
  }
  async function open() {
    if (!currentDesign) return;
    modal.hidden = false; modal.innerHTML = '<div class="sh-card"><p class="sm">Loading...</p></div>';
    if (typeof saveDesign === 'function' && designDirty) { try { await saveDesign(true); } catch (e) { /* ignore */ } }
    await loadExisting();
    const cust = await customerInfo();
    render(cust);
  }
  function tierDefaults() {
    const base = (existing && existing.payload && existing.payload.tiers) || [];
    return ['good', 'better', 'best'].map((k, i) => { const t = base.find((x) => x.key === k) || {}; return { key: k, name: t.name || ['Good', 'Better', 'Best'][i], price: t.price || '', description: t.description || '', items: (t.items || []).join('\n'), on: base.length ? !!base.find((x) => x.key === k) : i === 1 }; });
  }
  function render(cust) {
    const P = (existing && existing.payload) || {};
    const mockups = (DPRO.extras.mockups || []).filter((m) => m.afterUrl);
    const dep = P.deposit || { enabled: true, percent: 25 };
    const tiers = tierDefaults();
    let h = `<div class="sh-card"><div class="sh-row"><h2 style="flex:1">Share with customer</h2><button class="sh-btn" id="sh-close" type="button">Close</button></div>
      <p class="sm">Creates a private page with your pictures and options. The customer picks one and approves it right on their phone.</p>`;
    if (tableMissing) h += '<div class="sh-status warn"><strong>One-time setup needed.</strong> The sharing table is not in your database yet. Open the setup file that came with the installer (DESIGN-SHARE-SETUP.txt) and follow step 1, then reopen this screen.</div>';
    if (existing) {
      const st = existing.status === 'approved' ? `<strong>Approved:</strong> ${esc(existing.approved_name || '')} chose <strong>${esc(((P.tiers || []).find((t) => t.key === existing.approved_tier) || {}).name || existing.approved_tier || '')}</strong>${existing.approved_at ? ' on ' + new Date(existing.approved_at).toLocaleString() : ''}${existing.deposit_url ? `<br>Deposit link: <a href="${esc(existing.deposit_url)}" target="_blank" rel="noopener" style="color:#8CC9E6">${esc(existing.deposit_url)}</a> (${money(existing.deposit_amount)})` : ''}` : `Not approved yet. Viewed ${existing.view_count || 0} time${existing.view_count === 1 ? '' : 's'}${existing.last_viewed_at ? ', last ' + new Date(existing.last_viewed_at).toLocaleString() : ''}.`;
      h += `<div class="sh-status">${st}<div class="sh-link"><input type="text" id="sh-url" readonly value="${esc(linkFor(existing.token))}" /><button class="sh-btn" id="sh-copy" type="button">Copy link</button><a class="sh-btn" id="sh-sms" style="text-decoration:none" href="#">Text it</a><a class="sh-btn" id="sh-mail" style="text-decoration:none" href="#">Email it</a><button class="sh-btn" id="sh-open" type="button">Preview</button></div></div>`;
    }
    h += `<h3>Who is it for</h3><div class="sh-grid"><div><label>Page title</label><input type="text" id="sh-title" value="${esc(P.title || currentDesign.name || 'Your landscape design')}" /></div>
      <div><label>Customer name</label><input type="text" id="sh-cname" value="${esc(P.customerName || cust.name || '')}" /></div>
      <div><label>Customer email (for the approval confirmation)</label><input type="email" id="sh-cemail" value="${esc((existing && existing.customer_email) || cust.email || '')}" /></div></div>
      <label>Message at the top of the page</label><textarea id="sh-msg" placeholder="Thanks for having us out. Here is the design we talked about...">${esc(P.message || '')}</textarea>`;
    h += '<h3>Pictures to include</h3>';
    h += `<div class="sh-src"><input type="checkbox" id="sh-plan" checked /><div><strong>Plan view</strong><small>The top-down drawing</small></div></div>`;
    THREE_PRESETS.forEach((p) => { h += `<div class="sh-src"><input type="checkbox" data-3d="${p.id}" ${p.def && (p.id !== 'night' || hasLights()) ? 'checked' : ''} ${p.id === 'night' && !hasLights() ? 'disabled' : ''} /><div><strong>3D: ${esc(p.label)}</strong><small>${esc(p.sub)}</small></div></div>`; });
    if (mockups.length) mockups.forEach((m) => { h += `<div class="sh-src"><input type="checkbox" data-mock="${m.id}" checked /><div><strong>Photo mockup: ${esc(m.name)}</strong><small>Before/after slider${m.afterNightUrl ? ' with a night version' : ''}</small></div></div>`; });
    else h += '<p class="sm">No saved photo mockups yet. Use the Photo mockup button, save one, and it shows up here.</p>';
    h += `<h3>3D walk-around</h3><div class="sh-src"><input type="checkbox" id="sh-3d" ${P.scene && P.scene.elements ? 'checked' : (existing ? '' : 'checked')} /><div><strong>Let the customer explore the design in 3D</strong><small>Adds an "Explore in 3D" button to their page: they can spin, zoom, walk through, and try other seasons, times of day and night lighting on their own phone.</small></div></div>`;
    h += `<h3>Plant list</h3><div class="sh-src"><input type="checkbox" id="sh-plants" checked /><div><strong>Include the plant list</strong><small>${plantRows().length} ${plantRows().length === 1 ? "kind" : "kinds"} of plants from the plan, with mature sizes</small></div></div>`;
    h += '<h3>Options and prices</h3><p class="sm">Turn on one, two or three options. Prices are what the customer sees, so enter the full amount you want them to pay.</p><div class="sh-grid">';
    tiers.forEach((t) => { h += `<div class="sh-tier ${t.on ? '' : 'off'}" data-tier="${t.key}"><label style="margin-top:0"><input type="checkbox" class="t-on" ${t.on ? 'checked' : ''} /> Show this option</label>
      <label>Name</label><input type="text" class="t-name" value="${esc(t.name)}" /><label>Price ($)</label><input type="number" class="t-price" min="0" step="0.01" value="${esc(t.price)}" />
      <label>Short description</label><textarea class="t-desc" placeholder="What makes this option different">${esc(t.description)}</textarea><label>What's included (one per line)</label><textarea class="t-items" placeholder="Front bed planting&#10;Mulch and edging">${esc(t.items)}</textarea></div>`; });
    h += `</div><h3>Deposit</h3><div class="sh-row"><label style="margin:0"><input type="checkbox" id="sh-dep-on" ${dep.enabled ? 'checked' : ''} /> Offer a deposit link when they approve</label><span style="flex:1"></span><label style="margin:0">Deposit %</label><input type="number" id="sh-dep-pct" min="1" max="100" value="${dep.percent || 25}" style="width:80px" /></div>
      <p class="sm">The deposit link only appears automatically if Stripe is connected to the sharing function (see the setup file). Otherwise you get an email and send the deposit invoice yourself.</p>`;
    h += `<div class="sh-row" style="margin-top:16px"><button class="sh-btn pri" id="sh-pub" type="button" ${tableMissing ? 'disabled' : ''}>${existing ? 'Update the page (same link)' : 'Create the page'}</button>${existing ? '<button class="sh-btn" id="sh-new" type="button">Make a new link instead</button>' : ''}<span id="sh-prog" class="sm" style="margin:0"></span></div></div>`;
    modal.innerHTML = h;
    $('sh-close').addEventListener('click', () => { modal.hidden = true; });
    modal.querySelectorAll('.t-on').forEach((cb) => cb.addEventListener('change', () => cb.closest('.sh-tier').classList.toggle('off', !cb.checked)));
    if (existing) {
      const url = linkFor(existing.token); const nm = $('sh-cname').value.split(' ')[0] || 'there';
      const msg = `Hi ${nm}, here is your landscape design from EcoHaven Solutions: ${url}`;
      $('sh-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(url); $('sh-copy').textContent = 'Copied'; } catch (e) { $('sh-url').select(); } });
      $('sh-sms').href = 'sms:?&body=' + encodeURIComponent(msg);
      $('sh-mail').href = 'mailto:' + encodeURIComponent($('sh-cemail').value) + '?subject=' + encodeURIComponent('Your landscape design from EcoHaven Solutions') + '&body=' + encodeURIComponent(msg + '\n\nTap the link to see the pictures, pick an option, and approve it online.');
      $('sh-open').addEventListener('click', () => window.open(url, '_blank', 'noopener'));
    }
    $('sh-pub').addEventListener('click', () => publish(false));
    const nb = $('sh-new'); if (nb) nb.addEventListener('click', () => { if (window.confirm('This creates a brand-new link. The old link keeps working but stops getting updates.')) publish(true); });
  }
  const prog = (t) => { const el = $('sh-prog'); if (el) el.textContent = t; };

  async function up(dataUrl, folder) { return uploadToStorage(dataUrl, folder); }
  async function publish(forceNew) {
    if (busy) return; busy = true; const btn = $('sh-pub'); btn.disabled = true;
    try {
      const folder = `design-shares/${currentDesign.id}`; const images = []; const mocks = [];
      if ($('sh-plan').checked) { prog('Making the plan picture...'); const u = await planImage(); if (u) images.push({ id: 'plan', type: 'plan', label: 'Plan view', url: await up(u, folder) }); }
      if (typeof DPRO.threeD.capture !== 'function' && THREE_PRESETS.some((p) => { const cb = modal.querySelector(`[data-3d="${p.id}"]`); return cb && cb.checked; })) throw new Error('Your browser is still using an old copy of the app. Close this tab, reopen the app, and try again (or use a private window).');
      const picks = THREE_PRESETS.filter((p) => { const cb = modal.querySelector(`[data-3d="${p.id}"]`); return cb && cb.checked && !cb.disabled; });
      for (let i = 0; i < picks.length; i++) {
        prog(`Rendering 3D picture ${i + 1} of ${picks.length}...`);
        const u = await DPRO.threeD.capture(picks[i].opts); images.push({ id: '3d-' + picks[i].id, type: '3d', label: picks[i].label.replace(/^Aerial view/, 'Aerial view').replace(/^Front view at eye level/, 'Front view'), url: await up(u, folder) });
      }
      for (const cb of modal.querySelectorAll('[data-mock]')) {
        if (!cb.checked) continue; const m = (DPRO.extras.mockups || []).find((x) => x.id === cb.dataset.mock); if (!m) continue;
        mocks.push({ id: m.id, name: m.name, before: m.photoUrl, after: m.afterUrl, night: m.afterNightUrl || null });
      }
      const tiers = []; modal.querySelectorAll('.sh-tier').forEach((el) => {
        if (!el.querySelector('.t-on').checked) return; const price = Number(el.querySelector('.t-price').value);
        tiers.push({ key: el.dataset.tier, name: el.querySelector('.t-name').value.trim() || el.dataset.tier, price: price > 0 ? price : 0, description: el.querySelector('.t-desc').value.trim(), items: el.querySelector('.t-items').value.split('\n').map((s) => s.trim()).filter(Boolean) });
      });
      if (!images.length && !mocks.length) throw new Error('Pick at least one picture.');
      if (tiers.some((t) => !(t.price > 0))) throw new Error('Enter a price for each option you turned on.');
      prog('Saving the page...');
      const depOn = $('sh-dep-on').checked; const pct = Math.max(1, Math.min(100, Number($('sh-dep-pct').value) || 25));
      const payload = { title: $('sh-title').value.trim() || 'Your landscape design', customerName: $('sh-cname').value.trim(), message: $('sh-msg').value.trim(), images, mockups: mocks, plants: $('sh-plants').checked ? plantRows() : [], scene: $('sh-3d') && $('sh-3d').checked ? sceneData() : null, tiers, deposit: { enabled: depOn && tiers.length > 0, percent: pct }, updatedAt: new Date().toISOString() };
      const row = { design_id: currentDesign.id, title: payload.title, customer_name: payload.customerName, customer_email: $('sh-cemail').value.trim() || null, payload, updated_at: new Date().toISOString() };
      let saved;
      if (existing && !forceNew) {
        const r = await sb.from('design_shares').update(row).eq('id', existing.id).select().single(); if (r.error) throw new Error(r.error.message); saved = r.data;
      } else {
        const r = await sb.from('design_shares').insert(Object.assign({ token: newToken(), status: 'sent' }, row)).select().single(); if (r.error) throw new Error(r.error.message); saved = r.data;
      }
      existing = saved; const cust = await customerInfo(); render(cust); prog('Ready. Copy the link below or text/email it.');
    } catch (e) { prog(''); alert('Could not create the page: ' + (e && e.message ? e.message : e)); }
    busy = false; const b2 = $('sh-pub'); if (b2) b2.disabled = tableMissing;
  }

  const topbar = document.querySelector('.design-editor-topbar');
  if (topbar && !$('btn-design-share')) {
    const b = document.createElement('button'); b.className = 'btn btn-primary'; b.id = 'btn-design-share'; b.type = 'button'; b.textContent = 'Share with customer';
    const ref = $('btn-design-photo-mockup') || $('btn-design-3d') || $('btn-design-print'); topbar.insertBefore(b, ref ? ref.nextSibling : null); b.addEventListener('click', open);
  }
  DPRO.share = { open, linkFor };
})();
