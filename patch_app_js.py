import pathlib

path = pathlib.Path("phone-app/app.js")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# 1. Populate the new Address field when editing a lead, and refresh the
#    linked-estimate readout whenever the drawer opens (new or existing).
apply(
    """  if (lead) {
    leadDrawerTitle.textContent = 'Edit lead';
    leadDrawerIdTag.textContent = `#${lead.id}`;
    leadDeleteBtn.hidden = false;
    leadConvertBtn.hidden = lead.status === 'converted';
    leadForm.elements.name.value = lead.name || '';
    leadForm.elements.phone.value = lead.phone || '';
    leadForm.elements.email.value = lead.email || '';
    leadForm.elements.source.value = lead.source || '';
    leadForm.elements.status.value = lead.status || 'new';
    leadForm.elements.notes.value = lead.notes || '';
  } else {
    leadDrawerTitle.textContent = 'New lead';
    leadDrawerIdTag.textContent = 'NEW';
    leadDeleteBtn.hidden = true;
    leadConvertBtn.hidden = true;
  }

  leadOverlay.hidden = false;
  leadDrawer.hidden = false;
}""",
    """  if (lead) {
    leadDrawerTitle.textContent = 'Edit lead';
    leadDrawerIdTag.textContent = `#${lead.id}`;
    leadDeleteBtn.hidden = false;
    leadConvertBtn.hidden = lead.status === 'converted';
    leadForm.elements.name.value = lead.name || '';
    leadForm.elements.phone.value = lead.phone || '';
    leadForm.elements.email.value = lead.email || '';
    leadForm.elements.address.value = lead.address || '';
    leadForm.elements.source.value = lead.source || '';
    leadForm.elements.status.value = lead.status || 'new';
    leadForm.elements.notes.value = lead.notes || '';
  } else {
    leadDrawerTitle.textContent = 'New lead';
    leadDrawerIdTag.textContent = 'NEW';
    leadDeleteBtn.hidden = true;
    leadConvertBtn.hidden = true;
  }

  refreshLeadQuoteInfo(lead ? lead.id : null);

  leadOverlay.hidden = false;
  leadDrawer.hidden = false;
}

// Shows a small "linked estimate" readout on the Lead detail screen when
// the public quote form created a real Estimate for this Lead (an item was
// selected on the website, not just a general message). Quietly does
// nothing if there isn't one -- this is a convenience readout, not
// something that should ever block opening a Lead.
async function refreshLeadQuoteInfo(leadId) {
  const infoEl = document.getElementById('lead-quote-info');
  if (!infoEl) return;
  infoEl.hidden = true;
  infoEl.textContent = '';
  if (!leadId) return;
  try {
    const linked = await window.api.leads.getQuotes(leadId);
    if (!linked || !linked.length) return;
    const full = await window.api.quotes.get(linked[0].id);
    const statusLabel = QUOTE_STATUS_LABELS[full.status] || full.status;
    const acceptedNote = full.status === 'approved' ? ' — accepted online ✓' : '';
    infoEl.textContent = `Linked estimate E-${full.number}: ${statusLabel}${acceptedNote} · ${formatCurrency(full.total)}`;
    infoEl.hidden = false;
  } catch (err) {
    // Convenience readout only -- fail silently.
  }
}""",
    "lead drawer address field-in + linked estimate readout",
)

path.write_text(content)
print("DONE: phone-app/app.js patched successfully.")
