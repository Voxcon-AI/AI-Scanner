# Epic 5: Web Review Interface & Approval Workflow

**Epic Goal:** Develop the web-based document review and approval interface that authenticates users, displays document previews with AI analysis results, allows editing of routing recommendations, executes file operations on user approval, and provides clear feedback on success or failure. This epic delivers the human-in-the-loop control layer that ensures users maintain full authority over document routing decisions.

## Story 5.1: Frontend Application Structure and Routing

**As a** developer,
**I want** organized frontend application with routing for login and review pages,
**so that** users can navigate between authentication and document review flows.

### Acceptance Criteria

1. Frontend served as static files from frontend/ directory via Express static middleware
2. Single-page application structure with vanilla JavaScript (or minimal Alpine.js/htmx for reactivity)
3. Client-side routing handles two main views: /login and /review/:documentId
4. Index.html includes viewport meta tag for responsive design and links to styles.css and app.js
5. App.js implements simple router checking URL path and rendering appropriate view
6. Navigation between views updates browser history (pushState) without full page reload
7. 404 handler shows "Page not found" message for invalid routes
8. Frontend assets served with proper MIME types and cache headers (1 hour for CSS/JS)
9. Frontend build process not required for MVP (no webpack/vite—keep it simple)
10. Directory structure: frontend/index.html, frontend/css/styles.css, frontend/js/app.js, frontend/js/auth.js, frontend/js/review.js

## Story 5.2: Login Page and JWT Authentication Flow

**As a** user,
**I want** to log in with username and password,
**so that** I can securely access document review interface.

### Acceptance Criteria

1. Login page displays centered form with fields: username (text input), password (password input), "Remember me" checkbox, "Login" button
2. Form submission sends POST to /auth/login with JSON body: {username, password}
3. On successful login (200 response with JWT token), store token in localStorage (or sessionStorage if "Remember me" unchecked)
4. After login, redirect user to originally requested URL or /pending dashboard (if implemented) or wait for email link
5. On login failure (401 response), display error message: "Invalid username or password" below form
6. Password field includes "show/hide password" toggle icon for usability
7. Form includes basic client-side validation: both fields required, minimum 3 characters for username
8. Login button shows loading spinner during API call to prevent double-submission
9. JWT token included in all subsequent API requests via Authorization: Bearer {token} header
10. If user already logged in (valid token in storage), redirect from login page to dashboard/home

## Story 5.3: Document Review Page Layout and Data Loading

**As a** user,
**I want** to see document preview alongside AI recommendations,
**so that** I can verify the routing suggestion before approving.

### Acceptance Criteria

1. Review page URL format: /review/{documentId}?token={reviewToken}
2. Page loads document data via GET /api/documents/{documentId} with review token from URL query param
3. If review token invalid or expired, show error: "This review link has expired. Please check your email for a new link."
4. Page layout: left panel (60% width) shows document preview, right panel (40% width) shows AI analysis and approval form
5. Document preview displays PDF using PDF.js library (embedded viewer with zoom, page navigation) or image using <img> tag
6. PDF viewer includes controls: zoom in/out, previous/next page, page counter (Page X of Y)
7. Loading state shows spinner while document data and preview load
8. If document not found or already processed, show appropriate message: "Document not found" or "This document has already been processed"
9. Page is responsive: on tablet/mobile (<1024px), layout stacks vertically (preview on top, form below)
10. Document metadata displayed: filename, scan date/time, page count (if multi-page PDF)

## Story 5.4: AI Analysis Display and Confidence Visualization

**As a** user,
**I want** to see AI's classification, confidence score, and reasoning,
**so that** I understand why the system made its recommendation and can trust the suggestion.

### Acceptance Criteria

1. Right panel displays card titled "AI Analysis" with sections: Document Type, Confidence, Extracted Information, Recommendation, Reasoning
2. Document Type shown as prominent label/badge (e.g., "Packing List", "Purchase Order", "Invoice")
3. Confidence score displayed as percentage with visual indicator: progress bar or circular gauge, color-coded (green >80%, yellow 60-80%, red <60%)
4. Extracted Information section shows key-value pairs from analysis_result.extracted_fields: Vendor, PO Number, Date, etc. (only non-empty fields)
5. Recommendation section shows: "File to: {recommended_folder_path}" and "Filename: {recommended_filename}"
6. Reasoning text displayed in readable paragraph format (AI's 1-2 sentence explanation)
7. If document is partial analysis (50+ pages, only first 5 analyzed), show warning icon with tooltip: "Analyzed 5 of {total} pages"
8. Low confidence (<60%) shows warning message: "Low confidence - please review carefully before approving"
9. All text content properly escaped to prevent XSS (use textContent or sanitize HTML if needed)
10. Visual design clean and readable: good spacing, clear hierarchy, professional appearance

## Story 5.5: Editable Routing Fields and Form Interaction

**As a** user,
**I want** to edit recommended folder path and filename before approving,
**so that** I can correct AI mistakes or adjust routing based on my judgment.

### Acceptance Criteria

1. Approval form includes editable fields: Destination Folder (text input or dropdown with folder structure), Filename (text input with extension locked)
2. Destination Folder field pre-filled with AI recommendation, includes autocomplete/suggestions from loaded folder structure
3. Filename field pre-filled with AI recommendation, extension shown as read-only suffix or locked part of input
4. Filename validation: client-side check for invalid characters (/, \, :, \*, ?, ", <, >, |), show error if present
5. Character counter shows filename length (warn if >255 characters—file system limit)
6. Form includes action buttons: "Approve & File" (primary, green), "Reject" (secondary, gray), "Cancel" (tertiary, text link)
7. Folder field includes "Browse" button opening folder tree picker modal (MVP: simple dropdown, post-MVP: tree view)
8. Changes to form fields highlighted visually (e.g., field border changes color when edited from AI recommendation)
9. "Approve & File" button disabled if filename invalid or destination folder empty
10. Form remembers edits if user navigates away and returns (store in sessionStorage keyed by document ID)

## Story 5.6: Approval Action and File Operation Execution

**As a** user,
**I want** to approve routing recommendation and have file moved to destination,
**so that** document is filed correctly without manual file operations.

### Acceptance Criteria

1. Clicking "Approve & File" shows confirmation modal: "File {filename} to {folder_path}?" with "Confirm" and "Cancel" buttons
2. On confirm, send POST /api/documents/{documentId}/approve with JSON body: {destination_folder, filename}
3. Request includes JWT auth token from localStorage in Authorization header
4. Button shows loading spinner during API call, disabled to prevent double-clicks
5. Backend validates user is authenticated and document belongs to user (or any user for MVP single-user mode)
6. Backend executes file move operation: move file from scan_path to {destination_folder}/{filename}
7. If destination file already exists, backend returns 409 Conflict error: "File already exists at destination"
8. On conflict, frontend shows error with options: "Overwrite", "Rename (append timestamp)", "Cancel"
9. On successful move (200 response), update document status to "filed" in database
10. Backend logs INFO: "Document {id} filed: {destination_folder}/{filename} by user {user_id}"

## Story 5.7: Success Confirmation and Navigation

**As a** user,
**I want** clear feedback when document is filed successfully,
**so that** I know action completed and can proceed to next document.

### Acceptance Criteria

1. On successful file operation, show success message overlay: "Document filed successfully!" with green checkmark icon
2. Success message displays for 2 seconds, then auto-redirects to next pending document (if exists) or confirmation page
3. If more documents in same batch, redirect to /review/{nextDocumentId}?token={token}
4. If no more documents, show completion page: "All documents processed! You can close this window." with link to email for new batches
5. Success message includes filed location: "Filed to: {folder_path}/{filename}" for user confirmation
6. Redirect countdown shown: "Redirecting to next document in 2 seconds..." with "Skip" link for immediate redirect
7. User can click "View filed document" link to open destination folder in file explorer (if browser supports file:// protocol, otherwise show path to copy)
8. Page updates document status to "filed" in UI (if implementing dashboard view)
9. Browser back button after success shows message: "This document has already been processed"
10. Success analytics event logged (post-MVP: track time to approve, edits made, confidence score of approved docs)

## Story 5.8: Rejection and Error Handling

**As a** user,
**I want** to reject documents that AI misclassified or that need manual handling,
**so that** I can flag problematic documents without filing them incorrectly.

### Acceptance Criteria

1. Clicking "Reject" button shows modal: "Why are you rejecting this document?" with textarea (optional) and "Confirm Rejection" button
2. On confirm, send POST /api/documents/{documentId}/reject with JSON body: {reason (optional)}
3. Backend updates document status to "rejected", stores rejection reason in database
4. Rejected documents moved to "rejected" folder (configured via REJECTED_FOLDER_PATH environment variable) with original filename
5. Success message: "Document rejected and moved to manual review folder" with path shown
6. Rejection creates audit log entry for troubleshooting: document_id, user_id, rejection_reason, timestamp
7. Rejected document marked for prompt improvement analysis (post-MVP: learn from rejections)
8. After rejection, redirect to next document or completion page (same flow as approval)
9. If file move to rejected folder fails, show error and leave document in scan folder with status "rejection_failed"
10. GET /admin/rejected-documents endpoint lists all rejected documents with reasons (for prompt tuning)

## Story 5.9: Error Handling and User Feedback

**As a** user,
**I want** clear error messages when something goes wrong,
**so that** I understand the issue and know what action to take.

### Acceptance Criteria

1. Network errors (API unreachable) show message: "Unable to connect. Please check your internet connection and try again."
2. Authentication errors (401) redirect to login page with message: "Session expired. Please log in again."
3. Permission errors (403) show message: "You don't have permission to access this document."
4. File operation errors (500 from backend) show message: "Unable to file document. Error: {error message from API}"
5. All error messages include "Retry" button that repeats the failed action
6. File system errors (permission denied, disk full) show specific message from backend with troubleshooting guidance
7. Validation errors (invalid filename, missing folder) show inline below form field with red border
8. Timeout errors (API call >30s) show message: "Request timed out. The file operation may still be processing. Please check the destination folder."
9. Error state includes "Contact Support" link or instructions for manual filing
10. JavaScript errors caught globally and displayed as user-friendly message (not raw error stack), logged to console for debugging

---
