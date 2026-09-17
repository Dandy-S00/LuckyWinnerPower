# Admin frontend

Deploy this as a separate static application from the player site. Set `VITE_API_BASE_URL` to the API origin or reverse-proxy `/api` to the Go service.

Required production controls: admin-only authentication with MFA, RBAC, secure cookies, CSRF protection, strict CORS, Content-Security-Policy, HSTS, audit logging, and no database credentials in frontend variables.

Build: `npm ci && npm run build`. The generated `dist/` directory can be served by a static web server or a minimal container.
