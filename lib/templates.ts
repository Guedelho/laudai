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

5. IDIOMA E NOMENCLATURA: Todo o texto do laudo deve ser em português brasileiro. NUNCA inclua nomes de classificação interna ou rótulos de referência da nomenclatura abaixo (como "Hepatomegalia I", "Hipoecogênico II", "Mucocele III", "Nefropatia Crônica IV", "Cistos I", etc.). Use apenas a descrição dos achados, nunca o nome do tipo/classificação.

ESTRUTURA DA CONCLUSÃO (obrigatória quando houver alterações):
IMPRESSÃO DIAGNÓSTICA:
Os achados observados no [órgão] são compatíveis com [diagnóstico]. Diagnósticos diferenciais incluem: [DD1, DD2, DD3].

(repetir para cada órgão alterado)

RECOMENDAÇÕES:
[Frases salvadoras aplicáveis]

NOMENCLATURA DE REFERÊNCIA — lista de achados por alteração para auxiliar na descrição. O diagnóstico da impressão é de sua responsabilidade clínica:

FÍGADO — Alterações Difusas:
- Hepatomegalia I: dimensões fora do gradil costal, superfície regular, margens finas, ecogenicidade e ecotextura normais, arquitetura vascular preservada
- Hepatomegalia II: dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade e ecotextura normais, arquitetura vascular preservada
- Microhepatia I: dimensões diminuídas, superfície regular, margens finas, ecogenicidade preservada, ecotextura homogênea, arquitetura vascular preservada
- Microhepatia II: dimensões diminuídas, superfície irregular, margens abauladas, ecogenicidade aumentada, ecotextura grosseira, vasos pobremente evidenciados
- Hipoecogênico I: dimensões fora do gradil, superfície regular, margens abauladas, ecogenicidade diminuída, ecotextura normal, vasos preservados
- Hipoecogênico II: dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade diminuída, ecotextura normal, calibre vascular aumentado
- Colangiohepatite: fígado fora do gradil, superfície irregular, margens abauladas, ecogenicidade diminuída, ecotextura normal, vasos de calibre aumentados + vesícula biliar e vias biliares extra-hepáticas com espessamento de parede, calibre aumentado, conteúdo anecogênico com material amorfo ecodenso e móvel
- Hiperecogênico I: dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade difusamente aumentada, ecotextura preservada, vasos pobremente visualizados
- Hiperecogênico II: dimensões fora do gradil, superfície irregular, margens abauladas, ecogenicidade difusamente aumentada com perda da atenuação do feixe sonoro distal, ecotextura grosseira, vasos pobremente visualizados

FÍGADO — Alterações Focais:
Nódulo Único Hiperecogênico, Múltiplos Nódulos Hiperecogênicos, Mineralização do Parênquima Hepático, Nódulo Único Hipoecogênico, Múltiplos Nódulos Hipoecogênicos, Nódulos Hipo e Hiperecogênicos, Formação com Necrose, Cisto Único, Cisto Complexo, Múltiplos Cistos, Formação com Cistos em Felinos, Lesão em Alvo, Hematoma, Formações, Grandes Formações

VESÍCULA BILIAR — Alterações da Parede:
Variação Anatômica, Colangite, Espessamento da Parede por Edema, Espessamento da Parede por Anafilaxia, Colecistite Crônica, Colecistite Enfisematosa, Hiperplasia Mucinosa Cística

VESÍCULA BILIAR — Alterações de Conteúdo:
Sedimento em Animais Idosos, Graduação de Sedimento, Concreção Biliar, Colelitíase, Cálculo de Colesterol, Mucocele I a VI
(Mucocele: para bexiga e vesícula biliar, NÃO indicar cistocentese/colecistocentese quando houver presença de gás ou mucocele)

VIAS BILIARES:
Mineralização em Vias Biliares Intra-hepáticas, Coledocolitíase, Obstrução das Vias Biliares

BAÇO — Alterações Difusas:
Esplenomegalia, Microesplenia, Mineralização, Congestão Esplênica, Torção Esplênica, Esplenite, Ruptura Esplênica

BAÇO — Alterações Focais:
Nódulo Único Hiperecogênico, Mielolipoma (cães/gatos), Nódulo Único Hipoecogênico, Múltiplos Nódulos Hipoecogênicos, Padrão Micronodular, Padrão Micronodular em Filhotes, Cisto Único, Abscesso, Hematoma, Infarto, Imagem em Alvo, Formações, Grandes Formações, Formações Cavitárias, Trombose de Veia Esplênica

PÂNCREAS — Alterações Difusas:
Pancreatite Aguda, Pancreatite Crônica Agudizada, Pâncreas do Gato Idoso, Edema Pancreático, Pancreatite Hemorrágica Necrotizante

PÂNCREAS — Alterações Focais:
Nódulo Único, Múltiplos Nódulos, Cisto Único, Múltiplos Cistos, Abscesso, Neoplasia, Litíase Pancreática

ADRENAIS — Alterações Difusas:
Adrenalite, Hiperplasia Unilateral, Hiperplasia Bilateral, Atrofia Bilateral, Uma aumentada e uma diminuída, Hiperaldosteronismo em Felinos

ADRENAIS — Alterações Focais:
Hiperplasia Nodular Hipoecogênica, Hiperplasia Nodular Hiperecogênica, Calcificação, Neoplasia, Neoplasia com Comprometimento da VCC

ESTÔMAGO — Alterações da Parede:
Espessamento Difuso, Espessamento Focal, Úlcera Gástrica, Gastrite Urêmica, Gastrite Polipoide, Formações

ESTÔMAGO — Alterações de Conteúdo:
Acúmulo de Líquido por Processo Inflamatório, Acúmulo de Líquido por Processo Obstrutivo, Corpo Estranho Gástrico, Corpo Estranho Perfurante

INTESTINOS — Alterações da Parede:
Espessamento da Parede por Segmento, Espessamento Difuso da Parede, Espessamento da Parede em Felinos, Espessamento Focal da Parede (forma/amorfo), Linfangiectasia, Tiflite, Colite, Hiperplasia Folicular Linfoide

INTESTINOS — Alterações de Conteúdo:
Dilatação por Conteúdo Líquido, Corpo Estranho Linear, Corpo Estranho Não Obstrutivo, Corpo Estranho Obstrutivo, Intussuscepção

RINS — Alterações Difusas:
Nefropatia Aguda, Nefropatia Crônica I a V, Síndrome do Rim Grande-Rim Pequeno, Sinal da Medular, Sinal da Banda, Displasia Renal, PIF, Linfoma Renal

RINS — Alterações Focais:
Cisto Único, Múltiplos Cistos, Doença Policística Autossômica Dominante, Pseudocisto Perinéfrico, Infarto Renal, Abscesso Renal, Nefrocalcinose, Dioctophyma Renale, Neoplasia Focal

SISTEMA COLETOR:
Pielectasia, Litíase, Hidronefrose Unilateral, Hidronefrose Bilateral, Pielonefrite

URETERES:
Cálculo Único, Múltiplos Cálculos, Ureter Ectópico, Ureterocele

BEXIGA — Alterações da Parede:
Divertículo Uracal, Espessamento Difuso, Espessamento no Ápice, Espessamento no Colo, Cistite Enfisematosa, Cistite Polipoide, Cistite Pseudomembranosa, Neoplasia

BEXIGA — Alterações de Conteúdo:
Pontos Ecogênicos em Suspensão, Pontos Ecogênicos Depositados ao Fundo, Cálculo Único, Múltiplos Cálculos, Coágulo, Obstrução, Ruptura de Parede

URETRA:
Uretrite, Cálculo Único, Múltiplos Cálculos, Neoplasia

ÚTERO:
Hiperplasia Endometrial Cística I, Hiperplasia Endometrial Cística II, Mucometra/Hidrometra, Neoplasia, Granuloma de Coto, Piometra de Coto

OVÁRIOS:
Cistos I, Cistos II, Neoplasia, Ovário Remanescente, Granuloma

PRÓSTATA:
Hiperplasia Prostática Benigna, Hiperplasia Prostática Cística, Cisto Único, Cisto Paraprostático, Abscesso Prostático, Prostatite, Neoplasia

TESTÍCULOS:
Atrofia Testicular I, Atrofia Testicular II, Criptorquidismo, Cisto Simples, Cisto Septado, Nódulo Hiperecogênico, Orquite e Epididimite, Neoplasia

LINFONODOS:
Linfonodo Aumentado (cístico), Múltiplos Linfonodos Aumentados, Coalescência de Linfonodos

HÉRNIAS:
Descontinuidade da Parede I/II, Hérnia Perineal

MASSA EXPANSIVA:
Formações, Formações Cavitárias, Necrose em Formações

EFUSÃO PERITONEAL:
Líquido Livre I, Líquido Livre II

PERITONITE:
Peritonite Focal, Peritonite Difusa

ANOMALIAS GESTACIONAIS:
Hidrocefalia, Hidropsia ou Anasarca Fetal, Onfalocele e Gastrosquise, Morte Embrionária, Feto Macerado, Feto Mumificado, Feto Enfisematoso

ÚTERO PÓS-PARTO:
Metrite, Retenção de Placenta

FRASES SALVADORAS (use quando aplicável):
- Para alterações em órgãos com possível comprometimento funcional: "Sugiro correlação com achados clínicos e demais exames laboratoriais para maiores conclusões."
- Para lesões pequenas ou formações médias a grandes: "É recomendado acompanhamento ultrassonográfico da lesão, bem como a associação com o exame de punção guiada por agulha fina."
- Para formações grandes: "É indicada a correlação com exame de tomografia computadorizada/laparotomia exploratória para maiores esclarecimentos."
- Para alterações em bexiga (exceto gás): "Caso o clínico considere necessário, sugiro cistocentese com cultura da urina para melhor elucidação do quadro."
- Para alterações em vesícula biliar (exceto gás e mucocele): "Caso o clínico considere necessário, sugiro colecistocentese com cultura da bile para melhor elucidação das alterações supracitadas."

TEXTO PADRÃO (achados normais):
{defaults}

CABEÇALHO DO LAUDO:
ULTRASSONOGRAFIA ABDOMINAL
Data: {data}
Paciente: {paciente} | Espécie: {especie} | Raça: {raca} | Idade: {idade}
Responsável: {tutor}
Médico Veterinário: {veterinario} | CRMV: {crmv}

Gere o laudo completo com todas as seções. Ao final, inclua:

CONCLUSÃO:
Se tudo normal: use EXATAMENTE "Exame ultrassonográfico abdominal dentro dos limites da normalidade para a espécie {especie}." — sem alterar nada.
Se houver alterações, use obrigatoriamente esta estrutura:
IMPRESSÃO DIAGNÓSTICA:
Os achados observados no [órgão] são compatíveis com [diagnóstico]. Diagnósticos diferenciais incluem: [DD1, DD2, DD3].

(repetir para cada órgão alterado)

RECOMENDAÇÕES:
[Frases salvadoras aplicáveis]

Assinatura: ___________________________
{veterinario}
CRMV: {crmv}`,
};

export const REPORT_TITLES: Record<Specialty, string> = {
  ultrasound_abdominal: "RELATÓRIO ULTRASSONOGRÁFICO",
};

export const SPECIALTY_ABBR: Record<Specialty, string> = {
  ultrasound_abdominal: "US",
};
