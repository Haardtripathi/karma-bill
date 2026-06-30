# karma-automobiles-billing

A complete local MERN billing application for KARMA AUTOMOBILES. It supports customers, inventory/service items, invoices with multiple line items, image uploads, PDF generation, print-friendly invoice layout, WhatsApp invoice messages through Twilio, and dashboard totals.

## Features

- Company settings for invoice header, logo, signature, terms, maps link and invoice prefix
- Customer CRUD with soft delete
- Inventory/service item CRUD with stock checks for parts and other items
- Invoice creation, edit, soft delete, cancel and later payment collection
- Auto invoice numbers starting from `KA-107`
- KARMA AUTOMOBILES style print/PDF invoice template
- Cloudinary uploads when credentials are configured, local upload fallback for development
- Twilio WhatsApp invoice message workflow
- Backend Jest/Supertest tests with MongoDB memory server
- Frontend Vitest/Testing Library tests

## Tech Stack

Backend: Node.js, Express, MongoDB, Mongoose, Zod, Multer, Cloudinary, Twilio, Puppeteer, Jest, Supertest, mongodb-memory-server.

Frontend: React, Vite, React Router, Axios, TanStack React Query, React Hook Form-ready dependencies, Zod, React Hot Toast, Lucide React, Vitest, React Testing Library.

## Folder Structure

```text
backend/src
  config/ controllers/ middlewares/ models/ routes/ seed/ services/ templates/ tests/ utils/ validations/
frontend/src
  api/ components/ hooks/ layout/ pages/ routes/ styles/ tests/ utils/
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

The backend defaults to local MongoDB:

```text
mongodb://127.0.0.1:27017/karma_automobiles_billing
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

The frontend reads:

```text
VITE_API_BASE_URL=http://localhost:5001/api
VITE_BACKEND_PUBLIC_URL=http://localhost:5001
VITE_WHATSAPP_SHARE_ATTACHMENT=auto
```

`VITE_WHATSAPP_SHARE_ATTACHMENT` controls the WhatsApp file shared by the frontend/native app:

- `auto`: try PDF first, then fall back to the generated invoice image.
- `pdf`: share only the invoice PDF.
- `image`: share only the generated invoice image (`pdfImageUrl`).

## Local MongoDB Setup

Install and start MongoDB locally, then keep it running while using the app. The database is created automatically on first write.

## Twilio Setup

Add these to `backend/.env`:

```text
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
DEFAULT_COUNTRY_CODE=91
SEND_PDF_AS_MEDIA=false
```

The app sends a WhatsApp text message with the invoice link. Set `SEND_PDF_AS_MEDIA=true` only when `pdfUrl` is public and Twilio media delivery is configured.

## Cloudinary Setup

Add these to `backend/.env`:

```text
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_ROOT_FOLDER=karma-automobiles
```

If Cloudinary credentials are blank, uploads are stored under `backend/uploads` and served by the backend for local development.

## Seed Data

```bash
cd backend
npm run seed:company
npm run seed:items
```

Seeded inventory includes PETROL AND CNG SERVICE WITH WASHING, Engine oil, Oil filter, Air filter, Ac filter, Coolant, WHEEL ALIGNMENT AND WHEEL BALANCING, BRAKE PAD [SYNTHETIC], BRAKE DISC CUTTING, and CALIPER PIN NEW.

## Run Backend

```bash
cd backend
npm run dev
```

API base URL: `http://localhost:5001/api`

## Run Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.


## Install As App

The frontend is PWA-ready. Open `http://localhost:5173` in Chrome or Edge, then use the browser install option to add **KA Billing** as an app. On Android, use **Add to Home screen**. The app uses a manifest and service worker for an app-like shell while still calling the local backend API.

## Run Tests

```bash
cd backend
npm test

cd ../frontend
npm test
```

## API List

Health: `GET /api/health`

Dashboard: `GET /api/dashboard/summary`

Company settings: `GET /api/company-settings`, `PUT /api/company-settings`, `POST /api/company-settings/logo`, `POST /api/company-settings/signature`

Customers: `POST /api/customers`, `GET /api/customers`, `GET /api/customers/:id`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`

Inventory: `POST /api/inventory-items`, `GET /api/inventory-items`, `GET /api/inventory-items/:id`, `PUT /api/inventory-items/:id`, `DELETE /api/inventory-items/:id`, `POST /api/inventory-items/:id/image`

Invoices: `POST /api/invoices`, `GET /api/invoices`, `GET /api/invoices/:id`, `PUT /api/invoices/:id`, `DELETE /api/invoices/:id`, `PATCH /api/invoices/:id/cancel`, `POST /api/invoices/:id/payments`, `POST /api/invoices/:id/generate-pdf`, `GET /api/invoices/:id/pdf`, `GET /api/invoices/:id/print-data`, `POST /api/invoices/:id/send-whatsapp`

Uploads: `POST /api/uploads/image`, `POST /api/uploads/invoice-image`

WhatsApp: `POST /api/whatsapp/send-invoice/:invoiceId`

Twilio webhooks: `POST /api/webhooks/twilio/status`, `POST /api/webhooks/twilio/inbound`

## Common Issues

- MongoDB connection fails: make sure local MongoDB is running and `MONGO_URI` points to `127.0.0.1`.
- WhatsApp fails: add Twilio credentials and use a phone number joined to the Twilio WhatsApp sandbox or approved sender.
- Cloudinary upload fails: check all three Cloudinary credentials. With blank credentials the app uses local uploads.
- PDF generation falls back: Puppeteer may need a local Chromium/Chrome install on some Linux setups. The endpoint still returns a PDF fallback instead of crashing.
- CORS errors: confirm `CLIENT_URL=http://localhost:5173` in `backend/.env`.

## Local Run Summary

Terminal 1:

```bash
cd backend
npm install
npm run seed:company
npm run seed:items
npm run dev
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```
