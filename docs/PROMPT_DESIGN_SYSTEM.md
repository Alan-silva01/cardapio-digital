# 🎨 Design System & UI/UX Prompt — Seu Manel (Elite Dark Mode)

Este documento define a identidade visual para a criação das novas telas (Menu, Carrinho, Categorias) mantendo o estilo premium atual, mas aplicando um conceito **"More Dark"** inspirado nas referências enviadas.

---

## 🌑 1. Identidade Visual (Design Tokens)

### 🎨 Paleta de Cores (Dark Premium)
*   **Background Principal:** `#000000` (Preto puro para contraste infinito em telas OLED).
*   **Background Cards/Sheets:** `#0D0D0D` ou `#121212` (Cinza quase preto para profundidade).
*   **Acento Primário (Ação):** `#D4AF37` (Dourado Metálico) ou `#8B0000` (Vermelho Bordô profundo - conforme a referência).
*   **Textos:**
    *   `#FFFFFF` (Títulos e Preços).
    *   `#A0A0A0` (Descrições e Labels secundárias).
*   **Bordas/Divisores:** `#1A1A1A` (Sutil).

### 🖋️ Tipografia (Recapitulação)
*   **Títulos de Produtos/Seções:** `Playfair Display` (Serif). Peso: 700 ou 900.
*   **Corpo e Interface:** `Inter` (Sans-serif). Peso: 400 (corpo), 600 (semi-bold) para botões.

---

## 📱 2. Componentes de Interface

### 📍 A. Cards de Produto (Estilo Referência)
Inspirado na imagem das Cervejas e no app de comida:
*   **Formato:** Retangular com bordas arredondadas (`border-radius: 24px`).
*   **Efeito:** "Glassmorphism" sutil ou fundo sólido escuro com borda dourada/vermelha de 1px.
*   **Imagem:** Sangria superior (ocupando 60% do card) com degradê preto na base para o texto não sumir.
*   **Botão Adicionar:** Ícone de `+` em círculo flutuante no canto inferior direito do card.

### 🛒 B. Carrinho (Cart Logic)
*   **Estilo:** `Sticky Bottom Bar` ou `Floating Bubble`.
*   **Visual:** Fundo `#121212` com bordas superiores arredondadas.
*   **Animação:** Ao adicionar, o item deve "voar" para o ícone do carrinho (flying animation).
*   **Resumo:** Exibir quantidade total e subtotal de forma elegante, sem poluir a tela.

### 🍔 C. Menu de Categorias (Grid Inicial)
*   **Layout:** Grid de 2 colunas ou 3 colunas (ícones menores).
*   **Ícones:** Estilo "Line Art" dourado ou fotos circulares com borda iluminada.
*   **Interatividade:** Hover/Active state com brilho interno (Inner Glow).

---

## ✍️ 3. Prompt para Geração de Design (IA/Tools)

> "Crie uma interface de aplicativo mobile para um restaurante/bar premium chamado 'Seu Manel'. 
> **Tema:** Ultra Dark Mode (Background #000).
> **Estética:** Luxo, Sofisticado, Noturno.
> **Referências:** Use cards com bordas muito arredondadas (24px+), tipografia Playfair Display para nomes de pratos e Inter para o sistema.
> **Tela de Menu:** Um grid organizado com 12 categorias, usando ícones minimalistas em dourado metálico.
> **Tela de Carrinho:** Um resumo elegante com lista de itens, permitindo ajuste de quantidade (+/-) com botões redondos e minimalistas.
> **Visual:** Iluminação dramática nas fotos de comida/bebida, sombras suaves, e transições fluidas."

---

## 🛠️ 4. Próximos Passos de Implementação
1.  **Refatorar CSS:** Atualizar `index.css` com as novas variáveis de cores "More Dark".
2.  **Novos Componentes:** Criar `CategoryGrid.jsx`, `CartSheet.jsx` e `SubCategoryView.jsx`.
3.  **Animações:** Implementar Framer Motion para os sub-menus deslizantes.
