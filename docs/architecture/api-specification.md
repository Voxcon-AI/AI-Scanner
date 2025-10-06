# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: ai.scanner REST API
  version: 1.0.0
  description: Backend API for ai.scanner document routing system providing authentication, document metadata access, and approval workflow endpoints.

servers:
  - url: http://localhost:3000
    description: Local development server
  - url: https://ai-scanner.local
    description: Production deployment (self-signed cert acceptable for MVP)

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from /auth/login endpoint (RS256 signed, 24h expiration)

  schemas:
    Document:
      type: object
      properties:
        id:
          type: string
          format: uuid
        filename:
          type: string
        scan_timestamp:
          type: string
          format: date-time
        status:
          type: string
          enum: [queued, processing, analyzed, filed, rejected, failed]
        analysis_result:
          $ref: '#/components/schemas/AnalysisResult'
        destination_path:
          type: string
          nullable: true
        user_action:
          type: string
          enum: [approved, rejected, edited]
          nullable: true

    AnalysisResult:
      type: object
      properties:
        document_type:
          type: string
        confidence_score:
          type: number
          minimum: 0
          maximum: 100
        extracted_fields:
          type: object
          additionalProperties: true
        recommended_folder_path:
          type: string
        recommended_filename:
          type: string
        reasoning:
          type: string
        is_partial_analysis:
          type: boolean

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        username:
          type: string
        created_at:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
              additionalProperties: true
            timestamp:
              type: string
              format: date-time
            requestId:
              type: string
              format: uuid

paths:
  /health:
    get:
      summary: Health check endpoint
      description: Returns service health status for monitoring
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: healthy
                  timestamp:
                    type: string
                    format: date-time
                  version:
                    type: string
                    example: 1.0.0

  /health/db:
    get:
      summary: Database health check
      description: Tests PostgreSQL connection
      responses:
        '200':
          description: Database connection successful
        '503':
          description: Database connection failed

  /auth/register:
    post:
      summary: Register new user
      description: Create user account with bcrypt password hashing (10 rounds)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - password
              properties:
                username:
                  type: string
                  minLength: 3
                password:
                  type: string
                  minLength: 8
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    description: JWT token for immediate login
                  user:
                    $ref: '#/components/schemas/User'
        '409':
          description: Username already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/login:
    post:
      summary: User login
      description: Authenticate with username/password and receive JWT token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - password
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    description: JWT token (24h expiration)
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/documents/{documentId}:
    get:
      summary: Get document metadata
      description: Retrieve document details for review page
      security:
        - BearerAuth: []
      parameters:
        - name: documentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: token
          in: query
          description: Review token from email link (alternative to Bearer auth)
          schema:
            type: string
      responses:
        '200':
          description: Document found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Document'
        '401':
          description: Unauthorized (invalid token)
        '404':
          description: Document not found

  /api/documents/{documentId}/approve:
    post:
      summary: Approve document routing
      description: Execute file move operation with user-confirmed destination
      security:
        - BearerAuth: []
      parameters:
        - name: documentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - destination_folder
                - filename
              properties:
                destination_folder:
                  type: string
                  example: /Quality/Suppliers/AcmeCorp/POs
                filename:
                  type: string
                  example: PO-12345_AcmeCorp_2025-10-03.pdf
      responses:
        '200':
          description: Document filed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  destination:
                    type: string
                    description: Full file path where document was filed
        '409':
          description: File already exists at destination
        '500':
          description: File operation failed

  /api/documents/{documentId}/reject:
    post:
      summary: Reject document for manual review
      description: Move document to manual queue folder with optional rejection note
      security:
        - BearerAuth: []
      parameters:
        - name: documentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
                  maxLength: 500
                  description: Optional explanation for rejection
      responses:
        '200':
          description: Document rejected and moved to manual queue
        '500':
          description: Rejection operation failed

  /admin/reload-data:
    post:
      summary: Reload external data sources
      description: Refresh PO logs, vendor lists, folder structure from CSV/JSON files (requires authentication)
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Data sources reloaded
          content:
            application/json:
              schema:
                type: object
                properties:
                  po_logs_count:
                    type: integer
                  vendors_count:
                    type: integer
                  folders_count:
                    type: integer
```

**Authentication Flow:**

1. User POSTs credentials to `/auth/login`
2. Server validates against bcrypt hash in database
3. Server generates JWT with RS256 signing (private key from env)
4. Client stores token in localStorage
5. Subsequent requests include `Authorization: Bearer {token}` header
6. API middleware validates signature with public key, checks expiration
7. Token payload includes `{ user_id, username, iat, exp }` claims

**Error Response Format (Standardized):**
All errors return JSON with structure:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "details": {},
    "timestamp": "2025-10-03T14:30:52.123Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---
