# Supabase Setup Guide

## 🔌 Connection Information

Your Supabase project has been configured with the following details:
- **Project URL**: `https://aweatxdukxqumpwqvmpb.supabase.co`
- **Database Host**: `db.aweatxdukxqumpwqvmpb.supabase.co`

## 📋 Setup Steps

### 1. Install Supabase Client Library

Run the following command in your project directory:

```bash
npm install @supabase/supabase-js
```

### 2. Get Your Supabase Anon Key

> [!IMPORTANT]
> You need to get your **anon/public key** from the Supabase Dashboard to complete the setup.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings** (gear icon in sidebar)
4. Click on **API** section
5. Copy the **anon/public** key (NOT the service_role key)

### 3. Update Environment Configuration

Open the file `src/environments/environment.ts` and replace `YOUR_SUPABASE_ANON_KEY_HERE` with your actual anon key:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://aweatxdukxqumpwqvmpb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Your actual key here
  }
};
```

### 4. Database Schema

Make sure your Supabase database has a `portfolio_cards` table with the following structure:

```sql
CREATE TABLE portfolio_cards (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  condition TEXT,
  language TEXT,
  quantity INTEGER DEFAULT 1,
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  current_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Using the Supabase Service

The `SupabaseService` has been created with the following methods:

### Get All Portfolio Cards
```typescript
const cards = await this.supabaseService.getPortfolioCards();
```

### Add a New Card
```typescript
const newCard = {
  name: 'Charizard VMAX',
  code: '(020/189)',
  condition: 'NM',
  language: 'EN',
  quantity: 1,
  purchase_date: '2025-11-30',
  purchase_price: 150.00,
  current_price: 200.00
};
const result = await this.supabaseService.addPortfolioCard(newCard);
```

### Remove a Card
```typescript
await this.supabaseService.removePortfolioCard(cardId);
```

### Update a Card
```typescript
const updates = { current_price: 250.00 };
await this.supabaseService.updatePortfolioCard(cardId, updates);
```

## 🔒 Security Notes

> [!WARNING]
> **Never commit your Supabase keys to version control!**

Add `src/environments/environment.ts` to your `.gitignore` file:

```
# Environment files
src/environments/environment.ts
src/environments/environment.prod.ts
```

> [!TIP]
> Create a template file `environment.template.ts` that others can copy:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

## 🔄 Next Steps

1. Install the Supabase client library
2. Get your anon key from the Supabase Dashboard
3. Update the environment configuration
4. Create the `portfolio_cards` table in your Supabase database
5. Inject `SupabaseService` into your components and start using it!

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Angular + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-angular)
