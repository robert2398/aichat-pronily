import express from 'express';
import cors from 'cors';

// Prefer global fetch (Node 18+). Only require node-fetch if global fetch isn't available.
let fetchImpl = globalThis.fetch;
try {
  if (!fetchImpl) {
    // dynamic import to avoid requiring node-fetch during install in some environments
    // eslint-disable-next-line no-eval
    fetchImpl = (await import('node-fetch')).default;
  }
} catch (e) {
  // leave fetchImpl undefined; will error at runtime if not available
}

const app = express();
app.use(cors());

// Simple proxy endpoint: /download-proxy?url=ENCODED_URL
// Streams the remote resource and sets Content-Disposition so browsers prompt download.
app.get('/download-proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('missing url');
  try {
    if (!fetchImpl) return res.status(500).send('fetch API not available on server');
    const fetched = await fetchImpl(url, { headers: { accept: '*/*' }, redirect: 'follow' });
    if (!fetched.ok) return res.status(fetched.status).send(await fetched.text());
    const cd = fetched.headers.get('content-disposition');
    const ct = fetched.headers.get('content-type') || 'application/octet-stream';
    const len = fetched.headers.get('content-length');

    // Try to derive filename from URL if content-disposition absent
    let filename = 'download';
    try {
      const u = new URL(url);
      filename = u.pathname.split('/').pop() || filename;
    } catch (e) {}

    if (cd) res.setHeader('content-disposition', cd);
    else res.setHeader('content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('content-type', ct);
    if (len) res.setHeader('content-length', len);

    const body = fetched.body;
    if (body && body.pipe) {
      body.pipe(res);
    } else {
      const buf = await fetched.arrayBuffer();
      res.send(Buffer.from(buf));
    }
  } catch (e) {
    console.error('proxy error', e);
    res.status(500).send('proxy error');
  }
});

const port = process.env.PORT || 5178;
app.listen(port, () => console.log(`download-proxy listening on http://localhost:${port}`));
