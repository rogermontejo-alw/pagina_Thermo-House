# Thermo House Platform

A hybrid sales platform transforming a rooftop quoter into a professional sales automation tool. Built with Next.js, Supabase, and Google Maps.

## 🚀 Features

- **Satellite Roof Measurement**: Users can measure their roof area directly using Google Maps integration.
- **Dynamic Quoting Engine**:
  - Detects roof type (Concrete vs Sheet).
  - Offers tailored solutions (Standard, Premium, Thermal).
  - Calculates Cash vs MSI prices automatically.
- **Sales Automation**:
  - Admin Dashboard for tracking leads.
  - "Click-to-Chat" WhatsApp integration for immediate conversion.
- **Admin Dashboard**:
  - Kanban-style Funnel view.
  - Real-time Price Configuration per city.

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Framer Motion
- **Database**: Supabase
- **Maps**: Google Maps JavaScript API

## ⚡️ Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
   ```

3. **Database Setup**
   Run the SQL found in `supabase/schema.sql` in your Supabase SQL Editor to create the necessary tables and policies.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access Admin Panel**
   Navigate to `/admin` to manage quotes and prices.

## 📄 License
Private (Thermo House)
