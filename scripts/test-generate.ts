import { generateLaudo } from "../lib/gemini";

const rawInput = `Bexiga medindo 0,35 cm
colon 0,18 cm (espessado),  jejuno 0,36 cm (espessado), duodeno 0,38 cm (normal)
rim esquerdo 4,35 cm
estômago medindo 0,37 cm, com espessamento da camada muscular
próstata 1,79 x 0,90 cm
lama biliar com cerca de 75% do lume vesical, móvel
Tiago hipoecogenico `;

const previousOutput = `{"sections":[{"label":"BEXIGA","content":"Bexiga de repleção líquida adequada, formato habitual, paredes medindo 0,35 cm, margens internas lisas e conteúdo anecogênico e homogêneo normal."},{"label":"RIM ESQUERDO","content":"Em topografia habitual, contornos definidos e regulares, relação/junção corticomedular preservada e ecotextura sem evidências de alterações sonográficas."},{"label":"RIM DIREITO","content":"Em topografia habitual, contornos definidos e regulares, relação/junção corticomedular preservada e ecotextura sem evidências de alterações sonográficas."},{"label":"FÍGADO","content":"Fígado de dimensões fora do gradil costal, superfície regular, margens abauladas, ecogenicidade diminuída, ecotextura normal, vasos preservados. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos."},{"label":"VESÍCULA BILIAR","content":"Vesícula biliar repleta, paredes finas e ecogênicas com conteúdo anecogênico com material amorfo ecodenso e móvel ocupando cerca de 75% do lúmen."},{"label":"BAÇO","content":"Baço de contornos definidos, superfície lisa, margens finas, ecogenicidade e ecotextura preservadas."},{"label":"ESTÔMAGO","content":"Estômago com conteúdo luminal de padrão misto (gás e alimento), paredes medindo 0,37 cm com espessamento da camada muscular, mantendo o padrão em camadas."},{"label":"ALÇAS INTESTINAIS","content":"Alças intestinais de distribuição topográfica habitual; duodeno com espessura de 0,38 cm (normal), jejuno com espessamento de parede medindo 0,36 cm e cólon com espessamento de parede medindo 0,18 cm. Segmentos de alça com padrão em camadas mantido, peristaltismo evolutivo e com número de contrações normal."},{"label":"PÂNCREAS","content":"Pâncreas de ecogenicidade e ecotextura preservadas em região de lobo direito."},{"label":"ADRENAIS","content":"Não visibilizavas."},{"label":"PRÓSTATA","content":"Próstata em topografia habitual, medindo 1,79 x 0,90 cm, contornos definidos, superfície lisa, formato preservado, ecogênica e homogênea."},{"label":"TESTÍCULO DIREITO","content":"Não visualizado, com histórico de castração."},{"label":"TESTÍCULO ESQUERDO","content":"Não visualizado, com histórico de castração."}],"conclusion":"IMPRESSÃO DIAGNÓSTICA:\\nOs achados observados no fígado são compatíveis com hepatopatia difusa (Hipoecogênico I). Diagnósticos diferenciais incluem: Processos inflamatórios (hepatite), congestão passiva ou infiltração celular.\\nOs achados observados na vesícula biliar são compatíveis com lama biliar. Diagnósticos diferenciais incluem: Colestase, dieta rica em lipídeos ou lama biliar incidental.\\nOs achados observados no estômago, jejuno e cólon são compatíveis com gastroenterocolite. Diagnósticos diferenciais incluem: Processos inflamatórios (gastrite/enterite), doença inflamatória intestinal ou reações alimentares.\\nOs achados observados na bexiga são compatíveis com espessamento parietal (Cistite). Diagnósticos diferenciais incluem: Cistite bacteriana, cistite medicamentosa ou urólitos não visualizados.\\n\\nRECOMENDAÇÕES:\\nSugiro correlação com achados clínicos e demais exames laboratoriais para maiores conclusões.\\nCaso o clínico considere necessário, sugiro cistocentese com cultura da urina para melhor elucidação do quadro.\\nCaso o clínico considere necessário, sugiro colecistocentese com cultura da bile para melhor elucidação das alterações supracitadas.","impressao":["Os achados observados no fígado são compatíveis com hepatopatia difusa aguda.","Os achados observados na vesícula biliar são compatíveis com lama biliar.","Os achados observados no estômago, jejuno e cólon são compatíveis com gastroenterocolite. Diagnósticos diferenciais incluem: Processos inflamatórios (gastrite/enterite), doença inflamatória intestinal ou reações alimentares."],"recomendacoes":["Sugiro correlação com achados clínicos e demais exames laboratoriais para maiores conclusões."]}`;

async function main() {
  console.log("=== RAW INPUT ===");
  console.log(rawInput);
  console.log("\n=== RUNNING 4-STAGE PIPELINE ===\n");

  const result = await generateLaudo({
    rawInput,
    patientName: "Paciente Teste",
    species: "Canina",
    breed: "SRD",
    age: "8 anos",
    sex: "M",
    neutered: true,
    ownerName: "Tutor Teste",
    onStatus: (status) => console.log(`[status] ${status}`),
    onChunk: (chunk) => process.stdout.write(chunk),
  });

  console.log("\n\n=== NEW OUTPUT (parsed) ===");
  const parsed = JSON.parse(result);
  console.log(JSON.stringify(parsed, null, 2));

  console.log("\n=== PREVIOUS OUTPUT (parsed) ===");
  const prev = JSON.parse(previousOutput);
  console.log(JSON.stringify(prev, null, 2));

  console.log("\n=== DIFF HIGHLIGHTS ===");
  for (const section of parsed.sections) {
    const old = prev.sections?.find((s: { label: string }) => s.label === section.label);
    if (!old) {
      console.log(`\n[NEW SECTION] ${section.label}`);
    } else if (old.content !== section.content) {
      console.log(`\n[CHANGED] ${section.label}`);
      console.log(`  OLD: ${old.content}`);
      console.log(`  NEW: ${section.content}`);
    }
  }

  if (parsed.conclusion !== prev.conclusion) {
    console.log("\n[CHANGED] conclusion");
    console.log(`  OLD: ${prev.conclusion}`);
    console.log(`  NEW: ${parsed.conclusion}`);
  }
}

main().catch(console.error);
