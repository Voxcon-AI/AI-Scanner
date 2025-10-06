# ai.scanner

AI-powered document routing system using Gemini Vision API for intelligent classification and context-aware reasoning.

## Overview

ai.scanner automates the process of scanning, analyzing, and routing physical documents to their correct digital destinations. It uses Google's Gemini Vision API to analyze scanned documents and suggest appropriate destination folders based on purchase order logs, vendor lists, and folder structure configuration.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services with Docker Compose
docker-compose up
```

## Documentation

- [Product Requirements Document](docs/prd.md)
- [Architecture Documentation](docs/architecture.md)
- [Frontend Specification](docs/front-end-spec.md)

## Features

- **Automated File Monitoring**: Watches network share for new scanned documents
- **AI-Powered Analysis**: Uses Gemini Vision API for intelligent document classification
- **Email Review Workflow**: Sends batch summaries for human review and approval
- **Web Interface**: Simple approval workflow with document preview
- **Error Handling**: Robust retry logic and failure notifications

## Tech Stack

- **Backend**: Node.js 24.5.0, Express.js, TypeScript
- **Database**: PostgreSQL 16, Redis 7
- **AI**: Google Gemini Vision API
- **Frontend**: Vanilla JavaScript (ES2022)
- **Deployment**: Docker Compose

## License

ISC
