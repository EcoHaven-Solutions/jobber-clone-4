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


# The yearly report was filtering strictly on due_date being inside the
# selected year -- any invoice with no due date set (due_date is optional,
# no default, easy to skip when creating one) was silently excluded from
# EVERY report, forever, no matter its paid/unpaid status. getAvailableYears
# already falls back to created_at when due_date is blank; this makes the
# actual report use that exact same fallback so what you see matches what
# the year dropdown implied should be there.
apply(
    """    getYearlyInvoiceReport: async (year) =>
      withTotals(
        'invoices',
        'invoice_items',
        'invoice_id',
        unwrap(await sb.from('invoices').select('*, customers(name), jobs(title)').gte('due_date', `${year}-01-01`).lte('due_date', `${year}-12-31`)).map(mapInvoiceRow)
      ),""",
    """    getYearlyInvoiceReport: async (year) => {
      const allInvoices = unwrap(await sb.from('invoices').select('*, customers(name), jobs(title)'));
      const forYear = allInvoices.filter((inv) => (inv.due_date || inv.created_at || '').slice(0, 4) === String(year));
      return withTotals('invoices', 'invoice_items', 'invoice_id', forYear.map(mapInvoiceRow));
    },""",
    "getYearlyInvoiceReport due_date fallback",
)

path.write_text(content)
print("DONE: phone-app/supabase-api.js patched successfully.")
