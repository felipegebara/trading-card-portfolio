-- ============================================
-- Tabela: transactions
-- Descrição: Armazena histórico de transações de compra, venda e trade de cartas
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL', 'TRADE')),
  carta TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  preco_unitario DECIMAL(10,2) NOT NULL CHECK (preco_unitario >= 0),
  valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  idioma VARCHAR(10),
  estado VARCHAR(10),
  data_transacao DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Índices para melhor performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(data_transacao DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_carta ON transactions(carta);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias transações
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir suas próprias transações
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias transações
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias transações
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Trigger para atualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transactions_updated_at ON transactions;
CREATE TRIGGER trigger_update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- ============================================
-- Comentários
-- ============================================

COMMENT ON TABLE transactions IS 'Histórico de transações de compra, venda e trade de cartas Pokémon';
COMMENT ON COLUMN transactions.transaction_type IS 'Tipo de transação: BUY (compra), SELL (venda), TRADE (troca)';
COMMENT ON COLUMN transactions.valor_total IS 'Valor total calculado automaticamente (quantidade * preco_unitario)';
