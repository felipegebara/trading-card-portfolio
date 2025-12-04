# Supabase Integration - Quick Reference

## 📁 Files Created

1. **`src/services/supabase.service.ts`** - Main Supabase service with CRUD operations
2. **`src/environments/environment.ts`** - Environment configuration (needs your anon key)
3. **`src/app.component.supabase.example.ts`** - Example component showing Supabase integration
4. **`src/SUPABASE_SETUP.md`** - Detailed setup instructions

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Get Your Anon Key
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Project Settings → API → Copy "anon/public" key

### 3. Update Environment
Edit `src/environments/environment.ts`:
```typescript
anonKey: 'YOUR_ACTUAL_KEY_HERE'
```

### 4. Create Database Table
Run this SQL in Supabase SQL Editor:
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

## 🎯 Usage in Components

### Inject the Service
```typescript
constructor(private supabaseService: SupabaseService) {}
```

### Load Data
```typescript
const cards = await this.supabaseService.getPortfolioCards();
```

### Add Card
```typescript
await this.supabaseService.addPortfolioCard({
  name: 'Card Name',
  code: 'CODE',
  condition: 'NM',
  language: 'PT-BR',
  quantity: 1,
  purchase_date: '2025-11-30',
  purchase_price: 100.00,
  current_price: 150.00
});
```

### Remove Card
```typescript
await this.supabaseService.removePortfolioCard(cardId);
```

## 🔗 Your Connection Details

- **Project URL**: `https://aweatxdukxqumpwqvmpb.supabase.co`
- **Database**: `postgres`
- **Connection String**: `postgresql://postgres:Fridameudog12@db.aweatxdukxqumpwqvmpb.supabase.co:5432/postgres`

> ⚠️ **Note**: The connection string is for backend/server use only. For frontend Angular apps, use the Supabase JavaScript client with the anon key.

## 📚 Next Steps

1. Check `src/SUPABASE_SETUP.md` for detailed instructions
2. Review `src/app.component.supabase.example.ts` for integration examples
3. Update your `app.component.ts` to use Supabase instead of mock data
