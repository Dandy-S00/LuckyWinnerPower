const crypto = require('node:crypto');

function validTraceId(value) {
  return typeof value === 'string' && /^[0-9a-f]{32}$/i.test(value) && !/^0+$/.test(value);
}

function validSpanId(value) {
  return typeof value === 'string' && /^[0-9a-f]{16}$/i.test(value) && !/^0+$/.test(value);
}

function randomTraceId() {
  return crypto.randomBytes(16).toString('hex');
}

function randomSpanId() {
  return crypto.randomBytes(8).toString('hex');
}

function getTraceContext(req) {
  const traceparent = req.headers?.traceparent;
  const parts = typeof traceparent === 'string' ? traceparent.split('-') : [];
  const traceId = validTraceId(parts[1]) ? parts[1].toLowerCase() : randomTraceId();
  const parentSpanId = validSpanId(parts[2]) ? parts[2].toLowerCase() : null;
  return { traceId, parentSpanId };
}

function startRequestTrace(req, res, name) {
  const context = getTraceContext(req);
  const spanId = randomSpanId();
  const startedAt = process.hrtime.bigint();
  const requestId = crypto.randomUUID();
  let ended = false;

  res.setHeader('X-Trace-Id', context.traceId);
  res.setHeader('X-Request-Id', requestId);

  function end(statusCode, attributes = {}) {
    if (ended) return;
    ended = true;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(JSON.stringify({
      type: 'trace',
      name,
      traceId: context.traceId,
      spanId,
      parentSpanId: context.parentSpanId,
      requestId,
      durationMs: Math.round(durationMs * 100) / 100,
      statusCode,
      attributes,
    }));
  }

  res.once('finish', () => end(res.statusCode));
  res.once('close', () => end(res.statusCode || 499, { closed: true }));

  return { traceId: context.traceId, spanId, end };
}

module.exports = { startRequestTrace };
