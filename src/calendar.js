const db = require('./db');

function escapeIcsText(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDateTime(dateStr, timeStr) {
  // Floating local time (no timezone marker) — calendar apps display it in
  // whatever timezone the phone/computer is already set to.
  const time = timeStr || '09:00';
  return `${dateStr.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

function buildJobsIcs() {
  const jobs = db.listJobs().filter((j) => j.scheduled_date && j.status !== 'cancelled');

  const events = jobs.map((job) => {
    const customer = db.getCustomer(job.customer_id);
    const start = toIcsDateTime(job.scheduled_date, job.scheduled_time);
    const end = job.scheduled_time_end ? toIcsDateTime(job.scheduled_date, job.scheduled_time_end) : null;
    const description = [
      job.description,
      customer ? `Customer: ${customer.name} (${customer.phone || 'no phone on file'})` : '',
    ]
      .filter(Boolean)
      .join('\\n\\n');
    const location = customer && customer.address
      ? `${customer.address}, ${customer.city || ''} ${customer.state || ''}`.trim()
      : '';

    return [
      'BEGIN:VEVENT',
      `UID:job-${job.id}@ecohavenpro.local`,
      `DTSTAMP:${start}Z`,
      `DTSTART:${start}`,
      end ? `DTEND:${end}` : '',
      `SUMMARY:${escapeIcsText(job.title)} — ${escapeIcsText(job.customer_name)}`,
      description ? `DESCRIPTION:${escapeIcsText(description)}` : '',
      location ? `LOCATION:${escapeIcsText(location)}` : '',
      `STATUS:${job.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EcoHaven Solutions LLC//FieldBase//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:EcoHaven Jobs',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

module.exports = { buildJobsIcs };
