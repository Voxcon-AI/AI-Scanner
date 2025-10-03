# Testing Strategy

## Testing Pyramid

```
      E2E Tests (Manual)
      /                \
  Integration Tests (Vitest)
  /                          \
Frontend Unit Tests     Backend Unit Tests
    (Vitest)                (Vitest)
```

**Distribution:**
- **Unit Tests:** 70% of test effort (fast, isolated, test business logic)
- **Integration Tests:** 25% (test service interactions, database queries, API endpoints)
- **E2E Tests:** 5% (manual testing of critical workflows, browser automation deferred to post-MVP)

## Test Organization

**Frontend Tests:**
```
frontend/tests/
├── unit/
│   ├── utils/
│   │   ├── auth.test.js         # Test token validation
│   │   └── router.test.js       # Test route matching
│   ├── components/
│   │   ├── Button.test.js
│   │   └── Badge.test.js
│   └── api/
│       └── client.test.js       # Test fetch wrapper, error handling
└── integration/
    └── pages/
        └── ReviewPage.test.js   # Test page rendering with mock API
```

**Backend Tests:**
```
services/api/tests/
├── unit/
│   ├── repositories/
│   │   └── document.repo.test.ts  # Test SQL queries with mock DB
│   ├── services/
│   │   ├── file.service.test.ts   # Test file operations with temp files
│   │   └── jwt.service.test.ts    # Test token generation/validation
│   └── utils/
│       └── filename.test.ts       # Test sanitization logic
└── integration/
    ├── auth.integration.test.ts   # Test POST /auth/login flow
    ├── documents.integration.test.ts  # Test GET/POST /api/documents/*
    └── health.integration.test.ts     # Test /health endpoints
```

**E2E Tests (Manual Checklist):**
```
tests/e2e/
└── manual-checklist.md            # Step-by-step manual test cases
```

## Test Examples

**Frontend Component Test:**
```javascript
// frontend/tests/unit/components/Button.test.js
import { describe, it, expect } from 'vitest';
import { Button } from '../../../js/components/Button.js';

describe('Button Component', () => {
  it('renders with correct text', () => {
    const button = new Button({ text: 'Click Me', variant: 'primary' });
    const element = button.render();

    expect(element.textContent).toBe('Click Me');
    expect(element.className).toContain('btn-primary');
  });

  it('shows loading state', () => {
    const button = new Button({ text: 'Submit', loading: true });
    const element = button.render();

    expect(element.textContent).toBe('Loading...');
    expect(element.disabled).toBe(true);
  });

  it('calls onClick handler', () => {
    let clicked = false;
    const button = new Button({
      text: 'Test',
      onClick: () => { clicked = true; }
    });
    const element = button.render();

    element.click();
    expect(clicked).toBe(true);
  });
});
```

**Backend API Test:**
```typescript
// services/api/tests/integration/documents.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';
import { pool } from '../../src/utils/db';

describe('Document API', () => {
  let authToken: string;
  let documentId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    authToken = res.body.token;

    // Create test document
    const doc = await pool.query(
      `INSERT INTO documents (filename, scan_path, scan_timestamp, status)
       VALUES ('test.pdf', '/scan/test.pdf', NOW(), 'analyzed')
       RETURNING id`
    );
    documentId = doc.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM documents WHERE filename = $1', ['test.pdf']);
    await pool.query('DELETE FROM users WHERE username = $1', ['testuser']);
  });

  it('GET /api/documents/:id returns document', async () => {
    const res = await request(app)
      .get(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.id).toBe(documentId);
    expect(res.body.filename).toBe('test.pdf');
  });

  it('POST /api/documents/:id/approve files document', async () => {
    const res = await request(app)
      .post(`/api/documents/${documentId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        destination_folder: '/tmp/test-output',
        filename: 'approved-test.pdf'
      })
      .expect(200);

    expect(res.body.message).toContain('filed successfully');
  });

  it('Returns 401 without auth token', async () => {
    await request(app)
      .get(`/api/documents/${documentId}`)
      .expect(401);
  });
});
```

**E2E Test (Manual):**
```markdown
# Manual E2E Test Checklist

# Scenario: Document Approval Workflow

1. **Setup:**
   - [ ] Start all services: `docker-compose up -d`
   - [ ] Copy test document to scan folder: `cp examples/test-documents/invoice.pdf /mnt/scan-folder/`

2. **File Detection:**
   - [ ] Wait 10 seconds, check watcher logs: `docker-compose logs watcher | grep invoice.pdf`
   - [ ] Verify document in database: `psql -c "SELECT * FROM documents WHERE filename='invoice.pdf'"`

3. **AI Analysis:**
   - [ ] Wait 15 seconds for worker to process
   - [ ] Check worker logs for Gemini API call: `docker-compose logs worker | grep "Analysis complete"`
   - [ ] Verify status updated to 'analyzed': `psql -c "SELECT status FROM documents WHERE filename='invoice.pdf'"`

4. **Email Notification:**
   - [ ] Wait 15 seconds for batch trigger
   - [ ] Check email inbox for batch summary (should receive within 30s)
   - [ ] Verify email contains: document thumbnail, confidence score, review link

5. **Web Review:**
   - [ ] Click review link in email
   - [ ] Verify redirects to login page
   - [ ] Enter credentials (testuser / password123), submit
   - [ ] Verify document preview loads (PDF visible)
   - [ ] Verify AI analysis card shows confidence score, document type, reasoning
   - [ ] Verify recommended folder and filename pre-filled

6. **Approval:**
   - [ ] Click "Approve & File" button
   - [ ] Verify success message appears within 2 seconds
   - [ ] Verify redirect to success page
   - [ ] Check destination folder: `ls /mnt/output-folders/Quality/Suppliers/` (file should be moved)
   - [ ] Verify database status: `psql -c "SELECT status FROM documents WHERE filename='invoice.pdf'"` (should be 'filed')

7. **Cleanup:**
   - [ ] Delete test document from output folder
   - [ ] Reset database: `psql -c "DELETE FROM documents WHERE filename='invoice.pdf'"`

**Expected Duration:** 5-7 minutes
**Pass Criteria:** All steps complete without errors, file successfully moved to correct destination
```

---
