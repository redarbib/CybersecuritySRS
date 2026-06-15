# Secure File Transfer System

A secure web-based file transfer system developed as a group project to enable safe, encrypted, and efficient sharing of files between users. The system is designed with a strong focus on confidentiality, integrity, authentication, and controlled access to uploaded files.

---

## Project Overview

The Secure File Transfer System allows authenticated users to upload and share files securely. Files are transmitted over encrypted connections and stored securely in a cloud-based storage system (UploadThing, backed by AWS S3).

The system ensures protection against unauthorized access, file tampering, malware risks, and data interception during transfer.

---

## Target Users

The system is intended for:

* Businesses and organizations exchanging documents, reports, invoices, or datasets
* Teams sharing internal files between departments or locations
* Individuals sharing media such as images, videos, and documents

---

## Supported File Types

The system only allows safe and predefined file types:

* PNG
* MP3
* MP4
* RAR
* ZIP
* CSV
* TXT
* DOCX
* PDF

This restriction reduces security risks such as malware uploads or unsupported file exploitation.

---

## Key Features

### Authentication & Authorization

* Secure login system
* Only authenticated users can upload files
* Middleware-based access control

### Secure File Upload

* Files uploaded via HTTPS using multipart HTTP requests
* Direct upload to UploadThing (no backend file handling)
* Server-side validation before upload permission is granted

### Secure Storage

* Files stored in UploadThing cloud storage (AWS S3-backed)
* AES-256 encryption at rest (handled by storage provider)
* Secure URL generation for file access

### File Management

* Upload files securely
* Retrieve file URLs from database
* Manage and delete uploaded files
* Track metadata (filename, size, type, upload time)

### Integrity & Safety Controls

* File size limits to prevent abuse and server overload
* Upload status verification via UploadThing response
* Optional checksum validation (SHA-256 conceptually supported)

---

## Security Architecture

### 1. Encryption

* **In Transit:** TLS (HTTPS) ensures all data is encrypted during transfer
* **At Rest:** AES-256 encryption provided by UploadThing / underlying S3 infrastructure

### 2. Authentication

* Only logged-in users can upload files
* Authentication handled via server-side middleware
* Future support for JWT-based session handling

### 3. Access Control

* Upload permissions restricted to authenticated users
* File URLs are controlled and stored securely in database
* No public direct access without generated link

### 4. File Validation

* Allowed file types enforced
* File size limits implemented to prevent DoS-style abuse
* Upload verification handled via UploadThing response status

### 5. Threat Protection

The system is designed to mitigate:

* Data interception (TLS encryption)
* File tampering (secure upload pipeline)
* Unauthorized access (authentication layer)
* Malware uploads (file type restrictions)
* Denial of Service attempts (file size limits)

---

## Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* React
* Tailwind CSS

### Backend

* Next.js API Routes (full-stack architecture)
* Node.js runtime

### Storage

* UploadThing (cloud file storage)
* AWS S3 (backend infrastructure used by UploadThing)

### Security Technologies

* HTTPS / TLS encryption
* AES-256 encryption at rest (provider-level)
* Middleware-based authentication
* Secure file upload validation

---

## System Architecture

The system uses a **server-assisted upload authorization model**:

1. User logs in via frontend
2. Server validates authentication
3. Server grants upload permission
4. File is uploaded directly from client → UploadThing
5. UploadThing stores file securely (encrypted at rest)
6. File metadata + URL stored in database
7. User retrieves file via secure link

This design ensures the backend never directly handles file contents, improving scalability and security.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/redarbib/CybersecuritySRS
cd CybersecuritySRS
```

Install dependencies:

```bash
npm install
```

---

## Getting Started

Run the development server:

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

The application auto-reloads during development.

---

## Environment Variables

Create a `.env.local` file:

```env
DB_HOST=
DB_PASSWORD=
DB_PORT=
DB_USER=
DB_NAME=
```

---

## Project Structure

```bash
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

---

## Security Requirements Mapping

* **Encrypted Uploads:** HTTPS/TLS enforced
* **Encrypted Storage:** AES-256 (UploadThing/S3)
* **Authentication:** Required for uploads
* **File Type Restrictions:** Strict whitelist enforced
* **File Size Limits:** Prevents abuse and overload
* **Integrity Checks:** Upload status + optional checksum validation

---

## Testing

Run tests:

```bash
npm test
```

Test coverage includes:

* Authentication validation
* File upload restrictions
* Security rule enforcement
* Upload integrity checks

---

## Deployment

Supported platforms:

* Vercel (recommended for Next.js)
* AWS

Production build:

```bash
npm run build
npm start
```

---

## Repository, Planning and Mock ups

* GitHub: https://github.com/redarbib/CybersecuritySRS
* Trello: https://trello.com/b/AQiKb9B6/cybersecurity-srs
* Figma: https://www.figma.com/design/5TLruobrWPr4XdPVYHDGTs/Cybersecurity-SRS?node-id=0-1&t=NVMSBKOAx7WFrzPG-1

---

## Team Members

* Strahinja Zoranovic
* Saleh Mohammed Nur
* Reda Rbib