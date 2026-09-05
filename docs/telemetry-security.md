# CLOUDPULSE — Telemetry Security & Sensitive Data Redaction

## 1. PII and Credential Redaction

All telemetry collectors (OTel trace exporters, Morgan HTTP logger, Winston log formatters) enforce strict automatic data sanitization:

```typescript
// Sanitization rule applied across logs, spans, and attributes:
const SENSITIVE_PATTERNS = [
  /password/i,
  /authorization/i,
  /bearer\s+[a-zA-Z0-9_\-\.]+/i,
  /api[_-]?key/i,
  /token/i,
  /secret/i
];
```

---

## 2. High-Cardinality Protection
- **Disallowed in Metric Labels**: Raw UUIDs, full request URLs with query parameters, raw emails, JWT tokens.
- **Allowed in Metric Labels**: Standard bounded route templates (`/api/v1/orders/:id`), HTTP methods (`GET`, `POST`), status code classes (`2xx`, `4xx`, `5xx`), and service names.
