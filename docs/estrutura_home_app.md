# Estrutura Base - Tela 1 (Home Menu)

Este documento define a base arquitetural e de UX/UI para a primeira tela do aplicativo (Home), onde os clientes iniciarão seus pedidos.

---

## 📌 1. Macro-Categorias (Agrupamento para UX)
Para evitar sobrecarga cognitiva, o cardápio original (com mais de 19 seções brutas) foi reduzido para **8 categorias principais** de grande impacto visual na Tela Inicial:

1. 🍺 **Cervejas Geladas** 
   - *Acesso rápido a:* Long Necks, Cervejas 600ml
2. 🍹 **Drinks & Coquetéis**
   - *Acesso rápido a:* Menu de Drinks clássicos, Drinks Especiais, Shots
3. 🥃 **Destilados & Combos**
   - *Acesso rápido a:* Garrafas (Whisky, Vodka, Gin), Doses, Combos de Whisky
4. 🍷 **Vinhos & Espumantes**
   - *Acesso rápido a:* Toda a carta de vinhos
5. 🥤 **Não Alcoólicos**
   - *Acesso rápido a:* Sucos/Jarras, Refrigerantes, Águas, Energéticos
6. 🍟 **Petiscos & Porções**
   - *Acesso rápido a:* Petiscos variados, Pastéis, Tábuas de frios
7. 🥩 **Da Grelha & Pratos**
   - *Acesso rápido a:* Espetinhos, Pratos À La Carte, Executivos, Guarnições
8. 🍰 **Sobremesas**
   - *Acesso rápido a:* Pudim, Sobremesa Seu Manel

> *Nota de Arquitetura:* Itens administrativos como "Couvert Artístico", "Danos (Copos Quebrados)", ou balas ficarão invisíveis na Tela Home, sendo adicionados via regras corporativas no momento do checkout do carrinho.

---

## 🎨 2. Identidade Visual e Design (Anti-Template)

O design deve seguir o protocolo "Premium". Características essenciais:

*   **Vibe:** A ser definida (Ex: Dark/Noturno Premium para bar ou Claro Brutalista para modernidade).
*   **Atenção ao Roxo (Purple Ban):** Tons de roxo/violeta não serão utilizados como cores primárias.
*   **Tipografia (Anti-Boring):** Evitar fontes padrão. Usar tipografia que imponha personalidade, com cabeçalhos de grande impacto.
*   **Geometria:** As bordas e a forma dos elementos interativos não devem ficar no "feijão com arroz". Deverão seguir uma premissa baseada no público final.

---

## 📐 3. Estruturação do Layout (Hipótese de Design)

Para fugir das velhas páginas "divisórias por metades" ou simples listas chatas:

*   **Múltiplas Camadas (Depth):** Uso de camadas de sombras e sobreposições (sem afogar em Glassmorphism genérico) para fazer os botões parecerem "clicáveis e físicos".
*   **Fluxo Assimétrico ou Staggered:** Cards com alturas variadas, ou onde o principal (Bebidas Mais Vendidas + Petiscos) assumem formatos monumentais, enquanto outras categorias viram chips elegantes de acesso rápido.

---

## 🏗️ 4. Stack Técnico Definido para a UI

*   **Core:** React / Next.js com Tailwind CSS nativo.
*   **Interatividade Base:** Sem blibliotecas presas (Headless/Puro).
*   **Animação Premium e Física:** Elementos devem responder ao toque/scroll usando animações baseadas no princípio "Spring" (física real elástica), proporcionando peso aos itens. 

---

## 🧩 5. Comportamento Operacional (Navegação)

Ao clicar nas opções principais, a sub-navegação deve ser cirúrgica:
*   **Gavetas Inferiores (Bottom Sheets):** Ideal mobile-first para abrir subcategorias simples e rápidas (como Escolher Long Neck x 600ml).
*   **Páginas Dedicadas / Tabs fluidas:** Quando a carga de itens é demasiada pesada e requer filtros dinâmicos na tela.
