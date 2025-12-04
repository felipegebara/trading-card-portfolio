-- ====================================
-- CONVERSION FACTOR TABLES
-- ====================================
-- These tables store conversion factors for adjusting prices
-- when exact language/condition combinations aren't available

-- Language conversion factors
CREATE TABLE IF NOT EXISTS public.idioma_factor (
    idioma VARCHAR(50) PRIMARY KEY,
    factor DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default language factors  
INSERT INTO public.idioma_factor (idioma, factor) VALUES
    ('PT-BR', 1.00),
    ('EN', 0.85),
    ('JPN', 1.15),
    ('ES', 0.90),
    ('FR', 0.88),
    ('DE', 0.87),
    ('IT', 0.86)
ON CONFLICT (idioma) DO NOTHING;

-- Condition/State conversion factors
CREATE TABLE IF NOT EXISTS public.estado_factor (
    estado VARCHAR(50) PRIMARY KEY,
    factor DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default condition factors
INSERT INTO public.estado_factor (estado, factor) VALUES
    ('NM', 1.00),
    ('SP', 0.70),
    ('MP', 0.50),
    ('HP', 0.30),
    ('D', 0.10)
ON CONFLICT (estado) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_idioma_factor ON public.idioma_factor(idioma);
CREATE INDEX IF NOT EXISTS idx_estado_factor ON public.estado_factor(estado);

-- ====================================
-- COMMENTS
-- ====================================
COMMENT ON TABLE public.idioma_factor IS 'Conversion factors for different card languages';
COMMENT ON TABLE public.estado_factor IS 'Conversion factors for different card conditions';
