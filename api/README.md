# Edge Functions - Vercel Python Runtime

Esta pasta contém Edge Functions que rodam no Python runtime do Vercel.

## Como funciona

O Vercel detecta automaticamente qualquer arquivo `.py` nesta pasta e cria um endpoint serverless.

**Exemplo:**
- `api/forecast.py` → Cria endpoint em `/api/forecast`

## Forecast API

### Endpoint: `/api/forecast`
**Método:** POST

**Request Body:**
```json
{
  "historical": [
    {"date": "2024-01-01", "price": 100},
    {"date": "2024-01-02", "price": 105},
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Forecast gerado com sucesso",
  "forecast": [
    {
      "date": "2024-01-08",
      "predicted": 110.5,
      "lower": 105.2,
      "upper": 115.8
    },
    ...
  ]
}
```

## Dependências

As dependências Python são instaladas automaticamente pelo Vercel a partir de `requirements.txt`.

## Deploy

Não precisa fazer nada! Basta:

1. Commit os arquivos
2. Push para o GitHub
3. Vercel detecta e deploya automaticamente

## Testes Locais

Para testar localmente, instale o Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Isso iniciará um servidor local em `http://localhost:3000`.
