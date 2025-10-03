# Frontend Architecture

## Component Architecture

**Component Organization:**
```
frontend/
├── index.html               # Main entry point (SPA shell)
├── css/
│   └── styles.css          # Global styles + utility classes
├── js/
│   ├── app.js              # Main app initialization, router
│   ├── api/
│   │   ├── client.js       # Fetch wrapper, auth token injection
│   │   └── documents.js    # Document API methods (getDocument, approve, reject)
│   ├── components/
│   │   ├── Button.js       # Reusable button component
│   │   ├── Card.js         # Card container component
│   │   ├── Badge.js        # Confidence score badge
│   │   ├── Modal.js        # Modal overlay component
│   │   └── DocumentPreview.js  # PDF/image viewer component
│   ├── pages/
│   │   ├── LoginPage.js    # Login screen logic
│   │   ├── ReviewPage.js   # Document review screen logic
│   │   └── SuccessPage.js  # Success confirmation logic
│   ├── utils/
│   │   ├── auth.js         # Token storage, validation
│   │   ├── router.js       # Client-side routing
│   │   └── dom.js          # DOM manipulation helpers
│   └── constants.js        # API endpoints, status enums
└── assets/
    └── icons/              # SVG icons (inline or sprite)
```

**Component Template (Button.js Example):**
```typescript
// frontend/js/components/Button.js
export class Button {
  constructor(options) {
    this.text = options.text;
    this.variant = options.variant || 'primary'; // primary, secondary, ghost
    this.onClick = options.onClick;
    this.loading = options.loading || false;
  }

  render() {
    const button = document.createElement('button');
    button.className = `btn btn-${this.variant}`;
    button.textContent = this.loading ? 'Loading...' : this.text;
    button.disabled = this.loading;
    button.addEventListener('click', this.onClick);
    return button;
  }

  setLoading(loading) {
    this.loading = loading;
    // Re-render or update DOM
  }
}

// Usage in ReviewPage.js:
const approveBtn = new Button({
  text: 'Approve & File',
  variant: 'primary',
  onClick: handleApprove
});
document.querySelector('#actions').appendChild(approveBtn.render());
```

## State Management Architecture

**State Structure:**
```typescript
// No global state management library (Redux/Zustand) for MVP
// Each page manages its own local state via closures and DOM data attributes

// Example: ReviewPage state (closure-based)
function ReviewPage(documentId) {
  let document = null; // Local state
  let isSubmitting = false;

  async function loadDocument() {
    document = await fetchDocument(documentId);
    render();
  }

  function handleApprove() {
    isSubmitting = true;
    render();
    // Submit API call...
  }

  function render() {
    // Update DOM based on current state
    document.querySelector('#preview').innerHTML = renderPreview(document);
    document.querySelector('#approve-btn').disabled = isSubmitting;
  }

  return { loadDocument, handleApprove };
}
```

**State Management Patterns:**
- **Page-Level State:** Each page (LoginPage, ReviewPage) manages own state via closures (no global store)
- **URL as State:** Document ID and review token stored in URL query params (bookmarkable, shareable links)
- **LocalStorage for Auth:** JWT token persisted in localStorage for session continuity across page reloads
- **Optimistic Updates:** Approval action updates UI immediately (show success state), then sends API request in background

**Rationale:** No global state needed—each review page is isolated session with single document. Avoids complexity of Redux/Zustand for simple use case. URL-driven state enables direct linking to specific documents.

## Routing Architecture

**Route Organization:**
```javascript
// frontend/js/utils/router.js
const routes = {
  '/': LoginPage,           // Default route redirects to login if not authenticated
  '/login': LoginPage,
  '/review/:documentId': ReviewPage,
  '/success': SuccessPage
};

function router() {
  const path = window.location.pathname;
  const params = extractParams(path); // Parse :documentId from URL

  const PageComponent = matchRoute(path, routes);
  if (!PageComponent) {
    render404Page();
    return;
  }

  // Check auth before protected routes
  if (path !== '/login' && !isAuthenticated()) {
    window.history.pushState({}, '', '/login?returnUrl=' + path);
    LoginPage();
    return;
  }

  PageComponent(params);
}

// Listen for browser back/forward
window.addEventListener('popstate', router);

// Initial route on page load
document.addEventListener('DOMContentLoaded', router);
```

**Protected Route Pattern:**
```javascript
// frontend/js/utils/auth.js
export function isAuthenticated() {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  // Decode JWT and check expiration (simple client-side check)
  const payload = JSON.parse(atob(token.split('.')[1]));
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

export function requireAuth() {
  if (!isAuthenticated()) {
    const returnUrl = window.location.pathname + window.location.search;
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }
}

// Usage in ReviewPage.js:
export function ReviewPage(params) {
  requireAuth(); // Redirect to login if not authenticated
  // ... page logic
}
```

## Frontend Services Layer

**API Client Setup:**
```typescript
// frontend/js/api/client.js
const API_BASE_URL = window.location.origin; // Same-origin (no CORS)

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE_URL + endpoint, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

**Service Example (Document Service):**
```typescript
// frontend/js/api/documents.js
import { apiFetch } from './client.js';

export async function getDocument(documentId, reviewToken) {
  const endpoint = `/api/documents/${documentId}?token=${reviewToken}`;
  return apiFetch(endpoint, { method: 'GET' });
}

export async function approveDocument(documentId, destination) {
  const endpoint = `/api/documents/${documentId}/approve`;
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(destination)
  });
}

export async function rejectDocument(documentId, reason) {
  const endpoint = `/api/documents/${documentId}/reject`;
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

// Usage in ReviewPage.js:
import { getDocument, approveDocument } from './api/documents.js';

const doc = await getDocument(documentId, reviewToken);
await approveDocument(documentId, {
  destination_folder: '/Quality/Suppliers/AcmeCorp',
  filename: 'PO-12345.pdf'
});
```

---
