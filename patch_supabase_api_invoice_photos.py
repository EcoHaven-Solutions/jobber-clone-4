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


# Adds an invoicePhotos API, mirroring jobPhotos exactly (same
# uploadToStorage/deleteFromStorage helpers, same "attachments" bucket,
# just a different table/folder). No "type" field here since before/after
# doesn't apply to an invoice -- just a plain photo gallery.
apply(
    """  jobPhotos: {
    list: async (jobId) => unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at')),
    add: async (jobId, type, base64Data) => {
      const url = await uploadToStorage(base64Data, `jobs/${jobId}`);
      await sb.from('job_photos').insert({ job_id: jobId, type: type || 'before', filename: url });
      return unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at'));
    },
    delete: async (id, jobId) => {
      const row = unwrap(await sb.from('job_photos').select('*').eq('id', id).single());
      await deleteFromStorage(row.filename);
      await sb.from('job_photos').delete().eq('id', id);
      return unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at'));
    },
  },""",
    """  jobPhotos: {
    list: async (jobId) => unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at')),
    add: async (jobId, type, base64Data) => {
      const url = await uploadToStorage(base64Data, `jobs/${jobId}`);
      await sb.from('job_photos').insert({ job_id: jobId, type: type || 'before', filename: url });
      return unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at'));
    },
    delete: async (id, jobId) => {
      const row = unwrap(await sb.from('job_photos').select('*').eq('id', id).single());
      await deleteFromStorage(row.filename);
      await sb.from('job_photos').delete().eq('id', id);
      return unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at'));
    },
  },

  invoicePhotos: {
    list: async (invoiceId) => unwrap(await sb.from('invoice_photos').select('*').eq('invoice_id', invoiceId).order('created_at')),
    add: async (invoiceId, base64Data) => {
      const url = await uploadToStorage(base64Data, `invoices/${invoiceId}`);
      await sb.from('invoice_photos').insert({ invoice_id: invoiceId, filename: url });
      return unwrap(await sb.from('invoice_photos').select('*').eq('invoice_id', invoiceId).order('created_at'));
    },
    delete: async (id, invoiceId) => {
      const row = unwrap(await sb.from('invoice_photos').select('*').eq('id', id).single());
      await deleteFromStorage(row.filename);
      await sb.from('invoice_photos').delete().eq('id', id);
      return unwrap(await sb.from('invoice_photos').select('*').eq('invoice_id', invoiceId).order('created_at'));
    },
  },""",
    "add invoicePhotos API",
)

path.write_text(content)
print("DONE: phone-app/supabase-api.js patched successfully.")
