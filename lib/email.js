import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // enterprise@kth-tech.com
    pass: process.env.GMAIL_PASS,   // Gmail app password (16-char)
  },
});

export async function sendReport({ to, host, pdfBuffer, reportId }) {
  await transporter.sendMail({
    from: `"ARTEFX by KTH Tech" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Your SENTINEL Report — ${host}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f6f7f9;border-radius:16px">
        <img src="https://artefx.online/artefx-mark.svg" alt="ARTEFX" style="width:48px;margin-bottom:20px"/>
        <h2 style="font-size:22px;font-weight:900;color:#0b0d12;margin:0 0 8px">Your SENTINEL report is ready.</h2>
        <p style="color:#6b6e7a;font-size:14px;line-height:1.6;margin:0 0 24px">Your full website intelligence report for <strong>${host}</strong> is attached. It covers all 25 checks across Security, SEO, POPIA compliance, AI-readiness, and Page Quality.</p>
        <p style="color:#6b6e7a;font-size:13px;line-height:1.6;margin:0 0 32px">If you have questions or want us to fix any of the findings, reply to this email — we're happy to help.</p>
        <div style="border-top:1px solid rgba(11,13,18,.08);padding-top:20px;font-size:12px;color:#9ca3af">
          ARTEFX by KTH Tech · artefx.online · Report ID: ${reportId}
        </div>
      </div>`,
    attachments: [{
      filename: `SENTINEL-${host.replace(/[^a-z0-9]/gi, '-')}-report.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
}
