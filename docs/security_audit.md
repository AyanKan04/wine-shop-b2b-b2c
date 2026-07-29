# Security Audit Report: RuuBusiness B2B Wine/Spirits Platform

This report presents a security audit of the RuuBusiness MERN stack platform, evaluated using the **STRIDE threat modeling framework** and the **OWASP Top 10** vulnerabilities.

---

## Executive Summary

| Risk Level | Threat Domain | Vulnerability Summary | Suggested Mitigation |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Authorization | No auth checks or IDOR controls on data endpoints (BOLA). | Add verification checks utilizing real JWT middleware. |
| **HIGH** | Authentication | Plaintext password processing and dummy JWT token. | Implement `bcrypt` password hashing & secret JWT verification. |
| **MEDIUM** | Information Disclosure | Error stack traces could leak database credentials or paths. | Implement global catch error boundary middleware. |
| **MEDIUM** | Input Tampering | Target price, quantity inputs are parsed without bounds. | Enforce type schema validation (e.g., Zod, Joi). |

---

## Detailed Vulnerability Analysis (STRIDE Framework)

### 👥 1. Spoofing (Identity Spoofing)
- **Finding**: The server uses a static, hardcoded JWT token string (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ruubusiness_auth_token_mock`) inside [authController.js](file:///d:/TMDT/RuuBusiness/backend/src/controllers/authController.js) and lacks validation filters.
- **Risk**: High. Any user can construct or bypass the token check to log in as any role without signature validation.
- **Mitigation**:
  - Integrate `jsonwebtoken` with a secure key stored in `.env`.
  - Use cryptographically signed JWTs with expiration dates.

### ✍️ 2. Tampering (Data Modification)
- **Finding**: Input validation on RFQ creation, inventory adjustments, and company registers are parsed directly without strict boundary checks (e.g. negative quantities, negative pricing).
- **Risk**: Medium. Users can trigger negative stock imports or zero-valued quotation requests.
- **Mitigation**:
  - Enforce schema validation middleware (e.g. Joi or Zod) to assert boundaries (e.g., `.min(1)` for MOQ/quantities).

### 🔍 3. Repudiation (Traceability & Logs)
- **Finding**: Audits are written to a mutable in-memory array (`dbMock.activity_logs`). If the node process restarts, all B2B financial and credit history is cleared.
- **Risk**: Low-Medium. Lack of persistence prevents forensic auditing.
- **Mitigation**:
  - Implement a persistent logger (e.g., Winston) routing to a file system or database log table (`activity_logs`).

### 📂 4. Information Disclosure (Sensitive Data Leaks)
- **Finding**: Exception handler is missing in [app.js](file:///d:/TMDT/RuuBusiness/backend/src/app.js), meaning default Express HTML error stacks might leak file system routes or package versions to the client.
- **Risk**: Medium.
- **Mitigation**:
  - Add a global error-handling middleware at the end of the middleware stack to suppress detail leaks in production.

### ⚠️ 5. Denial of Service (DoS)
- **Finding**: The Gemini AI assistant controller [chatController.js](file:///d:/TMDT/RuuBusiness/backend/src/controllers/chatController.js) sends requests without request rate limiting (Rate Limit). A user could trigger thousands of Gemini API requests, exhausting API quotas.
- **Risk**: Medium.
- **Mitigation**:
  - Implement `express-rate-limit` middleware on `/api/rfqs/:id/messages` and other high-overhead paths.

### 🔑 6. Elevation of Privilege
- **Finding**: Administrative paths such as `/api/admin/licenses` and license approvals do not enforce role-based access control (RBAC). Any client role can execute these calls.
- **Risk**: High.
- **Mitigation**:
  - Restrict admin endpoints to users where `user_role === 'ADMIN'`.

---

## Action Plan (Mitigation Timeline)

1. **Immediate Phase (Hotfix)**:
   - Implement basic auth token checking middleware for critical endpoints.
   - Suppress error details.
2. **Intermediate Phase (Production Ready)**:
   - Configure Joi/Zod validators on RFQs and orders.
   - Set up express-rate-limit.
3. **Advanced Phase (Hardening)**:
   - Move from mock variables to PostgreSQL schemas with row-level security (RLS).
