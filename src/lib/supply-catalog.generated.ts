// Auto-generated from ../abastecimento-domestico/domain.js
export const SUPPLY_PURCHASE_CYCLE_LABELS = {
  "atacado-mensal": "Atacado mensal",
  "feira-semanal": "Feira semanal",
  "contingencia-rural": "Contingência rural"
} as const;

export const SUPPLY_SECTIONS = [
  {
    "id": "pantry",
    "label": "Despensa",
    "icon": "◫",
    "type": "inventory",
    "title": "Despensa",
    "subtitle": "Base mensal SG/SL com autonomia de 30–45 dias.",
    "alertBody": "Reposição até o estoque ideal, mantendo unidade consistente por item."
  },
  {
    "id": "proteins",
    "label": "Freezer",
    "icon": "◆",
    "type": "inventory",
    "title": "Proteínas e freezer",
    "subtitle": "Meta mensal de 28–32 kg.",
    "alertBody": "Fracionar por uso, etiquetar com data e seguir PEPS."
  },
  {
    "id": "feira",
    "label": "Feira",
    "icon": "✿",
    "type": "inventory",
    "title": "Feira semanal",
    "subtitle": "Itens de giro curto e reabastecimento semanal.",
    "alertBody": "Estoque ideal menor — a lógica prioriza frescor."
  },
  {
    "id": "care",
    "label": "Casa",
    "icon": "⬡",
    "type": "inventory",
    "title": "Higiene, limpeza e contingência",
    "subtitle": "Uso recorrente e reserva de segurança.",
    "alertBody": "Recorrência por consumo, reserva por mínimo/ideal."
  }
] as const;

export const SUPPLY_CATALOG = [
  {
    "id": "arroz-branco",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Arroz branco",
    "note": "Base principal da despensa",
    "unit": "kg",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "12–18 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 80,
    "highlight": true,
    "tags": [
      "SG/SL",
      "Núcleo"
    ]
  },
  {
    "id": "arroz-japones",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Arroz japonês",
    "note": "Uso específico e refeições de conforto",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 40,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "feijao",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Feijão",
    "note": "Proteína vegetal e rotina de almoço",
    "unit": "kg",
    "monthlyUsage": 5,
    "minimumStock": 2.5,
    "idealStock": 5,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 78,
    "highlight": true,
    "tags": [
      "SG/SL",
      "Núcleo"
    ]
  },
  {
    "id": "flocao-cuscuz",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Flocão de cuscuz",
    "note": "Café da manhã e refeições simples",
    "unit": "kg",
    "monthlyUsage": 4,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "8–10 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 75,
    "highlight": true,
    "tags": [
      "SG/SL",
      "Núcleo"
    ]
  },
  {
    "id": "macarrao-sg",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Macarrão penne/parafuso SG",
    "note": "Versátil para almoço e jantar SG",
    "unit": "kg",
    "monthlyUsage": 5,
    "minimumStock": 2.5,
    "idealStock": 5,
    "shelfLife": "10–12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 74,
    "highlight": true,
    "tags": [
      "SG/SL",
      "Núcleo"
    ]
  },
  {
    "id": "macarrao-sopa-sg",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Macarrão para sopa SG",
    "note": "Reserva para refeições simples e rápidas",
    "unit": "kg",
    "monthlyUsage": 1,
    "minimumStock": 0.5,
    "idealStock": 1,
    "shelfLife": "10–12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 32,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "tapioca",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Tapioca",
    "note": "Alternativa sem glúten para café e lanche",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "6–8 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 54,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "aveia",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Aveia",
    "note": "Farinha/flocos para mingau, granola e lanche",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 48,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "granola",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Granola",
    "note": "Complemento de café da manhã para SG/SL",
    "unit": "kg",
    "monthlyUsage": 1.5,
    "minimumStock": 0.5,
    "idealStock": 1.5,
    "shelfLife": "4–6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 34,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "biscoito-sg",
    "categoryId": "pantry",
    "group": "Base seca SG/SL",
    "label": "Biscoitos de arroz e maizena SG",
    "note": "Lanche infantil com restrição controlada",
    "unit": "pacotes",
    "monthlyUsage": 10,
    "minimumStock": 4,
    "idealStock": 10,
    "shelfLife": "4–8 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 44,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "leite-zl",
    "categoryId": "pantry",
    "group": "Laticínios ZL e cozinha",
    "label": "Leite sem lactose",
    "note": "Base da rotina da casa, consumo não diário",
    "unit": "L",
    "monthlyUsage": 18,
    "minimumStock": 9,
    "idealStock": 18,
    "shelfLife": "4–6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 82,
    "highlight": true,
    "tags": [
      "SG/SL",
      "Núcleo"
    ]
  },
  {
    "id": "requeijao-zl",
    "categoryId": "pantry",
    "group": "Laticínios ZL e cozinha",
    "label": "Requeijão ZL",
    "note": "Versátil para lanche e refeição rápida",
    "unit": "unid",
    "monthlyUsage": 4,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "30–45 dias",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 36,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "creme-leite-zl",
    "categoryId": "pantry",
    "group": "Laticínios ZL e cozinha",
    "label": "Creme de leite ZL",
    "note": "Base de preparo para receitas sem lactose",
    "unit": "unid",
    "monthlyUsage": 6,
    "minimumStock": 3,
    "idealStock": 6,
    "shelfLife": "4–6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 28,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "azeite",
    "categoryId": "pantry",
    "group": "Laticínios ZL e cozinha",
    "label": "Azeite",
    "note": "Cozinha diária e finalização",
    "unit": "garrafas",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 26,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "extrato-tomate",
    "categoryId": "pantry",
    "group": "Laticínios ZL e cozinha",
    "label": "Extrato de tomate",
    "note": "Molhos rápidos e preparo base",
    "unit": "unid",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 35,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "atum",
    "categoryId": "pantry",
    "group": "Proteína seca e emergência",
    "label": "Atum em lata",
    "note": "Reserva proteica e prato rápido",
    "unit": "latas",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "3–5 anos",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 52,
    "highlight": true,
    "tags": [
      "SG/SL",
      "Núcleo"
    ]
  },
  {
    "id": "grao-de-bico",
    "categoryId": "pantry",
    "group": "Proteína seca e emergência",
    "label": "Grão-de-bico",
    "note": "Seco e enlatado como dupla de segurança",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "12–18 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 38,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "milho-verde",
    "categoryId": "pantry",
    "group": "Proteína seca e emergência",
    "label": "Milho verde",
    "note": "Apoio para refeições rápidas e infantis",
    "unit": "latas",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 24,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "amendoim",
    "categoryId": "pantry",
    "group": "Proteína seca e emergência",
    "label": "Amendoim",
    "note": "Lanche energético e ingrediente de cozinha",
    "unit": "kg",
    "monthlyUsage": 1,
    "minimumStock": 0.5,
    "idealStock": 1,
    "shelfLife": "6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 22,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "shoyu",
    "categoryId": "pantry",
    "group": "Proteína seca e emergência",
    "label": "Shoyu / Tarê / óleo de gergelim",
    "note": "Kit pequeno de cozinha asiática e marinadas",
    "unit": "kits",
    "monthlyUsage": 1,
    "minimumStock": 0.5,
    "idealStock": 1,
    "shelfLife": "8–12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 14,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "sal",
    "categoryId": "pantry",
    "group": "Temperos e condimentos",
    "label": "Sal",
    "note": "Base de tempero da cozinha",
    "unit": "kg",
    "monthlyUsage": 1,
    "minimumStock": 0.5,
    "idealStock": 1,
    "shelfLife": "Indefinido",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 85,
    "highlight": true,
    "tags": [
      "SG/SL",
      "Núcleo"
    ]
  },
  {
    "id": "acucar",
    "categoryId": "pantry",
    "group": "Temperos e condimentos",
    "label": "Açúcar",
    "note": "Uso geral na cozinha",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 45,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "cafe",
    "categoryId": "pantry",
    "group": "Temperos e condimentos",
    "label": "Café",
    "note": "Consumo diário dos adultos",
    "unit": "pacotes",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "6–12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 50,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "oleo-vegetal",
    "categoryId": "pantry",
    "group": "Temperos e condimentos",
    "label": "Óleo vegetal",
    "note": "Fritura e preparo do dia a dia",
    "unit": "L",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 60,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "farinha-mandioca",
    "categoryId": "pantry",
    "group": "Temperos e condimentos",
    "label": "Farinha de mandioca",
    "note": "Complemento de refeição e farofa",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 55,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "temperos-secos",
    "categoryId": "pantry",
    "group": "Temperos e condimentos",
    "label": "Temperos secos (cominho, colorau, pimenta)",
    "note": "Cominho, colorau/urucum e pimenta-do-reino",
    "unit": "potes",
    "monthlyUsage": 1,
    "minimumStock": 1,
    "idealStock": 3,
    "shelfLife": "12–24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 40,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "leite-coco",
    "categoryId": "pantry",
    "group": "Laticínios ZL e cozinha",
    "label": "Leite de coco",
    "note": "Receitas, moquecas e sobremesas SL",
    "unit": "unid",
    "monthlyUsage": 4,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 30,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "iogurte-zl",
    "categoryId": "pantry",
    "group": "Laticínios ZL e cozinha",
    "label": "Iogurte sem lactose",
    "note": "Lanche e digestão das crianças",
    "unit": "unid",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "3–4 semanas",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 38,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "vinagre",
    "categoryId": "pantry",
    "group": "Temperos e condimentos",
    "label": "Vinagre",
    "note": "Tempero, conservas e limpeza leve",
    "unit": "L",
    "monthlyUsage": 0.5,
    "minimumStock": 0.5,
    "idealStock": 1,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 25,
    "tags": [
      "SG/SL"
    ]
  },
  {
    "id": "frango-file",
    "categoryId": "proteins",
    "group": "Proteínas principais",
    "label": "Filé de peito",
    "note": "Corte versátil e de giro alto",
    "unit": "kg",
    "monthlyUsage": 6,
    "minimumStock": 3,
    "idealStock": 6,
    "shelfLife": "6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 76,
    "highlight": true,
    "tags": [
      "Freezer",
      "Núcleo"
    ]
  },
  {
    "id": "sobrecoxa",
    "categoryId": "proteins",
    "group": "Proteínas principais",
    "label": "Sobrecoxa",
    "note": "Assados e refeições de bandeja",
    "unit": "kg",
    "monthlyUsage": 4,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 58,
    "tags": [
      "Freezer"
    ]
  },
  {
    "id": "coxinha-asa",
    "categoryId": "proteins",
    "group": "Proteínas principais",
    "label": "Coxinha da asa",
    "note": "Refeição prática e criança aprova",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 30,
    "tags": [
      "Freezer"
    ]
  },
  {
    "id": "bovino-moida",
    "categoryId": "proteins",
    "group": "Proteínas principais",
    "label": "Carne moída / músculo",
    "note": "Alta utilidade culinária",
    "unit": "kg",
    "monthlyUsage": 6,
    "minimumStock": 3,
    "idealStock": 6,
    "shelfLife": "4–6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 74,
    "highlight": true,
    "tags": [
      "Freezer",
      "Núcleo"
    ]
  },
  {
    "id": "carne-sol",
    "categoryId": "proteins",
    "group": "Proteínas principais",
    "label": "Carne de sol",
    "note": "Sabor local e cardápio de conforto",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "2–3 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 26,
    "tags": [
      "Freezer"
    ]
  },
  {
    "id": "acem-osso",
    "categoryId": "proteins",
    "group": "Proteínas principais",
    "label": "Acém com osso",
    "note": "Caldos, sopas e cozidos",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "4 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 18,
    "tags": [
      "Freezer"
    ]
  },
  {
    "id": "ovos",
    "categoryId": "proteins",
    "group": "Proteínas principais",
    "label": "Ovos",
    "note": "Consumo alto e versátil — média de 4 por dia",
    "unit": "unid",
    "monthlyUsage": 120,
    "minimumStock": 60,
    "idealStock": 120,
    "shelfLife": "3–4 semanas",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 70,
    "highlight": true,
    "tags": [
      "Freezer",
      "Núcleo"
    ]
  },
  {
    "id": "peixe",
    "categoryId": "proteins",
    "group": "Proteínas principais",
    "label": "Tilápia / Merluza",
    "note": "Opção leve de proteína congelada",
    "unit": "kg",
    "monthlyUsage": 4,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "4–6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 56,
    "tags": [
      "Freezer"
    ]
  },
  {
    "id": "maca-feira",
    "categoryId": "feira",
    "group": "Frutas",
    "label": "Maçã",
    "note": "Fruta de boa durabilidade para a semana",
    "unit": "kg",
    "monthlyUsage": 3,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "2–3 semanas",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 34,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "pera-feira",
    "categoryId": "feira",
    "group": "Frutas",
    "label": "Pêra",
    "note": "Giro curto e boa aceitação infantil",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 0.5,
    "idealStock": 1.5,
    "shelfLife": "7–10 dias",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 28,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "uva-feira",
    "categoryId": "feira",
    "group": "Frutas",
    "label": "Uva",
    "note": "Fruta fresca para a semana, sem estocar demais",
    "unit": "kg",
    "monthlyUsage": 2,
    "minimumStock": 0.5,
    "idealStock": 1,
    "shelfLife": "5–7 dias",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 20,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "cenoura-feira",
    "categoryId": "feira",
    "group": "Legumes",
    "label": "Cenoura",
    "note": "Legume de boa janela e alto uso culinário",
    "unit": "kg",
    "monthlyUsage": 3,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "2–3 semanas",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 32,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "batata-feira",
    "categoryId": "feira",
    "group": "Legumes",
    "label": "Batata",
    "note": "Base infantil e cardápio de conforto",
    "unit": "kg",
    "monthlyUsage": 5,
    "minimumStock": 2,
    "idealStock": 3,
    "shelfLife": "2–4 semanas",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 36,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "cebola-feira",
    "categoryId": "feira",
    "group": "Legumes",
    "label": "Cebola",
    "note": "Mais estável, mas entra na revisão semanal",
    "unit": "kg",
    "monthlyUsage": 3,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "1–2 meses",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 38,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "tomate-feira",
    "categoryId": "feira",
    "group": "Legumes",
    "label": "Tomate",
    "note": "Item de feira com virada rápida",
    "unit": "kg",
    "monthlyUsage": 4,
    "minimumStock": 1.5,
    "idealStock": 2.5,
    "shelfLife": "5–10 dias",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 42,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "coentro-feira",
    "categoryId": "feira",
    "group": "Temperos verdes",
    "label": "Coentro",
    "note": "Cheiro verde de giro semanal",
    "unit": "maços",
    "monthlyUsage": 4,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "3–5 dias",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 24,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "cebolinha-feira",
    "categoryId": "feira",
    "group": "Temperos verdes",
    "label": "Cebolinha",
    "note": "Reforça preparo rápido e congelamento em cubos",
    "unit": "maços",
    "monthlyUsage": 4,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "3–5 dias",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 22,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "hortela-feira",
    "categoryId": "feira",
    "group": "Temperos verdes",
    "label": "Hortelã",
    "note": "Uso pontual, mas ajuda na variedade",
    "unit": "maços",
    "monthlyUsage": 2,
    "minimumStock": 0.5,
    "idealStock": 1,
    "shelfLife": "3–5 dias",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 10,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "folhosas-feira",
    "categoryId": "feira",
    "group": "Temperos verdes",
    "label": "Folhosas",
    "note": "Couve, espinafre e alface em giro curto",
    "unit": "maços",
    "monthlyUsage": 16,
    "minimumStock": 2,
    "idealStock": 5,
    "shelfLife": "3–5 dias",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 84,
    "highlight": true,
    "tags": [
      "Feira",
      "Núcleo"
    ]
  },
  {
    "id": "alho-feira",
    "categoryId": "feira",
    "group": "Temperos verdes",
    "label": "Alho",
    "note": "Base de tempero — uso diário na cozinha",
    "unit": "cabeças",
    "monthlyUsage": 8,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "1–2 meses",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 70,
    "highlight": true,
    "tags": [
      "Feira",
      "Núcleo"
    ]
  },
  {
    "id": "banana-feira",
    "categoryId": "feira",
    "group": "Frutas",
    "label": "Banana",
    "note": "Fruta de alto consumo infantil e lanche rápido",
    "unit": "kg",
    "monthlyUsage": 6,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "5–10 dias",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 48,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "limao-feira",
    "categoryId": "feira",
    "group": "Frutas",
    "label": "Limão",
    "note": "Tempero, drinks e uso com peixes",
    "unit": "kg",
    "monthlyUsage": 1.5,
    "minimumStock": 0.5,
    "idealStock": 1,
    "shelfLife": "1–2 semanas",
    "purchaseCycle": "feira-semanal",
    "stockMode": "recurring",
    "priority": 35,
    "tags": [
      "Feira"
    ]
  },
  {
    "id": "gas-cozinha",
    "categoryId": "care",
    "group": "Água e infraestrutura",
    "label": "Gás de cozinha (botijão 13kg)",
    "note": "Sempre manter 2 — trocar quando o primeiro esvaziar",
    "unit": "botijões",
    "monthlyUsage": 1,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "Indefinido",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 88,
    "highlight": true,
    "tags": [
      "Núcleo"
    ]
  },
  {
    "id": "repelente",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Repelente de insetos",
    "note": "Zona rural — adulto e infantil",
    "unit": "frascos",
    "monthlyUsage": 1,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 60,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "sacos-freezer",
    "categoryId": "care",
    "group": "Limpeza e infraestrutura",
    "label": "Sacos para freezer / zip",
    "note": "Porcionamento e armazenamento das proteínas",
    "unit": "pacotes",
    "monthlyUsage": 1,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "Indefinido",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 42,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "papel-higienico",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Papel higiênico",
    "note": "Consumo alto, compra em volume",
    "unit": "rolos",
    "monthlyUsage": 40,
    "minimumStock": 20,
    "idealStock": 40,
    "shelfLife": "Indefinido",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 72,
    "highlight": true,
    "tags": [
      "Núcleo"
    ]
  },
  {
    "id": "papel-toalha",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Papel toalha",
    "note": "Cozinha e rotina com crianças",
    "unit": "rolos",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "Indefinido",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 20,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "guardanapo",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Guardanapos",
    "note": "Complemento de uso diário",
    "unit": "pacotes",
    "monthlyUsage": 6,
    "minimumStock": 3,
    "idealStock": 6,
    "shelfLife": "Indefinido",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 12,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "sabonete",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Sabonetes",
    "note": "6 de barra + 2 potes líquido para criança",
    "unit": "unid",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 26,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "pasta-dente",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Pasta de dente",
    "note": "2 adultos + 3-4 para as crianças",
    "unit": "tubos",
    "monthlyUsage": 6,
    "minimumStock": 3,
    "idealStock": 6,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 24,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "shampoo",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Shampoo",
    "note": "Adulto e infantil",
    "unit": "frascos",
    "monthlyUsage": 4,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 18,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "condicionador",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Condicionador",
    "note": "Adulto e infantil",
    "unit": "frascos",
    "monthlyUsage": 4,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 16,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "fio-dental",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Fio dental",
    "note": "Adulto e infantil",
    "unit": "unid",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 30,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "desodorante",
    "categoryId": "care",
    "group": "Higiene e pessoal",
    "label": "Desodorante",
    "note": "Adultos",
    "unit": "unid",
    "monthlyUsage": 2,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 35,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "sabao-liquido",
    "categoryId": "care",
    "group": "Limpeza e infraestrutura",
    "label": "Sabão líquido / pó",
    "note": "Lavanderia e limpeza geral",
    "unit": "kg",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "12 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 40,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "agua-sanitaria",
    "categoryId": "care",
    "group": "Limpeza e infraestrutura",
    "label": "Água sanitária",
    "note": "Base de limpeza pesada",
    "unit": "L",
    "monthlyUsage": 5,
    "minimumStock": 2,
    "idealStock": 5,
    "shelfLife": "6 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 34,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "alcool-70",
    "categoryId": "care",
    "group": "Limpeza e infraestrutura",
    "label": "Álcool 70%",
    "note": "Limpeza e higienização",
    "unit": "L",
    "monthlyUsage": 5,
    "minimumStock": 2,
    "idealStock": 5,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 44,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "detergente",
    "categoryId": "care",
    "group": "Limpeza e infraestrutura",
    "label": "Detergente",
    "note": "Pia e limpeza de cozinha",
    "unit": "frascos",
    "monthlyUsage": 6,
    "minimumStock": 3,
    "idealStock": 6,
    "shelfLife": "24 meses",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 24,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "sacos-lixo",
    "categoryId": "care",
    "group": "Limpeza e infraestrutura",
    "label": "Sacos de lixo",
    "note": "Mix 100L, 60L e 15L",
    "unit": "rolos",
    "monthlyUsage": 8,
    "minimumStock": 4,
    "idealStock": 8,
    "shelfLife": "Indefinido",
    "purchaseCycle": "atacado-mensal",
    "stockMode": "recurring",
    "priority": 18,
    "tags": [
      "Casa"
    ]
  },
  {
    "id": "paracetamol",
    "categoryId": "care",
    "group": "Contingência rural",
    "label": "Paracetamol 750mg",
    "note": "Reserva de segurança",
    "unit": "caixas",
    "monthlyUsage": 0,
    "minimumStock": 1,
    "idealStock": 2,
    "shelfLife": "24 meses",
    "purchaseCycle": "contingencia-rural",
    "stockMode": "contingency",
    "priority": 68,
    "highlight": true,
    "tags": [
      "Contingência",
      "Núcleo"
    ]
  },
  {
    "id": "soro-fisiologico",
    "categoryId": "care",
    "group": "Contingência rural",
    "label": "Soro fisiológico 0,9%",
    "note": "Olhos, nariz e apoio de cuidado infantil",
    "unit": "frascos",
    "monthlyUsage": 0,
    "minimumStock": 2,
    "idealStock": 4,
    "shelfLife": "24 meses",
    "purchaseCycle": "contingencia-rural",
    "stockMode": "contingency",
    "priority": 38,
    "tags": [
      "Contingência"
    ]
  },
  {
    "id": "termometro",
    "categoryId": "care",
    "group": "Contingência rural",
    "label": "Termômetro digital",
    "note": "Infraestrutura mínima de monitoramento",
    "unit": "unid",
    "monthlyUsage": 0,
    "minimumStock": 1,
    "idealStock": 1,
    "shelfLife": "Permanente",
    "purchaseCycle": "contingencia-rural",
    "stockMode": "contingency",
    "priority": 46,
    "tags": [
      "Contingência"
    ]
  }
] as const;
