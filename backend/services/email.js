require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendEmail(to, subject, html) {
  const info = await transporter.sendMail({
    from: `"A Camellar 🐪" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  });
  return info;
}

async function sendReminder(to, title, message, applicationInfo) {
  const appSection = applicationInfo
    ? `<p><strong>Related Application:</strong> ${applicationInfo.position} at ${applicationInfo.company}</p>`
    : '';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #d97706;">🐪 A Camellar Reminder</h2>
      <h3>${title}</h3>
      <p>${message}</p>
      ${appSection}
      <hr style="margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 14px;">Time to camellar — one steady step at a time gets the camel across the desert. 🐪</p>
      <p style="color: #6b7280; font-size: 12px;">From your work buddy, A Camellar</p>
    </div>
  `;

  return sendEmail(to, `🐪 ${title}`, html);
}

async function sendAccountabilityDigest(to, userName, stats) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #d97706;">🐪 Time to Camellar — Your Daily Digest</h2>
      <p>Hey ${userName || 'there'}! Saddle up — here's where your search stands:</p>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>📋 Total Applications:</strong> ${stats.total}</p>
        <p><strong>✅ Applied:</strong> ${stats.applied}</p>
        <p><strong>📞 In Progress (interviews/screens):</strong> ${stats.inProgress}</p>
        <p><strong>🤝 Connections Made:</strong> ${stats.connections}</p>
        <p><strong>📬 Pending Outreach:</strong> ${stats.pendingOutreach}</p>
      </div>
      ${stats.total < 5 ? '<p style="color: #dc2626;"><strong>⚠️ Pick up the pace! Aim for at least 5 applications this week.</strong></p>' : ''}
      <p>Keep at it — a camel covers ground by never quitting the trek. 🐪</p>
      <p style="color: #6b7280; font-size: 12px;">From your work buddy, A Camellar</p>
    </div>
  `;

  return sendEmail(to, '🐪 Time to Camellar — Your Daily Digest', html);
}

module.exports = { sendEmail, sendReminder, sendAccountabilityDigest };
