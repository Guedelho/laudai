import { Specialty } from "@/shared/models";

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  ultrasound_abdominal: "Ultrassonografia Abdominal",
};

const DEFAULTS_BASE_ABDOMINAL = `BEXIGA: Bexiga de repleção líquida adequada, formato habitual, paredes normoespessas, conteúdo anecogênico e homogêneo.

RIM ESQUERDO: Rim com formato anatômico preservado e localizado em topografia habitual, contornos regulares, relação/junção corticomedular preservada e ecotextura sem evidências de alterações sonográficas.

RIM DIREITO: Rim com formato anatômico preservado e localizado em topografia habitual, contornos regulares, relação/junção corticomedular preservada e ecotextura sem evidências de alterações sonográficas.

FÍGADO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura predominantemente homogênea. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.

VESÍCULA BILIAR: Vesícula biliar com repleção preservada, paredes finas e ecogênicas com conteúdo anecogênico e homogêneo.

BAÇO: Baço de contornos definidos, superfície regular, margens finas, ecogenicidade e ecotextura preservadas.

ESTÔMAGO: Estômago com conteúdo luminal de padrão misto (gás e alimento), peristaltismo evolutivo, com paredes apresentando padrão em camadas preservado.

ALÇAS INTESTINAIS: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas mantido e ecogenicidade normal, peristaltismo evolutivo e com número de contrações normal.

PÂNCREAS: Pâncreas normoecogênico, com ecotextura preservada em região de lobo direito.

ADRENAIS: Adrenais de formato mantido, bordas regulares, distinção córticomedular e ecogenicidade preservadas.`;

const DEFAULTS_MALE_ABDOMINAL = `PRÓSTATA: Próstata em topografia habitual, de contornos regulares, formato preservado, hiperecogênica e homogênea.

TESTÍCULO DIREITO: Localizado em bolsa escrotal, hipoecogênico, homogêneo, mediastino testicular preservado, sem evidências de alterações sonográficas.

TESTÍCULO ESQUERDO: Localizado em bolsa escrotal, hipoecogênico, homogêneo, mediastino testicular preservado, sem evidências de alterações sonográficas.`;

const DEFAULTS_MALE_NEUTERED_ABDOMINAL = `PRÓSTATA: Próstata em topografia habitual, de contornos regulares, formato preservado, hiperecogênica e homogênea.

TESTÍCULO DIREITO: Não visualizado, com histórico de castração.

TESTÍCULO ESQUERDO: Não visualizado, com histórico de castração.`;

const DEFAULTS_FEMALE_ABDOMINAL = `ÚTERO: Útero de dimensões, contornos e ecotextura preservados, sem evidências de alterações sonográficas.

OVÁRIOS: Ovários em topografia habitual, ovalados, hipoecogênicos e homogêneos, sem evidências de alterações sonográficas.`;

const DEFAULTS_FEMALE_NEUTERED_ABDOMINAL = `ÚTERO: Não visualizado, com histórico de castração.

OVÁRIOS: Não visualizados, com histórico de castração.`;

export function buildDefaults(sex?: string | null, neutered?: boolean | null): string {
  const base = DEFAULTS_BASE_ABDOMINAL;
  if (sex === "M") return `${base}\n\n${neutered ? DEFAULTS_MALE_NEUTERED_ABDOMINAL : DEFAULTS_MALE_ABDOMINAL}`;
  if (sex === "F") return `${base}\n\n${neutered ? DEFAULTS_FEMALE_NEUTERED_ABDOMINAL : DEFAULTS_FEMALE_ABDOMINAL}`;
  return `${base}\n\n${DEFAULTS_MALE_ABDOMINAL}\n\n${DEFAULTS_FEMALE_ABDOMINAL}`;
}

// ─── Nomenclature sections (organ-keyed, no classification labels) ───────────

export const NOMENCLATURE: Record<string, string> = {
  liver: `FÍGADO — Alterações difusas (descrição → impressão → recomendação):
- Dimensões fora do gradil, superfície regular, margens finas, ecogenicidade e ecotextura normais, vasos preservados → Hepatomegalia pouco específica, podendo indicar processo inflamatório → Sugiro pesquisa de hepatopatias. Em filhotes: hepatomegalia é condição normalmente encontrada até oito meses.
- Dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade e ecotextura normais, vasos preservados → Alterações correlacionadas com processo inflamatório → Sugiro correlação com achados clínicos e demais exames laboratoriais.
- Dimensões diminuídas, superfície regular, margens finas, ecogenicidade preservada, ecotextura homogênea → Em filhotes: hipoplasia portal ou desvios portossistêmicos → Sugiro correlação com tomografia computadorizada.
- Dimensões diminuídas, superfície irregular, margens abauladas, ecogenicidade aumentada, ecotextura grosseira, vasos pobremente evidenciados → Hepatopatia crônica em estágio avançado → Sugiro exame dopplervelocimétrico hepático.
- Dimensões fora do gradil, ecogenicidade diminuída, vasos preservados → Processo inflamatório (hepatite aguda), DD hepatopatia por toxemia → Sugiro correlação clínico-laboratorial. DD: neoplasias infiltrativas (linfoma, linfossarcoma, leucemia).
- Dimensões fora do gradil, ecogenicidade diminuída, calibre vascular aumentado → Congestão hepática → Sugiro pesquisa de cardiopatias.
- Fígado + vesícula biliar e vias biliares com espessamento de parede e material ecodenso → Colangiohepatite → Sugiro correlação laboratorial.
- Ecogenicidade difusamente aumentada, vasos pobremente visualizados → Hepatopatia crônica → Sugiro correlação laboratorial. DD: hepatopatia esteroidal, lipidose, fibrose, neoplasias infiltrativas.
- Ecogenicidade aumentada com perda da atenuação distal, ecotextura grosseira → Infiltração gordurosa (esteatose hepática) → Sugiro dopplervelocimétrico hepático.

FÍGADO — Alterações focais: nódulos (hiper/hipoecogênicos), mineralização, formações, cistos, lesão em alvo, hematoma`,

  gallbladder: `VESÍCULA BILIAR — Alterações da parede (descrição → impressão):
- Espessamento de parede com edema → Colecistite aguda, DD hipertensão portal, hipoalbuminemia, obstrução biliar
- Espessamento crônico → Colecistite crônica
- Presença de gás na parede → Colecistite enfisematosa
- Hiperplasia mucinosa cística → Hiperplasia mucinosa cística acompanhada de mucocele

VESÍCULA BILIAR — Alterações de conteúdo:
- Sedimento leve → Colestase, DD hipofunção motora em idosos ou endocrinopatias
- Sedimento moderado/grave → Colestase
- Concreção biliar, colelitíase, mucocele

VIAS BILIARES: mineralização intra-hepática, coledocolitíase, obstrução`,

  spleen: `BAÇO — Alterações difusas (descrição → impressão → recomendação):
- Esplenomegalia → Hiperplasia linfoide, processo inflamatório/infeccioso → Correlação clínico-laboratorial
- Microesplenia → DD desidratação ou caquexia → Correlação clínico-laboratorial
- Mineralização → Mineralização esplênica → Sugiro pesquisa de adrenopatias e nefropatias
- Congestão esplênica, torção esplênica, esplenite, ruptura esplênica

BAÇO — Alterações focais: nódulos, mielolipoma, cistos, abscesso, hematoma, infarto, imagem em alvo, formações, trombose`,

  pancreas: `PÂNCREAS — Alterações difusas (descrição → impressão → recomendação):
- Ecogenicidade diminuída, aumento, gordura periférica reativa → Pancreatite aguda → Sugiro correlação laboratorial e acompanhamento ultrassonográfico
- Ecotextura heterogênea, contornos irregulares → Pancreatite crônica agudizada → Sugiro correlação laboratorial e acompanhamento
- Em gatos idosos: alterações comumente encontradas em senis, não descartar pancreatopatias → Correlação clínico-laboratorial
- Edema pancreático
- Áreas anecogênicas + ecogenicidade heterogênea → Pancreatite necrotizante hemorrágica → Sugiro tomografia computadorizada

PÂNCREAS — Alterações focais: nódulos, cistos, abscesso, neoplasia, litíase`,

  adrenals: `ADRENAIS — Alterações difusas: adrenalite, hiperplasia (uni/bilateral), atrofia bilateral, hiperaldosteronismo em felinos
ADRENAIS — Alterações focais: hiperplasia nodular, calcificação, neoplasia, comprometimento da VCC`,

  stomach: `ESTÔMAGO — Alterações (descrição → impressão → recomendação):
- Espessamento difuso → Gastrite → Correlação clínica
- Espessamento focal severo → DD processo inflamatório/edema → Acompanhamento ultrassonográfico
- Úlcera gástrica → Sugiro endoscopia
- Gastrite urêmica → Correlação clínico-laboratorial
- Gastrite polipoide → Sugiro endoscopia
- Corpo estranho gástrico, corpo estranho perfurante`,

  intestines: `INTESTINOS — Alterações (descrição → impressão → recomendação):
- Espessamento por segmento → Processo inflamatório (duodenite/jejunite)
- Espessamento difuso → Enterite
- Em felinos: espessamento difuso → DD doença intestinal inflamatória ou neoplasia infiltrativa → Sugiro endoscopia
- Linfangiectasia → Processo inflamatório intenso → Sugiro exame cito/histopatológico
- Tiflite, colite, hiperplasia folicular linfoide
- Corpo estranho (linear/obstrutivo/não obstrutivo), intussuscepção`,

  kidneys: `RINS — Alterações difusas (descrição → impressão → recomendação):
- Nefropatia aguda → Sugiro correlação clínico-laboratorial
- Nefropatia crônica (graus variados de perda da junção corticomedular, ecogenicidade aumentada, dimensões reduzidas) → Sugiro urinálise e correlação laboratorial
- Síndrome do rim grande/pequeno (felinos) → Doença renal crônica com atrofia + hiperplasia compensatória → Sugiro urinálise
- Sinal da medular, sinal da banda → Alteração pouco específica → Sugiro pesquisa de nefropatias e urinálise
- Displasia renal, PIF, linfoma renal

RINS — Alterações focais: cistos, doença policística, pseudocisto, infarto, abscesso, nefrocalcinose, dioctophyma, neoplasia
SISTEMA COLETOR: pielectasia, litíase, hidronefrose, pielonefrite
URETERES: cálculos, ureter ectópico, ureterocele`,

  bladder: `BEXIGA — Alterações (descrição → impressão → recomendação):
- Divertículo uracal → Acompanhamento clínico e ultrassonográfico
- Espessamento difuso → Cistite crônica → Sugiro urinálise (EAS)
- Espessamento no ápice → Cistite crônica com debris → Sugiro urinálise
- Espessamento no colo → DD processo inflamatório focal severo ou neoplasia → Sugiro urinálise via sonda e cito/histopatológico
- Cistite enfisematosa, cistite polipoide → Sugiro videocistoscopia
- Cistite pseudomembranosa → Sugiro exame de controle
- Sedimento, cálculos, coágulo, obstrução, ruptura

URETRA: uretrite, cálculos, neoplasia`,

  uterus: `ÚTERO: hiperplasia endometrial cística, mucometra/hidrometra, neoplasia, granuloma de coto, piometra de coto
ÚTERO PÓS-PARTO: metrite, retenção de placenta
ANOMALIAS GESTACIONAIS: hidrocefalia, hidropsia fetal, onfalocele, gastrosquise, morte embrionária, feto macerado/mumificado/enfisematoso`,

  ovaries: `OVÁRIOS: cistos, neoplasia, ovário remanescente, granuloma`,

  prostate: `PRÓSTATA: hiperplasia prostática benigna, hiperplasia cística, cisto, cisto paraprostático, abscesso, prostatite, neoplasia`,

  testicles: `TESTÍCULOS: atrofia, criptorquidismo, cistos, nódulo hiperecogênico, orquite/epididimite, neoplasia`,

  lymphnodes: `LINFONODOS: linfonodo aumentado (cístico), múltiplos aumentados, coalescência`,

  misc: `HÉRNIAS: descontinuidade da parede, hérnia perineal
MASSA EXPANSIVA: formações, formações cavitárias, necrose
EFUSÃO PERITONEAL: líquido livre
PERITONITE: focal, difusa`,
};

export const FRASES_SALVADORAS = `FRASES SALVADORAS (use quando aplicável):
- Para alterações em órgãos com possível comprometimento funcional: "Sugiro correlação com achados clínicos e demais exames laboratoriais para maiores conclusões."
- Para lesões pequenas ou formações médias a grandes: "É recomendado acompanhamento ultrassonográfico da lesão, bem como a associação com o exame de punção guiada por agulha fina."
- Para formações grandes: "É indicada a correlação com exame de tomografia computadorizada/laparotomia exploratória para maiores esclarecimentos."
- Para alterações em bexiga (exceto gás): "Caso o clínico considere necessário, sugiro cistocentese com cultura da urina para melhor elucidação do quadro."
- Para alterações em vesícula biliar (exceto gás e mucocele): "Caso o clínico considere necessário, sugiro colecistocentese com cultura da bile para melhor elucidação das alterações supracitadas."`;

export const SECTION_TEMPLATES: Record<Specialty, (defaults: string) => string> = {
  ultrasound_abdominal: (
    defaults,
  ) => `Você é um especialista em ultrassonografia veterinária. Gere APENAS o array de seções descritivas de um laudo abdominal.

Retorne APENAS um objeto JSON válido, sem nenhum texto antes ou depois, sem markdown, sem blocos de código:
{ "sections": [{ "label": "NOME DA SEÇÃO", "content": "Texto descritivo." }] }

NÃO inclua conclusion, impression, recommendations ou qualquer campo além de sections.

REGRAS OBRIGATÓRIAS:

1. Órgãos NÃO listados nos achados → copie o texto padrão EXATAMENTE, sem nenhuma modificação.

2. Órgãos listados nos achados → use o texto padrão como BASE e modifique APENAS os campos explicitamente informados. Campos não mencionados permanecem exatamente como no texto padrão.

3. MEDIDAS: inclua apenas medidas presentes nos achados. Se nenhuma medida foi informada, o laudo não deve conter nenhum número de medida em nenhuma seção, incluindo seções copiadas do padrão. FORMATAÇÃO ISO 80000-1: espaço entre número e unidade, símbolo em caixa correta (cm, mm, ml, L, kg, g, °C, bpm — nunca CM, Cm, ML, KG). Nunca altere o valor numérico.

4. GRADAÇÃO — PROIBIDO: nunca adicione numerais romanos após diagnósticos.

5. IDIOMA: português brasileiro, terminologia técnica de consenso, sem termos coloquiais. NUNCA use palavras em inglês — corrija qualquer anglicismo (ex: "distribution" → "distribuição", "content" → "conteúdo").

6. SEMIOLOGIA — use APENAS estes termos:
- Topografia: habitual ou ectópica
- Contornos: definidos, pouco definidos ou não definidos
- Margens: finas, afiladas, abauladas ou arredondadas (para fígado, baço, adrenais, linfonodos)
- Superfície: regular, irregular, ondulada, serrilhada ou micronodular
- Formato: anatômico (normal), nodular, triangular, em alvo, amorfo
- Dimensões: sempre em centímetros, formatadas conforme ISO 80000-1; para lesões, extrair 3 dimensões quando possível
- Ecogenicidade: anecogênico, hipoecogênico, hiperecogênico, normoecogênico
- Ecotextura: homogênea, heterogênea, mista ou complexa
- Arquitetura: parênquima + arquitetura vascular (para fígado e rins)

TEXTO PADRÃO (achados normais):
${defaults}`,
};

export function buildConclusionPrompt(nomenclature: string, especie: string): string {
  return `Você é um médico veterinário especialista em diagnóstico por imagem abdominal. Com base nos achados e nas seções do laudo, gere a conclusão.

Retorne APENAS um objeto JSON válido, sem markdown, sem blocos de código:
{ "conclusion": "...", "impression": ["..."], "recommendations": ["..."] }

"impression" e "recommendations" são arrays de strings. Omita-os se o exame for normal.

REGRAS:

1. Exame normal → conclusion = "Exame ultrassonográfico abdominal dentro dos limites da normalidade para a espécie ${especie}." — exatamente assim, sem impression nem recommendations.

2. Exame com alterações → para cada órgão alterado, gere uma frase de impressão:
"Por meio dos achados visualizados no [órgão], foi possível determinar o diagnóstico presuntivo de [diagnóstico], com diagnóstico diferencial para [DD1, DD2, DD3]."

3. GRADAÇÃO — PROIBIDO: nunca use numerais romanos após diagnósticos (ex: "hepatomegalia III"). Escreva apenas o diagnóstico.

4. RECOMENDAÇÕES: use as frases salvadoras específicas para cada condição encontrada, conforme referência abaixo.

${nomenclature}`;
}

export const REPORT_TITLES: Record<Specialty, string> = {
  ultrasound_abdominal: "RELATÓRIO ULTRASSONOGRÁFICO",
};

export const SPECIALTY_ABBR: Record<Specialty, string> = {
  ultrasound_abdominal: "US",
};

export function buildVerifierPrompt(defaults: string): string {
  return (
    "Retorne APENAS um objeto JSON válido, sem nenhum texto antes ou depois, sem markdown, sem blocos de código.\n\n" +
    "Você é um médico veterinário especialista em ultrassonografia abdominal de pequenos animais (cães e gatos), " +
    "com amplo domínio da semiologia sonográfica, achados normais e patológicos por órgão, e das apresentações " +
    "típicas das principais afecções abdominais na rotina clínica. " +
    "Seu papel é revisar laudos gerados por IA e corrigi-los com rigor clínico, usando o input original do veterinário executante como única fonte de verdade.\n\n" +
    "TEXTO PADRÃO DE REFERÊNCIA (achados normais por seção):\n" +
    defaults +
    "\n\nREGRAS DE REVISÃO:\n" +
    "1. Seções inalteradas → copie EXATAMENTE como estão no laudo, sem nenhuma modificação.\n" +
    "2. Seções com alterações → para cada campo que difere do padrão, avalie com seu critério de especialista em ultrassonografia abdominal se a mudança é:\n" +
    "   a) Clinicamente justificada pelo achado informado pelo veterinário → MANTENHA.\n" +
    "   b) Sem relação clínica com o achado informado → RESTAURE ao texto padrão.\n" +
    "   Restaure SOMENTE quando tiver certeza clínica de que a mudança não decorre do achado relatado.\n" +
    '3. IDIOMA: O laudo está em português brasileiro. NUNCA substitua palavras portuguesas por equivalentes em inglês. Se encontrar qualquer palavra em inglês no laudo (ex: "distribution", "content", "label"), corrija para o português correto (ex: "distribuição", "conteúdo").\n' +
    "4. ERROS DE DIGITAÇÃO: O input do veterinário pode conter erros ortográficos ou abreviações. Ao comparar o input com o laudo, interprete o intent clínico — não rejeite uma mudança por diferença ortográfica entre o input e o laudo.\n" +
    "5. MEDIDAS: Qualquer valor numérico com unidade (cm, mm, m, ml, L, g, kg, mg, °C, bpm, rpm, m/s, cm/s, etc.) ausente no input do veterinário deve ser REMOVIDO do laudo. Verifique também se todas as medidas presentes seguem ISO 80000-1 — espaço entre número e unidade, símbolo em caixa correta (cm, mm, ml, L, kg, g, °C, bpm — nunca CM, Cm, ML, KG, etc.) — corrija a formatação sem alterar o valor. EXCEÇÃO: porcentagem (%) segue a convenção médica brasileira — sem espaço antes do símbolo (ex: 75%, não 75 %).\n" +
    "6. GRADAÇÃO: Se houver graus em numerais romanos após diagnósticos (ex: 'hepatomegalia III', 'mucocele II'), REMOVA a gradação — mantenha apenas o diagnóstico.\n" +
    "7. MEDIDAS EM EXAME NORMAL: Se o input do veterinário não contém nenhuma medida, o laudo não deve conter nenhum número de medida em nenhuma seção. Remova qualquer medida inventada.\n" +
    "8. Impressão diagnóstica e recomendações → mantenha intactas.\n" +
    "9. NÃO inclua cabeçalho ou qualquer texto fora do JSON.\n\n" +
    "Retorne APENAS o objeto JSON corrigido, sem explicações ou comentários."
  );
}
