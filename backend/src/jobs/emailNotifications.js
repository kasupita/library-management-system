const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const BRAND_IMAGE_URL =
  process.env.EMAIL_BRAND_IMAGE_URL ||
  (process.env.APP_PUBLIC_URL
    ? `${String(process.env.APP_PUBLIC_URL).replace(/\/$/, '')}/siba-campus.jpg`
    : 'https://siba.edu.lk/assets/images/navBar/siba.jpg');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(text) {
  const body = escapeHtml(text).replace(/\n/g, '<br>');
  return `<div style="font-family:Arial,sans-serif;color:#222;max-width:560px;">
  <img src="${BRAND_IMAGE_URL}" alt="SIBA Campus" width="280" style="display:block;max-width:100%;height:auto;margin-bottom:16px;border-radius:8px;" />
  <div>${body}</div>
</div>`;
}

async function sendMail({ to, subject, text }) {
  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html: buildHtml(text),
  });
}

async function ensureEvent(borrowId, eventType, eventDate) {
  try {
    await pool.query(
      'INSERT INTO notification_events (id, borrow_id, event_type, event_date) VALUES (?, ?, ?, ?)',
      [uuidv4(), borrowId, eventType, eventDate]
    );
    return true;
  } catch (e) {
    // duplicate (unique_borrow_event) => already sent
    if (e && (e.code === 'ER_DUP_ENTRY' || e.errno === 1062)) return false;
    throw e;
  }
}

function money(n) {
  const v = Number(n || 0);
  return v.toFixed(2);
}

async function runOnce() {
  if (!smtpConfigured()) {
    console.log('[emailNotifications] SMTP not configured; skipping');
    return;
  }

  const today = new Date();
  const eventDate = today.toISOString().slice(0, 10);

  // Due soon: due date within next 2 days (including today), still borrowed
  const [dueSoonRows] = await pool.query(
    `
    SELECT br.id as borrowId, br.due_date as dueDate, b.title as bookTitle, u.email as email, u.name as userName
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    JOIN users u ON br.user_id = u.id
    WHERE br.status = 'borrowed'
      AND br.due_date >= NOW()
      AND br.due_date < DATE_ADD(NOW(), INTERVAL 2 DAY)
    `
  );

  for (const row of dueSoonRows) {
    const ok = await ensureEvent(row.borrowId, 'due_soon', eventDate);
    if (!ok) continue;
    const due = new Date(row.dueDate).toLocaleDateString();
    await sendMail({
      to: row.email,
      subject: `Library reminder: return due soon (${row.bookTitle})`,
      text:
        `Hello ${row.userName || 'Student'},\n\n` +
        `This is a reminder that your borrowed book is due soon:\n` +
        `- Book: ${row.bookTitle}\n` +
        `- Due date: ${due}\n\n` +
        `Please return the book on or before the due date to avoid overdue fines.\n\n` +
        `SIBA Library Management System`,
    });
  }

  // Overdue: borrowed and due_date < now. We estimate fine as $1/day like current return logic.
  const [overdueRows] = await pool.query(
    `
    SELECT br.id as borrowId, br.due_date as dueDate, b.title as bookTitle, u.email as email, u.name as userName
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    JOIN users u ON br.user_id = u.id
    WHERE br.status = 'borrowed'
      AND br.due_date < NOW()
    `
  );

  for (const row of overdueRows) {
    const ok = await ensureEvent(row.borrowId, 'overdue', eventDate);
    if (!ok) continue;

    const dueDate = new Date(row.dueDate);
    const daysOverdue = Math.max(
      1,
      Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const fine = daysOverdue * 1;

    await sendMail({
      to: row.email,
      subject: `Overdue notice: fines may apply (${row.bookTitle})`,
      text:
        `Hello ${row.userName || 'Student'},\n\n` +
        `Your borrowed book is overdue:\n` +
        `- Book: ${row.bookTitle}\n` +
        `- Due date: ${dueDate.toLocaleDateString()}\n` +
        `- Days overdue: ${daysOverdue}\n` +
        `- Estimated fine: $${money(fine)} (at $1/day)\n\n` +
        `Please return the book as soon as possible.\n\n` +
        `SIBA Library Management System`,
    });
  }
}

function startEmailNotificationsJob() {
  const schedule = process.env.EMAIL_CRON || '0 8 * * *'; // daily at 08:00
  cron.schedule(schedule, async () => {
    try {
      await runOnce();
    } catch (e) {
      console.error('[emailNotifications] job failed:', e.message || e);
    }
  });
  console.log(`[emailNotifications] scheduled: ${schedule}`);
}

module.exports = { startEmailNotificationsJob, runOnce };

