# 🎯 ONDE ENCONTRAR A COMPARAÇÃO DE VOLUME

## Passo a Passo para Ver o Comparativo

### 1️⃣ Abra a aplicação
Acesse: `http://localhost:5173` (ou a porta do seu dev server)

### 2️⃣ Vá para aba "ANÁLISE"
Clique na aba **"Análise"** (não é "Oportunidades")

### 3️⃣ Busque uma carta
No campo de busca, digite o nome de uma carta, ex:
- "latias"
- "lucario"
- "genesect"

### 4️⃣ Selecione a carta
Clique na carta que aparecer nos resultados da busca

### 5️⃣ Role para baixo 👇
Você verá nesta ordem:
```
1. Gráfico de preço & tendência
2. Fluxo de vendedores
3. Insights
4. ⭐ COMPARAÇÃO DE MERCADOS ⭐  ← AQUI!
   - Cards lado a lado (MYP vs PriceCharting)
   - BARRAS DE VOLUME (verde MYP / azul PC) ← NOVO!
   - Análise de tendências
5. Ver ofertas detalhadas (botão)
```

---

## 🔍 Se Ainda Não Aparecer

### Verificar no Console do Navegador
1. Pressione `F12` para abrir DevTools
2. Vá para aba **Console**
3. Procure por mensagens:
   - `✅ PriceCharting data loaded`
   - `📊 Sales data loaded: X sales`
   - `📊 Sales summary`

### Possíveis Problemas

#### Problema 1: Dados não carregam
**Sintoma:** Card de comparação não aparece  
**Causa:** Sem dados de PriceCharting para essa carta  
**Solução:** Tente outra carta

#### Problema 2: Erro de compilação
**Sintoma:** Página em branco ou erro  
**Causa:** Erro no TypeScript  
**Solução:** Verifique o terminal onde roda `npm run dev`

#### Problema 3: Cache do navegador
**Sintoma:** Mudanças não aparecem  
**Solução:** 
- Pressione `Ctrl + Shift + R` (hard refresh)
- Ou `Ctrl + F5`

---

## 📸 O Que Você Deve Ver

### Seção de Comparação Completa:
```
┌─────────────────────────────────────────────────┐
│ 📊 Comparação de Mercados                       │
│ Analise oportunidades entre mercados            │
├──────────────┬──────────────────────────────────┤
│ 🇧🇷 MYP      │ 🌎 PriceCharting                │
│ Vendas: 4    │ Preço: $104                      │
│ Volume: R$1k │ RAW Sales: 45                    │
│              │ PSA Sales: 28                    │
│              │ Total: 73                        │
└──────────────┴──────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📊 Comparativo de Volume de Vendas    ← NOVO!  │
│                                                 │
│ 🇧🇷 MYP Brasil                         4       │
│ ██████░░░░░░░░░░░░░░░░░░░░░░░░                  │
│ 4 vendas (7 dias)                              │
│                                                 │
│ 🌎 PriceCharting Int'l                 73      │
│ ████████████████████████████████████████████    │
│ 45 RAW + 28 PSA                                │
│                                                 │
│ Demanda Relativa: Internacional 18.2x maior 🔥  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 💡 Análise de Tendências                        │
│ Gap: +46.5% | Oport: R$ 256 | Fechando         │
│                                                 │
│ 💼 Recomendação: ⚠️ MYP sobrevalorizado        │
│ • MYP está 46.5% mais caro que PriceCharting   │
│ • 🔥 Demanda internacional 18x maior...        │
│ • Alta liquidez no exterior...                 │
│ • 🏆 Mercado prefere PSA...                    │
└─────────────────────────────────────────────────┘
```

---

## 🚨 DEBUG RÁPIDO

Cole isso no Console do navegador (F12):
```javascript
// Verificar se componente existe
const wrapper = document.querySelector('app-market-comparison-wrapper');
console.log('Wrapper encontrado:', wrapper ? 'SIM ✅' : 'NÃO ❌');

// Verificar dados
if (wrapper) {
  console.log('Props:', wrapper);
}
```

---

## ✅ Checklist

- [ ] Estou na aba "Análise"?
- [ ] Selecionei uma carta?
- [ ] Rolei a página para baixo?
- [ ] Vejo o card "📊 Comparação de Mercados"?
- [ ] Vejo a seção "📊 Comparativo de Volume de Vendas" logo abaixo?

Se marcou tudo ✅ mas não vê, me avise e vou investigar mais!
