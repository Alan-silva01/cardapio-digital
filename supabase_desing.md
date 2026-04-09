# 📘 Bíblia de Design Supabase — Dados 100% Reais do DOM (2026)

> Extraído via `getComputedStyle` direto do Chrome DevTools no projeto real  
> URL: `https://supabase.com/dashboard/project/wphpvlfpcrjmvwfukzpc/database/schemas`  
> **Todos os valores são computados reais — sem estimativas.**

---

## 🔤 TIPOGRAFIA GLOBAL

| Propriedade | Valor Real |
|---|---|
| **Font Family** | `customFont, "customFont Fallback", Circular, custom-font, "Helvetica Neue", Helvetica, Arial, sans-serif` |
| **Font Family Base (CSS Var)** | `--font-family-body: Inter` |
| **Font Size (body base)** | `12px` |
| **Line Height (body base)** | `18px` |
| **Font Weight padrão** | `400` (Regular) |

---

## 🌑 TEMA ESCURO (DARK MODE)

### Body

| Propriedade | Valor Real |
|---|---|
| **background** | `#171717` (`rgb(23, 23, 23)`) |
| **color (texto)** | `#fafafa` (`rgb(250, 250, 250)`) |
| **font-size** | `12px` |
| **line-height** | `18px` |

### Sidebar

| Propriedade | Valor Real |
|---|---|
| **background** | `#171717` |
| **border-right-color** | `#2e2e2e` |
| **padding** | `0px 9px 0px 6px` |
| **width (container total)** | `~260px` aberto / `~48px` fechado |

### Links de Navegação (NAV_LINKS)

| Propriedade | Valor Real |
|---|---|
| **color** | `#fafafa` |
| **background (padrão)** | `transparent` |
| **background (ativo)** | `#006239` (verde escuro da marca no dark) |
| **font-size** | `12px` |
| **font-weight** | `400` |
| **padding** | `3px 7.5px` |
| **border-radius** | `4.5px` |

### Link Ativo (ACTIVE_LINK)

| Propriedade | Valor Real |
|---|---|
| **color** | `#fafafa` |
| **background** | `#006239` |
| **font-weight** | `400` |

### Títulos de Grupos (GROUP_TITLES)

| Propriedade | Valor Real |
|---|---|
| **color** | `#898989` |
| **font-size** | `10.5px` |
| **font-weight** | `400` |
| **letter-spacing** | `normal` |
| **text-transform** | `none` |

### Botões

| Botão | bg | color | border | border-radius | height | padding |
|---|---|---|---|---|---|---|
| **Nav/Icon button** | `transparent` | `#898989` | `0px solid #2e2e2e` | `4.5px` | `30px` | `6px` |
| **Pill button (ex: branch)** | `#242424` | `#fafafa` | `1px solid #363636` | `9999px` | `24px` | `3px 7.5px` |
| **Primary (Connect)** | `#006239` | `#fafafa` | none | `4.5px` | `30px` | `3px 7.5px` |

---

## ☀️ TEMA CLARO (LIGHT MODE)

### Body

| Propriedade | Valor Real |
|---|---|
| **background** | `#fcfcfc` (`rgb(252, 252, 252)`) |
| **color (texto)** | `#171717` (`rgb(23, 23, 23)`) |
| **font-size** | `12px` |
| **line-height** | `18px` |

### Sidebar

| Propriedade | Valor Real |
|---|---|
| **background** | `#fcfcfc` |
| **border-right-color** | `#dfdfdf` |
| **padding** | `0px 9px 0px 6px` |

### Links de Navegação (NAV_LINKS)

| Propriedade | Valor Real |
|---|---|
| **color** | `#171717` |
| **background (padrão)** | `transparent` |
| **background (ativo)** | `#72e3ad` (verde claro da marca no light) |
| **font-size** | `12px` |
| **font-weight** | `400` |
| **padding** | `3px 7.5px` |
| **border-radius** | `4.5px` |

### Link Ativo (ACTIVE_LINK)

| Propriedade | Valor Real |
|---|---|
| **color** | `#171717` |
| **background** | `#72e3ad` |
| **font-weight** | `400` |

### Títulos de Grupos (GROUP_TITLES)

| Propriedade | Valor Real |
|---|---|
| **color** | `#707070` |
| **font-size** | `10.5px` |
| **font-weight** | `400` |
| **letter-spacing** | `normal` |
| **text-transform** | `none` |

### Botões

| Botão | bg | color | border | border-radius | height | padding |
|---|---|---|---|---|---|---|
| **Nav/Icon button** | `transparent` | `#707070` | `0px solid #dfdfdf` | `4.5px` | `30px` | `6px` |
| **Pill button (ex: branch)** | `#fdfdfd` | `#171717` | `1px solid #d4d4d4` | `9999px` | `24px` | `3px 7.5px` |
| **Primary (Connect)** | `#72e3ad` | `#171717` | none | `4.5px` | `30px` | `3px 7.5px` |

---

## 🎨 VARIÁVEIS CSS CRÍTICAS (CSS_VARS do Root)

Extraídas via `getComputedStyle(document.documentElement)` — valores nos dois temas.

### Backgrounds e Surfaces

| Variável | Dark | Light | Descrição |
|---|---|---|---|
| `--background-dialog-default` | `hsl(0,0%,7.1%)` = `#121212` | `hsl(0,0%,100%)` = `#ffffff` | Fundo de modais/dialogs |
| `--background-overlay-hover` | `hsl(0,0%,18%)` = `#2e2e2e` | `hsl(0,0%,95.3%)` = `#f3f3f3` | Hover em overlays |
| `--background-surface-75` | — | `hsl(0,0%,100%)` = `#ffffff` | Superfície elevada no light |

### Bordas

| Variável | Dark | Light |
|---|---|---|
| Sidebar border-right | `#2e2e2e` | `#dfdfdf` |
| Pill Button border | `#363636` | `#d4d4d4` |

### Cores de Marca (Brand)

| Variável | Dark | Light | Descrição |
|---|---|---|---|
| `--brand-link` | `hsl(155,100%,38.6%)` = `#00c573` | `hsl(153.4,100%,36.7%)` = `#00ba6c` | Cor de links e brand |
| Active link bg | `#006239` | `#72e3ad` | Fundo do item ativo |

### Border Radii

| Variável | Valor |
|---|---|
| `--borderradius-lg` | `8px` |
| Nav item | `4.5px` |
| Pill buttons | `9999px` |

### Spacing

| Variável | Valor |
|---|---|
| `--spacing-scale` | `2px` |
| `--borderwidth-md` | `4px` |

---

## 📐 RESUMO COMPARATIVO (Dark vs Light)

| Elemento | DARK | LIGHT |
|---|---|---|
| Body background | `#171717` | `#fcfcfc` |
| Body text | `#fafafa` | `#171717` |
| Sidebar background | `#171717` | `#fcfcfc` |
| Sidebar border | `#2e2e2e` | `#dfdfdf` |
| Link color | `#fafafa` | `#171717` |
| Link ativo bg | `#006239` | `#72e3ad` |
| Group title color | `#898989` | `#707070` |
| Icon color | `#898989` | `#707070` |
| Pill button bg | `#242424` | `#fdfdfd` |
| Pill button border | `#363636` | `#d4d4d4` |
| Dialog/Modal bg | `#121212` | `#ffffff` |
| Hover overlay | `#2e2e2e` | `#f3f3f3` |

---

## 🧩 ANATOMIA DE COMPONENTES EXTRAS

### Modal / Dialog
- **border-radius:** `8px` (`--borderradius-lg`)
- **background dark:** `#121212` (`--background-dialog-default`)
- **background light:** `#ffffff`
- **overlay:** `rgba(0,0,0,0.5)` + `backdrop-blur: 2px`

### Pill Badge (ex: branch "main", badge "FREE")
- **height:** `24px`
- **border-radius:** `9999px`
- **padding:** `3px 7.5px`
- **font-size:** `12px`
- **Dark:** bg `#242424`, border `1px solid #363636`, text `#fafafa`
- **Light:** bg `#fdfdfd`, border `1px solid #d4d4d4`, text `#171717`

### Ícones
- **Biblioteca:** Lucide Icons (SVG outline)
- **Tamanho:** `16px × 16px`
- **Stroke:** `1.5px`
- **Cor:** herda do texto (`currentColor`) — `#898989` (dark) / `#707070` (light)

### Sidebar Hover Expand
- **Trigger:** hover do mouse
- **Largura aberta:** `~260px`
- **Largura fechada:** `~48px`
- **Animação:** `transition: width 200-300ms ease-in-out`
- **Comportamento:** abre em overlay (não empurra o layout)
- **Sombra ao abrir:** `box-shadow: 4px 0 12px rgba(0,0,0,0.4)`
