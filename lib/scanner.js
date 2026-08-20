const WORKER = 'https://artefx-scanner.karlit.workers.dev';

export async function scanUrl(targetUrl) {
  const res = await fetch(`${WORKER}/?url=${encodeURIComponent(targetUrl)}`);
  if (!res.ok) throw new Error(`Scanner returned ${res.status}`);
  return res.json();
}
