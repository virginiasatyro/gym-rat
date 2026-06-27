window.EXERCISE_CATALOG = [
  { id: "supino-reto-halteres", name: "Supino Reto com Halteres" },
  { id: "supino-inclinado-halteres", name: "Supino Inclinado com Halteres" },
  { id: "triceps-polia-barra-reta", name: "Triceps na Polia com Barra Reta" },
  { id: "triceps-polia-corda", name: "Triceps na Polia com Corda", aliases: ["Triceps Frances na Polia com Corda"] },
  { id: "desenvolvimento-arnold-sentado", name: "Desenvolvimento Arnold Sentado" },
  { id: "elevacao-frontal-halteres", name: "Elevacao Frontal com Halteres", aliases: ["Elevacao Frontal Alternada", "Elevacao Frontal Unilateral com Halteres"] },
  { id: "afundo-step", name: "Afundo com Step" },
  { id: "cadeira-extensora", name: "Cadeira Extensora" },
  { id: "puxada-aberta-barra-reta", name: "Puxada Aberta Barra Reta" },
  { id: "crucifixo-inverso-sentado", name: "Crucifixo Inverso Sentado" },
  { id: "rosca-zottman", name: "Rosca Zottman" },
  { id: "rosca-concentrada", name: "Rosca Concentrada" },
  { id: "elevacao-lateral-halteres", name: "Elevacao Lateral com Halteres" },
  { id: "encolhimento-ombros-barra-reta", name: "Encolhimento de Ombros com Barra Reta" },
  { id: "bom-dia", name: "Bom Dia" },
  { id: "cadeira-flexora", name: "Cadeira Flexora" },
  { id: "agachamento-livre-barra-suporte", name: "Agachamento Livre com Barra no Suporte" },
  { id: "agachamento-barra-hexagonal", name: "Agachamento com Barra Hexagonal" },
  { id: "leg-press-45", name: "Leg Press 45" },
  { id: "crucifixo-maquina", name: "Crucifixo Maquina" },
  { id: "puxada-neutra-triangulo", name: "Pegada Neutra Triangulo" },
  { id: "aducao-quadril-maquina", name: "Aducao de Quadril Maquina" },
  { id: "abducao-quadril-maquina", name: "Abducao de Quadril Maquina" },
  { id: "abdominais", name: "100 Abdominais" },
  { id: "flexao-bracos", name: "Flexao de Bracos" },
  { id: "prancha-dinamica", name: "Prancha Dinamica" },
  { id: "remada-baixa-polia-neutra", name: "Remada Baixa na Polia Baixa (Pegaga Neutra)" },
  { id: "rosca-inversa-halteres", name: "Rosca Inversa com Halteres" },
  { id: "abdominal-remador", name: "Abdominal Remador" },
  { id: "flexao-nordica", name: "Flexao Nordica" },
  { id: "bridge-fit-ball-iii", name: "Brigde Fit Ball III" },
  { id: "abdominal-canivete", name: "Abdominal Canivete" },
  { id: "agachamento-isometrico", name: "Agachamento Isometrico" },
  { id: "abdominal-escalador", name: "Abdominal Escalador" },
  { id: "remada-alta-polia-baixa-barra-reta", name: "Remada Alta na Polia Baixa com Barra Reta" },
  { id: "elevacao-quadril-maquina", name: "Elevacao de Quadril na Maquina" },
  { id: "mesa-flexora-unilateral", name: "Mesa Flexora Unilateral" },
  { id: "extensao-panturrilha", name: "Extensao de Panturrilha" },
  { id: "puxada-frontal", name: "Puxada Frontal" },
  { id: "supino-inclinado", name: "Supino Inclinado" },
  { id: "remada-curvada", name: "Remada Curvada" }
];

window.EXERCISE_CATALOG_BY_NAME = window.EXERCISE_CATALOG.reduce((index, exercise) => {
  [exercise.name, ...(exercise.aliases || [])].forEach((name) => {
    index[normalizeCatalogName(name)] = exercise.id;
  });

  return index;
}, {});

function normalizeCatalogName(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
