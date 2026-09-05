import pathlib

path = pathlib.Path("phone-app/supabase-api.js")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# Leads: add getQuotes(), and make convertToCustomer carry the address over
# and re-point any linked estimate (quotes.lead_id) at the new customer.
apply(
    """  leads: {
    list: async () => unwrap(await sb.from('leads').select('*').order('created_at', { ascending: false })),
    create: async (l) => unwrap(await sb.from('leads').insert(cleanLead(l)).select().single()),
    update: async (id, updates) => unwrap(await sb.from('leads').update(cleanLead(updates)).eq('id', id).select().single()),
    delete: async (id) => { await sb.from('leads').delete().eq('id', id); return { id }; },
    convertToCustomer: async (id) => {
      const lead = unwrap(await sb.from('leads').select('*').eq('id', id).single());
      const customer = unwrap(await sb.from('customers').insert({ name: lead.name, phone: lead.phone, email: lead.email, notes: lead.notes }).select().single());
      await sb.from('leads').update({ status: 'converted' }).eq('id', id);
      return customer;
    },
  },""",
    """  leads: {
    list: async () => unwrap(await sb.from('leads').select('*').order('created_at', { ascending: false })),
    create: async (l) => unwrap(await sb.from('leads').insert(cleanLead(l)).select().single()),
    update: async (id, updates) => unwrap(await sb.from('leads').update(cleanLead(updates)).eq('id', id).select().single()),
    delete: async (id) => { await sb.from('leads').delete().eq('id', id); return { id }; },
    // Any real Estimate the public quote form created for this Lead
    // (quotes.lead_id) -- most recent first. Used to show a "linked
    // estimate" readout on the Lead detail screen.
    getQuotes: async (id) => unwrap(await sb.from('quotes').select('*').eq('lead_id', id).order('created_at', { ascending: false })),
    convertToCustomer: async (id) => {
      const lead = unwrap(await sb.from('leads').select('*').eq('id', id).single());
      const customer = unwrap(await sb.from('customers').insert({ name: lead.name, phone: lead.phone, email: lead.email, address: lead.address, notes: lead.notes }).select().single());
      // Any Estimate the website created for this Lead now belongs to the
      // new Customer too, so it shows up normally under them going forward.
      await sb.from('quotes').update({ customer_id: customer.id }).eq('lead_id', id);
      await sb.from('leads').update({ status: 'converted' }).eq('id', id);
      return customer;
    },
  },""",
    "leads.getQuotes + convertToCustomer",
)

path.write_text(content)
print("DONE: phone-app/supabase-api.js patched successfully.")
