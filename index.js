import express from 'express';
import crypto from 'crypto';
import { scanUrl } from './lib/scanner.js';
import { buildReportHtml } from './lib/report-template.js';
import { htmlToPdf } from './lib/pdf.js';
import { sendReport } from './lib/email.js';

const app = express();
const PORT = process.env.PORT || 3100;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Parse raw body for Paystack signature verification
app.use('/webhook/paystack', express.raw({ type: 'application/json' }));
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ ok: true, service: 'artefx-api' }));

// Paystack webhook
app.post('/webhook/paystack', async (req, res) => {
  // 1. Verify signature
  const sig = req.headers['x-paystack-signature'];
  const expected = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(req.body)
    .digest('hex');

  if (sig !== expected) {
    console.warn('Invalid Paystack signature');
    return res.sendStatus(401);
  }

  const event = JSON.parse(req.body);

  // Only act on successful charges
  if (event.event !== 'charge.success') return res.sendStatus(200);

  const { customer, metadata, amount, reference } = event.data;
  const email = customer?.email;
  const targetUrl = metadata?.sentinel_url || metadata?.url;

  if (!email || !targetUrl) {
    console.warn('Missing email or URL in webhook payload', { email, targetUrl });
    return res.sendStatus(200);
  }

  // Confirm it's an R997 SENTINEL payment (99700 kobo)
  if (amount < 99700) {
    console.warn('Amount too low for SENTINEL report', amount);
    return res.sendStatus(200);
  }

  // Respond immediately so Paystack doesn't retry
  res.sendStatus(200);

  // Process async
  processReport({ email, targetUrl, reference }).catch(err =>
    console.error('Report generation failed:', err)
  );
});

async function processReport({ email, targetUrl, reference }) {
  console.log(`Processing SENTINEL report: ${targetUrl} → ${email}`);
  const reportId = `SNT-${reference.slice(-8).toUpperCase()}`;

  try {
    // 1. Scan
    console.log('Scanning', targetUrl);
    const scanData = await scanUrl(targetUrl);

    // 2. Build HTML
    const html = buildReportHtml(scanData, reportId);

    // 3. Render PDF
    console.log('Rendering PDF');
    const pdfBuffer = await htmlToPdf(html);

    // 4. Email
    const host = (() => { try { return new URL(targetUrl).hostname; } catch { return targetUrl; } })();
    console.log('Sending email to', email);
    await sendReport({ to: email, host, pdfBuffer, reportId });

    console.log(`✓ Report delivered: ${reportId} → ${email}`);
  } catch (err) {
    console.error(`✗ Failed for ${reference}:`, err.message);
    // TODO: retry queue or alert to Slack/email
  }
}

app.listen(PORT, () => console.log(`artefx-api running on :${PORT}`));
