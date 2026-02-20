# 🍽️ Estrutura do Cardápio — O que vai dentro de quê

## Hierarquia do Menu

```
MENU (Seu Manel)
├── 🥟 Pastéis / Salgados
├── 🍢 Espetinhos
├── 🍽️ Executivos / Pratos do Dia
├── 🥗 Guarnições
├── 🍰 Sobremesas
├── 🥩 Pratos à la Carte
├── 🍟 Petiscos / Frituras
├── 🍹 Drinks (subcategorias: Caipirinhas, Coquetéis, Gin, Especiais)
├── 🥃 Shots
├── 🍺 Long Neck / Cervejas Unid.
├── 🍺 Cervejas 600ml
├── 🍷 Vinhos (garrafas)
├── 🥃 Destilados — Garrafa
├── 🥃 Destilados — Dose
├── 🧃 Sucos (variantes: Copo / Jarra)
├── 💧 Águas / Energéticos / Refri
├── 🥂 Combos Whisky (variantes: c/ Red Bull / c/ Água Coco)
├── 📦 Diversos / Utensílios
├── 🍬 Balas / Pequenos Itens
└── ⚠️ Danos (ADMIN-ONLY — não aparece pro cliente)
```

---

## Regras de Variantes e Addons

### Tipos de Variação (Radio — seleciona 1):
| Tipo | Exemplo | Produtos que usam |
|------|---------|-------------------|
| Tamanho | P / M / G | Picanha, Tábua de Frios |
| Modo | Com casca / Sem casca | Camarão |
| Origem | Nacional / Importado | Gin drinks |
| Formato | Copo / Jarra | Sucos |
| Combo | c/ 4 Red Bull / c/ 4 Água Coco | Combos Whisky |

### Tipos de Addons (Checkbox — multi-select):
| Tipo | Itens | Produtos que usam |
|------|-------|-------------------|
| Guarnições | Arroz (+7), Farofa (+5), Vinagrete (+7), Purê (+5) | Espetinhos, Pratos |
| Molhos | Rosé, Tártaro | Isca de Peixe, Batata Frita |

---

## Detalhamento por Categoria

### 🥟 1. Pastéis (7 produtos, sem variantes)
- Pastel de Carne — R$ 30
- Pastel Frango — R$ 30
- Pastel Frango c/ Catupiry — R$ 30
- Pastel Carne c/ Queijo — R$ 30
- Pastel Carne de Sol c/ Catupiry — R$ 30
- Pastel de Queijo — R$ 30
- Pastel Romeu e Julieta (6 un.) — R$ 18

### 🍢 2. Espetinhos (8 produtos, addons: guarnições)
- Espeto de Linguiça — R$ 19
- Espeto de Frango — R$ 18
- Espeto de Porco — R$ 20
- Espeto Medalhão de Filé — R$ 28
- Medalhão de Frango — R$ 25
- Coração de Galinha — R$ 18
- Espeto de Filé — R$ 25
- Espeto de Picanha — R$ 29

> **Upsell:** "Completo com arroz + vinagrete + farofa? +R$ 19"

### 🍽️ 3. Executivos (3 produtos, acompanhamentos inclusos)
- Executivo Pescada (arroz, batata, vinagrete, farofa) — R$ 30
- Executivo Bife Acebolado (ovo, arroz, purê, vinagrete, farofa) — R$ 30
- Prato Kids (filé, arroz, batata) — R$ 22

### 🥗 4. Guarnições (4 itens — também servem como addons)
- Arroz R$7 | Farofa R$5 | Vinagrete R$7 | Purê R$5

### 🍰 5. Sobremesas (2 produtos)
- Sobremesa Seu Manel (brownie + sorvete) — R$ 25
- Pudim — R$ 10

### 🥩 6. Pratos à la Carte (7 produtos, variantes em Picanha)
- **Picanha na Chapa**: G R$ 175 (4 pess.) / M R$ 125 (2 pess.)
- Chapa Mista — R$ 150
- Carne de Sol de Filé 500g — R$ 155
- Camarão Internacional — R$ 125
- Filé Pescada na Chapa — R$ 150
- Filé Peixe à Delícia — R$ 130
- Moqueca com Camarão G — R$ 170

### 🍟 7. Petiscos (24 produtos — categoria grande!)
Inclui: Macaxeira, Batata, Camarão (variantes com/sem casca), Carne de Sol, Filé, Calabresa, Tábua de Frios (variantes M/G), Frango, Costela, Torresmo, Linguiça, Dadinho...

> **Camarão ao Alho:** variante Com Casca R$60 / Sem Casca R$70
> **Tábua de Frios:** variante M R$45 / G R$65

### 🍹 8. Drinks (subcategorias!)
- **Caipirinhas** (4): R$15-36
- **Coquetéis** (7): R$18-22
- **Gin** (5, variante Nacional/Importado): R$24-31
- **Especiais** (6+): R$28-47

### 🥃 9. Shots (9 produtos): R$5-30

### 🍺 10. Long Neck (7+): R$12-15

### 🍺 11. Cerveja 600ml (7+): R$12-18

### 🍷 12. Vinhos (6): R$45-130

### 🥃 13. Destilados Garrafa (14 — ⚠️ VERIFICAR preços)

### 🥃 14. Destilados Dose (10+): R$5-26

### 🧃 15. Sucos (7, variante Copo/Jarra): R$7-30

### 💧 16. Águas/Energéticos/Refri (10+): R$4-24

### 🥂 17. Combos Whisky (6, variante Red Bull/Água Coco): R$255-550
> `is_combo = true` — addons desabilitados

### 📦 18. Diversos (4): R$2-10

### 🍬 19. Balas (6): R$0,25-4

### ⚠️ 20. Danos — ADMIN-ONLY (3): R$3-15
> NÃO aparece no menu do cliente. Admin adiciona manualmente na comanda.

---

## Couvert Artístico
- R$ 10,00 por pessoa (configurável no admin)
- Toggle para ativar/desativar
- Aplicado automaticamente: `num_guests × couvert_value`
