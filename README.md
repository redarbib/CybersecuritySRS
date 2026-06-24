# Veilige Bestandsoverdracht Systeem

Een webgebaseerd systeem voor veilige bestandsoverdracht, ontwikkeld als groepsproject om het veilig, versleuteld en efficiënt delen van bestanden tussen gebruikers mogelijk te maken. Het systeem is ontworpen met een sterke focus op vertrouwelijkheid, integriteit, authenticatie en gecontroleerde toegang tot geüploade bestanden.

---

## Projectoverzicht

Het Veilige Bestandsoverdracht Systeem stelt geauthenticeerde gebruikers in staat om bestanden veilig te uploaden en te delen. Bestanden worden verzonden via versleutelde verbindingen en opgeslagen in een cloudopslagoplossing (UploadThing, ondersteund door AWS S3).

Het systeem beschermt tegen ongeautoriseerde toegang, bestandsmanipulatie, malware en onderschepping van data tijdens overdracht.

---

## Doelgroep

Het systeem is bedoeld voor:

* Bedrijven en organisaties die documenten, rapporten, facturen of datasets uitwisselen
* Teams die interne bestanden delen tussen afdelingen of locaties
* Particulieren die media zoals afbeeldingen, video’s en documenten delen

---

## Ondersteunde bestandstypen

Het systeem staat alleen veilige en vooraf gedefinieerde bestandstypen toe:

* PNG
* MP3
* MP4
* RAR
* ZIP
* CSV
* DOCX
* PDF

Deze beperking vermindert het risico op malwareuploads en misbruik van niet-ondersteunde bestanden.

---

## Belangrijkste functies

### Authenticatie & Autorisatie

* Veilig inlogsysteem
* Alleen geauthenticeerde gebruikers kunnen bestanden uploaden en bewerken
* Middleware-gebaseerde toegangscontrole

---

### Veilige bestandsupload

* Bestanden worden geüpload via HTTPS met multipart HTTP requests
* Directe upload naar UploadThing (geen server-side bestandsverwerking)
* Server-side validatie vóór toestemming voor upload

---

### Veilige opslag

* Bestanden opgeslagen in UploadThing cloudopslag (AWS S3-gebaseerd)
* AES-256 encryptie in rust (geleverd door de opslagprovider)
* Veilige URL-generatie voor bestandsaccess

---

### Bestandsbeheer

* Uploaden van bestanden
* Ophalen van bestands-URL’s uit de database
* Overzicht van geüploade bestanden
* Bewerken van metadata (zoals bestandsnaam)
* Beheren en verwijderen van bestanden
* Metadata tracking (naam, grootte, type, eigenaar, uploadtijd)
* Bijhouden of een bestand is gedownload door een ontvanger

---

### Integriteit & beveiligingscontroles

* Maximale bestandsgrootte van 128 MB ter voorkoming van misbruik en serveroverbelasting
* Uploadstatuscontrole via UploadThing response
* Checksum-gebaseerde integriteitsvalidatie om te verzekeren dat bestanden volledig en correct zijn geüpload

---

## Beveiligingsarchitectuur

### 1. Encryptie

* **Tijdens overdracht:** TLS (HTTPS) versleutelt alle data
* **In rust:** AES-256 encryptie via UploadThing / AWS S3 infrastructuur

---

### 2. Authenticatie

* Alleen ingelogde gebruikers kunnen uploaden en bewerken
* Authenticatie wordt server-side afgehandeld via middleware

---

### 3. Toegangscontrole

* Upload- en bewerkrechten alleen voor geauthenticeerde gebruikers
* Bestandslinks worden gecontroleerd en veilig opgeslagen in de database
* Geen directe publieke toegang zonder gegenereerde link

---

### 4. Bestandsvalidatie

* Alleen toegestane bestandstypen
* Maximale bestandsgrootte van 500 MB
* Uploadvalidatie via UploadThing response en checksumcontrole

---

### 5. Bescherming tegen bedreigingen

Het systeem is ontworpen om de volgende risico’s te beperken:

* Data onderschepping (TLS encryptie)
* Bestandsmanipulatie (veilige upload pipeline + integriteitscontroles)
* Ongeautoriseerde toegang (authenticatielaag)
* Malware uploads (file type restricties)
* Denial of Service aanvallen (bestandsgrootte limieten)

---

## Tech stack

### Frontend

* Next.js (App Router)
* TypeScript
* React
* Tailwind CSS

---

### Backend

* Next.js API Routes (full-stack architectuur)
* Node.js runtime

---

### Opslag

* UploadThing (cloud file storage)

---

### Beveiligingstechnologieën

* HTTPS / TLS encryptie
* AES-256 encryptie in rust
* Middleware-gebaseerde authenticatie
* Veilige uploadvalidatie

---

## Systeemarchitectuur

Het systeem gebruikt een server-assisted upload model:

1. Gebruiker logt in via frontend
2. Server valideert authenticatie en autorisatie
3. Server genereert een tijdelijke uploadtoegang (presigned URL) voor UploadThing
4. Bestand wordt direct client → UploadThing geüpload
5. UploadThing slaat het bestand veilig op en retourneert bevestiging
6. Metadata + URL worden opgeslagen in de database
7. Gebruiker kan het bestand ophalen via een beveiligde link; downloads worden bijgehouden

Dit ontwerp zorgt ervoor dat de backend geen bestanden direct verwerkt, wat schaalbaarheid en veiligheid verbetert.

---

## Installatie

Repository clonen:

```
git clone https://github.com/redarbib/CybersecuritySRS
cd CybersecuritySRS
```

Dependencies installeren:

```
npm install
npm install uploadthing @uploadthing/react
npm install mysql2 --save
```

UploadThing opzetten:

Maak een account aan bij UploadThing. Nadat je bent ingelogd, maak je een nieuw project aan. Vervolgens krijg je een API-key die je nodig hebt om UploadThing met je applicatie te verbinden. Deze API-key plaats je in `.env`-bestand, nadat je dit hebt gedaan herstart de development server. Als alles correct is ingesteld, werkt UploadThing en kunnen bestanden succesvol worden geüpload.

---

## Starten van het project

Development server starten:

```
npm run dev
```

Open:

```
http://localhost:3000
```

De applicatie herlaadt automatisch tijdens development.
 
---


## Omgevingsvariabelen

Maak een `.env` bestand aan:

```
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

## Projectstructuur

```
secure-file-transfer-system/
│
├── src/              # Pages en routing (Next.js App Router)
├── components/      # UI componenten
├── lib/             # Utility functies
├── services/       # Upload & security logica
├── database/       # Database schema/modellen
├── public/         # Statische assets
└── README.md
```

---

## Mapping van security requirements

* **Versleutelde uploads:** HTTPS/TLS
* **Versleutelde opslag:** AES-256 (UploadThing/S3)
* **Authenticatie:** verplicht voor upload en bewerken
* **Bestandstype restricties:** strikte whitelist
* **Bestandsgrootte limiet:** max 128 MB
* **Integriteitscontrole:** uploadstatus + checksum validatie

---

## Status van functionaliteiten

De volgende onderdelen zijn volledig afgerond en werken correct:

* Uploadfunctie voor bestanden
* Downloadfunctie met server-side controle
* Bestandsvalidatie (type + grootte)
* Basisbeveiliging bij upload en download
* Opslaan van metadata in database
* Login- en registratiesysteem
* Dashboard
* Upload naar UploadThing (cloud storage)

---

## Deployment

Ondersteunde platformen:

* Vercel
* AWS

Production build:

```
npm run build
npm start
```

---

## Repository en planning

* **GitHub:** [https://github.com/redarbib/CybersecuritySRS](https://github.com/redarbib/CybersecuritySRS)
* **Trello:** [https://trello.com/b/AQiKb9B6/cybersecurity-srs](https://trello.com/b/AQiKb9B6/cybersecurity-srs)
* **Figma:** [https://www.figma.com/design/5TLruobrWPr4XdPVYHDGTs/Cybersecurity-SRS?node-id=0-1&p=f&t=fXxjewbScdldj9MU-0](https://www.figma.com/design/5TLruobrWPr4XdPVYHDGTs/Cybersecurity-SRS?node-id=0-1&p=f&t=fXxjewbScdldj9MU-0)

---

## Teamleden

* Strahinja Zoranovic
* Saleh Saleh
* Reda Rbib