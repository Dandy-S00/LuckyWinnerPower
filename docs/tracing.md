# Request Tracing

All API handlers create a W3C-compatible request trace using `lib/tracing.js`.

## What is recorded

- `traceId`: propagated from an incoming `traceparent` header or generated for a new request
- `spanId` and optional `parentSpanId`
- `requestId`: a unique request identifier
- route name, HTTP status, and duration in milliseconds
- `X-Trace-Id` and `X-Request-Id` response headers for support diagnostics

Trace records are emitted as one JSON object per completed request with `type: "trace"`. The implementation deliberately excludes authorization headers, request bodies, payment data, and Supabase credentials.

## Local collection

Run the API and capture structured logs, then filter trace records:

```bash
npm run dev 2>&1 | jq 'select(.type == "trace")'
```

The current deployment is Vercel-compatible and writes traces to the platform log stream. Configure your log drain or Azure Monitor integration to forward these JSON records to a centralized sink.

## Production path

For distributed tracing in Azure, replace the logger in `lib/tracing.js` with the OpenTelemetry Node SDK and OTLP exporter, or use the hosting platform's supported Application Insights auto-instrumentation. Preserve the existing trace IDs and redaction policy, and validate that `traceparent` propagation is retained across Stripe and Supabase calls.
