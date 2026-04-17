import { Specialty } from "@/types";

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  ultrasound_abdominal: "Ultrassonografia Abdominal",
};

const DEFAULTS_BASE_ABDOMINAL = `BEXIGA: Bexiga de repleção líquida adequada, formato habitual, paredes finas e ecogênicas, margens internas lisas e conteúdo anecogênico e homogêneo normal.

RIM ESQUERDO: Em topografia habitual, contornos definidos e regulares, relação/junção corticomedular preservada e ecotextura sem evidências de alterações sonográficas.

RIM DIREITO: Em topografia habitual, contornos definidos e regulares, relação/junção corticomedular preservada e ecotextura sem evidências de alterações sonográficas.

FÍGADO: Fígado de dimensões dentro dos limites do gradil costal, superfície lisa, margens afiladas, parênquima de ecogenicidade e ecotextura dentro dos limites da normalidade. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.

VESÍCULA BILIAR: Vesícula biliar repleta, paredes finas e ecogênicas com conteúdo anecogênico e homogêneo.

BAÇO: Baço de contornos definidos, superfície lisa, margens finas, ecogenicidade e ecotextura preservadas.

ESTÔMAGO: Estômago com conteúdo luminal de padrão misto (gás e alimento), paredes de aspecto sonográfico mantido com padrão em camadas.

ALÇAS INTESTINAIS: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas mantido e ecogenicidade normal, peristaltismo evolutivo e com número de contrações normal.

PÂNCREAS: Pâncreas de ecogenicidade e ecotextura preservadas em região de lobo direito.

ADRENAIS: Adrenais de formato mantido, bordas regulares, distinção córticomedular e ecogenicidade preservadas.`;

const DEFAULTS_MALE_ABDOMINAL = `PRÓSTATA: Próstata em topografia habitual e de contornos definidos, superfície lisa, formato preservado, ecogênica e homogênea.

TESTÍCULO DIREITO: Localizado em bolsa escrotal, hipoecogênico, homogêneo, com presença de linha central hiperecogênica (mediastino testicular), sem evidências de alterações sonográficas.

TESTÍCULO ESQUERDO: Localizado em bolsa escrotal, hipoecogênico, homogêneo, com presença de linha central hiperecogênica (mediastino testicular), sem evidências de alterações sonográficas.`;

const DEFAULTS_MALE_NEUTERED_ABDOMINAL = `PRÓSTATA: Próstata em topografia habitual e de contornos definidos, superfície lisa, formato preservado, ecogênica e homogênea.

TESTÍCULO DIREITO: Não visualizado, com histórico de castração.

TESTÍCULO ESQUERDO: Não visualizado, com histórico de castração.`;

const DEFAULTS_FEMALE_ABDOMINAL = `ÚTERO: Útero de dimensões, contornos e ecotextura preservados, sem evidências de alterações sonográficas.

OVÁRIOS: Ovários de contornos definidos, dimensões e ecotextura preservadas, sem evidências de alterações sonográficas.`;

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
  liver: `FÍGADO — Padrões de alteração difusa:
- Dimensões fora do gradil costal, superfície regular, margens finas, ecogenicidade e ecotextura normais, arquitetura vascular preservada
- Dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade e ecotextura normais, arquitetura vascular preservada
- Dimensões diminuídas, superfície regular, margens finas, ecogenicidade preservada, ecotextura homogênea, arquitetura vascular preservada
- Dimensões diminuídas, superfície irregular, margens abauladas, ecogenicidade aumentada, ecotextura grosseira, vasos pobremente evidenciados
- Dimensões fora do gradil, superfície regular, margens abauladas, ecogenicidade diminuída, ecotextura normal, vasos preservados
- Dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade diminuída, ecotextura normal, calibre vascular aumentado
- Fígado fora do gradil, superfície irregular, margens abauladas, ecogenicidade diminuída, ecotextura normal, vasos de calibre aumentados + vesícula biliar e vias biliares extra-hepáticas com espessamento de parede, calibre aumentado, conteúdo anecogênico com material amorfo ecodenso e móvel
- Dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade difusamente aumentada, ecotextura preservada, vasos pobremente visualizados
- Dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade difusamente aumentada com perda da atenuação do feixe sonoro distal, ecotextura grosseira, vasos pobremente visualizados

FÍGADO — Alterações focais:
Nódulo único hiperecogênico, múltiplos nódulos hiperecogênicos, mineralização do parênquima hepático, nódulo único hipoecogênico, múltiplos nódulos hipoecogênicos, nódulos hipo e hiperecogênicos, formação com necrose, cisto único, cisto complexo, múltiplos cistos, formação com cistos em felinos, lesão em alvo, hematoma, formações, grandes formações`,

  gallbladder: `VESÍCULA BILIAR — Alterações da parede:
Variação anatômica, colangite, espessamento da parede por edema, espessamento da parede por anafilaxia, colecistite crônica, colecistite enfisematosa, hiperplasia mucinosa cística

VESÍCULA BILIAR — Alterações de conteúdo:
Sedimento em animais idosos, graduação de sedimento, concreção biliar, colelitíase, cálculo de colesterol, mucocele
(Mucocele: para bexiga e vesícula biliar, NÃO indicar cistocentese/colecistocentese quando houver presença de gás ou mucocele)

VIAS BILIARES:
Mineralização em vias biliares intra-hepáticas, coledocolitíase, obstrução das vias biliares`,

  spleen: `BAÇO — Alterações difusas:
Esplenomegalia, microesplenia, mineralização, congestão esplênica, torção esplênica, esplenite, ruptura esplênica

BAÇO — Alterações focais:
Nódulo único hiperecogênico, mielolipoma (cães/gatos), nódulo único hipoecogênico, múltiplos nódulos hipoecogênicos, padrão micronodular, padrão micronodular em filhotes, cisto único, abscesso, hematoma, infarto, imagem em alvo, formações, grandes formações, formações cavitárias, trombose de veia esplênica`,

  pancreas: `PÂNCREAS — Alterações difusas:
Pancreatite aguda, pancreatite crônica agudizada, pâncreas do gato idoso, edema pancreático, pancreatite hemorrágica necrotizante

PÂNCREAS — Alterações focais:
Nódulo único, múltiplos nódulos, cisto único, múltiplos cistos, abscesso, neoplasia, litíase pancreática`,

  adrenals: `ADRENAIS — Alterações difusas:
Adrenalite, hiperplasia unilateral, hiperplasia bilateral, atrofia bilateral, uma aumentada e uma diminuída, hiperaldosteronismo em felinos

ADRENAIS — Alterações focais:
Hiperplasia nodular hipoecogênica, hiperplasia nodular hiperecogênica, calcificação, neoplasia, neoplasia com comprometimento da VCC`,

  stomach: `ESTÔMAGO — Alterações da parede:
Espessamento difuso, espessamento focal, úlcera gástrica, gastrite urêmica, gastrite polipoide, formações

ESTÔMAGO — Alterações de conteúdo:
Acúmulo de líquido por processo inflamatório, acúmulo de líquido por processo obstrutivo, corpo estranho gástrico, corpo estranho perfurante`,

  intestines: `INTESTINOS — Alterações da parede:
Espessamento da parede por segmento, espessamento difuso da parede, espessamento da parede em felinos, espessamento focal da parede (forma/amorfo), linfangiectasia, tiflite, colite, hiperplasia folicular linfoide

INTESTINOS — Alterações de conteúdo:
Dilatação por conteúdo líquido, corpo estranho linear, corpo estranho não obstrutivo, corpo estranho obstrutivo, intussuscepção`,

  kidneys: `RINS — Alterações difusas:
Nefropatia aguda, nefropatia crônica, síndrome do rim grande-rim pequeno, sinal da medular, sinal da banda, displasia renal, PIF, linfoma renal

RINS — Alterações focais:
Cisto único, múltiplos cistos, doença policística autossômica dominante, pseudocisto perinéfrico, infarto renal, abscesso renal, nefrocalcinose, dioctophyma renale, neoplasia focal

SISTEMA COLETOR:
Pielectasia, litíase, hidronefrose unilateral, hidronefrose bilateral, pielonefrite

URETERES:
Cálculo único, múltiplos cálculos, ureter ectópico, ureterocele`,

  bladder: `BEXIGA — Alterações da parede:
Divertículo uracal, espessamento difuso, espessamento no ápice, espessamento no colo, cistite enfisematosa, cistite polipoide, cistite pseudomembranosa, neoplasia

BEXIGA — Alterações de conteúdo:
Pontos ecogênicos em suspensão, pontos ecogênicos depositados ao fundo, cálculo único, múltiplos cálculos, coágulo, obstrução, ruptura de parede

URETRA:
Uretrite, cálculo único, múltiplos cálculos, neoplasia`,

  uterus: `ÚTERO:
Hiperplasia endometrial cística, mucometra/hidrometra, neoplasia, granuloma de coto, piometra de coto

ÚTERO PÓS-PARTO:
Metrite, retenção de placenta

ANOMALIAS GESTACIONAIS:
Hidrocefalia, hidropsia ou anasarca fetal, onfalocele e gastrosquise, morte embrionária, feto macerado, feto mumificado, feto enfisematoso`,

  ovaries: `OVÁRIOS:
Cistos, neoplasia, ovário remanescente, granuloma`,

  prostate: `PRÓSTATA:
Hiperplasia prostática benigna, hiperplasia prostática cística, cisto único, cisto paraprostático, abscesso prostático, prostatite, neoplasia`,

  testicles: `TESTÍCULOS:
Atrofia testicular, criptorquidismo, cisto simples, cisto septado, nódulo hiperecogênico, orquite e epididimite, neoplasia`,

  lymphnodes: `LINFONODOS:
Linfonodo aumentado (cístico), múltiplos linfonodos aumentados, coalescência de linfonodos`,

  misc: `HÉRNIAS:
Descontinuidade da parede, hérnia perineal

MASSA EXPANSIVA:
Formações, formações cavitárias, necrose em formações

EFUSÃO PERITONEAL:
Líquido livre

PERITONITE:
Peritonite focal, peritonite difusa`,
};

export const FRASES_SALVADORAS = `FRASES SALVADORAS (use quando aplicável):
- Para alterações em órgãos com possível comprometimento funcional: "Sugiro correlação com achados clínicos e demais exames laboratoriais para maiores conclusões."
- Para lesões pequenas ou formações médias a grandes: "É recomendado acompanhamento ultrassonográfico da lesão, bem como a associação com o exame de punção guiada por agulha fina."
- Para formações grandes: "É indicada a correlação com exame de tomografia computadorizada/laparotomia exploratória para maiores esclarecimentos."
- Para alterações em bexiga (exceto gás): "Caso o clínico considere necessário, sugiro cistocentese com cultura da urina para melhor elucidação do quadro."
- Para alterações em vesícula biliar (exceto gás e mucocele): "Caso o clínico considere necessário, sugiro colecistocentese com cultura da bile para melhor elucidação das alterações supracitadas."`;

export const TEMPLATES: Record<Specialty, string> = {
  ultrasound_abdominal: `Você é um especialista em ultrassonografia veterinária. Seu trabalho é gerar laudos ultrassonográficos abdominais formais em português brasileiro.

FORMATO DE SAÍDA OBRIGATÓRIO: Retorne APENAS um objeto JSON válido, sem nenhum texto antes ou depois, sem markdown, sem blocos de código. O JSON deve seguir exatamente esta estrutura:
{
  "sections": [
    { "label": "NOME DA SEÇÃO", "content": "Texto descritivo da seção." }
  ],
  "conclusion": "Texto da conclusão geral (ex: Exame dentro dos limites da normalidade).",
  "impressao": ["Frase de impressão diagnóstica 1.", "Frase de impressão diagnóstica 2."],
  "recomendacoes": ["Frase de recomendação 1.", "Frase de recomendação 2."]
}
Campos "impressao" e "recomendacoes" são arrays de strings. Omita-os se não houver alterações (exame normal). O campo "conclusion" é sempre obrigatório. NÃO inclua cabeçalho, assinatura, linha de assinatura, campo "Médico Veterinário" ou qualquer texto fora do JSON. O array "sections" deve conter APENAS seções de órgãos/estruturas anatômicas.

REGRAS OBRIGATÓRIAS:

1. Seções NÃO mencionadas pelo veterinário → copie o texto padrão EXATAMENTE, sem nenhuma modificação.

2. Seções mencionadas pelo veterinário → use o texto padrão como BASE e modifique APENAS os campos que o veterinário explicitamente informou. Campos não mencionados permanecem exatamente como no texto padrão. Exemplo: se o veterinário disse "fígado aumentado com ecogenicidade aumentada", mantenha superfície, margens, ecotextura e arquitetura vascular do texto padrão — altere apenas dimensões e ecogenicidade.

3. Impressão diagnóstica e Recomendação → NÃO coloque inline após cada órgão. Todas as impressões e recomendações vão APENAS na seção CONCLUSÃO ao final do laudo, agrupadas.

4. MEDIDAS — PROIBIDO INVENTAR: NUNCA inclua medidas no laudo que o veterinário não tenha fornecido explicitamente. Sem exceções. Se o veterinário informou "rim mede 3,2cm", inclua. Se não informou medida alguma para um órgão, o laudo não deve conter nenhum número de medida para aquele órgão.

5. IDIOMA E NOMENCLATURA: Todo o texto do laudo deve ser em português brasileiro. Descreva os achados em linguagem descritiva. NUNCA use nomes de classificação interna como rótulos.

CONCLUSÃO:
Se tudo normal: use EXATAMENTE "Exame ultrassonográfico abdominal dentro dos limites da normalidade para a espécie {especie}." — sem alterar nada.
Se houver alterações, use obrigatoriamente esta estrutura:
IMPRESSÃO DIAGNÓSTICA:
Os achados observados no [órgão] são compatíveis com [diagnóstico]. Diagnósticos diferenciais incluem: [DD1, DD2, DD3].
(repetir para cada órgão alterado)
RECOMENDAÇÕES:
[Frases salvadoras aplicáveis]

{nomenclature}

TEXTO PADRÃO (achados normais):
{defaults}

Gere o laudo completo com todas as seções.`,
};

export const REPORT_TITLES: Record<Specialty, string> = {
  ultrasound_abdominal: "RELATÓRIO ULTRASSONOGRÁFICO",
};

export const SPECIALTY_ABBR: Record<Specialty, string> = {
  ultrasound_abdominal: "US",
};
