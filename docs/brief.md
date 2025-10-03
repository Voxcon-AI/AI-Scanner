# Project Brief: ai.scanner

**Project:** ai.scanner - AI-Powered Document Routing System
**Date:** 2025-10-03
**Status:** Pre-Development
**Timeline:** 1 week MVP

---

## Executive Summary

**ai.scanner** is an intelligent document routing system that uses AI vision models to automatically classify, analyze, and recommend filing locations for scanned documents. The system monitors network folders for incoming scans, analyzes documents using Gemini Vision API with context-aware reasoning (consulting external data sources like PO logs and vendor lists), and sends users batch email summaries with web-based review interfaces for approval before final routing.

The primary problem is the manual, time-consuming, and error-prone process of routing scanned documents to correct folder locations in structured filing systems (QMS, medical records, general business operations). Existing scanner-to-folder workflows lack intelligence, requiring users to manually classify, rename, and file every document.

**Target Market:** Small-to-medium businesses and practices with document-heavy workflows (ISO QMS manufacturing, medical practices, legal firms, accounting offices). Initial focus: personal use with simultaneous open-source GitHub release for community adoption.

**Key Value Proposition:** Reduce document filing time from 2-5 minutes per document to 10-15 seconds of review time, while improving accuracy through AI-powered reasoning and reducing human error in compliance-critical filing systems.

---

## Problem Statement

### Current State and Pain Points

Organizations with structured filing requirements (ISO QMS, HIPAA medical records, financial compliance) face daily document routing challenges:

1. **Manual Classification:** Users must identify document type, extract key information (vendor, PO number, patient name, date), and determine correct folder location from hundreds of possible paths
2. **Time Consumption:** Each scanned document requires 2-5 minutes of manual processing (open, read, identify, navigate folder structure, rename, file)
3. **Human Error:** Misfiled documents create compliance issues, audit failures, and lost productivity searching for incorrectly filed items
4. **Cognitive Load:** Users must memorize complex folder structures and naming conventions, leading to inconsistent filing patterns
5. **Exception Handling:** Documents with missing information (no PO number, abbreviated vendor names) require additional research and decision-making

### Impact of the Problem

- **Productivity Loss:** 10 documents/day × 3 minutes each = 30 minutes of non-value-add work daily
- **Compliance Risk:** Misfiled documents in QMS/medical environments can result in audit failures, regulatory penalties
- **Frustration:** Repetitive, mindless work that interrupts higher-value tasks
- **Knowledge Dependency:** New employees struggle to learn filing systems, creating bottlenecks

### Why Existing Solutions Fall Short

- **Basic Scanner Software:** Routes to single folder with timestamp filenames - no intelligence
- **OCR-Only Tools:** Extract text but don't understand context or folder structure
- **Manual Workflows:** Rely entirely on human classification and navigation
- **Enterprise DMS:** Expensive ($10k-$100k+), complex setup, overkill for small-medium organizations

### Urgency and Importance

With increasing regulatory scrutiny (ISO audits, HIPAA compliance) and remote work trends increasing document scanning volume, the need for intelligent, reliable, affordable document routing is immediate. The availability of cost-effective AI vision models (Gemini) makes this solution technically and economically viable now.

---

## Proposed Solution

### Core Concept and Approach

**ai.scanner** combines three key technologies into a seamless workflow:

1. **Folder Monitoring:** Watch network folder (scanner output) for new documents
2. **AI Reasoning Engine:** Use Gemini Vision + OCR to not just classify documents, but *reason* about them—consulting external data sources (PO logs, vendor lists, folder structures) to fill information gaps and make intelligent recommendations
3. **Human-in-the-Loop Approval:** Present recommendations via web interface with confidence scores, editable fields, and clear approval workflow before any file operations

### Key Differentiators

- **Context-Aware Reasoning:** Unlike simple OCR classification, ai.scanner consults external data sources to infer missing information (e.g., "no PO# visible, but this vendor had recent order on PO-12345")
- **Batch Processing UX:** 15-second idle trigger sends single summary email for multiple scans, not inbox-spamming individual emails
- **Confidence Transparency:** Shows AI certainty scores and reasoning, building trust through honesty ("I'm 92% confident this is a packing list for Vendor X")
- **Multi-Industry Adaptability:** Configurable document types and folder structures, not hardcoded for single industry
- **Open Source + Easy Setup:** Docker Compose deployment with .env configuration—10-minute setup for IT admins

### Why This Solution Will Succeed

1. **Timing:** Gemini models provide sophisticated vision+reasoning at low cost (vs expensive enterprise AI)
2. **User Trust:** Human approval requirement + confidence scores = compliance-safe and trusted
3. **Open Source:** Community-driven improvement, no vendor lock-in, free to adopt
4. **Real User:** Built by someone with the problem, for actual workflows (not consultant-designed)
5. **Lean MVP:** 1-week timeline forces ruthless prioritization on core value delivery

### High-Level Vision

A world where scanning a document is the *last* time you think about filing it. The AI becomes your intelligent filing assistant, learning your organization's patterns and handling 95%+ of routing decisions with minimal review time.

---

## Target Users

### Primary User Segment: QMS Managers & Compliance Officers

**Demographic/Firmographic Profile:**
- Small-to-medium manufacturing companies (10-200 employees)
- ISO 9001/AS9100 certified or pursuing certification
- 5-50 document scans per day
- Windows-based networks with shared folder structures

**Current Behaviors and Workflows:**
- Scan packing lists, purchase orders, inspection reports at receiving desk
- Walk back to office, manually open PDFs, identify vendor/PO, navigate folder structure
- Rename files according to naming conventions, move to appropriate folders
- Update tracking spreadsheets or QMS software

**Specific Needs and Pain Points:**
- Need fast routing during busy receiving periods (morning deliveries)
- Struggle with abbreviated vendor names on packing lists
- Fear of audit findings due to misfiled documents
- Want to train new employees quickly without extensive folder structure memorization

**Goals They're Trying to Achieve:**
- Maintain audit-ready document filing system
- Reduce time spent on administrative tasks
- Ensure consistent naming and filing across team members
- Improve document retrieval speed during audits

### Secondary User Segment: Medical Office Staff

**Demographic/Firmographic Profile:**
- Small medical practices (1-5 providers)
- HIPAA-compliant environments
- High-volume scanning (patient charts, insurance forms, lab results)
- Mac or Windows workstations

**Current Behaviors and Workflows:**
- Scan patient charts after appointments (often 20-50+ pages)
- Manually rename with patient name and date
- File in patient folder structures or import to EHR systems
- Handle insurance forms, referrals, lab results separately

**Specific Needs and Pain Points:**
- Large multi-page documents slow down processing
- Patient privacy requires careful file handling
- Need fast turnaround between appointments
- Misrouted documents create compliance risks and patient safety issues

**Goals They're Trying to Achieve:**
- Maintain HIPAA-compliant document management
- Reduce after-hours administrative burden
- Ensure accurate patient record filing
- Free up staff time for patient-facing activities

---

## Goals & Success Metrics

### Business Objectives

- **Adoption:** 10+ external organizations using ai.scanner within 3 months of open-source release
- **Time Savings:** Reduce average document routing time from 3 minutes to <30 seconds (90% reduction)
- **Accuracy:** Achieve 85%+ correct-on-first-recommendation rate within first 50 documents processed
- **Open Source Traction:** 100+ GitHub stars, 5+ community contributions within 6 months

### User Success Metrics

- **Daily Usage:** Users process 10+ documents/day through ai.scanner
- **Review Time:** Average user review/approval time <15 seconds per document
- **Trust:** Users approve AI recommendations without editing 70%+ of the time
- **Retention:** 80%+ of users still active after 30 days of initial setup

### Key Performance Indicators (KPIs)

- **Processing Speed:** AI analysis completes in <15 seconds from scan to email
- **Confidence Score Distribution:** 70%+ of recommendations have confidence >80%
- **User Correction Rate:** Track % of recommendations user edits vs approves as-is
- **Setup Completion Rate:** 85%+ of users who start setup complete it successfully
- **Error Rate:** <2% of filed documents require manual re-routing due to errors

---

## MVP Scope

### Core Features (Must Have)

- **Folder Monitoring Service:** Watch configured network folder for new PDF/image files, trigger analysis pipeline on file creation
- **Gemini Vision Analysis:** Send document to Gemini API with multimodal prompt (image + OCR text) for classification, key data extraction, and reasoning
- **Reasoning Engine Prompt:** AI consults external data sources (PO logs, vendor lists, existing folder structure) to fill information gaps and make intelligent routing recommendations
- **Confidence Scoring:** Return structured output with confidence percentages for document type, extracted fields, and routing recommendation
- **Batch Queue with 15s Idle Trigger:** Queue incoming scans, send single summary email after 15 seconds of no new activity
- **Email Summary:** HTML email with document thumbnails, AI recommendations, confidence scores, and links to web review interface
- **Web Review Interface:** Single-page app showing document preview, AI analysis digest, recommended folder path, editable filename field, approve/reject buttons
- **Authentication:** Secure access to review interface (magic links OR username/password with JWT sessions)
- **Large Document Detection:** Automatically detect 50+ page documents, process first 5 pages with page count context to model
- **User Approval Workflow:** Clear indication of proposed file operation, require explicit approval before any writes to filesystem
- **File Routing on Approval:** Move/copy file from scan folder to approved destination with user-confirmed filename
- **Docker Compose Deployment:** One-command setup with docker-compose.yaml (app container, Postgres, Redis/queue system)
- **.env Configuration:** Simple environment variable configuration (folder paths, email settings, Gemini API key, auth secrets)

### Out of Scope for MVP

- Desktop notification tool (Windows/Mac native apps)
- PDF rotation/editing in web UI
- Thumbnail previews embedded in email (link to web UI instead)
- Auto-CC relevant people based on document type
- Advanced fuzzy matching for vendor names (basic string matching only)
- Learning/feedback loop automation (manual prompt improvement)
- Multi-user role-based access control (single user or shared login for MVP)
- Real-time collaboration features
- Mobile app
- Multi-language support
- Audit log dashboard (basic logging only)

### MVP Success Criteria

**MVP is successful if:**
1. A non-technical user can install and configure ai.scanner in <15 minutes using README
2. System correctly identifies document type with 70%+ accuracy on first 20 documents
3. Average processing time (scan → email) is <15 seconds
4. User can review and approve 10 documents in <3 minutes (vs 30 minutes manually)
5. System runs continuously for 7+ days without requiring restart or intervention
6. Zero data loss or file corruption incidents during testing period

---

## Post-MVP Vision

### Phase 2 Features

**Desktop Management Tool (Win/Mac):**
- Native application with system tray integration
- Desktop notifications when documents pending review
- Drag-and-drop document submission
- Quick approval hotkeys
- Live queue monitoring

**PDF Enhancement Tools:**
- Page rotation before analysis (portrait scanner handling landscape docs)
- Page extraction/removal
- Merge multiple scans into single document
- Auto-rotate pages using vision model

**Learning & Feedback Loop:**
- Thumbs up/down on recommendations
- Track user corrections over time
- Automated prompt engineering based on feedback patterns
- Adaptive confidence thresholds per document type

**Advanced Routing Intelligence:**
- Fuzzy matching for vendor name variations
- Historical pattern recognition (user always files X type in Y location)
- Cross-reference multiple data sources (accounting system, CRM, ERP)
- Smart suggestions for new folder creation

### Long-term Vision

**1-Year Vision:**
ai.scanner becomes the go-to open-source solution for intelligent document management in small-medium businesses. Community contributions expand integrations (QuickBooks, ERP systems, industry-specific templates). SaaS offering launched for non-technical users who want hosted solution.

**2-Year Vision:**
ai.scanner ecosystem includes marketplace of industry-specific templates (ISO QMS, HIPAA, legal practice, accounting), third-party integrations, and professional services. Self-learning capabilities reduce human review time to <5 seconds per document for established systems.

### Expansion Opportunities

- **Industry-Specific Packages:** Pre-configured templates for ISO 9001, ISO 13485, AS9100, HIPAA, SOX compliance
- **API/Integration Platform:** Webhooks, REST API for connecting to existing business systems
- **Enterprise Features:** Multi-tenant, SSO, advanced RBAC, audit logs, compliance reporting
- **Mobile App:** Snap photo with phone, instant routing recommendation
- **OCR Improvement Service:** Train custom models on user's specific document formats
- **Consulting/Implementation Services:** Professional setup and customization for complex environments

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Linux (primary), Windows, macOS (via Docker Desktop)
- **Browser Support:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge) for web review interface
- **Performance Requirements:**
  - Process single-page document in <5 seconds
  - Process 50-page document in <15 seconds
  - Support 100+ documents/day throughput
  - Web interface responsive on tablet devices

### Technology Preferences

- **Frontend:** Simple HTML/CSS/JavaScript (or lightweight React/Vue) for web review interface—minimal complexity
- **Backend:** **Python preferred** (rich AI/ML ecosystem, better Gemini examples, PDF handling libraries) OR Node.js (faster async, lighter weight)
- **Database:** PostgreSQL (user sessions, document queue, processing history, feedback data)
- **Queue System:** Redis or Python multiprocessing queue for batch processing
- **Hosting/Infrastructure:** Self-hosted via Docker Compose (user's own servers/NAS devices)

### Architecture Considerations

- **Repository Structure:**
  - Single monorepo for MVP (backend + frontend)
  - Clear separation of concerns (file watcher, analysis engine, web server, email service)
  - Example configs and documentation in repo root

- **Service Architecture:**
  - File Watcher Service (continuous monitoring)
  - Analysis Worker (queue consumer, calls Gemini API)
  - Web API (authentication, approval endpoints)
  - Email Service (batch summary generation)
  - Database (shared state across services)

- **Integration Requirements:**
  - Gemini API (Google Cloud API key)
  - Email service (SMTP relay, SendGrid, or AWS SES)
  - Network folder access (SMB/CIFS for Windows shares, NFS for Linux)
  - External data sources (CSV/JSON files for PO logs, vendor lists)

- **Security/Compliance:**
  - Authentication required for web access (JWT sessions)
  - HTTPS for web interface (self-signed cert acceptable for MVP)
  - No document storage in database (privacy/compliance consideration)
  - Secure API key storage (.env file, not committed to git)
  - File system permissions validation
  - Session timeout for inactive users
  - Optional: encryption at rest for sensitive environments

---

## Constraints & Assumptions

### Constraints

- **Budget:** $0 software budget—free/open-source tools only. Minimal API costs (Gemini free tier: 15 requests/minute, sufficient for MVP testing)
- **Timeline:** 1 week to working MVP (realistically 20-30 development hours)
- **Resources:** Single developer (project owner), limited AI context window (Claude 5x plan limits)
- **Technical:** Must work with existing Brother ADS-2700W scanner via network folder (no direct scanner API integration)

### Key Assumptions

- Users have network-accessible folder structures (SMB shares, NAS, network drives)
- Scanning produces PDF or common image formats (PNG, JPEG, TIFF)
- Users have basic technical skills to edit .env file and run Docker Compose
- Email delivery is reliable (users regularly check email)
- Gemini API availability and response times are consistent
- Users willing to provide feedback for system improvement
- Folder structures are relatively stable (not constantly reorganizing)
- External data sources (PO logs, vendor lists) can be exported to CSV/JSON format
- Internet connectivity available for Gemini API calls

---

## Risks & Open Questions

### Key Risks

- **API Cost Escalation:** Heavy usage could exceed Gemini free tier, requiring paid plan. *Mitigation: Monitor usage, implement rate limiting, document cost expectations in README*
- **Gemini Model Changes:** API deprecation or model behavior changes could break functionality. *Mitigation: Version pin API, design for model swappability*
- **Email Deliverability:** Batch emails flagged as spam or delayed by mail servers. *Mitigation: Support multiple email methods, consider web dashboard as alternative*
- **Large Document Performance:** 50+ page documents may timeout or exceed API limits. *Mitigation: First 5 pages analysis strategy, implement fallback logic*
- **Scanner Integration Brittleness:** Network folder monitoring may miss files due to timing issues. *Mitigation: Implement retry logic, file lock detection*
- **Multi-Platform Compatibility:** Docker behavior differences on Windows/Mac vs Linux. *Mitigation: Test on multiple platforms, provide platform-specific setup docs*
- **Security Vulnerabilities:** Authentication or file handling bugs create exposure risk. *Mitigation: Security-focused code review, input validation, principle of least privilege*

### Open Questions

- **Tech Stack Decision:** Python or Node.js for backend? (Leaning Python for AI ecosystem)
- **Email Service:** SMTP relay vs SendGrid vs AWS SES? (Need cost/complexity comparison)
- **Scan Volume:** What's realistic daily volume for performance testing? (10? 100? 1000?)
- **Multiple Output Folders:** Should MVP support routing to multiple distinct folder structures, or single output directory only?
- **Scanner Connectivity:** Network folder sufficient, or need direct scanner integration in future?
- **Feedback Mechanism:** How to collect user feedback for prompt improvement? (Manual review vs automated pipeline?)
- **Version Control for Prompts:** How to track prompt iterations as system learns?
- **Notification Fallback:** If email fails, how does user know documents are pending?
- **Concurrent Users:** Does MVP need to support multiple users reviewing simultaneously?
- **Document Retention:** How long to keep processed documents in queue/database? Auto-cleanup policy?

### Areas Needing Further Research

- **Gemini API Limits:** Exact rate limits, payload size limits, timeout behavior for free vs paid tiers
- **PDF Parsing Libraries:** Compare PyPDF2, pdfplumber, pdf2image for page extraction performance
- **Prompt Engineering:** Best practices for structured output, confidence scoring, reasoning explanation from Gemini
- **Docker Networking:** How to access host network folders from containerized app (especially Windows SMB shares)
- **HIPAA Compliance:** Specific requirements for medical practice use case (encryption, audit logs, BAA with Google?)
- **ISO QMS Requirements:** What audit trail is needed for document routing in certified environments?
- **Email HTML Rendering:** Cross-client compatibility for batch summary email templates
- **Authentication Methods:** Security best practices for magic links vs JWT sessions in containerized apps

---

## Appendices

### A. Research Summary

**Brainstorming Session Results (2025-10-03):**
- 35+ ideas generated across First Principles, SCAMPER, and Role Playing techniques
- Key insight: This is a reasoning problem, not just a classification problem
- Identified dual-user scenario (QMS + medical) validating multi-industry approach
- Established 15-second batch trigger as critical UX differentiator
- Confirmed user approval as non-negotiable for compliance/trust

**Competitive Landscape:**
- Enterprise DMS (DocuWare, M-Files): $10k-$100k, complex setup, overkill for SMBs
- OCR Tools (ABBYY, Adobe): Extract text but no intelligent routing
- Scanner Software (Brother, Fujitsu): Basic folder routing with no intelligence
- **Gap Identified:** No affordable, intelligent, open-source solution for SMB document routing

### B. Stakeholder Input

**Primary Stakeholder (Project Owner):**
- Real-world QMS user with daily packing list routing pain
- Secondary use case: Medical practice (validates multi-industry need)
- Strong preference for open-source, community-driven solution
- Timeline-constrained (1 week MVP) forces lean, focused scope
- Technical capability: Can develop and deploy, wants simple architecture

### C. References

- Brainstorming Session Results: `docs/brainstorming-session-results.md`
- Brother ADS-2700W Scanner: Network scan-to-folder capability
- Gemini API Documentation: https://ai.google.dev/docs
- ISO 9001 Document Control Requirements: Clause 7.5
- HIPAA Security Rule: 45 CFR § 164.312 (Technical Safeguards)

---

## Next Steps

### Immediate Actions

1. **Finalize Tech Stack Decision:** Choose Python vs Node.js based on ecosystem/familiarity (recommend Python)
2. **Create GitHub Repository:** Initialize repo with LICENSE (MIT/Apache 2.0), README skeleton, .gitignore
3. **Set Up Development Environment:** Docker development setup, Gemini API key acquisition, test email service
4. **Design Database Schema:** Users, documents, processing_queue, feedback tables
5. **Prototype Core Workflow:** File watcher → queue → Gemini analysis → email (end-to-end smoke test)
6. **Build Web Review Interface:** Minimal HTML/CSS form with authentication, approve/reject logic
7. **Write Deployment Documentation:** README with setup instructions, .env.example, docker-compose.yaml
8. **Test with Real Documents:** Use actual packing lists/documents to validate accuracy and performance
9. **Iterate on Prompt Engineering:** Refine Gemini prompts based on real-world results
10. **Prepare Open Source Release:** Clean up code, add comments, write contribution guidelines

### PM Handoff

This Project Brief provides the full context for **ai.scanner**. The next step is to create a detailed Product Requirements Document (PRD) that specifies exact functionality, user stories, technical architecture, and acceptance criteria for MVP development.

**Recommended next agent:** `dev` agent to begin technical architecture design and implementation planning, OR continue with `analyst` to create supporting documentation (technical architecture brief, API design).

---

*Project Brief created using BMAD-METHOD™ framework*
*Based on brainstorming session results from 2025-10-03*
