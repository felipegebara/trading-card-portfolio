-- =====================================================
-- SQL SIMPLIFICADO - Histórico de Transações
-- Copie e cole TUDO no Supabase SQL Editor
-- =====================================================

-- 1. LIMPAR (remover tabela antiga se existir)
DROP TABLE IF EXISTS transactions CASCADE;

-- 2. Garantir extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CRIAR TABELA TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tipo TEXT NOT NULL,
    carta TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    estado TEXT,
    idioma TEXT,
    notas TEXT,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR ÍNDICES
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_data ON transactions(data DESC);
CREATE INDEX idx_transactions_tipo ON transactions(tipo);

-- 5. ATIVAR RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS (para usuários verem apenas suas transações)
CREATE POLICY "Usuários veem suas transações"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem suas transações"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam suas transações"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas transações"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- ✅ PRONTO! Tabela criada com sucesso!
