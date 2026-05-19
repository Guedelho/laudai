import { ReportType } from "@/shared/models";

export const SPECIALTIES: Record<ReportType, { label: string; reportTitle: string; abbr: string }> = {
  ultrasound_abdominal: {
    label: "Ultrassonografia Abdominal",
    reportTitle: "RELATÓRIO ULTRASSONOGRÁFICO",
    abbr: "US",
  },
  periodontal_treatment: {
    label: "Tratamento Periodontal",
    reportTitle: "RELATÓRIO ODONTOLÓGICO",
    abbr: "ODONTO",
  },
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

export function buildDefaults(sex: string, neutered: boolean): string {
  const base = DEFAULTS_BASE_ABDOMINAL;
  if (sex === "M") return `${base}\n\n${neutered ? DEFAULTS_MALE_NEUTERED_ABDOMINAL : DEFAULTS_MALE_ABDOMINAL}`;
  if (sex === "F") return `${base}\n\n${neutered ? DEFAULTS_FEMALE_NEUTERED_ABDOMINAL : DEFAULTS_FEMALE_ABDOMINAL}`;
  return `${base}\n\n${DEFAULTS_MALE_ABDOMINAL}\n\n${DEFAULTS_FEMALE_ABDOMINAL}`;
}

const NOMENCLATURE: Record<string, string> = {
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

const FRASES_SALVADORAS = `FRASES SALVADORAS (use quando aplicável):
- Para alterações em órgãos com possível comprometimento funcional: "Sugiro correlação com achados clínicos e demais exames laboratoriais para maiores conclusões."
- Para lesões pequenas ou formações médias a grandes: "É recomendado acompanhamento ultrassonográfico da lesão, bem como a associação com o exame de punção guiada por agulha fina."
- Para formações grandes: "É indicada a correlação com exame de tomografia computadorizada/laparotomia exploratória para maiores esclarecimentos."
- Para alterações em bexiga (exceto gás): "Caso o clínico considere necessário, sugiro cistocentese com cultura da urina para melhor elucidação do quadro."
- Para alterações em vesícula biliar (exceto gás e mucocele): "Caso o clínico considere necessário, sugiro colecistocentese com cultura da bile para melhor elucidação das alterações supracitadas."`;

const FULL_NOMENCLATURE = `REFERÊNCIA DE ACHADOS POR ÓRGÃO:\n\n${Object.values(NOMENCLATURE).join("\n\n")}\n\n${FRASES_SALVADORAS}`;

export function buildSingleCallPrompt(defaults: string, especie: string): string {
  return `Você é um médico veterinário especialista em ultrassonografia abdominal de pequenos animais (cães e gatos), com amplo domínio da semiologia sonográfica, achados normais e patológicos por órgão, e das apresentações típicas das principais afecções abdominais na rotina clínica.

Gere um laudo ultrassonográfico abdominal completo com base nos achados informados. Retorne APENAS um objeto JSON válido, sem nenhum texto antes ou depois, sem markdown, sem blocos de código:
{ "sections": [{ "label": "NOME DA SEÇÃO", "content": "Texto descritivo." }], "conclusion": "...", "impression": ["..."], "recommendations": ["..."] }

Omita "impression" e "recommendations" se o exame for normal.

REGRAS OBRIGATÓRIAS — SEÇÕES:

1. Órgãos NÃO listados nos achados → copie o texto padrão EXATAMENTE, sem nenhuma modificação.

2. Órgãos listados nos achados → use o texto padrão como BASE e modifique APENAS os campos explicitamente informados. Campos não mencionados permanecem exatamente como no texto padrão.

3. MEDIDAS: inclua apenas medidas presentes nos achados. Se nenhuma medida foi informada, o laudo não deve conter nenhum número de medida em nenhuma seção. FORMATAÇÃO ISO 80000-1: espaço entre número e unidade, símbolo em caixa correta (cm, mm, ml, L, kg, g, °C, bpm — nunca CM, Cm, ML, KG). Nunca altere o valor numérico.

4. GRADAÇÃO — PROIBIDO: nunca adicione numerais romanos após diagnósticos.

5. IDIOMA: português brasileiro, terminologia técnica de consenso. NUNCA use palavras em inglês — corrija qualquer anglicismo (ex: "distribution" → "distribuição", "content" → "conteúdo").

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

REGRAS OBRIGATÓRIAS — CONCLUSÃO:

7. Exame normal → conclusion = "Exame ultrassonográfico abdominal dentro dos limites da normalidade para a espécie ${especie}." — exatamente assim, sem impression nem recommendations.

8. Exame com alterações → para cada órgão alterado, gere uma frase de impressão:
"Por meio dos achados visualizados no [órgão], foi possível determinar o diagnóstico presuntivo de [diagnóstico], com diagnóstico diferencial para [DD1, DD2, DD3]."

9. RECOMENDAÇÕES: use as frases salvadoras específicas para cada condição encontrada, conforme referência abaixo.

10. MARCAÇÃO DE ACHADOS DO USUÁRIO: gere o laudo completo (texto padrão + modificações) normalmente, e SOMENTE então envolva em \`**...**\` os trechos do laudo que foram derivados dos achados informados pelo usuário — alterações descritas, diagnósticos presuntivos e recomendações decorrentes desses achados. Nas seções, marque apenas os fragmentos modificados em relação ao texto padrão; o restante permanece sem marcação. Em conclusão, impressões, recomendações e observações, marque os trechos clinicamente relevantes derivados dos achados (diagnósticos, lesões, condições). NÃO marque: medidas numéricas com unidades (ex: "5,2 cm", "3 mm"), texto padrão copiado, conclusão de exame normal, nem rótulos de seção. Se um trecho contiver descrição e medida juntos, marque apenas a parte descritiva e deixe a medida fora dos asteriscos.

${FULL_NOMENCLATURE}

TEXTO PADRÃO (achados normais):
${defaults}`;
}
