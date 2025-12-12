# 🔧 FIX: Busca de Cartas não Funciona

## Problema
A busca por cartas (ex: "lat" para Latias) não est retornando resultados.

## Causa
O método `loadAllCards()` está buscando de `myp_cards_meg` que tem apenas ~200 registros duplicados,  quando deveria buscar de `card_images` que tem as 10 cartas únicas.

## Solução Rápida (1 EDIT)

Abra o arquivo:
```
src/components/market-analysis-advanced/market-analysis-advanced.component.ts
```

Encontre a linha **567** (aproximadamente):
```typescript
.from('myp_cards_meg')
```

Troque por:
```typescript
.from('card_images')
```

E na linha **568**, troque:
```typescript
.select('carta, url')
```

Por:
```typescript
.select('carta, image_url')
```

## Código Completo da Função

Se preferir substituir a função inteira, localize `async loadAllCards()` (linha ~562) e substitua por:

```typescript
async loadAllCards() {
  console.log('🔄 Carregando todas as cartas...');
  // Changed to card_images which has all 10 unique cards
  const { data, error } = await supabase
    .from('card_images')
    .select('carta, image_url')
    .order('carta', { ascending: true });

  if (error) {
    console.error('❌ Erro ao carregar cartas:', error);
    return;
  }

  if (data) {
    const unique = new Map();
    data.forEach((d: any) => {
      if (d.carta && !unique.has(d.carta)) {
        unique.set(d.carta, {
          card_name: d.carta,
          slug: d.carta
        });
      }
    });

    const cards = Array.from(unique.values());
    console.log(`✅ ${cards.length} cartas carregadas.`);
    this.allCards.set(cards);
  }
}
```

## Teste
Após fazer a alteração:
1. Recarregue a página
2. Vá para a aba "Análise"
3. Digite "lat" na busca
4. Deve aparecer "Mega Latias EX" nos resultados ✅

## Por que card_images?
- `myp_cards_meg`: ~200 rows (duplicados)
- `card_images`: 10 rows (1 por carta única) ✅
