# 📜 Estrutura Completa do Cardápio — Seu Manel (V5)

Este documento é a referência oficial para o banco de dados e para o frontend do aplicativo. Ele define a hierarquia exata de categorias, sub-menus e produtos.

---

## 🏗️ 1. Grid Inicial (12 Categorias)
As categorias devem ser cadastradas na tabela `categorias` do Supabase na ordem abaixo:

1.  **Cervejas** (🍺)
2.  **Petiscos** (🍟)
3.  **Drinks** (🍹)
4.  **Pratos & Executivos** (🥩)
5.  **Vinhos** (🍷)
6.  **Destilados** (🥃)
7.  **Combos** (📦)
8.  **Bebidas** (🥤)
9.  **Pastéis** (🥟)
10. **Espetinhos** (🍢)
11. **Sobremesas** (🍰)
12. **Guarnições** (🍚)

---

## 📋 2. Detalhamento de Conteúdo (O que vai em cada lugar)

### 🍺 01. Cervejas
*   **Sub-abas:** [Long Neck] [600ml]
*   **Produtos:** Heineken, Stella, Spaten, Corona, Budweiser, Original, Amstel, Skol, Brahma, Devassa, Stempel.

### 🍟 02. Petiscos
*   **Acesso:** Direto
*   **Produtos:** Batatas, Macaxeira, Camarões, Iscas de Peixe, Carne de Sol Trinchada, Calabresa, Tábua de Frios, Queijo Coalho, Frango a Passarinho, Tulipa, Costela Barbecue, Torresmo, Dadinho de Tapioca.

### 🍹 03. Drinks (Com Álcool)
*   **Sub-abas:** [Coquetéis] [Shots]
*   **Produtos:** Caipirinhas, Mojito, Piña Colada, Gins (Tropical, Tônica, My Lounge, Blue, Kiwi, Tangerina, Pitaya), Aperol, Moscow Mule, Margarita, Negroni, Shots (Carrocinha, Régua, etc).

### 🥩 04. Pratos & Executivos
*   **Sub-abas:** [Executivos] [À La Carte]
*   **Produtos:** 
    *   *Executivos:* Pescada Amarela, Bife Acebolado, Prato Kids.
    *   *À La Carte:* Picanha na Chapa, Chapa Mista, Carne de Sol de Filé, Camarão Internacional, Moqueca.

### 🍷 05. Vinhos
*   **Acesso:** Direto (com variação de Taça/Garrafa)
*   **Produtos:** Galiotto, Quinta do Morgado, Lambrusco, Casal Garcia, Piscine, Pérgola.

### 🥃 06. Destilados
*   **Sub-abas:** [Whiskies] [Gins] [Vodkas] [Licores]
*   **Produtos:* 
    *   *Whiskies:* Red/Black/Gold Label, Jack Daniels, Old Parr, Chivas, Buchanan's.
    *   *Gins:* Tanqueray, Bombay, Gordon's.
    *   *Vodkas:* Absolut, Grey Goose, Ciroc, Belvedere.
    *   *Licores:* 43, Balena, Amarula.

### 📦 07. Combos
*   **Acesso:** Direto (com variação de acompanhamento)
*   **Produtos:** Combo Old Parr, Combo Red Label, Combo Gold Label, Combo Jack Daniels, Combo Chivas, Combo Buchanan's.

### 🥤 08. Bebidas (Sem Álcool)
*   **Sub-abas:** [Sucos] [Refrigerantes] [Águas/Energéticos]
*   **Produtos:** Sucos (Copo/Jarra), Refrigerantes (Lata/KS), H2O, Sprite Fresh, Águas, Red Bull (todos sabores), Monster.

### 🥟 09. Pastéis
*   **Acesso:** Direto
*   **Produtos:** Carne, Frango, Catupiry, Carne de Sol, Queijo, Romeu e Julieta.

### 🍢 10. Espetinhos
*   **Acesso:** Direto
*   **Produtos:** Linguiça, Frango, Porco, Medalhão Filé/Frango, Coração, Filé, Picanha.

### 🍰 11. Sobremesas
*   **Acesso:** Direto
*   **Produtos:** Sobremesa Seu Manel, Pudim.

### 🍚 12. Guarnições
*   **Acesso:** Direto
*   **Produtos:** Arroz, Vinagrete, Farofa, Purê.

---

## 🎨 3. Lógica de Interface (Diferenciais)

1.  **Variações Inteligentes:** Produtos como Sucos, Vinhos e Destilados devem usar a tabela `variacoes_produto` para oferecer tamanhos (Copo/Jarra, Taça/Garrafa, Dose/Garrafa) dentro do mesmo item.
2.  **Identidade Visual:** Categorias de 1 a 7 (Douradas no mapa) ganham destaque premium no design.
3.  **Rapidez:** O cliente não "se perde" mais em listas infinitas de bebidas misturadas.
