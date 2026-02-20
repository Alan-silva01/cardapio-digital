export const products = [
    // DRINKS
    {
        id: 'melancita',
        name: 'Drink Melancita',
        category: 'Drinks',
        price: '28,00',
        size: 'Melancia • Gin • Mix de limão • Ener. Melancia • Xarope • Schweppes',
        rating: 5,
        description: 'Drink refrescante à base de gin com melancia, mix de limão e energético de melancia. Levemente adocicado, cítrico e equilibrado. Perfeito para quem busca um drink tropical e refrescante.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771585718/App_Bar_50Acorona_50kb_15_mpfjzn.png',
        backgroundUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771597495/App_Bar_50Acorona_50kb_18_lydxgs.png',
        tint: 'neutral'
    },
    {
        id: 'tropical-blue',
        name: 'Tropical Blue',
        category: 'Drinks',
        price: '26,00',
        variations: {
            nacional: '26,00',
            importado: '29,00'
        },
        size: 'Gin • curaçau blue • mix de limão • gelo • soda • schweppes',
        rating: 5,
        description: 'Drink refrescante e visualmente impactante, combinando gin com o toque cítrico e adocicado do curaçau blue. Finalizado com soda e schweppes para uma refrescância máxima.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771596795/App_Bar_50Acorona_50kb_17_wey6vr.png',
        backgroundUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771597495/App_Bar_50Acorona_50kb_18_lydxgs.png',
        tint: 'neutral'
    },
    {
        id: 'coquetel-morango',
        name: 'Coquetel de Morango',
        category: 'Drinks',
        price: '22,00',
        variations: {
            'com álcool': '22,00',
            'sem álcool': '20,00'
        },
        size: 'Morango • Frutas • Mix refrescante',
        rating: 5,
        description: 'Coquetel refrescante preparado com morangos selecionados e um toque especial de álcool. Sabor frutado e intenso.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771599311/App_Bar_50Acorona_50kb_19_ey0jl0.png',
        backgroundUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771597495/App_Bar_50Acorona_50kb_18_lydxgs.png',
        tint: 'neutral'
    },
    {
        id: 'coquetel-kiwi',
        name: 'Coquetel de Kiwi',
        category: 'Drinks',
        price: '22,00',
        variations: {
            'com álcool': '22,00',
            'sem álcool': '20,00'
        },
        size: 'Kiwi • Frutas • Mix refrescante',
        rating: 5,
        description: 'Coquetel refrescante preparado com kiwis selecionados e um toque especial de álcool. Sabor equilibrado e cítrico.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771599309/App_Bar_50Acorona_50kb_20_izlhcm.png',
        backgroundUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771597495/App_Bar_50Acorona_50kb_18_lydxgs.png',
        tint: 'neutral'
    },
    {
        id: 'coquetel-abacaxi',
        name: 'Coquetel de Abacaxi',
        category: 'Drinks',
        price: '22,00',
        variations: {
            'com álcool': '22,00',
            'sem álcool': '20,00'
        },
        size: 'Abacaxi • Frutas • Mix refrescante',
        rating: 5,
        description: 'Coquetel refrescante preparado com abacaxis selecionados e um toque especial de álcool. Sabor tropical e doce.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771599310/App_Bar_50Acorona_50kb_21_lti1hn.png',
        backgroundUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771597495/App_Bar_50Acorona_50kb_18_lydxgs.png',
        tint: 'neutral'
    },
    {
        id: 'coquetel-maracuja',
        name: 'Coquetel de Maracujá',
        category: 'Drinks',
        price: '22,00',
        variations: {
            'com álcool': '22,00',
            'sem álcool': '20,00'
        },
        size: 'Maracujá • Frutas • Mix refrescante',
        rating: 5,
        description: 'Coquetel refrescante preparado com maracujás selecionados e um toque especial de álcool. Sabor marcante e aromático.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771599310/App_Bar_50Acorona_50kb_22_bhr896.png',
        backgroundUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771597495/App_Bar_50Acorona_50kb_18_lydxgs.png',
        tint: 'neutral'
    },
    // GINS
    {
        id: 'tanqueray',
        name: 'Gin Tanqueray',
        category: 'Gins',
        price: '230,00',
        size: '750ml',
        rating: 4,
        description: 'Tanqueray é um gin inglês criado em 1830 por Charles Tanqueray. Ficou famoso pela receita clássica com zimbro marcante e pelo estilo seco, tornando-se referência mundial em coquetelaria.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771541223/App_Bar_50Acorona_50kb_7_akzpmv.png',
        tint: 'whiskey'
    },
    // VODKAS
    {
        id: 'absolut',
        name: 'Vodka Absolut',
        category: 'Vodkas',
        price: '220,00',
        size: '1L',
        rating: 4,
        description: 'Absolut foi criada na Suécia em 1879 e se destacou pela produção contínua e alto padrão de pureza. Tornou-se um ícone global graças à garrafa inconfundível.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771541223/App_Bar_50Acorona_50kb_8_gsrwdo.png',
        tint: 'whiskey'
    },
    {
        id: 'grey-goose',
        name: 'Vodka Grey Goose',
        category: 'Vodkas',
        price: '250,00',
        size: '1L',
        rating: 4,
        description: 'Grey Goose é uma vodka premium criada na França. Produzida com trigo francês e água pura, tornou-se símbolo de luxo, pureza e sofisticação no mundo todo.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771541227/App_Bar_50Acorona_50kb_11_rirvjo.png',
        tint: 'whiskey'
    },
    // WHISKEYS
    {
        id: 'royal-salute',
        name: 'Royal Salute',
        category: 'Whiskeys',
        price: '1.800,00',
        size: '700ml',
        rating: 5,
        description: 'O Royal Salute 21 Anos foi criado em 1953 para celebrar a coroação da Rainha Elizabeth II. Um blend excepcional e potente.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771534443/App_Bar_50Acorona_50kb_5_gkrgbw.png',
        tint: 'whiskey'
    },
    {
        id: 'gold-label',
        name: 'Gold Label',
        category: 'Whiskeys',
        price: '500,00',
        size: '1L',
        rating: 5,
        description: 'Johnnie Walker Gold Label Reserve é um whisky escocês premium criado para celebrações especiais. Destaca-se pelo perfil suave e cremoso, com notas de mel e frutas.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771541224/App_Bar_50Acorona_50kb_10_jpwxsn.png',
        tint: 'whiskey'
    },
    {
        id: 'old-parr',
        name: 'Old Parr',
        category: 'Whiskeys',
        price: '310,00',
        size: '1L',
        rating: 4,
        description: 'Um clássico escocês conhecido por sua suavidade única. Envelhecido por 12 anos para atingir o equilíbrio perfeito.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771534431/App_Bar_50Acorona_50kb_6_gjb0ze.png',
        tint: 'whiskey'
    },
    // CERVEJAS
    {
        id: 'heineken',
        name: 'Heineken',
        category: 'Cervejas',
        price: '17.00',
        size: '330ml',
        rating: 3,
        description: 'Cerveja lager puro malte de cor dourada, produzida com ingredientes 100% naturais. Aroma de lúpulo e um amargor refrescante característicos.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771534092/App_Bar_50Acorona_50kb_4_olliv2.png',
        tint: 'whiskey'
    },
    {
        id: 'corona',
        name: 'Corona',
        category: 'Cervejas',
        price: '16.00',
        size: '330ml',
        rating: 3,
        description: 'Cerveja tipo Pilsen, leve e refrescante. Tradicionalmente servida com uma fatia de limão no gargalo para acentuar sua suavidade.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771531821/App_Bar_50Acorona_50kb_wgfvii.png',
        tint: 'whiskey'
    },
    {
        id: 'budweiser',
        name: 'Budweiser',
        category: 'Cervejas',
        price: '12.00',
        size: '330ml',
        rating: 3,
        description: 'Budweiser foi criada em 1876, nos Estados Unidos. É conhecida como “The King of Beers”, símbolo da tradição cervejeira americana.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771532357/App_Bar_50Acorona_50kb_2_kur2s9.png',
        tint: 'whiskey'
    },
    {
        id: 'imperio-ultra',
        name: 'Império Ultra',
        category: 'Cervejas',
        price: '10.00',
        size: '210ml',
        rating: 3,
        description: 'Cerveja premium de perfil leve e refrescante. Criada com foco em sofisticação e consumo urbano moderno.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771532389/App_Bar_50Acorona_50kb_1_ic57tz.png',
        tint: 'whiskey'
    },
    {
        id: 'michelob-ultra',
        name: 'Michelob Ultra',
        category: 'Cervejas',
        price: '12.00',
        size: '330ml',
        rating: 3,
        description: 'Conhecida pelo posicionamento sofisticado e pelo foco em leveza e estilo de vida ativo. Criada no fim do século XIX nos EUA.',
        imageUrl: 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771532900/App_Bar_50Acorona_50kb_3_t8vqnc.png',
        tint: 'whiskey'
    }
];
