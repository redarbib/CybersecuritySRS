# Secure File Transfer System

A secure web-based file transfer system developed as a group project to enable safe, encrypted, and efficient sharing of files between users. The system is designed with a strong focus on confidentiality, integrity, authentication, and controlled access to uploaded files.

## Project Overview

The Secure File Transfer System allows authenticated users to upload and share files securely. Files are transmitted over encrypted connections and stored securely in a cloud-based storage system (UploadThing, backed by AWS S3).

The system ensures protection against unauthorized access, file tampering, malware risks, and data interception during transfer.

## Target Users

The system is intended for:

- Businesses and organizations exchanging documents, reports, invoices, or datasets
- Teams sharing internal files between departments or locations
- Individuals sharing media such as images, videos, and documents

## Supported File Types

The system only allows safe and predefined file types:

- PNG
- MP3
- MP4
- RAR
- ZIP
- CSV
- TXT
- DOCX
- PDF

This restriction reduces security risks such as malware uploads or unsupported file exploitation.

## Key Features

### Authentication & Authorization
- Secure login system
- Only authenticated users can upload and edit files
- Middleware-based access control

### Secure File Upload
- Files uploaded via HTTPS using multipart HTTP requests
- Direct upload to UploadThing (no backend file handling)
- Server-side validation before upload permission is granted

### Secure Storage
- Files stored in UploadThing cloud storage (AWS S3-backed)
- AES-256 encryption at rest (handled by storage provider)
- Secure URL generation for file access

### File Management
- Upload files securely
- Retrieve file URLs from database
- View an overview of uploaded files
- Edit file metadata (e.g. filename)
- Manage and delete uploaded files
- Track metadata (filename, size, type, owner, upload time)
- Track whether a file has been downloaded by a recipient

### Integrity & Safety Controls
- Maximum file size of 100 GB to prevent abuse and server overload
- Upload status verification via UploadThing response
- Checksum-based integrity validation to confirm files are uploaded fully and correctly

### Error Logging
- Errors occurring during upload, download, or transfer are recorded in an error log
- Error logs are stored in the database (error type, error message, timestamp) for monitoring and troubleshooting

## Security Architecture

### 1. Encryption
- **In Transit:** TLS (HTTPS) ensures all data is encrypted during transfer
- **At Rest:** AES-256 encryption provided by UploadThing / underlying S3 infrastructure

### 2. Authentication
- Only logged-in users can upload and edit files
- Authentication handled via server-side middleware

### 3. Access Control
- Upload and edit permissions restricted to authenticated users
- File URLs are controlled and stored securely in database
- No public direct access without a generated link

### 4. File Validation
- Allowed file types enforced
- Maximum file size of 100 GB enforced to prevent DoS-style abuse
- Upload verification handled via UploadThing response status and checksum integrity checks

### 5. Threat Protection
The system is designed to mitigate:
- Data interception (TLS encryption)
- File tampering (secure upload pipeline + integrity checks)
- Unauthorized access (authentication layer)
- Malware uploads (file type restrictions)
- Denial of Service attempts (file size limits)

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS

### Backend
- Next.js API Routes (full-stack architecture)
- Node.js runtime

### Storage
- UploadThing (cloud file storage)
- AWS S3 (backend infrastructure used by UploadThing)

### Security Technologies
- HTTPS / TLS encryption
- AES-256 encryption at rest (provider-level)
- Middleware-based authentication
- Secure file upload validation
- Error logging and monitoring

## System Architecture

The system uses a server-assisted upload authorization model:

1. User logs in via frontend
2. Server validates authentication and authorization
3. Server generates a temporary, presigned upload URL for UploadThing
4. File is uploaded directly from client → UploadThing via the presigned URL
5. UploadThing stores the file securely (encrypted at rest) and returns a confirmation/result
6. File metadata + URL stored in database, linked to the user's account
7. User retrieves the file via a secure link; recipients can download via this link and download status is tracked

This design ensures the backend never directly handles file contents, improving scalability and security.

## Installation

Clone the repository:

```
git clone https://github.com/redarbib/CybersecuritySRS
cd CybersecuritySRS
```

Install dependencies:

```
npm install
```

## Getting Started

Run the development server:

```
npm run dev
```

Open:

```
http://localhost:3000
```

The application auto-reloads during development.

## Environment Variables

Create a `.env.local` file:

```
DB_HOST=
DB_PASSWORD=
DB_PORT=
DB_USER=
DB_NAME=
```

## Project Structure

```
secure-file-transfer-system/
│
├── src/              # Pages and routing (Next.js App Router)
├── components/      # UI components
├── lib/             # Utility functions
├── services/        # Upload & security logic
├── database/        # Database schema/models
├── public/          # Static assets
└── README.md
```

## Security Requirements Mapping

- **Encrypted Uploads:** HTTPS/TLS enforced
- **Encrypted Storage:** AES-256 (UploadThing/S3)
- **Authentication:** Required for uploads and edits
- **File Type Restrictions:** Strict whitelist enforced
- **File Size Limits:** Maximum of 2 GB to prevent abuse and overload
- **Integrity Checks:** Upload status verification + checksum validation

## Status van Functionaliteiten

### Afgeronde functies

De volgende onderdelen van het systeem zijn volledig afgerond en werken correct:

- Uploadfunctie voor bestanden  
- Downloadfunctie met server-side controle of het bestand bestaat  
- Bestandsvalidatie  
  - Alleen toegestane bestandstypes kunnen worden geüpload  
  - Maximale bestandsgrootte is ingesteld  
- Basisbeveiliging bij upload en download  
- Opslaan van bestandsmetadata in de database  
- Login- en registratiesysteem 
- Dashboard  
- Upload naar UploadThing (cloud storage)  
---

### Nog niet afgerond

De volgende onderdelen zijn nog niet volledig uitgewerkt:

- Google login

## Testing

Run tests:

```
npm test
```

Test coverage includes:

- Authentication validation
- File upload restrictions
- Security rule enforcement
- Upload integrity checks
- Error logging behavior

## Deployment

Supported platforms:

- Vercel (recommended for Next.js)
- AWS

Production build:

```
npm run build
npm start
```

## Repository and Planning

- **GitHub:** https://github.com/redarbib/CybersecuritySRS
- **Trello:** https://trello.com/b/AQiKb9B6/cybersecurity-srs

## Team Members

- Strahinja Zoranovic
- Saleh Saleh
- Reda Rbib
