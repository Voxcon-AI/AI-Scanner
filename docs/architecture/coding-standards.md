# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in `shared/src/types/` and import from `@ai-scanner/shared` in both frontend and backend. Never duplicate type definitions between packages.

- **API Calls:** Never make direct `fetch()` calls from frontend pages—use the service layer (`frontend/js/api/documents.js`). All API requests must go through `apiFetch()` wrapper for consistent error handling and auth token injection.

- **Environment Variables:** Access only through config objects (`config/env.js`), never use `process.env` directly in business logic. Validate all required env vars on service startup (fail fast if missing).

- **Error Handling:** All API routes must use the standard error handler middleware. Return structured errors: `{ error: { code, message, details, timestamp, requestId } }`. Never expose stack traces in production.

- **State Updates:** Never mutate state directly—use pure functions and immutable updates. For document status changes, always update database first, then return updated state to caller.

- **Database Queries:** All database access must go through repository layer (`repositories/*.repo.ts`). Never write raw SQL in controllers or services (exception: migrations).

- **File Path Validation:** All user-provided file paths (destination folders, filenames) must be validated against whitelist before file operations. Use `validateFolderPath()` from `@ai-scanner/shared/utils/paths`.

- **JWT Token Handling:** Never log JWT tokens (mask in logs with `logger.child({ token: '***' })`). Validate expiration on every protected route. Use short-lived review tokens (4h) for email links.

- **Async Error Handling:** All async functions must use try-catch blocks. Never throw unhandled promise rejections. Log errors with context: `logger.error({ err, documentId }, 'Failed to process document')`.

- **Input Sanitization:** All user input (filenames, folder paths, rejection notes) must be sanitized before storing in database or using in file operations. Use `sanitizeFilename()` from shared utils.

## Naming Conventions

| Element               | Frontend                    | Backend              | Example                                    |
| --------------------- | --------------------------- | -------------------- | ------------------------------------------ |
| Components            | PascalCase                  | -                    | `Button.js`, `DocumentPreview.js`          |
| Hooks                 | camelCase with 'use' prefix | -                    | `useAuth.js`, `useRouter.js`               |
| API Routes            | -                           | kebab-case           | `/api/documents/:id`, `/auth/login`        |
| Database Tables       | -                           | snake_case           | `documents`, `processing_queue`, `batches` |
| TypeScript Interfaces | PascalCase                  | PascalCase           | `Document`, `AnalysisResult`, `QueueJob`   |
| Functions             | camelCase                   | camelCase            | `approveDocument()`, `sanitizeFilename()`  |
| Constants             | SCREAMING_SNAKE_CASE        | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_POLL_INTERVAL` |
| Environment Variables | SCREAMING_SNAKE_CASE        | SCREAMING_SNAKE_CASE | `GEMINI_API_KEY`, `SMTP_HOST`              |

**Additional Conventions:**

- **File Names:** Match primary export name (`Button.js` exports `Button` class, `document.repo.ts` exports `documentRepo`)
- **Test Files:** Same name as source file with `.test.` suffix (`Button.test.js`, `document.repo.test.ts`)
- **Async Functions:** Prefix with `async` keyword, return Promises (never mix callbacks and Promises)
- **Boolean Variables:** Prefix with `is`, `has`, `should` (`isAuthenticated`, `hasConfidence`, `shouldRetry`)
- **Event Handlers:** Prefix with `handle` (`handleApprove`, `handleReject`, `handleLogin`)

---
