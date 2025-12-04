# Market Analysis Advanced Component

## 📁 Estrutura de Arquivos

```
market-analysis-advanced/
├── market-analysis-advanced.component.ts  # Componente principal
├── market-analysis.types.ts               # Interfaces e tipos
├── market-analysis.service.ts             # Lógica de negócio
└── chart-renderer.ts                      # Renderização de gráficos
```

## 🏗️ Arquitetura

### 1. **market-analysis.types.ts**
Define todas as interfaces e tipos usados no componente:
- `MarketOffer`: Estrutura de uma oferta de mercado
- `OpportunityScore`: Score de oportunidade de compra
- `MarketKPIs`: Indicadores chave de performance
- `DistributionItem`: Item de distribuição (condição/idioma)
- `PriceEvolution`: Evolução de preços por data
- `FilterState`: Estado dos filtros

### 2. **market-analysis.service.ts**
Contém toda a lógica de negócio:
- `normalizeCondition()`: Normaliza nomes de condições
- `calculateOpportunityScore()`: Calcula score de oportunidade
- `isPriceOutlier()`: Detecta preços outliers
- `calculateConditionDistribution()`: Calcula distribuição por condição
- `calculateLanguageDistribution()`: Calcula distribuição por idioma
- `getBestValueCondition()`: Identifica melhor custo-benefício
- `getMarketTrend()`: Determina tendência de mercado
- `getPriceZone()`: Identifica zona de preço
- `getRecommendation()`: Gera recomendação
- `exportToCSV()`: Exporta dados para CSV

### 3. **chart-renderer.ts**
Responsável pela renderização de gráficos:
- `renderPriceChart()`: Renderiza gráfico de evolução de preços
- Métodos privados para desenhar grid, bandas, linhas, pontos, labels e legenda

### 4. **market-analysis-advanced.component.ts**
Componente principal que orquestra tudo:
- **State Management**: Usa Angular signals para reatividade
- **Computed Properties**: Cálculos derivados automáticos
- **Data Loading**: Integração com Supabase
- **Filter Management**: Gerenciamento de filtros e histórico
- **Template Helpers**: Métodos auxiliares para o template

## 🔄 Fluxo de Dados

```
Supabase
   ↓
loadData()
   ↓
allOffers (signal)
   ↓
filteredOffers (computed) ← selectedCard, selectedLanguage, etc.
   ↓
├─→ kpis (computed)
├─→ conditionDistribution (computed)
├─→ languageDistribution (computed)
├─→ priceEvolution (computed)
└─→ displayedOffers (computed) ← quickFilter, sortColumn
```

## 📊 Features Implementadas

### KPIs Inteligentes
- Preço mínimo com tendência
- Preço médio com tendência
- Liquidez (ofertas/dia)
- Dispersão de preços

### Análise de Oportunidades
- Score automático (0-100)
- Classificação: TOP PICK, Bom, OK, Caro
- Detecção de outliers (±2 desvios padrão)

### Visualizações
- Gráfico de evolução com previsão
- Distribuições por condição e idioma
- Insights automáticos

### Filtros e Ordenação
- Filtros: carta, idioma, condição, período
- Histórico de filtros recentes
- Quick filters: Top Picks, NM, Baratos
- Ordenação por score ou preço

### Análise Preditiva
- Tendência de mercado
- Zona de preço (compra/venda/neutra)
- Recomendação automática

### Exportação
- CSV com todos os dados e scores

## 🎨 Princípios de Design

1. **Separação de Responsabilidades**
   - Tipos separados da lógica
   - Lógica de negócio separada da apresentação
   - Renderização de gráficos isolada

2. **Reatividade**
   - Uso de signals para estado
   - Computed properties para cálculos derivados
   - Effects para side effects (chart rendering)

3. **Testabilidade**
   - Serviços com métodos estáticos
   - Lógica pura sem dependências
   - Fácil de mockar e testar

4. **Manutenibilidade**
   - Código organizado e documentado
   - Nomes descritivos
   - Funções pequenas e focadas

## 🚀 Como Usar

```typescript
// O componente é standalone e pode ser usado diretamente
import { MarketAnalysisAdvancedComponent } from './components/market-analysis-advanced/market-analysis-advanced.component';

// No template
<app-market-analysis-advanced></app-market-analysis-advanced>
```

## 🔧 Extensões Futuras

- [ ] Integração com API de previsão de preços
- [ ] Alertas de preço personalizados
- [ ] Comparação entre múltiplas cartas
- [ ] Histórico de compras do usuário
- [ ] Gráficos interativos com tooltips
- [ ] Filtros salvos personalizados
- [ ] Exportação em múltiplos formatos
