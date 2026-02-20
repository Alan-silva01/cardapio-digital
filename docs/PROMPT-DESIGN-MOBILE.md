# 📱 Prompt de Design UI — Telas Mobile (Cliente)

> Use este prompt em ferramentas de IA de design (v0, Lovable, Figma AI, Galileo, etc.)
> Cada seção = 1 prompt separado. Gere tela por tela.

---

## 🎨 Design System (Incluir em TODOS os prompts)

```
DESIGN SYSTEM — "Seu Manel Bar"

STYLE:
- Premium editorial/luxury bar app
- Inspired by whisky brand product pages
- Clean, sophisticated, high-end restaurant feel

BACKGROUND:
- Light cream/beige (#F5F0E8) with subtle vintage map texture overlay (very faint, like old nautical charts)
- This map texture background is used on ALL screens consistently

COLORS:
- Primary Background: #F5F0E8 (warm cream with map texture)
- Cards/Surfaces: #FFFFFF with subtle shadow
- Dark surfaces: #1A1A1A to #0D0D0D (bottom sheets, overlays, selected states)
- Accent: #C4392D (deep red — for prices, CTAs, highlights, badges)
- Text Primary: #111111 (near black)
- Text Secondary: #6B6B6B (medium gray)
- Success: #2D7D46 (available, served)
- Warning: #D4A72C (low stock)
- Error: #C4392D (out of stock)

TYPOGRAPHY:
- Headings: Serif font (Playfair Display or similar) — bold, editorial feel
- Body/UI: Sans-serif (Inter or DM Sans) — clean, readable
- Prices: Accent red color, serif font, slightly larger
- Category labels: Uppercase, small, letter-spacing 2px, sans-serif

IMAGES:
- Product photos: Large, hero-style, floating/overlapping layout sections
- Food photos on dark circular plates (like gourmet plating)
- Drinks with dramatic dark/moody lighting and reflections
- Images should feel editorial, not stock-photo generic

COMPONENTS:
- Buttons: Rounded corners (8px), solid dark (#1A1A1A) or accent red
- Category pills: Rounded pill shape, dark fill when selected, outline when not
- Cards: White background, subtle border-radius (12px), soft shadow
- Bottom sheet: Dark (#1A1A1A) with rounded top corners for product details
- Star ratings: Red/gold stars, 5-star scale
- Size/variant selector: Pill chips, dark when selected, outlined when not
- Bottom navigation: Dark bar (#1A1A1A) with white icons, rounded top corners
- Floating cart button: Fixed bottom, accent red, shows total + item count

LAYOUT:
- Mobile-first (375x812 — iPhone viewport)
- Generous white space
- Product images overflow/overlap sections for depth
- Information layered: image hero → details below → actions at bottom
```

---

## TELA 1: Entrada na Mesa (Splash + Nome)

```
PROMPT:

Design a mobile app screen (375x812) for a premium bar/restaurant called "Seu Manel".

This is the TABLE ENTRY screen that appears after scanning a QR code.

Layout:
- Background: warm cream (#F5F0E8) with faint vintage nautical map texture
- Top: Restaurant logo "SEU MANEL" centered, serif font, elegant
- Below logo: "Mesa 03" in large serif heading
- Center: A large hero image of a dramatic cocktail glass with dark moody lighting, floating/overlapping, with subtle reflection effect
- Below image: A card/form area with:
  - Label: "Qual o seu nome?" (serif heading)
  - Text input field (clean, minimal, underline style)
  - A large dark button (#1A1A1A): "Entrar no Menu" with subtle arrow icon
- Below button: small text "Couvert artístico: R$ 10,00/pessoa" in gray
- Very bottom: subtle bar branding or tagline in small serif italic

Mood: Sophisticated, welcoming, like entering an upscale speakeasy
No phone frame. Just the UI.
```

---

## TELA 2: Menu Principal (Categorias + Produtos)

```
PROMPT:

Design a mobile app screen (375x812) for a premium bar/restaurant menu.

This is the MAIN MENU screen showing food and drink categories.

Layout:
- Background: warm cream (#F5F0E8) with faint vintage map texture
- Top header: Hamburger menu icon (left), "Seu Manel" serif title (center), cart icon with red badge "3" (right)
- Search bar below header: "Buscar no menu..." with search icon, rounded, light gray fill
- Category pills row: Horizontal scroll — "🥟 Pastéis" "🍢 Espetinhos" "🍹 Drinks" "🥩 Pratos" "🍺 Cervejas"  — dark fill on selected, outlined on rest
- Section title: "⭐ DESTAQUES" in uppercase, letter-spacing, serif font
- Product grid (2 columns):
  - Each card: white background, rounded corners, soft shadow
  - Large food photo taking ~60% of card (food on dark plates, gourmet style)
  - Product name in serif bold below image
  - Price in red accent: "R$ 175,00"
  - Small tag badge: "🔥 Popular" or "⭐ Chef"
  - Heart icon (❤️) top-right corner of image for favorites
- Show 4 product cards visible
- Bottom: Floating cart bar — dark background (#1A1A1A), rounded top corners, showing "🛒 Ver Carrinho (3) — R$ 231,00" with accent red price
- Bottom navigation: dark bar with icons — Home, Menu, Orders, Profile
  
Mood: Clean, appetizing, editorial food magazine feel. Products should look irresistible.
No phone frame. Just the UI.
```

---

## TELA 3: Página do Produto (Detalhe)

```
PROMPT:

Design a mobile app screen (375x812) for a premium bar/restaurant product detail page.

This is the PRODUCT DETAIL screen for "Picanha na Chapa".

Layout:
- Background: warm cream (#F5F0E8) with faint vintage map texture on top half
- Top bar: Back arrow (left), Cart icon with badge (right), Heart/favorite icon (right)
- Hero section (top 45%):
  - Category label: "PRATOS À LA CARTE" uppercase, small, letter-spacing, gray
  - Product name: "Picanha na Chapa" large serif bold heading
  - Large product photo: Sizzling steak on dark plate, dramatically lit, floating/overlapping into the detail area below
  - Small secondary photo thumbnail on the side (like the whisky app carousel style)
  - Star rating: ★★★★★ in red/gold
- Detail section (bottom 55%) — dark bottom sheet (#1A1A1A, rounded top corners):
  - "Escolha o tamanho:" label in white
  - Size selector pills: "Média (2 pess.) R$125" and "Grande (4 pess.) R$175" — selected one is white fill with dark text, unselected is outlined
  - "Acompanhamentos:" label
  - Checkbox list in white text: "☑ Arroz +R$7" "☑ Farofa +R$5" "☐ Vinagrete +R$7" "☐ Purê +R$5"
  - "Observações:" text input area, outlined in gray
  - Quantity selector: [−] 1 [+] in a row
  - Big CTA button at bottom: Accent red (#C4392D), full width: "Adicionar — R$ 187,00"

Mood: Like a luxury product page. The food is the hero. Dark bottom sheet makes it feel premium.
No phone frame. Just the UI.
```

---

## TELA 4: Página do Produto — Drink

```
PROMPT:

Design a mobile app screen (375x812) for a premium bar drink detail page.

This is the PRODUCT DETAIL screen for "Gin Tônica" (a gin cocktail).

Layout:
- Background: warm cream (#F5F0E8) with faint vintage map texture on top half
- Top bar: Back arrow, cart icon, heart icon
- Hero section:
  - Category: "DRINKS — GIN" uppercase, small, letter-spacing
  - Product name: "Gin Tônica" large serif bold
  - Large dramatic cocktail photo: glass with ice, citrus garnish, dark moody lighting with reflections (like the reference cocktail photo), floating/overlapping
  - Small carousel dots or secondary drink images
- Detail section — dark bottom sheet (#1A1A1A):
  - "Escolha o tipo:" label in white
  - Variant selector pills: "Nacional R$24" "Importado R$27" (selected = white fill)
  - Description text in light gray: "Gin, tônica, especiarias botânicas, limão siciliano"
  - Prep time: "⏱️ ~5 min" in gray
  - Quantity: [−] 1 [+]
  - CTA: Accent red button "Adicionar — R$ 27,00"

Mood: Moody, sophisticated, like a craft cocktail bar menu. The drink is the star.
No phone frame. Just the UI.
```

---

## TELA 5: Carrinho

```
PROMPT:

Design a mobile app screen (375x812) for a premium restaurant cart/checkout screen.

This is the CART screen showing selected items before sending the order.

Layout:
- Background: warm cream (#F5F0E8) with faint vintage map texture
- Top: "Seu Carrinho" in serif heading, back arrow left
- Item list:
  - Each item card: white background, rounded corners, soft shadow
    - Small product photo (circle or rounded square) on left
    - Product name in serif bold: "Picanha na Chapa G"
    - Extras below in small gray: "+ Arroz, Farofa"
    - Notes in italic gray: "Sem cebola, bem passado"
    - Price right-aligned in red accent: "R$ 187,00"
    - Quantity controls: [−] 1 [+] and trash icon 🗑️
  - Show 2-3 items
- Separator line
- Summary section:
  - Subtotal: R$ 221,00 (gray)
  - Couvert (1 pessoa): R$ 10,00 (gray)
  - Divider
  - TOTAL: R$ 231,00 (large, serif bold, red accent)
- General notes field: "Observação geral..." outlined input
- Bottom: Large dark button (#1A1A1A): "📤 Enviar Pedido"
- Below button: Link text "Continuar Pedindo →" in accent red

Mood: Clean, organized, trustworthy. Total is prominent. Easy to review before ordering.
No phone frame. Just the UI.
```

---

## TELA 6: Meus Pedidos (Acompanhamento)

```
PROMPT:

Design a mobile app screen (375x812) for a premium restaurant order tracking screen.

This is the "MY ORDERS" screen showing order status in real-time.

Layout:
- Background: warm cream (#F5F0E8) with faint vintage map texture
- Top: "Meus Pedidos" serif heading, "Mesa 03 — Alan" subtitle in gray
- Order cards (stacked vertically):
  
  Card 1:
  - Header: "Pedido #1" + timestamp "14:32" right-aligned in gray
  - Items: "2x Picanha na Chapa G — R$ 350" and "1x Heineken 600ml — R$ 17"
  - Status badge: 🍳 "PREPARANDO" — orange/amber background pill badge, pulsing/glowing subtly
  
  Card 2:
  - Header: "Pedido #2" + "15:10"
  - Items: "1x Pudim — R$ 10"
  - Status badge: ✅ "SERVIDO" — green background pill badge
  
- Separator
- Summary: "Meu total: R$ 377,00" in large serif, red accent
- Bottom section:
  - Large outlined button: "🔔 Solicitar Fechar Comanda" (dark outline)
  - Below: "Fazer Novo Pedido →" link in accent red
- Bottom nav: dark bar

Status badges visual reference:
- 📥 Recebido = Blue pill
- 🍳 Preparando = Orange pill (with subtle pulse animation note)  
- ✅ Servido = Green pill

Mood: Calm, informative, reassuring. Customer should feel their order is being tracked.
No phone frame. Just the UI.
```

---

## TELA 7: Produto Esgotado (Estado)

```
PROMPT:

Design a mobile app screen (375x812) showing a product card and detail page in "OUT OF STOCK" state.

Show two states side by side or stacked:

State A — Product card (in menu grid):
- Same white card design as regular product
- Product image has a dark overlay/blur effect
- Red diagonal ribbon or overlay tag: "ESGOTADO" in white bold text
- Heart icon still visible but grayed
- Price still visible but crossed out or grayed

State B — Product detail page:
- Same layout as regular product detail
- Hero image has subtle dark overlay
- "ESGOTADO" large red text overlaying the image
- Bottom sheet still shows details but the CTA button is disabled:
  - Gray button instead of red: "Indisponível"
  - Small text below: "Este item está temporariamente esgotado"

Background: warm cream with map texture
Mood: Still premium, but clearly communicates unavailability without being ugly
No phone frame. Just the UI.
```

---

## Dica de Uso

> **Ordem recomendada de geração:**
> 1. Menu Principal (tela 2) — define o visual base
> 2. Produto Detalhe (tela 3) — define o bottom sheet style
> 3. Drink Detalhe (tela 4) — variação com drinks
> 4. Carrinho (tela 5)
> 5. Meus Pedidos (tela 6)
> 6. Entrada Mesa (tela 1)
> 7. Estado Esgotado (tela 7)
>
> **Cole o Design System no início de cada prompt** para manter consistência.
