# Session and Authentication Security Policy

**Scope:** Faith Counseling SaaS — all environments  
**Owner:** Engineering / Compliance  
**Status:** Active — enforced at application layer

---

## 1. Session Lifetime

| Context | Idle timeout | Absolute max |
|---|---|---|
| Staff (counselor, admin) | 30 minutes | 8 hours |
| Platform administrator | 15 minutes | 4 hours |
| Unauthenticated UI (public pages) | N/A | N/A |

Sessions **must** be invalidated server-side on logout.  
A new session token **must** be issued on every login (session fixation prevention).

---

## 2. Multi-Factor Authentication (MFA)

- MFA is **required** for all staff accounts before accessing any Protected Health Information (PHI).
- Accepted second factors (in preference order):
  1. TOTP authenticator app (RFC 6238)
  2. Hardware security key (WebAuthn / FIDO2)
  3. Email OTP — only as a fallback for account recovery, not routine login
- SMS OTP is **not** an accepted factor (SIM-swap risk, NIST SP 800-63B §5.1.3).

---

## 3. Re-authentication for Sensitive Actions

The following actions require the user to re-authenticate (password + MFA) regardless of session age:

- Exporting or downloading any client record set
- Changing another staff member's role or permissions
- Viewing raw audit logs
- Deleting any client or appointment record
- Changing MFA settings

---

## 4. Password Policy

- Minimum length: **14 characters**
- No maximum length under 128 characters
- Check against the HaveIBeenPwned breached-password list at registration and password change
- No forced rotation (NIST SP 800-63B §5.1.1.2 — rotation increases weak-password risk)
- Lock account after **10** consecutive failed attempts; unlock via email verification

---

## 5. Token Handling

- Session tokens: cryptographically random, ≥ 128 bits of entropy (`crypto.randomBytes(32)`)
- Tokens stored in HttpOnly, Secure, SameSite=Strict cookies — never in localStorage
- CSRF protection: double-submit cookie pattern or synchronizer token for all state-changing requests
- `SESSION_SECRET` env var must be a minimum 32-byte random value (see `.env.example`)

---

## 6. Transport Security

- All traffic served over HTTPS in production (TLS 1.2 minimum, TLS 1.3 preferred)
- HSTS header enforced: `max-age=63072000; includeSubDomains; preload`
- API calls between the web proxy and API server use the private network interface only (`API_BASE_URL` defaults to `127.0.0.1`)

---

## 7. Audit Requirements

Every authenticated session event must produce an audit log entry with:

- `occurredAt` — ISO 8601 timestamp
- `actorId` — staff member ID
- `actorRole` — role at time of action
- `tenantId` — practice location
- `action` — event type (e.g., `session.login`, `session.logout`, `session.mfa_success`)
- `requestId` — correlation ID

PHI field values must **never** appear in audit log entries.

---

## 8. Incident Response

If a session token is suspected to have been compromised:

1. Immediately invalidate all active sessions for the affected user
2. Force MFA re-enrollment
3. Log a `security.session_revoked` audit event
4. Notify the Practice HIPAA Security Officer within 1 hour
5. Document in the incident register within 24 hours

---

*References: HIPAA Security Rule §164.312(a)(2)(i) — Unique user identification; §164.312(d) — Person or entity authentication; NIST SP 800-63B*
