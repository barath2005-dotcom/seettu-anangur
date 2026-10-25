# Seettu Manager — Android APK + Web Application

A production-oriented, full-stack **Seettu (Chit Fund / Rotating Savings & Credit Association - ROSCA)** Investment Management System.

Built with a unified monorepo architecture, shared database schema, and identical real-time REST APIs powering both a responsive web dashboard and an Android mobile application.

---

## 1. System Architecture

```
seettu-manager/
├── packages/
│   └── shared/                 # Shared TypeScript interfaces, Zod schemas, INR & Kolkata time utils
├── apps/
│   ├── backend/                # Node.js, Express, Prisma ORM, JWT (Access + Refresh), Vitest
│   │   ├── prisma/             # Schema (PostgreSQL & SQLite), automated seed scripts
│   │   └── src/                # Auth, Members, Schemes, Payments Ledger, Payouts, Reports, Audit
│   ├── web/                    # React 18, Vite, Tailwind CSS, Recharts, Lucide (All 17 Screens)
│   └── mobile/                 # React Native, Expo, Expo Router, EAS Build for APK (All 11 Screens)
├── docker-compose.yml          # PostgreSQL 16 + API + Web containers
└── README.md
```

### Core Design Principles
- **Monetary Precision**: All money is strictly stored and calculated in **integer minor units (Paise)**:
  `₹5,000 = 500,000 Paise`. Never uses floating-point arithmetic.
- **Timezone**: All collection due dates, transactions, and statements are calculated in **`Asia/Kolkata` (IST)**.
- **Idempotency**: All payment transactions enforce unique idempotency keys and database constraints to prevent double collection.
- **Audit Trails**: Every administrative action, payment reversal, and payout approval logs an immutable record with user ID, timestamp, and client IP.

---

## 2. Quick Start (Run Locally on Localhost)

### Prerequisites
- Node.js >= 18 (Tested on v26)
- npm >= 9

### Step 1: Install Dependencies
```bash
cd /Users/barathr/.gemini/antigravity/scratch/seettu-manager
npm install
npm run build:shared
```

### Step 2: Initialize Database & Seed Demo Data
```bash
# Push schema to local database
cd apps/backend
npx prisma db push

# Seed realistic demo data (Members, Schemes, Payments, Payouts)
npx tsx prisma/seed.ts
cd ../..
```

### Step 3: Start the Backend API (Port 4000)
```bash
npm --workspace=@seettu/backend run dev
```
*API will run at `http://localhost:4000`. Health check at `http://localhost:4000/api/health`.*

### Step 4: Start the Web Application (Port 5173)
In a separate terminal:
```bash
npm --workspace=@seettu/web run dev
```
*Open your browser at `http://localhost:5173`.*

---

## 3. Demo Credentials

The database comes pre-seeded with 3 roles ready for testing:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@seettu.com` | `admin123` | Full access: Members, Schemes, Payments, Payout Approvals, Staff, Audit |
| **Staff** | `staff@seettu.com` | `staff123` | Member viewing, Record payments, Prepare payouts |
| **Member** | `member@seettu.com` | `member123` | View own profile (Ramesh Kumar M-001), personal passbook, receipts |

---

## 4. Run Automated Vitest Tests

Run the full integration test suite covering authentication, member privacy, collection calculations, idempotency, and financial reconciliation:

```bash
npm --workspace=@seettu/backend run test
```

---

## 5. Android APK Generation (Expo EAS)

The mobile application is configured with Expo Application Services (EAS) to build a standalone, distributable **Android APK** that does not require the Google Play Store.

### Configuration (`apps/mobile/eas.json`)
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-production-api.com/api"
      }
    }
  }
}
```

### Exact Commands to Build the APK
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Navigate to the mobile app directory and start the APK build:
   ```bash
   cd apps/mobile
   eas build -p android --profile preview
   ```
4. EAS will compile the Android build in the cloud and output a direct download link for the `.apk` file.
5. Transfer and install the `.apk` on any Android device (enable "Install from Unknown Sources").

### Running Mobile App in Development:
```bash
cd apps/mobile
npm run android    # Run on connected Android device / emulator
npm run web        # Test mobile responsive layout in browser
```

---

## 6. PostgreSQL Production Deployment

For production deployments using PostgreSQL:

### Using Docker Compose
```bash
docker-compose up -d
```
This automatically boots:
- **PostgreSQL 16**: Container `seettu-postgres` on port 5432
- **Backend API**: Container `seettu-backend` on port 4000
- **Web App**: Container `seettu-web` on port 3000

### Production PostgreSQL URL
Set in your production `.env`:
```env
DATABASE_URL="postgresql://postgres:password@your-db-host:5432/seettu_db?schema=public"
```

To run Prisma migrations against PostgreSQL:
```bash
cd apps/backend
npx prisma db push --schema=prisma/schema.postgresql.prisma
```

---

## 7. Legal and Operational Safeguards

> [!IMPORTANT]
> This software is designed strictly for recordkeeping, accounting, and administrative management.
> In India, pooled savings and chit funds are governed under the **Chit Funds Act, 1982**, state chit fund rules, and RBI / SEBI regulations. 
> Before operating a real-money chit fund or investment scheme, verify statutory registration, state authorization, and payment provider agreements with qualified legal counsel.
