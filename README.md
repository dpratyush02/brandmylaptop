# BrandMyLaptop 💻✨

> **Your Brand. On My Laptop.**  
> A real-world advertising auction built around an actual HP laptop lid. 10 physical advertising spots, a 72-hour live auction, instant online logo placement, and physical vinyl sticker fulfillment.

---

## ⚡ Key Features

- **Interactive HP Laptop Mockup**: 16:10 matte obsidian lid featuring 10 numbered sticker zones with live logo rendering and hover tooltips.
- **72-Hour Live Countdown**: Synchronized auction clock pushing real-time bid updates via Server-Sent Events (SSE).
- **Dodo Payments Integration**: Hosted Dodo Payments Checkout Sessions with cryptographic webhook signature verification (`standardwebhooks`).
- **Instant Online vs Physical Fulfillment Rule**:
  - **Online**: When a valid bid is confirmed, the sponsor's logo appears live on the digital laptop mockup immediately.
  - **Physical**: Highest bidder at the 72-hour close wins the physical sticker on the real laptop lid (installed within 72h).
- **Admin Operations Dashboard (`/admin`)**: Password-protected portal to manage spots, trigger extensions, and update sticker fulfillment pipelines (`Winner Confirmed` → `Logo Received` → `Prepared` → `Installed` → `Proof Uploaded`).

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/brandmylaptop.git
cd brandmylaptop
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your variables:
```env
DODO_PAYMENTS_API_KEY=your_dodo_api_key
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_WEBHOOK_SECRET=whsec_your_webhook_secret
DODO_RETURN_URL=http://localhost:3000/auction/success
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PASSWORD=your_secure_admin_password
```

### 3. Initialize the Database
```bash
npx prisma db push
node scripts/seed.mjs
```

### 4. Run Development Server
```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Vercel Deployment

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the environment variables from `.env.example`.
4. Deploy!

### Post-Deployment Webhook Setup:
In your **Dodo Payments Dashboard** (`app.dodopayments.com`):
- Add Webhook Endpoint: `https://your-vercel-domain.vercel.app/api/webhooks/dodo`
- Event: `payment.succeeded`
- Copy the `whsec_...` signing secret into your Vercel Environment Variables.
