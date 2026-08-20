<a>
 <img width="1024" alt="CybersecuritySRS" src="/public/landingPage.png" >
</a>

A web-based system for secure file transfer, developed as a group project to enable secure, encrypted, and efficient file sharing between users. The system is designed with a strong focus on confidentiality, integrity, authentication, and controlled access to uploaded files.

---

## Project Overview

The Secure File Transfer System allows authenticated users to securely upload and share files. Files are transmitted over encrypted connections and stored using a cloud storage solution (UploadThing, supported by AWS S3).

The system protects against unauthorized access, file manipulation, malware, and data interception during transfer.

---

## Features

The following components have been fully completed and work correctly:

* File upload functionality
* Download functionality with server-side authorization
* File validation (type + size)
* Basic upload and download security
* Metadata storage in the database
* Login and registration system
* Dashboard
* Uploading files to UploadThing (cloud storage)

---

## Target Audience

The system is intended for:

* Companies and organizations that exchange documents, reports, invoices, or datasets
* Teams that share internal files between departments or locations
* Individuals who share media such as images, videos, and documents

---

## Supported File Types

The system only allows safe and predefined file types:

* PNG
* MP3
* MP4
* RAR
* ZIP
* CSV
* DOCX
* PDF

This restriction reduces the risk of malware uploads and misuse of unsupported file types.

---

## Key Features

### Authentication & Authorization

* Secure login system
* Only authenticated users can upload and edit files
* Middleware-based access control

---

### Secure File Upload

* Files are uploaded via HTTPS using multipart HTTP requests
* Direct upload to UploadThing (no server-side file processing)
* Server-side validation before upload authorization

---

### Secure Storage

* Files are stored in UploadThing cloud storage (AWS S3-based)
* AES-256 encryption at rest (provided by the storage provider)
* Secure URL generation for file access

---

### File Management

* Upload files
* Retrieve file URLs from the database
* View uploaded files
* Edit metadata (such as file names)
* Manage and delete files
* Metadata tracking (name, size, type, owner, upload time)
* Track whether a file has been downloaded by a recipient

---

### Integrity & Security Controls

* Maximum file size of 128 MB to prevent abuse and server overload
* Upload status verification through the UploadThing response
* Checksum-based integrity validation to ensure files are uploaded completely and correctly

---

## Security Architecture

### 1. Encryption

* **During transfer:** TLS (HTTPS) encrypts all data
* **At rest:** AES-256 encryption through UploadThing / AWS S3 infrastructure

---

### 2. Authentication

* Only logged-in users can upload and edit files
* Authentication is handled server-side through middleware

---

### 3. Access Control

* Upload and editing permissions are restricted to authenticated users
* File links are securely stored and controlled through the database
* No direct public access without a generated link

---

### 4. File Validation

* Only permitted file types are accepted
* Maximum file size of 500 MB
* Upload validation through the UploadThing response and checksum verification

---

### 5. Threat Protection

The system is designed to mitigate the following risks:

* Data interception (TLS encryption)
* File manipulation (secure upload pipeline + integrity checks)
* Unauthorized access (authentication layer)
* Malware uploads (file type restrictions)
* Denial-of-Service attacks (file size limits)

---

## Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* React
* Tailwind CSS

---

### Backend

* Next.js API Routes (full-stack architecture)
* Node.js runtime

---

### Storage

* UploadThing (cloud file storage)

---

### Security Technologies

* HTTPS / TLS encryption
* AES-256 encryption at rest
* Middleware-based authentication
* Secure upload validation

---

## System Architecture

The system uses a server-assisted upload model:

1. User logs in through the frontend
2. Server validates authentication and authorization
3. Server generates temporary upload access (presigned URL) for UploadThing
4. File is uploaded directly from the client → UploadThing
5. UploadThing securely stores the file and returns confirmation
6. Metadata + URL are stored in the database
7. User can retrieve the file through a secure link; downloads are tracked

This design ensures that the backend does not directly process files, improving scalability and security.

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
npm install uploadthing @uploadthing/react
npm install mysql2 --save
```

### Set Up UploadThing

Create an account with UploadThing. After logging in, create a new project. You will then receive an API key that is required to connect UploadThing to your application. Place this API key in the `.env` file, then restart the development server. If everything is configured correctly, UploadThing will work and files can be uploaded successfully.

---

## Starting the Project

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The application automatically reloads during development.

---

## Environment Variables

Create a `.env` file:

```env
DB_HOST=
DB_PASSWORD=
DB_PORT=
DB_USER=
DB_NAME=
FILE_ACCESS_SECRET=
SESSION_SECRET=
SECRET_CODE=
UPLOADTHING_TOKEN=
```

---

## Project Structure

```text
secure-file-transfer-system/
│
├── src/              # Pages and routing (Next.js App Router)
├── components/      # UI components
├── lib/              # Utility functions
├── services/        # Upload & security logic
├── database/        # Database schema/models
├── public/           # Static assets
└── README.md
```

---

## Security Requirements Mapping

* **Encrypted uploads:** HTTPS/TLS
* **Encrypted storage:** AES-256 (UploadThing/S3)
* **Authentication:** Required for uploading and editing
* **File type restrictions:** Strict whitelist
* **File size limit:** Maximum 128 MB
* **Integrity checks:** Upload status + checksum validation

---

## Deployment

Supported platforms:

* Vercel
* AWS

Production build:

```bash
npm run build
npm start
```

---

## Repository and Planning

* **GitHub:** [https://github.com/redarbib/CybersecuritySRS](https://github.com/redarbib/CybersecuritySRS)
* **Trello:** [https://trello.com/b/AQiKb9B6/cybersecurity-srs](https://trello.com/b/AQiKb9B6/cybersecurity-srs)
* **Figma:** [https://www.figma.com/design/5TLruobrWPr4XdPVYHDGTs/Cybersecurity-SRS?node-id=0-1&p=f&t=fXxjewbScdldj9MU-0](https://www.figma.com/design/5TLruobrWPr4XdPVYHDGTs/Cybersecurity-SRS?node-id=0-1&p=f&t=fXxjewbScdldj9MU-0)

---

## Team members

* [Strahinja Zoranovic](https://github.com/strahinjazoranovic)
* [Reda Rbib](https://github.com/redarbib)
* [Saleh Saleh](https://github.com/salehn12)
