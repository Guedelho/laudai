import { type ReportType } from "@/shared/constants";

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

// Catálogo verbatim do "Mapa do Laudo Memorável" (Zelinda Arêas): para cada órgão,
// a lista de condições com a DESCRIÇÃO, IMPRESSÃO e RECOMENDAÇÃO exatas do livro.
// O modelo localiza a condição que corresponde ao achado do veterinário e reproduz
// esses textos, adaptando apenas medidas/lateralidade/localização informadas.
const MAP_REFERENCE = `## FÍGADO
• HEPATOMEGALIA I
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade e ecotextura dentro dos limites da normalidade. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: Hepatomegalia pouco específica, podendo indicar presença de processo inflamatório.
  RECOMENDAÇÃO: Em adultos: Sugiro pesquisa de hepatopatias para maiores conclusões. Em filhotes: A hepatomegalia é uma condição normalmente encontrada em animais até oito meses de idade.
• HEPATOMEGALIA II
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície irregular, margens abauladas, parênquima de ecogenicidade e ecotextura dentro dos limites da normalidade. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: As alterações hepáticas podem estar correlacionadas com presença de processo inflamatório, não podendo ser descartada demais causas.
  RECOMENDAÇÃO: Sugiro correlação com achados clínicos e demais exames laboratoriais para maiores conclusões.
• MICROHEPATIA I
  DESCRIÇÃO: Fígado de dimensões subjetivamente diminuídas, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura homogênea. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: FILHOTES - A microhepatia em animais jovens pode indicar presença de hipoplasia portal ou desvios portossistêmicos.
  RECOMENDAÇÃO: Caso o clínico considere necessário, sugiro correlação com exame de tomografia computadorizada para apoio diagnóstico.
• MICROHEPATIA II
  DESCRIÇÃO: Fígado de dimensões diminuídas, superfície irregular, margens abauladas, parênquima de ecogenicidade aumentada e ecotextura grosseira. Arquitetura vascular portal intra-hepática pobremente evidenciada.
  IMPRESSÃO: A microhepatia em animais adultos/idosos pode estar correlacionado à hepatopatia crônica em estágio avançado.
  RECOMENDAÇÃO: Sugiro correlação com demais exames laboratoriais assim como exame dopplervelocimétrico hepático a fim de monitorar a hemodinâmica vascular do órgão.
• HIPOECOGÊNICO I
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície regular, margens abauladas, parênquima de ecogenicidade diminuída e ecotextura dentro dos limites da normalidade. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: Por meio dos achados visualizados no fígado, foi possível determinar o diagnóstico presuntivo de processo inflamatório (hepatite aguda). com diagnóstico diferencial para hepatopatia toxemia. Outros diagnósticos diferenciais: Neoplasias infiltrativas (linfoma, linfossarcoma e leucemia).
  RECOMENDAÇÃO: Sugiro correlação com achados clínicos e demais exames laboratoriais para maiores esclarecimentos.
• HIPOECOGÊNICO II
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície irregular, margens abauladas, parênquima de ecogenicidade diminuída e ecotextura dentro dos limites da normalidade. Arquitetura vascular portal e intra-hepática de calibre aumentados.
  IMPRESSÃO: Por meio dos achados visualizados no fígado e vasos hepáticos, foi possível determinar o diagnóstico presuntivo de congestão hepática.
  RECOMENDAÇÃO: É recomendada a correlação laboratorial e pesquisa de cardiopatias para apoio diagnóstico.
• COLANGIOHEPATITE
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície irregular, margens abauladas, parênquima de ecogenicidade diminuída e ecotextura dentro dos limites da normalidade. Arquitetura vascular portal e intra-hepática de calibre aumentados. Vesícula biliar e vias biliares extrahepáticas com espessamento de parede, aumentadas de calibre, com conteúdo anecogênico apresentando material amorfo, ecodenso e móvel em seu interior.
  IMPRESSÃO: Por meio dos achados visualizados no fígado, vesícula biliar e vias biliares, foi possível determinar o diagnóstico presuntivo de colangiohepatite.
  RECOMENDAÇÃO: Sugiro correlação com demais exames laboratoriais para melhores conclusões.
• HIPERECOGÊNICO I
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície irregular, margens abauladas, parênquima de ecogenicidade aumentada de forma difusa e ecotextura preservada. Arquitetura vascular portal e intra-hepática pobremente visualizada.
  IMPRESSÃO: Alterações hepáticas indicam presença de hepatopatia crônica. Outros diagnósticos diferenciais: Hepatopatia esteroidal, lipidose, fibrose inicial e neoplasias infiltrativas.
  RECOMENDAÇÃO: Sugiro correlação com demais exames laboratoriais.
• HIPERECOGÊNICO II
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície irregular, margens abauladas, parênquima de ecogenicidade aumentada de forma difusa, havendo perda da atenuação do feixe sonoro distal, e ecotextura grosseira. Arquitetura vascular portal e intra-hepática pobremente visualizada.
  IMPRESSÃO: Por meio dos achados visualizados no fígado, foi possível determinar o diagnóstico presuntivo de infiltração gordurosa (hepatopatia vacuolar/esteatose hepática).
  RECOMENDAÇÃO: Sugiro correlação com demais exames laboratoriais assim como exame dopplervelocimétrico hepático a fim de monitorar a hemodinâmica vascular do órgão.
• NÓDULO ÚNICO HIPERECOGÊNICO
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: Fígado apresentando alteração focal que pode indicar hiperplasia nodular com diagnóstico diferencial para hiperplasia vacuolar. Outros diagnósticos diferenciais: Granuloma, mineralização, neoplasia primária ou metastática. *Não é indicado biópsia em fígado de felinos. Optar pela citologia.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico da lesão e caso o clínico considere necessário, correlação com achados cito/histopatológicos*.
• DIVERSOS NÓDULOS HIPERECOGÊNICOS
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura heterogênea devido à presença de inúmeras e pequenas formações predominantemente arredondadas/ovaladas, de contornos definidos e regulares/irregulares, hiperecogênica, localizada em (região) de forma difusa, medindo a maior 0,00 x 0,00cm e a menor 0,00 x 0,00cm. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: Fígado apresentando alteração focal que pode indicar hiperplasia nodular, com diagnóstico diferencial para hiperplasia vacuolar. Outros diagnósticos diferenciais: Fibrose, mineralização, neoplasia primária ou metastático. *Não é indicado biópsia em fígado de felinos. Optar pela citologia.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico da lesão e caso o clínico considere necessário, correlação com achados cito/histopatológicos*.
• MINERALIZAÇÃO DO PARÊNQUIMA HEPÁTICO
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura heterogênea devido à presença de inúmeras e pequenas formações predominantemente arredondadas/ovaladas, de contornos definidos e regulares/irregulares, hiperecogênicas, formadoras de sombra acústica, espalhadas de forma difusa pelo parênquima, medindo aproximadamente 0,00 x 0,00cm. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: Tal alteração hepática pode indicar presença de mineralização.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico da lesão e pesquisa de endocrinopatias para maiores conclusões.
• NÓDULO ÚNICO HIPOECOGÊNICO
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: Fígado apresentando alteração focal que pode indicar hiperplasia nodular. Outros diagnósticos diferenciais: Abscesso em fase inicial, neoplasia primária e metastática. Correlacionar achados clínicos e laboratoriais. *Não é indicado biópsia em fígado de felinos. Optar pela citologia.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico da lesão e caso o clínico considere necessário, correlação com achados cito/histopatológicos*.
• DIVERSOS NÓDULOS HIPOECOGÊNICOS
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura heterogênea devido à presença de inúmeras pequenas formações predominantemente arredondadas/ovaladas, de contornos definidos e regulares/irregulares, hipoecogênica, localizada em (região/de forma difusa), medindo a maior 0,00 x 0,00cm e a menor 0,00 x 0,00cm. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: Fígado apresentando alteração focal que pode indicar hiperplasia nodular. Outros diagnósticos diferenciais: Abscesso em fase inicial, neoplasia primária e metastática. Correlacionar achados clínicos e laboratoriais. *Não é indicado biópsia em fígado de felinos. Optar pela citologia.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico da lesão e caso o clínico considere necessário, correlação com achados cito/histopatológicos*.
• DIVERSOS NÓDULOS HIPO E HIPERECOGÊNICOS
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura heterogênea devido à presença de inúmeras imagens predominantemente arredondadas, de contornos definidos e regulares/irregulares, umas hipo e outras hiperecogênicas, heterogêneos, localizadas em (região/de forma difusa pelo parênquima), medindo a maior 0,00 x 0,00cm e menor 0,00 x 0,00cm. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: Fígado apresentando alterações que podem indicar hiperplasia nodular com diagnóstico diferencial para neoplasia primária ou metastática. Outros diagnósticos diferenciais: Abscesso em fase inicial, neoplasia primária e metastática. Correlacionar achados clínicos e laboratoriais. *Não é indicado biópsia em fígado de felinos. Optar pela citologia.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico da lesão e caso o clínico considere necessário, correlação com achados cito/histopatológicos*.
• FORMAÇÃO COM NECROSE
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura heterogênea devido à presença de uma
  IMPRESSÃO: Alteração hepática focal sugere presença de formação com áreas de necrose tecidual.
• CISTO ÚNICO
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: Fígado apresentando alteração compatível com cisto simples. Outros diagnósticos diferenciais: Abscesso em fase inicial. Correlacionar achados clínicos e laboratoriais.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico da lesão e correlação com achados clínico/laboratoriais.
• CISTO COMPLEXO
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: Fígado apresentando alteração compatível com cisto complexo.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico da lesão e correlação com achados clínico/laboratoriais para melhores conclusões.
• MÚLTIPLOS CÍSTOS
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura heterogênea, devido à presença de inúmeras imagens arredondadas, de contornos bem definidos e regulares, com paredes finas, conteúdo anecogênico acompanhada de reforço acústico posterior, localizada em região de /de forma difusa pelo parênquima, medindo a maior 0,00 x 0,00cm. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.
  IMPRESSÃO: Fígado apresentando alteração que pode indicar doença hepática crônica com diagnóstico diferencial para doença policística autossômica dominante. (quando for gato)
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico e correlação com achados clínico/laboratoriais para melhores conclusões.
• FORMAÇÃO COM CISTOS EM FELINOS
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície irregular, margens abauladas, parênquima normoecogênico, ecotextura heterogênea, devido à presença de uma
  IMPRESSÃO: Fígado apresentando alteração que pode indicar cistoadenoma biliar. Outros diagnósticos diferenciais: Doenças crônicas.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico e correlação com achados clínico/laboratoriais.
• LESÕES EM ALVO
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura predominantemente homogênea, devido à presença de uma
  IMPRESSÃO: Fígado apresentando alteração que pode indicar hiperplasia nodular com diagnóstico diferencial para neoplasia primária/ metastático.
  RECOMENDAÇÃO: Sugiro correlação com exame cito / histopatológicos.
• HEMATOMA
  DESCRIÇÃO: Fígado de dimensões dentro dos limites do gradil costal, superfície regular, margens finas, parênquima de ecogenicidade preservada e ecotextura predominantemente homogênea, porém com presença de uma
  IMPRESSÃO: Alteração hepática pode indicar hiperplasia nodular, entretanto, a hipótese diagnóstica de um hematoma, não deve ser descartada. Outros diagnósticos diferenciais: Lesões necróticas, neoplasias e abscessos em fase inicial.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico.
• FORMAÇÕES
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície irregular, margens abauladas, parênquima normoecogênico, ecotextura heterogênea, devido à presença de uma massa de contornos irregulares, de aspecto sólido/cavitário/multicavitário/misto localizada em (região), medindo aproximadamente 0,00 x 0,00 x 0,00cm (comprimento x altura x largura).
  IMPRESSÃO: Fígado apresentando
  RECOMENDAÇÃO: É recomendada a correlação com demais exames de
• GRANDES FORMAÇÕES
  DESCRIÇÃO: Fígado de dimensões fora dos limites do gradil costal, superfície irregular, margens abauladas, parênquima normoecogênico, ecotextura heterogênea, devido à presença de uma massa expansiva sem forma definida, de contornos pouco marcados e irregulares, de aspecto sólido/cavitário/multicavitário/misto localizada em (região), medindo aproximadamente 0,00 x 0,00 x 0,00cm (comprimento x altura x largura).
  IMPRESSÃO: Fígado apresentando
  RECOMENDAÇÃO: É recomendada a correlação com demais exames de

## VESÍCULA BILIAR
• VARIAÇÕES ANATÔMICAS
  DESCRIÇÃO: Vesícula biliar repleta, septada, paredes finas e ecogênicas com conteúdo anecogênico e homogêneo.
  IMPRESSÃO: Vesícula biliar apresentando variação anatômica comumente encontrada em felinos domésticos. Sugiro acompanhamento ultrassonográfico para controle de possíveis patologias.
• COLANGITITE
  DESCRIÇÃO: Vesícula biliar e vias biliares extrahepáticas com espessamento de parede, aumentadas de calibre, com conteúdo anecogênico apresentando material amorfo, ecodenso e móvel em seu interior.
  IMPRESSÃO: Por meio dos achados visualizados em vesícula biliar e vias biliares, foi possível determinar o diagnóstico presuntivo de colangite.
  RECOMENDAÇÃO: Sugiro correlação com demais exames laboratoriais para melhores conclusões.
• ESPESSAMENTO DA PAREDE POR EDEMA
  DESCRIÇÃO: Vesícula biliar normo/hiperestendida, paredes espessadas, medindo 0,00cm, apresentando padrão de uma camada hipoecogênica delimitada por duas camadas hiperecogênicas com conteúdo anecogênico. Quando acompanhada de sedimento: com conteúdo anecogênico e material ecodenso móvel e amorfo.
  IMPRESSÃO: Presença de colecistite aguda, podendo estar relacionada a quadros de hipertensão portal, hipoalbuminemia, ou ainda obstrução biliar. Outros diagnósticos diferenciais: Pancreatite, cardiopatias e anafilaxia.
• ESPESSAMENTO DA PAREDE POR ANAFILAXIA
  DESCRIÇÃO: Vesícula biliar hiperestendida, paredes espessadas, medindo 0,00cm, apresentando padrão de uma camada hipoecogênica delimitada por duas camadas hiperecogênicas com conteúdo anecogênico. Quando acompanhada de sedimento: com conteúdo anecogênico e material ecodenso móvel e amorfo.
  IMPRESSÃO: Presença de colecistite aguda, podendo estar relacionada a quadros de processo alérgico (anafilaxia). Outros diagnósticos diferenciais: Pancreatite, cardiopatias e hipoproteinemia.
• COLECISTITE CRÔNICA
  DESCRIÇÃO: Vesícula biliar normodistendida, com espessamento difuso da parede (>0,10cm) e aumento da ecogenicidade e conteúdo anecogênico. Quando acompanhada de sedimento: com conteúdo anecogênico e material ecodenso móvel e amorfo.
  IMPRESSÃO: As alterações visualizadas em vesícula biliar são compatíveis com colecistite crônica. Outros diagnósticos diferenciais: Colangite e colangiohepatite.
• COLECISTITE ENFISEMATOSA
  DESCRIÇÃO: Vesícula biliar normodistendida, com espessamento difuso da parede (>0,10cm) e aumento da ecogenicidade, conteúdo anecogênico com presença de inúmeros pontos ecogênicos em suspensão formadores de reverberação intramural / intraluminal.
  IMPRESSÃO: As alterações visualizadas em vesícula biliar são compatíveis com colecistite enfisematosa.
• HIPERPLASIA MUCINOSA CÍSTICA
  DESCRIÇÃO: Vesícula biliar aumentada de volume, medindo 0,00ml, apresentando em sua parede inúmeras áreas anecogênicas margeando a mucosa da parede da vesícula biliar. Conteúdo ecogênico, imóvel / móvel, e heterogêneo concentrado no interior.
  IMPRESSÃO: As alterações visualizadas em vesícula biliar são sugestivas de hiperplasia mucinosa cística, acompanhada de mucocele biliar.
• SEDIMENTO LEVE ANIMAIS IDOSOS
  DESCRIÇÃO: Vesícula biliar com repleção preservada, paredes finas e ecogênicas com conteúdo anecogênico acompanhada de até 25% de material ecogênico, móvel. Parede fina e ecogênica.
  IMPRESSÃO: Vesícula biliar apresentando leve quantidade de sedimento, sugerindo colestase.
  RECOMENDAÇÃO: Tal alteração indica hipofunção motora biliar devido a alteração neurológica em animais idosos, com diagnóstico diferencial para alteração da viscosidade secundária a endocrinopatias.
• GRADUAÇÃO DO SEDIMENTO
  DESCRIÇÃO: Vesícula biliar com repleção preservada, paredes finas e ecogênicas com conteúdo anecogênico acompanhada de até: -25% de material ecogênico e móvel. -de 25 a 50% de material ecogênico e móvel. -de 50 a 75 de material ecogênico e móvel. -mais de 75% de material ecogênico e móvel.
  IMPRESSÃO: Vesícula biliar apresentando leve / moderado / grave quantidade de sedimento, indicando colestase.
  RECOMENDAÇÃO: Tal alteração indica hipofunção motora biliar devido a alteração neurológica em animais idosos, com diagnóstico diferencial para alteração da viscosidade secundária a endocrinopatias.
• CONCREÇÃO BILIAR
  DESCRIÇÃO: Vesícula biliar com repleção demasiada, paredes espessadas e ecogênicas com conteúdo anecogênico acompanhada de material ecogênico, móvel e com discreto formato arredondada/ovalado, medindo 0,00 x 0,00cm formando fraca / não havendo formação de sombra acústica posterior.
  IMPRESSÃO: A alteração descrita em vesícula biliar indica presença de concreção biliar.
  RECOMENDAÇÃO: Caso o clínico considere necessário, sugiro correlação com exame de colecistocentese para apoio diagnóstico.
• COLELITÍASE
  DESCRIÇÃO: Vesícula biliar normodistendida, paredes finas/espessadas e ecogênicas com conteúdo anecogênico apresentando em seu interior, uma
  IMPRESSÃO: Imagem visualizada em vesícula biliar é compatível com colelitíase.
• CÁLCULO DE COLESTEROL
  DESCRIÇÃO: Vesícula biliar normodistendida, com paredes finas e ecogênicas, conteúdo anecogênico apresentando uma
  IMPRESSÃO: A alteração descrita em vesícula biliar sugere presença de cálculo de colesterol.
  RECOMENDAÇÃO: Caso o clínico considere necessário, sugiro correlação com exame de colecistocentese para apoio diagnóstico.
• MUCOCELE I
  DESCRIÇÃO: Vesícula biliar com repleção levemente/severamente aumentada, com 00,00ml, preenchida por um grande volume de sedimento biliar organizado e imóvel, havendo discretíssima presença de bile anecogênica na periferia. Parede fina/espessada e ecogênica, medindo 0,00cm.
  IMPRESSÃO: Vesícula biliar apresentando alterações sonográficas compatíveis com mucocele biliar grau I, segundo Bosso et al 2000.
• MUCOCELE II
  DESCRIÇÃO: Vesícula biliar com repleção levemente/severamente aumentada, com 00,00ml, preenchida por um grande volume de sedimento biliar organizado e imóvel, apresentando padrão estrelado incompleto. Parede fina/espessada e ecogênica, medindo 0,00cm.
  IMPRESSÃO: Vesícula biliar apresentando alterações sonográficas compatíveis com mucocele biliar grau II, segundo Bosso et al 2000.
• MUCOCELE III
  DESCRIÇÃO: Vesícula biliar com repleção levemente/severamente aumentada, com 00,00ml, preenchida por um grande volume de sedimento biliar organizado e imóvel, apresentando padrão estrelado completo. Parede fina/espessada e ecogênica, medindo 0,00cm.
  IMPRESSÃO: Vesícula biliar apresentando alterações sonográficas compatíveis com mucocele biliar grau III, segundo Bosso et al 2000.
• MUCOCELE IV
  DESCRIÇÃO: Vesícula biliar com repleção levemente/severamente aumentada, com 00,00ml, preenchida por um grande volume de sedimento biliar organizado e imóvel, apresentando padrão estriado e estrelado combinados. Parede fina/espessada e ecogênica, medindo 0,00cm.
  IMPRESSÃO: Vesícula biliar apresentando alterações sonográficas compatíveis com mucocele biliar grau IV, segundo Bosso et al 2000.
• MUCOCELE V
  DESCRIÇÃO: Vesícula biliar com repleção levemente/severamente aumentada, com 00,00ml, preenchida por um grande volume de sedimento biliar organizado e imóvel, apresentando padrão estriado total com bile ecogênica no centro. Parede fina/espessada e ecogênica, medindo 0,00cm.
  IMPRESSÃO: Vesícula biliar apresentando alterações sonográficas compatíveis com mucocele biliar grau V, segundo Bosso et al 2000.
• MUCOCELE VI
  DESCRIÇÃO: Vesícula biliar com repleção levemente/severamente aumentada, com 00,00ml, preenchida por um grande volume de sedimento biliar organizado e imóvel, apresentando padrão completo semelhante ao kiwi. Parede fina/espessada e ecogênica, medindo 0,00cm.
  IMPRESSÃO: Vesícula biliar apresentando alterações sonográficas compatíveis com mucocele biliar grau VI, segundo Bosso et al 2000.

## VIAS BILIARES
• MINERALIZAÇÕES EM VIAS BILIARES INTRA
  DESCRIÇÃO: Vias biliares intra-hepáticas apresentando em seu trajeto imagens de superfície refletora e formação de forte sombra acústica medindo 0,00cm de extensão.
  IMPRESSÃO: As imagens visualizadas em ductos biliares intra-hepáticos são compatíveis com mineralizações podendo se tratar de litíases.
  RECOMENDAÇÃO: É recomendada a correlação com demais achados clínicos-laboratoriais.
• COLEDOCOLITÍASE
  DESCRIÇÃO: Ducto colédoco levemente dilatado, medindo 0,00cm, com paredes finas/espessadas e ecogênicas, conteúdo anecogênico apresentando em seu interior, uma
  IMPRESSÃO: A alteração descrita em vias biliares indica coledocolitíase.
  RECOMENDAÇÃO: É recomendada a correlação com demais achados clínicos-laboratoriais, bem como coleta de bile por colecistocentese para apoio diagnóstico.
• OBSTRUÇÃO DAS VIAS BILIARES (SEM LITÍASE)
  DESCRIÇÃO: Vesícula biliar e colo vesical com distensão moderada à severa. Ductos cístico e colédoco apresentando marcada dilatação, medindo 0,50cm (acima de 0,50cm). Papila duodenal medindo 0,00cm (normal/aumentada)
  IMPRESSÃO: Alterações visualizadas em vias biliares podem indicar presença de processo obstrutivo.

## BAÇO
• ESPLENOMEGALIA
  DESCRIÇÃO: Baço de contornos definidos, superfície irregular, margens abauladas e perda do formato anatômico, ecogenicidade e ecotextura preservadas.
  IMPRESSÃO: Esplenomegalia pode indicar hiperplasia linfoide, sugerindo presença de processo inflamatório/infeccioso ativo.
  RECOMENDAÇÃO: É recomendada a correlação com demais achados clínicos-laboratoriais para melhores conclusões.
• MICROESPLENIA
  DESCRIÇÃO: Baço de contornos definidos, dimensões reduzidas, superfície irregular, bordas cortantes, ecogenicidade diminuída e ecotextura preservadas.
  IMPRESSÃO: Baço com alterações que indicam microesplenia, podendo estar correlacionado com desidratação ou caquexia.
  RECOMENDAÇÃO: É recomendada a correlação com demais achados clínicos-laboratoriais para melhores conclusões.
• MINERALIZAÇÃO
  DESCRIÇÃO: Baço de contornos definidos, dimensões preservadas/aumentadas, superfície irregular, bordas cortantes, ecogenicidade preservada, apresentando inúmeros pontos ecogênicos espalhados de forma difusa pelo parênquima.
  IMPRESSÃO: Alterações esplênicas podem indicar presença de mineralização.
  RECOMENDAÇÃO: É recomendada pesquisa de adrenopatias, bem como nefropatias para apoio diagnóstico.
• CONGESTÃO ESPLÊNICA
  DESCRIÇÃO: Baço de dimensões aumentadas, contornos irregulares, bordas abauladas, diminuição da ecogenicidade e ecotextura preservada, arquitetura vascular apresentando aumento de seu calibre.
  IMPRESSÃO: Baço apresentando alterações que podem indicar presença de congestão esplênica.
• TORÇÃO ESPLÊNICA
  DESCRIÇÃO: Baço de contornos definidos, dimensões severamente aumentadas, superfície irregular, com margens abauladas e acentuada diminuição da ecogenicidade, acompanhada de ecotextura de aspecto rendilhado e aumento da ecogenicidade do mesentério adjacente.
  IMPRESSÃO: Baço apresentando alterações que indicam presença de torção esplênica.
• ESPLENITE
  DESCRIÇÃO: Baço de contornos definidos e irregulares, dimensões aumentadas, margens abauladas e ecotextura heterogênea, acompanhada de diversas imagens hipoecogênicas e amorfas.
  IMPRESSÃO: As alterações esplênicas são pouco específicas e podem sugerir quadro de esplenite, com diagnóstico diferencial para hiperplasia linfoide.
• RUPTURA ESPLÊNICA
  DESCRIÇÃO: Baço de contornos definidos, superfície lisa, porem, nota-se em face visceral/parietal descontinuidade de sua superfície. Ecogenicidade e ecotextura preservadas.
  IMPRESSÃO: Tal alteração visualizada em baço pode indicar presença de ruptura esplênica.
• NÓDULO ÚNICO HIPERECOGÊNICO
  DESCRIÇÃO: Baço de contornos definidos, superfície regular, margens finas, ecogenicidade preservadas e ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: Baço apresentando alterações compatíveis com hiperplasia nodular com diagnóstico diferencial para mielolipoma e hematopoiese extramedular. Outros diagnósticos diferenciais: Granuloma, abscesso em fase inicial, neoplasia primária ou metastática.
  RECOMENDAÇÃO: Sugiro controle ultrassonográfico e caso o clínico considere necessário, exame de cito/histopatologia para apoio diagnóstico.
• MIELOLIPOMA NOS CÃES
  DESCRIÇÃO: Baço de contornos definidos, superfície lisa, margens abauladas, ecogenicidade preservada e ecotextura heterogênea, devido à presença de múltiplos nódulos hiperecogênicos em borda visceral, próximo à região do hilo, medindo o maior 0,00 x 0,00cm.
  IMPRESSÃO: Baço apresentando mielolipiomas esplênicos. São achados incidentais comuns em animais senis.
• MIELOLIPOMA NOS GATOS
  DESCRIÇÃO: Baço de contornos definidos, superfície lisa, margens abauladas, ecogenicidade preservada e ecotextura heterogênea, devido à presença de X formações nodulares localizado em região de cabeça/corpo/cauda, medindo o maior 0,00 x 0,00cm.
  IMPRESSÃO: Baço apresentando mielolipiomas esplênicos. São achados incidentais comuns em animais senis.
• NÓDULO ÚNICO HIPOECOGÊNICO
  DESCRIÇÃO: Baço de contornos definidos, superfície regular, margens finas, ecogenicidade preservadas e ecotextura predominantemente homogênea, porém apresentando uma formação nodular, de contornos definidos e regulares, hipoecogênica, homogênea/heterogênea, localizada em região de cabeça/corpo/cauda medindo 0,00 x 0,00cm.
  IMPRESSÃO: Baço apresentando alterações compatíveis com hiperplasia nodular com diagnóstico diferencial para hematoma e hematopoiese extramedular. Outros diagnósticos diferenciais: Abscesso e hematoma em fase inicial, neoplasia primária ou metastática.
  RECOMENDAÇÃO: Sugiro controle ultrassonográfico em conjunto com exame de cito/histopatologia para apoio diagnóstico.
• MÚLTIPLOS NÓDULOS HIPOECOGÊNICOS
  DESCRIÇÃO: Baço de contornos definidos, superfície irregular, margens abauladas e ecotextura heterogênea devido a inúmeras imagens arredondadas/ovaladas e hipoecogênicas, espalhadas de forma difusa pelo parênquima.
  IMPRESSÃO: Baço apresentando alterações compatíveis com hiperplasia nodular com diagnóstico diferencial para hematopoiese extramedular. Outros diagnósticos diferenciais: Esplenite, neoplasia primária ou metastática.
  RECOMENDAÇÃO: Sugiro controle ultrassonográfico em conjunto com exame de cito/histopatologia para apoio diagnóstico.
• PADRÃO MICRONODULAR
  DESCRIÇÃO: Baço de contornos definidos, superfície irregular, margens abauladas e ecotextura heterogênea devido a inúmeras imagens micronodulares, hipoecogênicas, espalhadas de forma difusa pelo parênquima.
  IMPRESSÃO: Baço apresentando alterações compatíveis com hiperplasia nodular com diagnóstico diferencial para hematopoiese extramedular. Outros diagnósticos diferenciais: Esplenite, neoplasia primária ou metastática.
  RECOMENDAÇÃO: Sugiro controle ultrassonográfico em conjunto com exames laboratoriais e correlação clínica para apoio diagnóstico.
• PADRÃO MICRONODULAR EM FILHOTES
  DESCRIÇÃO: Baço de contornos definidos, superfície irregular, margens abauladas e ecotextura heterogênea devido a inúmeras imagens micronodulares, hipoecogênicas, espalhadas de forma difusa pelo parênquima.
  IMPRESSÃO: Imagens visualizadas em baço, quando em filhotes, são comumente associadas à resposta vacinal.
  RECOMENDAÇÃO: Sugiro controle ultrassonográfico em conjunto com acompanhamento clínico.
• CISTO ÚNICO
  DESCRIÇÃO: Baço de contornos definidos, superfície regular, margens finas, ecogenicidade preservadas e ecotextura predominantemente homogênea, porém apresentando uma pequena formação circunscrita, de paredes finas e bem definidas, com conteúdo anecogênica, formadora de reforço acústico posterior localizada em região de cabeça/corpo/cauda, medindo 0,00 x 0,00cm.
  IMPRESSÃO: Baço apresentando alteração focal compatível com cisto esplênico
• ABSCESSOS
  DESCRIÇÃO: Baço de contornos definidos, superfície irregular, margens abauladas, ecogenicidade preservadas e ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: As alterações encontradas em baço podem indicar presença de abscesso esplênico acompanhado de áreas de necrose.
  RECOMENDAÇÃO: Sugiro correlação clínica para apoio diagnóstico.
• HEMATOMA
  DESCRIÇÃO: Baço de contornos definidos, superfície irregular, margens abauladas, ecogenicidade preservadas e ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: Baço apresentando alteração focal que pode ser compatível com hematoma, com diagnóstico diferencial para hiperplasia nodular, esplenite e ainda abscesso.
  RECOMENDAÇÃO: Sugiro correlação clínica para apoio diagnóstico.
• INFARTO
  DESCRIÇÃO: Baço de contornos definidos, superfície regular, margens finas, ecogenicidade preservadas e ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: As alterações esplênicas sugerem presença de infarto esplênico, com diagnóstico diferencial para abscesso em fase inicial.
  RECOMENDAÇÃO: É importante a correlação com achados clínicos e laboratoriais para apoio diagnóstico.
• IMAGEM EM ALVO
  DESCRIÇÃO: Baço de contornos definidos, superfície irregular, margens abauladas, ecogenicidade preservadas e ecotextura predominantemente homogênea, porém, apresentando uma
  IMPRESSÃO: Baço apresentando lesão que pode indicar hiperplasia nodular, com diagnóstico diferencial para neoplasia metastático.
  RECOMENDAÇÃO: Sugiro controle ultrassonográfico em conjunto com exame de cito/histopatologia para apoio diagnóstico.
• FORMAÇÕES
  DESCRIÇÃO: Baço de contornos definidos, superfície severamente irregular, havendo distensão capsular, ecotextura heterogênea, devido a uma formação com áreas irregulares hipoecogênicas e ecogênicas, localizada em corpo/cauda, medindo 0,00 x 0,00 x 0,00cm (comprimento x altura x largura).
  IMPRESSÃO: Tal alteração visualizada em baço, sugere se tratar de processo neoplásico, com diagnóstico diferencial para processo inflamatório severo.
  RECOMENDAÇÃO: É recomendada a correlação com demais exames de
• GRANDES FORMAÇÕES
  DESCRIÇÃO: Baço de contornos definidos, superfície severamente irregular, havendo distensão capsular, ecotextura heterogênea, devido a uma formação com áreas irregulares hipoecogênicas e anecogênicas, localizada em corpo/cauda, medindo 0,00 x 0,00cm x 0,00cm (comprimento x altura x largura).
  IMPRESSÃO: Tal alteração visualizada em baço, sugere se tratar de processo neoplásico, com diagnóstico diferencial para processo inflamatório severo.
  RECOMENDAÇÃO: É recomendada a correlação com demais exames de
• GRANDES FORMAÇÕES CAVITÁRIAS
  DESCRIÇÃO: Baço de contornos definidos, superfície severamente irregular, havendo distensão capsular, ecotextura heterogênea, devido à presença de uma massa expansiva arredondada / sem forma definida, medindo aproximadamente 0,00 x 0,00 x 0,00cm (comprimento x altura x largura), de contornos definidos e irregulares, de aspecto cavitário/multicavitário, acompanhada de componente sólido. Nota-se ainda reforço acústico posterior devido à presença de cavidades preenchidas por conteúdo líquido.
  IMPRESSÃO: Tal alteração visualizada em baço, sugere se tratar de processo neoplásico.
  RECOMENDAÇÃO: É recomendada a correlação com demais exames de
• TROMBOSE DE VEIA ESPLÊNICA
  DESCRIÇÃO: Veia esplênica apresentando em seu interior um material ecogênico e estático, medindo 0,00 x 0,00cm, causando desvio do fluxo ao mapeamento Doppler colorido.
  IMPRESSÃO: Tal alteração visualizada em veia esplênica pode indicar trombose da veia esplênica.

## PÂNCREAS
• PANCREATITE AGUDA
  DESCRIÇÃO: Pâncreas apresentando contornos irregulares, ecogenicidade diminuída e ecotextura grosseira, medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo/por toda sua extensão (normal /aumentado). Nota-se ainda aumento de ecogenicidade dos tecidos adjacentes.
  IMPRESSÃO: As alterações pancreáticas são compatíveis com processo inflamatório agudo (pancreatite).
  RECOMENDAÇÃO: Sugiro correlação com exames laboratoriais, bem como acompanhamento ultrassonográfico em X dias.
• PANCREATITE CRÔNICA AGUDIZADA
  DESCRIÇÃO: Pâncreas apresentando contornos irregulares, ecogenicidade aumentada, e ecotextura grosseira, medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo (normal/aumentado), acompanhado de aumento de ecogenicidade dos tecidos adjacentes (esteatite focal).
  IMPRESSÃO: Pâncreas apresentando conjunto de alterações que indicam pancreatite crônica agudizada.
  RECOMENDAÇÃO: Sugiro correlação com exames laboratoriais, bem como acompanhamento ultrassonográfico em X dias.
• PÂNCREAS GATO IDOSO
  DESCRIÇÃO: Pâncreas apresentando contornos irregulares, ecogenicidade aumentada, e ecotextura grosseira/homogênea, medindo 0,00cm de espessura em região de lobo direito/corpo pancreático/lobo esquerdo (diminuído). Ducto pancreático mede 0,00cm (dilatado), não havendo evidências sonográficas de processos obstrutivos.
  IMPRESSÃO: As alterações visualizadas em pâncreas são comumente encontradas em gatos senis. Entretanto, não se deve descartar demais pancreatopatias.
  RECOMENDAÇÃO: sugiro correlação com achados clínicos e laboratoriais para apoio diagnóstico.
• EDEMA PANCREÁTICO
  DESCRIÇÃO: Pâncreas apresentando contornos irregulares, ecotextura grosseira, apresentando inúmeras linhas anecogênicas de permeio, medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo (aumentado).
  IMPRESSÃO: Pâncreas apresentando alterações que indicam presença de edema pancreático.
• PANCREATITE NECROTIZANTE HEMORRÁGICA
  DESCRIÇÃO: Pâncreas com margens pouco definidas, ecogenicidade diminuída, medindo 0,00cm de espessura em região de lobo esquerdo/direito (aumentado de tamanho), de contornos irregulares, apresentando inúmeras linhas anecogênicas de permeio e ainda uma
  IMPRESSÃO: Pâncreas apresentando alterações que sugerem se tratar de pancreatite necrotizante hemorrágica.
  RECOMENDAÇÃO: A tomografia computadorizada é um exame de
• ÚNICO NÓDULO
  DESCRIÇÃO: Pâncreas normoecogênico medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo (normal), apresentando uma
  IMPRESSÃO: Pâncreas apresentando alteração focal que pode indicar hiperplasia nodular pancreática.
• MÚLTIPLOS NÓDULOS
  DESCRIÇÃO: Pâncreas normoecogênico medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo (normal/aumentada), com ecotextura heterogênea, devido à inúmeras imagens arredondadas, hipoecogênicas/hiperecogênicas, de contornos bem definidos, regulares, medindo a maior aproximadamente 0,00 x 0,00cm e a menor 0,00 x 0,00cm.
  IMPRESSÃO: Pâncreas apresentando alteração focal que pode indicar hiperplasia nodular pancreática.
• CISTO ÚNICO
  DESCRIÇÃO: Pâncreas normoecogênico medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo, com ecotextura predominantemente homogênea, porém apresentando uma
  IMPRESSÃO: Alteração pancreática é compatível com cisto simples.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e acompanhamento ultrassonográfico da lesão, bem como exame de citologia guiada para apoio diagnóstico.
• MÚLTIPLOS CISTOS
  DESCRIÇÃO: Pâncreas hiperecogênico, medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo, com ecotextura heterogênea devido à presença de inúmeras imagens arredondadas, de contornos bem definidos e regulares com conteúdo anecogênico acompanhadas de reforço acústico posterior, medindo aproximadamente 0,00 x 0,00cm, localizada em lobo direito/corpo pancreático/lobo esquerdo.
  IMPRESSÃO: Pâncreas apresentando alterações que indicam presença de cistos, geralmente associada à processos crônicos.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e acompanhamento ultrassonográfico da lesão, bem como exame de citologia guiada para apoio diagnóstico.
• ABSCESSO
  DESCRIÇÃO: Pâncreas aumentado de tamanho, medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo, com ecogenicidade preservada/diminuída, ecotextura grosseira, devido a uma
  IMPRESSÃO: Pâncreas apresentando alterações que podem caracterizar presença de abscesso acompanhada de peritonite focal.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e acompanhamento ultrassonográfico da lesão.
• NEOPLASIA
  DESCRIÇÃO: Pâncreas hipoecogênico medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo, com ecotextura grosseira, devido a uma
  IMPRESSÃO: Pâncreas apresentando alterações que podem caracterizar presença de neoplasia, com diagnóstico diferencial para hiperplasia nodular.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e acompanhamento ultrassonográfico da lesão, bem como exame de citologia guiada para apoio diagnóstico.
• LITÍASE PANCREÁTICA
  DESCRIÇÃO: Pâncreas normoecogênico medindo 0,00cm de espessura em região de lobo direito/corpo/lobo esquerdo, com ecotextura preservada, apresentando no interior do ducto pancreático, uma
  IMPRESSÃO: Pâncreas apresentando alterações compatíveis com litíase no ducto pancreático.

## ADRENAIS
• ADRENALITE
  DESCRIÇÃO: Adrenais de formato mantido, bordas abauladas e regulares com definição corticomedular preservada. Adrenal direita mede 0,00 x 0,00 x 0,00cm e esquerda mede 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal).
  IMPRESSÃO: Alterações descritas em adrenais sugerem presença de hiperplasia bilateral.
  RECOMENDAÇÃO: Sugiro pesquisa de adrenopatias para melhores conclusões e acompanhamento ultrassonográfico em X dias para apoio diagnóstico.
• HIPERPLASIA UNILATERAL
  DESCRIÇÃO: Adrenal esquerda / direta aumentada de tamanho, medindo 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal), com formato anatômico predominantemente mantido, bordas abauladas e irregulares e distinção córticomedular perdida/preservada. Adrenal esquerda/direita de formato mantido, bordas regulares, distinção córticomedular e ecogenicidade preservadas, medindo 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal).
  IMPRESSÃO: Alterações descritas em adrenal esquerda/direita sugere presença de hiperplasia unilateral.
  RECOMENDAÇÃO: Sugiro pesquisa de adrenopatias para melhores conclusões.
• HIPERPLASIA BILATERAL
  DESCRIÇÃO: Adrenais de formato mantido / perdido, bordas abauladas e irregulares com perda da definição corticomedular. Ambas aumentadas de tamanho, onde adrenal direita mede 0,00 x 0,00 x 0,00cm e esquerda mede 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal).
  IMPRESSÃO: Alterações descritas em adrenais sugerem presença de hiperplasia bilateral.
  RECOMENDAÇÃO: Sugiro pesquisa de adrenopatias para melhores conclusões.
• ATROFIA BILATERAL
  DESCRIÇÃO: Adrenais de dimensões reduzidas, onde a direita mede 0,00 x 0,00 x 0,00cm e esquerda mede 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal), apresentando bordas irregulares e perda da definição corticomedular.
  IMPRESSÃO: Alterações descritas em adrenais sugerem presença de atrofia bilateral.
  RECOMENDAÇÃO: Sugiro pesquisa de adrenopatias para melhores conclusões.
• UM AUMETANDA UMA DIMINUÍDA
  DESCRIÇÃO: Adrenal esquerda / direta aumentada de tamanho, medindo 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal), com formato anatômico predominantemente mantido, bordas abauladas e irregulares e distinção córticomedular perdida. Adrenal esquerda / direta de dimensões reduzidas, medindo 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal), com formato anatômico predominantemente mantido, bordas irregulares e distinção córticomedular perdida.
  IMPRESSÃO: Alterações descritas em adrenais indicam hiperplasia da adrenal esquerda/direita e atrofia da glândula contralateral.
  RECOMENDAÇÃO: Sugiro pesquisa de adrenopatias para melhores conclusões.
• HIPERALDESTERONISMO EM FELINOS
  DESCRIÇÃO: Adrenal esquerda / direta aumentada de tamanho, medindo 0,00 x 0,00cm (comprimento x altura), com formato anatômico predominantemente mantido, bordas abauladas e irregulares e distinção córticomedular perdida. Adrenal esquerda / direta de dimensões reduzidas, medindo 0,00 x 0,00cm (comprimento x altura), com formato anatômico predominantemente mantido, bordas irregulares e distinção córticomedular perdida.
  IMPRESSÃO: Alterações descritas em adrenais podem indicar presença de hiperaldesteronismo.
  RECOMENDAÇÃO: Sugiro pesquisa de endocrinopatias para apoio diagnóstico.
• HIPERPLASIA NODULAR HIPOECOGÊNICA
  DESCRIÇÃO: Adrenal direita / esquerda medindo 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal), com perda do formato anatômico e distinção córticomedular, ecotextura heterogênea devido à presença de uma formação nodular hipoecogênica, homogênea/heterogênea localizada em polo cranial / caudal medindo 0,00 x 0,00cm.
  IMPRESSÃO: Alterações descritas em adrenal direita/esquerda sugere presença de hiperplasia nodular.
  RECOMENDAÇÃO: Sugiro pesquisa de adrenopatias para melhores conclusões.
• HIPERPLASIA NODULAR HIPERECOGÊNICA
  DESCRIÇÃO: Adrenal direita / esquerda medindo 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal), com perda do formato anatômico e distinção córticomedular, ecotextura heterogênea devido à presença de uma formação nodular hiperecogênica, homogênea/heterogênea localizada em polo cranial / caudal medindo 0,00 x 0,00cm.
  IMPRESSÃO: Alterações descritas em adrenal direita/esquerda sugere presença de hiperplasia nodular.
  RECOMENDAÇÃO: Sugiro pesquisa de adrenopatias para melhores conclusões.
• CALCIFICAÇÃO
  DESCRIÇÃO: Adrenal direita / esquerda medindo 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal), com perda do formato anatômico e distinção córticomedular, ecotextura heterogênea devido à presença de uma formação nodular hiperecogênica, homogênea/heterogênea localizada em polo cranial / caudal medindo 0,00 x 0,00cm.
  IMPRESSÃO: Alterações descritas em adrenal direita/esquerda sugere presença de hiperplasia nodular.
  RECOMENDAÇÃO: Sugiro pesquisa de adrenopatias para melhores conclusões.
• NEOPLASIA
  DESCRIÇÃO: Adrenal esquerda / direta severamente aumentada de tamanho, medindo 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal), com perda do formato anatômico, de aspecto globoso / sem forma definida, com bordas irregulares, hipoecogênica com perda da distinção córticomedular e heterogênea.
  IMPRESSÃO: Alterações descritas em adrenal direita/esquerda pode sugerir presença de neoformação.
• NEOPLASIA COM COMPROMETIMENTO VCC
  DESCRIÇÃO: Em topografia de adrenal direita, nota-se uma formação de contornos definidos e irregulares, medindo 0,00 x 0,00cm, hipoecogênica, e levemente heterogênea, se estendendo até os limites de parede da veia cava caudal e comprometendo seu calibre.
  IMPRESSÃO: Alterações descritas em adrenal direita pode sugerir presença de neoformação, com estreitamento da veia cava caudal.
  RECOMENDAÇÃO: Sugiro correlação com exame de tomografia computadorizada para melhor elucidação da

## ESTÔMAGO
• ESPESSAMENTO DIFUSO DA PAREDE
  DESCRIÇÃO: Estômago com conteúdo luminal de padrão gasoso/anecóico (líquido)/misto (alimentos), peristaltismo evolutivo, com paredes apresentando padrão em camadas preservado, porém espessadas de forma difusa, medindo aproximadamente 0,00cm .
  IMPRESSÃO: Estômago apresentando alterações compatíveis com processo inflamatório difuso (gastrite).
• ESPESSAMENTO FOCAL DA PAREDE
  DESCRIÇÃO: Estômago com conteúdo luminal de padrão gasoso/anecóico (líquido)/misto (alimentos), peristaltismo evolutivo, com paredes hipoecogênica, apresentando padrão em camadas perdido, com um espessamento concentrado em região de fundo/curvatura maior/curvatura menor/antropiloro, medindo aproximadamente 0,00cm .
  IMPRESSÃO: Estômago apresentando alterações compatíveis com processo inflamatório focal severo (edema).
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e acompanhamento ultrassonográfico para apoio diagnóstico.
• ÚLCERA GÁSTRICA
  DESCRIÇÃO: Estômago com conteúdo luminal de padrão anecóico (líquido)/misto (gasoso e pastoso), motilidade reduzida/normal, com paredes apresentando padrão em camadas preservado / perdido, porém, nota-se em região de fundo/corpo/antro um espessamento focal acompanhado de uma depressão/irregularidade na mucosa gástrica caracterizada por uma interface hiperecogênica.
  IMPRESSÃO: Estômago apresentando alterações que podem indicar presença de úlcera gástrica.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e caso o médico veterinário considere necessário, sugiro correlação com exame de endoscopia para apoio diagnóstico.
• GASTRITE URÊMICA
  DESCRIÇÃO: Estômago com conteúdo luminal de padrão anecóico (líquido)/misto (pastoso e gasoso), parede espessada, medindo 0,00cm, apresentando aumento difuso de ecogenicidade em mucosa gástrica.
  IMPRESSÃO: As alterações visualizadas em estômago, podem indicar presença de gastrite urêmica.
  RECOMENDAÇÃO: Sugiro correlação clínico-laboratorial para maiores esclarecimentos, bem como reavaliação ultrassonográfica para acompanhamento da alteração.
• GASTRITE POLIPÓIDE
  DESCRIÇÃO: Estômago com conteúdo luminal de padrão misto (gás e alimento), peristaltismo preservado/aumentado, paredes de aspecto sonográfico mantido em sua predominância, porém apresentando um aumento de volume focal, de forma arredondada, com perda da estratificação de camadas, hipoecogêneo levemente heterogênea, medindo aproximadamente 0,00 x 0,00cm, localizada em região antro-pilórica.
  IMPRESSÃO: As alterações visualizadas em estômago, podem sugerir presença de gastrite polipóide.
  RECOMENDAÇÃO: É recomendada a realização do exame de endoscopia para maiores conclusões.
• FORMAÇÕES
  DESCRIÇÃO: Estômago com conteúdo luminal de padrão misto (gás e alimento), paredes apresentando perda do padrão de camadas, sobretudo em região de fundo o corpo gástrico, com severo espessamento focal com padrão de massa, chegando a medir 4,33 x 3,20cm, enquanto em região de antropiloro mede 0,70cm.
  IMPRESSÃO: Estômago apresentando imagens que indicam presença de provável processo neoplásico, com diagnóstico diferencial para edema gástrico agudo severo.
  RECOMENDAÇÃO: É recomendada correlação com exame de tomografia computadorizada par apoio diagnóstico.
• ACÚMULO DE LÍQUIDO POR PROCESSO INFLAMATÓRIO
  DESCRIÇÃO: Estômago com acentuado conteúdo luminal de padrão anecóico (líquido), peristaltismo aumentado e evolutivo. Paredes de aspecto sonográfico mantido com padrão em camadas, hiperecogênica espessada, medindo 0,Xcm.
  IMPRESSÃO: Alterações gástricas indicam presença de processo inflamatório (gastrite).
  RECOMENDAÇÃO: Sugiro acompanhamento clínico e ultrassonográfico para apoio diagnóstico.
• ACÚMULO DE LÍQUIDO POR PROCESSO OBSTRUTIVO
  DESCRIÇÃO: Estômago com acentuado conteúdo luminal de padrão anecóico (líquido), peristaltismo aumentado e não evolutivo. Paredes de aspecto sonográfico mantido com padrão em camadas e medindo 0,Xcm de espessura.
  IMPRESSÃO: Alterações gástricas indicam presença de processo obstrutivo.
• CORPO ESTRANHO GÁSTRICO
  DESCRIÇÃO: Estômago com conteúdo luminal de padrão misto (líquido, gás e alimento) / padrão anecogênico, peristaltismo evolutivo, acompanhado de uma
  IMPRESSÃO: Estômago apresentando alteração compatível com corpo estranho.
• CORPO ESTRANHO PERFURANTE
  DESCRIÇÃO: Estômago com conteúdo luminal de padrão anecóico, peristaltismo evolutivo, acompanhado de uma
  IMPRESSÃO: Imagens visualizadas em estômago são sugestivas de presença de corpo estranho perfurante acompanhada de peritonite focal.

## INTESTINOS
• ESPESSAMENTO DA PAREDE POR SEGMENTO
  DESCRIÇÃO: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas mantido e ecogenicidade normal, peristaltismo evolutivo, com número de contrações normal. Paredes espessadas em segmento de duodeno/jejuno/cólon que mede 0,00cm. Demais segmentos de espessura normal, jejuno mede 0,00cm e cólon descendente 0,00cm.
  IMPRESSÃO: Tais alterações visualizadas em duodeno são indicativas de processo inflamatório (duodenite).
• ESPESSAMENTO DIFUSO DA PAREDE
  DESCRIÇÃO: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas mantido e ecogenicidade normal, peristaltismo evolutivo, com número de contrações normal/aumentado Paredes espessadas onde o duodeno mede 0,00cm, jejuno 0,00cm, íleo 0,00cm e cólon descendente mede 0,00cm, apresentando conteúdo normal/anecogênico.
  IMPRESSÃO: Tais alterações visualizadas em alças intestinais são indicativas de processo inflamatório (enterite).
• ESPESSAMENTO DIFUSO DA PAREDE EM FELINOS
  DESCRIÇÃO: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas mantido e ecogenicidade normal, peristaltismo evolutivo, com número de contrações normal e paredes espessadas, medindo em duodeno 0,00cm, jejuno 0,00cm, íleo 0,00cm, ceco 0,00cm e cólon 0,00cm, apresentando evidente aumento em camada muscular.
  IMPRESSÃO: Tais alterações visualizadas em alças intestinais podem indicar presença de doença intestinal inflamatório, com diagnóstico diferencial para neoplasia infiltrativa.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e caso o médico veterinário considere necessário, sugiro correlação com exame de endoscopia para apoio diagnóstico.
• ESPESSAMENTO FOCAL DA PAREDE COM FORMA
  DESCRIÇÃO: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas predominantemente mantido e ecogenicidade normal, peristaltismo evolutivo e com número de contrações normal. Duodeno mede 0,00cm, jejuno 0,00cm e cólon descendente 0,00cm. Foi observado em porção jejunal, uma formação predominantemente arredondada, invadindo seu lúmen, medindo um total de 0,00 x 0,00 x 0,00 cm (comprimento x altura x largura), contornos pouco definidos, hipoecogênica, heterogênea, havendo perda da estratificação de camadas e aparente descontinuidade com a camada mucosa/submucosa/muscular acompanhada de diminuição do lúmen intestinal e aumento de ecogenicidade em mesentério adjacente.
  IMPRESSÃO: Presença de neoformação focal associada a peritonite focal.
  RECOMENDAÇÃO: Sugiro correlação com exame histopatológico para apoio diagnóstico.
• ESPESSAMENTO FOCAL DA PAREDE SEM FORMA
  DESCRIÇÃO: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas predominantemente mantido e ecogenicidade normal, peristaltismo evolutivo e com número de contrações normal. Duodeno mede 0,00cm, jejuno 0,00cm e cólon descendente 0,00cm. Foi observado em porção jejunal, um importante espessamento de parede medindo 0,00cm, com extensão de pelo menos 0,00 cm. Tal lesão apresenta contornos pouco definidos, é hipoecogênica, heterogênea, havendo perda da estratificação de camadas e aparente descontinuidade com a camada mucosa/submucosa/muscular acompanhada de diminuição do lúmen intestinal e aumento de ecogenicidade em mesentério adjacente.
  IMPRESSÃO: Presença de neoformação focal associada a peritonite focal, com diagnóstico diferencial para processo inflamatório local severo.
  RECOMENDAÇÃO: Sugiro correlação com exame histopatológico para apoio diagnóstico.
• LINFANGIECTASIA
  DESCRIÇÃO: Segmento de duodeno/jejuno com distribuição topográfica habitual, alça com padrão em camadas levemente perdido, espessadas e de ecogenicidade aumentada, apresentando por todo segmento estriações hiperecóicas perpendiculares na mucosa e peristaltismo evolutivo e com número de contrações normal/aumentado. Demais alças intestinais como duodeno mede 0,00cm e cólon descendente 0,00cm.
  IMPRESSÃO: Alças intestinais apresentando imagens que indicam presença de processo inflamatório intenso.
  RECOMENDAÇÃO: Entretanto, é recomendada a correlação com exame cito/histopatológico para maiores conclusões.
• TIFLITE
  DESCRIÇÃO: Ceco apresentando diminuição da ecogenicidade da parede e espessamento, medindo 0,00cm. Linfonodos cólicos adjacentes aumentados, hipoecogênicos e com aumento da ecogenidade dos tecidos adjacentes.
  IMPRESSÃO: Alterações visualizadas em ceco e região, indicam presença de tiflite.
• COLITE
  DESCRIÇÃO: Segmento de cólon ascendente, transverso e descendente com distribuição topográfica habitual, alça com padrão em camadas espessadas, conteúdo predominantemente anecogênico, peristaltismo evolutivo e com número de contrações aumentado.
  IMPRESSÃO: Alças intestinais apresentando imagens que indicam presença de processo inflamatório intenso.
  RECOMENDAÇÃO: Entretanto, é recomendada a correlação com exame cito/histopatológico para maiores conclusões.
• HIPERPLASIA FOLICULAR LINFOIDE
  DESCRIÇÃO: Segmento de cólon ascendente/transverso/descendente com distribuição topográfica habitual, alça com padrão em camadas espessadas, apresentando pequenas imagens arredondadas e hipoecogênicas.
  IMPRESSÃO: Cólon apresentando imagens que indicam presença de hiperplasia folicular linfoide.
• DILATAÇÃO POR CONTEÚDO LÍQUIDO
  DESCRIÇÃO: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas mantido e ecogenicidade normal, peristaltismo evolutivo, com número de contrações aumentado. Paredes espessadas em segmento de duodeno que mede 0,00cm e presença de marcada / severa quantidade conteúdo de padrão anecogênico (líquido). Demais segmentos de espessura normal, jejuno mede 0,00cm e cólon descendente 0,00cm com conteúdo preservado.
  IMPRESSÃO: Alterações visualizadas em segmento de alça intestinal é compatível com processo inflamatório difuso /focal.
• CORPO ESTRANHO LINEAR
  DESCRIÇÃO: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas mantido e ecogenicidade normal. Observa-se em região correspondente a duodeno/jejuno marcado pregueamento das alças, acompanhado de
  IMPRESSÃO: Alterações visualizadas em segmento de alça intestinal é compatível com corpo estranho linear.
• CORPO ESTRANHO NÃO OBSTRUTIVO
  DESCRIÇÃO: Nota-se em segmento correspondente a duodeno/jejuno, presença de uma
  IMPRESSÃO: Presença de corpo estranho em segmento de duodeno/jejuno não havendo evidências ultrassonográficas que indiquem processo obstrutivo no momento do exame.
• CORPO ESTRANHO OBSTRUTIVO
  DESCRIÇÃO: Nota-se em segmento correspondente a duodeno/jejuno, presença de uma
  IMPRESSÃO: Presença de corpo estranho em segmento de duodeno/jejuno acompanhado de processo obstrutivo.
• INTUSSESCEPÇÃO
  DESCRIÇÃO: Segmento de duodeno /jejuno apresentando processo obstrutivo com
  IMPRESSÃO: Imagem em segmento de duodeno/jejuno compatível com intussuscepção acompanhado neoplasia/ corpo estranho.

## RINS
• NEFROPATIA AGUDA
  DESCRIÇÃO: Rins de formato mantido, contonros regulares e localizados em topografia habitual, apresentando aumento de ecogenicidade, dimensões aumentadas e simétricas, onde o rim esquerdo mede 0,00cm e o direito 0,00 cm de comprimento em plano dorsal. Não há evidências sonográficas de litíases.
  IMPRESSÃO: Tais alterações renais podem indicar nefropatia aguda.
  RECOMENDAÇÃO: Sugiro correlação com achados clínicos e laboratoriais para apoio diagnóstico.
• NEFROPATIA CRÔNICA I
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas, onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos com aumento da ecogenicidade em região cortical. Não há evidências sonográficas de litíases.
  IMPRESSÃO: Rins apresentando alterações sugestivas de nefropatia.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e laboratoriais bem como exame de urinálise para apoio diagnóstico
• NEFROPATIA CRÔNICA II
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos com aumento da ecogenicidade e perda da definição corticomedular. Não há evidências sonográficas de litíases.
  IMPRESSÃO: Rins apresentando alterações sugestivas de nefropatia.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e laboratoriais bem como exame de urinálise para apoio diagnóstico
• NEFROPATIA CRÔNICA III
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos de contornos irregulares, com aumento da ecogenicidade e perda da definição corticomedular e mineralizações dos recessos pélvicos. Não há evidências sonográficas de litíases.
  IMPRESSÃO: Rins apresentando alterações sugestivas de nefropatia crônica.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e laboratoriais bem como exame de urinálise para apoio diagnóstico
• NEFROPATIA CRÔNICA IV
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos de contornos irregulares, com aumento da ecogenicidade, perda da definição corticomedular e mineralizações dos recessos pélvicos, acompanhada de presença de inúmeras e diminutas estruturas anecogênicas de contornos regulares e bem definidos em permeio. Não há evidências sonográficas de litíases.
  IMPRESSÃO: Rins apresentando alterações sugestivas de nefropatia crônica.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e laboratoriais bem como exame de urinálise para apoio diagnóstico
• NEFROPATIA CRÔNICA V
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos de contornos irregulares, com aumento da ecogenicidade, perda da definição corticomedular e mineralizações dos recessos pélvicos, acompanhada de presença de inúmeras e diminutas estruturas anecogênicas de contornos regulares e bem definidos em permeio. Pelve de rim esquerdo medindo 0,00cm e direito mede 0,00cm (dilatadas). Não há evidências sonográficas de litíases.
  IMPRESSÃO: Rins apresentando alterações sugestivas de nefropatia crônica.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e laboratoriais bem como exame de urinálise para apoio diagnóstico
• SÍNDROME DO RIM GRANDE RIM PEQUENO NOS FELINOS
  DESCRIÇÃO: Rim esquerdo / direito com perda do formato anatômico e contornos irregulares, localizado em topografia habitual, medindo aproximadamente 0,00cm de comprimento em plano dorsal (diminuído), apresentando perda da definição corticomedular e aumento de ecogenicidade. Pelve renal medindo 0,00cm (aumentada). Rim esquerdo / direito de formato mantido, contornos regulares e localizado em topografia habitual, medindo aproximadamente 0,00cm de comprimento em plano dorsal (normal/aumentado), arquitetura preservada / apresentando perda da definição corticomedular e aumento de ecogenicidade em região cortical.
  IMPRESSÃO: Presença de doença renal crônica importante, devido à atrofia em rim esquerdo / direito com hiperplasia contralateral compensatória.
  RECOMENDAÇÃO: É recomendada a correlação com achados clínicos e laboratoriais bem como exame de urinálise para apoio diagnóstico
• SINAL DA MEDULAR
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas, onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal (normal aumentado / diminuído). Ambos apresentando um halo fino, bem definido e hiperecogênico na região corticomedular. Não há evidências sonográficas de litíases.
  IMPRESSÃO: O sinal da medular é uma alteração renal pouco específica.
  RECOMENDAÇÃO: Sugiro pesquisa de nefropatias, bem como realização de urinálise para apoio diagnóstico.
• SINAL DA BANDA
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas, onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal (normal aumentado / diminuído). Ambos apresentando um halo espesso, pouco definido e hiperecogênico na região corticomedular. Não há evidências sonográficas de litíases.
  IMPRESSÃO: Alteração renal pouco específica, podendo indicar presença de nefropatia.
  RECOMENDAÇÃO: Sugiro pesquisa de nefropatias, bem como realização de urinálise para apoio diagnóstico.
• DISPLASIA RENAL
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal (normal / diminuído). Ambos de contornos irregulares, com aumento da ecogenicidade, perda da definição corticomedular, mineralizações dos recessos pélvicos. Pelve de rim esquerdo medindo 0,00cm e direito mede 0,00cm (dilatada). Não há evidências sonográficas de litíase.
  IMPRESSÃO: Alterações renais severas, indicando doença renal crônica, podendo estar relacionado com displasia renal.
• PERITONITE INFECCIOSA FELINA
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal (aumentados). Ambos de contornos irregulares, presença de fluido subcapsular, com aumento da ecogenicidade e perda da definição corticomedular/ presença de halo hiperecogênico em região corticomedular, acompanhada de pielectasia (pelve renal esquerda mede 0,00cm e direita mede 0,00cm).
  IMPRESSÃO: Alterações renais severas, podendo estar relacionada com processo infeccioso viral, com diagnóstico diferencial para neoplasia infiltrativa.
• LINFOMA RENAL
  DESCRIÇÃO: Rins com perda do formato anatômico e localizados em topografia habitual, de dimensões simétricas onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal (normal / aumentados). Ambos de contornos irregulares, hiperecogênicos, apresentando dilatação dos recessos pélvicos, e apresentando discreta / leve /marcada quantidade de fluido subcapsular.
  IMPRESSÃO: Alterações renais severas, indicando doença renal crônica, com diagnóstico diferencial para neoplasia e peritonite infecciosa felina (gatos).
• CISTO ÚNICO
  DESCRIÇÃO: Rim esquerdo / direito de formato mantido e localizado em topografia habitual, medindo aproximadamente 0,00cm de comprimento em plano dorsal, apresentando uma
  IMPRESSÃO: Rim direito /esquerdo apresentando alteração focal compatível com cisto simples.
  RECOMENDAÇÃO: Caso o clínico considere necessário, sugiro exame de citologia guiada para punção do conteúdo.
• MÚLTIPLOS CÍSTOS
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas, onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos com perda da definição corticomedular, apresentando inúmeras imagens de contornos bem definidos e regulares, paredes finas e ecogênicas, conteúdo anecogênico medindo a maior 0,00 x 0,00cm distribuídas por todo parênquima renal. Não há evidências sonográficas de litíase.
  IMPRESSÃO: Rins apresentando alterações multifocais compatíveis com cistos.
• DOENÇA POLICÍSTICA AUTOSSÔMICA DOMINANTE
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas, onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos com perda da definição corticomedular, apresentando inúmeras imagens de contornos bem definidos e regulares, paredes finas e ecogênicas, conteúdo anecogênico medindo a maior 0,00 x 0,00cm distribuídas por todo parênquima renal. Não há evidências sonográficas de litíase.
  IMPRESSÃO: Rim direito /esquerdo apresentando alteração multifocal compatível com cistos podendo estar relacionada com doença policística autossômica dominante.
• PSEUDOCISTO PERINÉFRICO
  DESCRIÇÃO: Rim direito localizado em topografia habitual, medindo aproximadamente 0,00cm de comprimento em plano dorsal (diminuído), com contornos irregulares, marcada perda da definição corticomedular, hiperecogênico, circundado por severa quantidade conteúdo anecogênico, que está envolto por cápsula renal, fina e ecogênica.
  IMPRESSÃO: Rim direito /esquerdo apresentando alteração que indica pseudocisto perinéfrico.
• INFARTO RENAL
  DESCRIÇÃO: Rim direito / esquerdo de contornos irregulares, localizado em topografia habitual, medindo 0,00cm de comprimento em plano dorsal, apresentando uma área hipercogênica, de formato triangular localizado em região cortical no polo cranial / caudal, acompanhada de retração da capsula renal.
  IMPRESSÃO: As alterações visualizadas em rim esquerdo / direito são compatíveis com infarto renal.
• ABSCESSO RENAL
  DESCRIÇÃO: Rim esquerdo / direito localizado em topografia habitual, contornos irregulares e medindo aproximadamente 0,00cm de comprimento em plano dorsal, com perda da definição corticomedular e aumento da ecogenicidade, discreta dilatação de pelve renal, apresentando uma
  IMPRESSÃO: Rim direito / esquerdo apresentando alteração focal que pode indicar presença abscesso renal, com diagnóstico diferencial para grande cisto.
  RECOMENDAÇÃO: É recomendada a correlação com demais exames laboratoriais, bem como o acompanhamento ultrassonográfico da lesão para maiores esclarecimentos.
• NEFROCALCINOSE
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas, onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos apresentando aumento da ecogenicidade e perda da definição corticomedular, e com presença de múltiplos e diminutos pontos hiperecóicos espalhados de forma difusa pela córtex / medular renal, formadores de leve sombra acústica.
  IMPRESSÃO: Rins apresentando alterações que indicam nefrocalcinose / mineralização renal, podendo estar relacionado com endocrinopatias.
  RECOMENDAÇÃO: É recomendada a correlação com demais exames laboratoriais para apoio diagnóstico.
• DIOCTOPHYMA RENALE
  DESCRIÇÃO: Em topografia de rim direito/esquerdo foi visualizada uma estrutura contendo uma cápsula fina e regular, apresentando em seu interior conteúdo anegênico acompanhada de diversas estruturas móveis de multicamadas tubulares e cilíndricas. Tal estrutura mede 0,00 x 0,00cm de diâmetro.
  IMPRESSÃO: Quanto à
• NEOPLASIA FOCAL
  DESCRIÇÃO: Rim esquerdo / direito com perda do formato anatômico, localizado em topografia habitual, medindo aproximadamente 0,00cm de comprimento em plano dorsal, apresentando uma
  IMPRESSÃO: Rim direito / esquerdo apresentando alteração focal pouco específica, podendo se tratar de cisto, com diagnóstico diferencial para neoplasia e abscesso renal.
  RECOMENDAÇÃO: Sugiro correlação com achados clínicos-laboratoriais, além de exame de tomografia computadorizada para apoio diagnóstico.

## SISTEMA COLETOR
• PIELECTASIA
  DESCRIÇÃO: Pelve renal dilatada no corte sagital e transversal, apresentando conteúdo anecogênico, medindo aproximadamente 0,0cm.
  IMPRESSÃO: A pielectasia é uma dilatação da pelve renal não obstrutiva, podendo estar relacionada com diuréticos, fluidoterapia, pielonefrite.
  RECOMENDAÇÃO: É recomendada a correlação com histórico e quadro clínico do animal, e caso o clínico considere necessário, sugiro acompanhamento ultrassonográfico para apoio diagnóstico.
• LITÍASE
  DESCRIÇÃO: Rim direito / esquerdo com formato anatômico preservado e localizado em topografia habitual, medindo 0,00cm de comprimento em plano dorsal, apresentando em pelve renal uma
  IMPRESSÃO: As alterações visualizadas em pelve renal esquerda / direita são compatíveis com litíase, sem evidências de processo obstrutivo total.
  RECOMENDAÇÃO: É recomendada a correlação com estudo radiográfico abdominal, e acompanhamento ultrassonográfico para apoio diagnóstico.
• HIDRONEFROSE UNILATERAL
  DESCRIÇÃO: Rim esquerdo / direito localizado em topografia habitual, contornos irregulares e perda de seu formato anatômico, medindo aproximadamente 0,00cm de comprimento em plano dorsal (preservado/aumentado), com severa dilatação da pelve renal, que mede 0,00cm, preenchida por conteúdo anecogênico (com aproximadamente 0,00ml), havendo perda da relação corticomedular pela ausência da camada medular. Ureter proximal dilatado, medindo 0,00cm.
  IMPRESSÃO: Rim esquerdo / direito com alterações compatíveis com leve / moderada hidronefrose.
• HIDRONEFROSE BILATERAL
  DESCRIÇÃO: Rins de formato mantido e localizados em topografia habitual, de dimensões simétricas, onde rim esquerdo mede 0,00cm e rim direito mede 0,00 cm de comprimento em plano dorsal. Ambos com alteração da definição corticomedular por marcada dilatação da pelve renal, que mede 0,00cm com aproximadamente 0,00ml no rim esquerdo e 0,00cm no rim direito com 0,00ml.
  IMPRESSÃO: Rins com alterações compatíveis com severa hidronefrose com marcada perda do parênquima renal.
• PIELONEFRITE
  DESCRIÇÃO: Rim esquerdo / direito de formato mantido e localizado em topografia habitual, aumentada de tamanho, medindo 0,00 cm de comprimento em plano dorsal. Nota-se ainda aumento da ecogenicidade em região cortical, perda da definição corticomedular e dilatação da pelve, onde mede 0,00cm, com presença de conteúdo anecogênico com pontos ecogênicos em suspensão / ecogênico. Nota-se ainda discreta presença de líquido em região retroperitoneal.
  IMPRESSÃO: Rim direito / esquerdo apresentando alteração que pode indicar presença de nefropatia, podendo se tratar de pielonefrite.

## URETERES
• ÚNICO CÁLCULO
  DESCRIÇÃO: Nota-se em porção proximal / medial /distal de ureter esquerdo / direito presença de uma
  IMPRESSÃO: Ureter esquerdo / direito apresentando de litíase acompanhada de processo obstrutivo.
• MÚLTIPLOS CÁLCULOS
  DESCRIÇÃO: Ureter esquerdo / direito com presença de duas/três... imagens de padrão mineral, formadoras de sombra acústica posterior, medindo a maior aproximadamente 0,00cm localizada na porção proximal/medial/distal, e a menor medindo 0,00cm localizada em porção proximal/medial/distal, causando a uma dilatação do ureter, que mede 0,00cm de diâmetro.
  IMPRESSÃO: Ureter esquerdo / direito apresentando de litíases acompanhada de processo obstrutivo.
• URETER ECTÓPICO
  DESCRIÇÃO: Ureter esquerdo /direito apresentando severa dilatação, medindo 0,00cm, de trajeto tortuoso, apresentando peristalse, desembocando caudalmente à região do trígono vesical / em uretra proximal.
  IMPRESSÃO: Ureter esquerdo / direito apresentando características de ureter ectópico.
  RECOMENDAÇÃO: Sugiro correlação com demais exames de
• URETEROCELE
  DESCRIÇÃO: Na região do trígono, se projetando para o interior da vesícula urinária, nota-se uma estrutura cística de paredes finas e regulares, medindo 0,00cm.
  IMPRESSÃO: Tal alteração visualizada em vesícula urinária indica ureterocele.

## BEXIGA
• DIVERTICULO URACAL
  DESCRIÇÃO: Bexiga em topografia habitual, paredes regulares medindo 0,00cm, apresentando em face cranioventral uma estrutura cística, que se estende para fora da parede vesical, medindo 0,00 x 0,00cm.
  IMPRESSÃO: Bexiga apresentando alteração compatível com divertículo uracal.
  RECOMENDAÇÃO: É recomendado o acompanhamento clínico e ultrassonográfico a fim de monitorar a lesão.
• ESPESSAMENTO DIFUSO
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes difusamente espessadas e ecogênicas medindo 0,0cm de espessura, margens internas lisas / irregulares e conteúdo anecogênico.
  IMPRESSÃO: Bexiga apresentando alteração que indica presença de processo inflamatório crônico (cistite).
  RECOMENDAÇÃO: Sugiro correlação com exame EAS para apoio diagnóstico.
• ESPESSAMENTO NO ÁPICE
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes espessadas, sobretudo em região do ápice, hipoecogênicas medindo 0,0cm de espessura, margens internas irregulares e conteúdo anecogênico apresentando discreta/ moderada /severa quantidade de pontos ecogênicos em suspensão sem reverberação / com reverberação / depositados no fundo sem sombra acústica / com sombra acústica.
  IMPRESSÃO: Bexiga apresentando discreta alteração compatível com processo inflamatório crônico, acompanhada de debris celulares, comumente encontrados em cistites crônicas, hematúria e/ou piúria.
  RECOMENDAÇÃO: Sugiro correlação com exame EAS para apoio diagnóstico.
• ESPESSAMENTO NO COLO
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes normoespessas/predominantemente espessadas de forma difusa, porém apresentando em região do trígono / caudal ao trígono / do colo, um marcado espessamento com perda da estratificação das camadas, medindo 0,00 x 0,00cm. Conteúdo anecogênico apresentando discretas partículas ecogênicas em suspensão sem / com reverberação.
  IMPRESSÃO: Bexiga apresentando alterações que podem estar relacionadas com processo inflamatório focal severo, com diagnóstico diferencial para neoplasia.
  RECOMENDAÇÃO: Sugiro exame de urinálise via sonda, e ainda exame cito/histopatológico para maiores conclusões.
• CISTITE ENFISEMATOSA
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes espessadas e ecogênicas medindo 0,0cm de espessura, margens internas irregulares e conteúdo predominantemente anecogênico com presença de inúmeros pontos ecogênicos em suspensão formadores de artefato de reverberação intramural / intraluminal.
  IMPRESSÃO: As alterações visualizadas em bexiga são sugestivas de cistite enfisematosa.
• CISTITE POLIPOIDE
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes predominantemente normoespessas e ecogênicas medindo 0,00cm, margens internas lisas/irregulares, apresentando uma formação peduncular e solitária em face ventral da parede, medindo 0,00 x 0,00cm. Conteúdo anecogênico e homogêneo normal.
  IMPRESSÃO: Bexiga apresentando alterações que podem indicar presença de cistite polipoide.
  RECOMENDAÇÃO: Sugiro exame de urinálise, bem como realização de videocistoscopia para apoio diagnóstico.
• CISTITE PSEUDOMEMBRANOSA
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes espessadas medindo 0,00cm, apresentando aspecto de multicamadas se projetando para o lúmen. Conteúdo anecogênico apresentando severa quantidade de pontos ecogênicas em suspensão com reverberação e
  IMPRESSÃO: Bexiga apresentando imagens que podem indicar presença de cistite pseudomembranosa .
  RECOMENDAÇÃO: Sugiro exame de controle para acompanhamento da lesão.
• NEOPLASIA
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes predominantemente finas / espessadas, apresentando em região do trígono / caudal ao trígono / do ápice vesical, uma formação irregular que se projeta para o lúmen, de base larga, heterogênea, de contornos irregulares, medindo 0,00 x 0,00cm. Conteúdo anecogênico apresentando discretas partículas ecogênicas em suspensão sem / com reverberação.
  IMPRESSÃO: Bexiga apresentando alterações que podem estar relacionadas com processo neoplásico.
  RECOMENDAÇÃO: Sugiro exame de urinálise via sonda, e ainda exame cito/histopatológico para maiores conclusões.
• PONTOS ECOGÊNICOS EM SUSPENSÃO
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes finas e ecogênicas medindo 0,0cm de espessura, margens internas lisas/irregulares e conteúdo anecogênico apresentando discretos 1)pontos ecogênicas em suspensão sem reverberação 2)pontos ecogênicas em suspensão com reverberação
  IMPRESSÃO: Bexiga apresentando discreta alteração compatível com debris celulares, podendo estar associado com cistites agudas ou crônicas, hematúria e/ou piúria.
  RECOMENDAÇÃO: Sugiro correlação com exame EAS para apoio diagnóstico.
• PONTOS ECOGÊNICOS DEPOSITADOS AO FUNDO
  DESCRIÇÃO: Bexiga de repleção líquida adequada/inadequeda, formato habitual, paredes finas e ecogênicas medindo 0,0cm de espessura, margens internas lisas/irregulares e conteúdo anecogênico apresentando discretos 1)pontos ecogênicos depositados no fundo sem sombra acústica posterior. 2)pontos ecogênicos depositados no fundo com sombra acústica posterior.
  IMPRESSÃO: Bexiga apresentando discreta alteração compatível com debris celulares, podendo estar associado com cistites agudas ou crônicas, hematúria e/ou piúria.
  RECOMENDAÇÃO: Sugiro correlação com exame EAS para apoio diagnóstico.
• ÚNICO CÁLCULO
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes finas e ecogênicas medindo 0,0cm de espessura, margens internas lisas e conteúdo anecogênico apresentando discretas partículas ecogênicas em suspensão acompanhada de uma
  IMPRESSÃO: Bexiga apresentando alteração compatível com litíase acompanhada de debris celulares.
  RECOMENDAÇÃO: Sugiro correlação com exame EAS para apoio diagnóstico.
• MÚLTIPLOS CÁLCULOS
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes finas e ecogênicas medindo 0,0cm de espessura, margens internas irregulares e conteúdo anecogênico apresentando discretas partículas ecogênicas em suspensão acompanhada de inúmeras imagens móveis, hiperecogênicas e formadoras de sombra acústica medindo a maior 0,00cm e a menor 0,00cm.
  IMPRESSÃO: Bexiga apresentando alteração compatível com litíases acompanhada de debris celulares.
  RECOMENDAÇÃO: Sugiro correlação com exame EAS para apoio diagnóstico.
• COÁGULO
  DESCRIÇÃO: Bexiga de repleção líquida adequada, formato habitual, paredes finas e ecogênicas medindo 0,0cm de espessura, margens internas irregulares e conteúdo predominantemente anecogênico com presença de massa amorfa, ecodensa móvel / imóvel, hipoecogênica / hiperecogênica / mista, de contornos arredondados, medindo 0,00 x 0,00cm não formadora de sombra acústica.
  IMPRESSÃO: Quanto à
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico após protocolo terapêutico.
• OBSTRUÇÃO
  DESCRIÇÃO: Bexiga de repleção líquida demasiada, de formato arredondado, , paredes lisas, finas e ecogênicas não sendo possível fazer sua mensuração.
  IMPRESSÃO: Bexiga apresentando características de hiperdistensão, podendo estar relacionada à processo obstrutivo.
  RECOMENDAÇÃO: Sugiro novo exame de controle após procedimento de alívio, e estudo radiográfico da região pélvica para apoio diagnóstico.
• RUPTURA DE PAREDE
  DESCRIÇÃO: Bexiga de repleção líquida inadequada, com paredes espessas e ecogênicas, com evidente presença de líquido livre adjacente. Animal submetido à técnica de flushing onde notou-se extravazamento da solução para o interior da cavidade abdominal.
  IMPRESSÃO: Quanto à informações colhidas acerca da bexiga, podemos sugerir presença de ruptura de parede.
  RECOMENDAÇÃO: Sugiro acompanhamento ultrassonográfico após protocolo terapêutico.

## URETRA
• URETRITE
  DESCRIÇÃO: Uretra em sua porção proximal /prostática apresentando marcada espessamento de parede, e importante distensão, medindo 0,00cm.
  IMPRESSÃO: Uretra apresentando alteração que pode sugerir presença de processo inflamatório (uretrite).
• ÚNICO CÁLCULO
  DESCRIÇÃO: Uretra em sua porção proximal /prostática / peniana apresentando uma
  IMPRESSÃO: As alterações visualizadas em uretra indicam presença de litíase.
• MÚLTIPLOS CÁLCULOS
  DESCRIÇÃO: Uretra em sua porção proximal /prostática / peniana apresentando imagens de superfície refletora, formadoras de sombra acústica, medindo a maior aproximadamente 0,00cm, e a menor 0,00cm, acompanhada de marcada dilatação ureteral anterior.
  IMPRESSÃO: As alterações visualizadas em uretra indicam presença de litíases.
• NEOPLASIA
  DESCRIÇÃO: Uretra em sua porção proximal /prostática apresentando uma área de espessamento focal, ecogênica onde foram observadas pequenas áreas hiperecogênicas formadoras de sombra acústica, medindo aproximadamente 0,00cm, com diminuição do lúmen uretral.
  IMPRESSÃO: As alterações visualizadas em uretra são sugestivas de presença de processo inflamatório intenso com diagnóstico diferencial para neoplasia.
  RECOMENDAÇÃO: Caso o clínico considere necessário, sugiro correlação com exame cito/histopatológico por biópsia por escarificação para apoio diagnóstico.

## ÚTERO
• HIPERPLASIA ENDOMETRIAL CÍSTICA I
  DESCRIÇÃO: Imagem de útero em sua porção de corno direito aumentado de tamanho, medindo 0,00 cm de diâmetro, e em corno esquerdo medindo 0,0cm, com paredes espessadas apresentando inúmeros cistos se projetando para seu lúmen.
  IMPRESSÃO: Alterações uterinas indicam presença de hiperplasia endometrial cística.
  RECOMENDAÇÃO: Sugiro correlacionar com histórico e sinais clínicos para maiores esclarecimentos.
• HIPERPLASIA ENDOMETRIAL CÍSTICA II
  DESCRIÇÃO: Imagem de útero em sua porção de corno esquerdo (0,00cm) e corno direito (0,00cm) aumentados de diâmetro, com paredes espessadas apresentando inúmeras estruturas císticas se projetando para seu lúmen, e acentuada presença de conteúdo anecogênico com pontos ecogênicos em suspensão / ecogênico. Nota-se ainda presença de aumento de ecogenicidade em mesentério adjacente aos cornos.
  IMPRESSÃO: Alterações uterinas indicam presença de hiperplasia endometrial cística acompanhada de hemometra/piometra.
  RECOMENDAÇÃO: Sugiro correlacionar com histórico e sinais clínicos para maiores esclarecimentos.
• MUCOMETRA / HIDROMETRA
  DESCRIÇÃO: Imagem de útero em sua porção de corno esquerdo (0,00cm) e corno direito (0,00cm) aumentados de diâmetro, com paredes finas/espessadas apresentando conteúdo anecogênico.
  IMPRESSÃO: Alterações uterinas indicam presença de hidro/mucometra.
  RECOMENDAÇÃO: Sugiro correlacionar com histórico e sinais clínicos para maiores esclarecimentos.
• NEOPLASIA
  DESCRIÇÃO: Em região de corpo /corno esquerdo / direito nota-se uma massa de padrão sólido e heterogênea, hipoecogênica, de contornos definidos e irregulares, medindo aproximadamente 0,00 x 0,00 x 0,00cm.
  IMPRESSÃO: Corpo uterino /Corno esquerdo / direito apresentando
  RECOMENDAÇÃO: Sugiro correlacionar com histórico e sinais clínicos para maiores esclarecimentos.
• GRANULOMA DE COTO
  DESCRIÇÃO: Em topografia de coto uterino, ventral ao cólon e dorsal à bexiga, nota-se
  IMPRESSÃO: Tal
• PIOMETRA DE COTO I
  DESCRIÇÃO: Em topografia de coto uterino, ventral ao cólon descendente e dorsal a bexiga, nota-se uma
  IMPRESSÃO: Tal

## ANOMALIAS GESTACIONAIS
• HIDROCEFALIA
  DESCRIÇÃO: Feto x apresentando acúmulo de conteúdo anecogênico nos ventrículos cerebrais, acompanhado de perda da massa cerebral.
  IMPRESSÃO: As alterações visualizadas em feto x indicam presença de hidrocefalia.
• HIDROPSIA OU ANASARCA FETAL
  DESCRIÇÃO: Feto X apresentando moderada quantidade de líquido livre em cavidade pleural/ cavidade peritoneal / pericárdica, e ainda presença de uma camada anecóica entre a pele e os tecidos adjacente, caracterizando edema de subcutâneo.
  IMPRESSÃO: As alterações visualizadas em feto X são compatíveis com hidropsia/anasarca fetal.
• ONFALOCELE E GASTROQUISE
  DESCRIÇÃO: Em feto X nota-se falha ou perda da continuidade da parede abdominal fetal com consequente protusão de alças intestinais.
  IMPRESSÃO: As alterações visualizadas em feto x indicam presença de defeito congênito na parede abdominal feta (onfalocele/gastroquise).
• MORTE EMBRIONÁRIA
  DESCRIÇÃO: Vesícula gestacional apresentando conteúdo hipoecóico com pontos ecogênicos em suspensão, perda do margeamento embrionário e ausência dos batimentos cardíacos.
  IMPRESSÃO: Presença de vesícula gestacional em fase de absorção embrionário caracterizando morte do embrião.
• FETO MACERADO
  DESCRIÇÃO: Feto x com ausência de movimento fetal e batimentos cardíacos, acompanhada de estruturas fetais dispersas envolto por presença de conteúdo ecogênico e hiperecogênica e parede interna do útero hiperecóica e irregular.
  IMPRESSÃO: Tais alterações visualizadas em útero são compatíveis com fragmentos ósseos e fetais, caracterizando maceração fetal.
• FETO MUMIFICADO
  DESCRIÇÃO: Feto x com ausência de movimento fetal e batimentos cardíacos, com corpo preservado e curvado, com parede interna do útero hiperecóica e irregular, acompanhado de conteúdo ecogênico ao redor do feto.
  IMPRESSÃO: Quanto às alterações visualizadas em útero, indicam presença de feto mumificado.
  RECOMENDAÇÃO: É recomendada a correlação com exame radiográfico para apoio diagnóstico.
• FETO ENFISEMATOSO
  DESCRIÇÃO: Feto x com ausência de movimento fetal e batimentos cardíacos, parede uterina espessada, apresentando artefato de reverberação no interior do útero e do feto.
  IMPRESSÃO: Presença de feto enfisematoso
  RECOMENDAÇÃO: É recomendada a correlação com exame radiográfico para apoio diagnóstico.

## ÚTERO PÓS PARTO
• METRITE
  DESCRIÇÃO: Útero com paredes espessadas e irregulares, apresentando aumento de ecogenicidade em camada de endométrio, conferindo aspecto de pregueamento, acompanhada de conteúdo hipo/anecogênico com pontos ecogênicos em suspensão.
  IMPRESSÃO: Alterações uterinas são sugestivas de metrite, com diagnóstico diferencial para involução uterina.
  RECOMENDAÇÃO: É recomendada reavaliação ultrassonográfica em X dias.
• RETENÇÃO DE PLACENTA
  DESCRIÇÃO: Útero apresentando aumento de ecogenicidade em camada de endométrio, paredes espessadas e irregulares, acompanhado de conteúdo com vários pontos hiperecóicos fazendo discreto sombreamento acústico.
  IMPRESSÃO: Alterações uterinas são sugestivas de retenção de placenta, com diagnóstico diferencial para involução uterina.
  RECOMENDAÇÃO: É recomendada reavaliação ultrassonográfica em X dias.

## OVÁRIOS
• CISTOS I
  DESCRIÇÃO: Ovário esquerdo / direito medindo 0,00 x 0,00cm, em topografia habitual, hipoecogênico, apresentando em seu parênquima uma
  IMPRESSÃO: Ovário esquerdo/direito apresentando alteração que indica presença de cisto.
• CISTOS II
  DESCRIÇÃO: Ovário esquerdo, medindo 0,00cm e direito medindo 0,00cm, ambos em topografia habitual, hipoecogênicos. de contornos irregulares, apresentando em seu parênquima imagens arredondadas, de contornos bem definidos e regulares, conteúdo anecogênico, formadora de reforço acústico posterior, medindo a maior 0,00cm em ovário esquerdo e 0,00cm em ovário direito.
  IMPRESSÃO: Ovário esquerdo/direito apresentando imagens compatíveis com cistos.
• NEOPLASIA
  DESCRIÇÃO: Em topografia de ovário esquerdo / direito, caudalmente à rim esquerdo / direito nota-se uma formação de aparência sólida, hipoecogênica e heterogênea, medindo aproximadamente 0,00 x 0,00 x 0,00cm (comprimento x altura x largura).
  IMPRESSÃO: Alterações visualizadas em ovários são sugestivas de neoplasia ovariana.
• OVÁRIO REMANESCENTE
  DESCRIÇÃO: Em topografia de ovário esquerdo / direito, nota-se presença de uma
  IMPRESSÃO: Topografia de ovário esquerdo / direito apresentando imagens que indicam presença de ovário remanescente.
• GRANULOMA
  DESCRIÇÃO: Em topografia de ovário esquerdo / direito nota-se
  IMPRESSÃO: Tal

## PRÓSTATA
• HIPERPLASIA PROSTÁTICA BENIGNA
  DESCRIÇÃO: Próstata em topografia habitual, de contornos regulares, hiperecogênica, homogênea, apresentando aumento de suas dimensões, medindo 0,00 x 0,00 x 0,00cm (comprimento x altura x largura).
  IMPRESSÃO: Próstata apresentando alterações compatíveis com hiperplasia prostática benigna.
• HIPERPLASIA PROSTÁTICA CÍSTICA
  DESCRIÇÃO: Próstata em topografia habitual, aumentada de tamanho medindo 0,00 x 0,00 x 0,00cm (comprimento x altura x largura), de contornos irregulares, hiperecóica, com múltiplas imagens arredondadas variando de hipoecóicas a anecóicas, espalhadas de forma difusa, medindo aproximadamente 0,00cm.
  IMPRESSÃO: Próstata apresentando alterações compatíveis com hiperplasia prostática cística.
• CISTO ÚNICO
  DESCRIÇÃO: Próstata em topografia habitual, medindo 0,00 x 0,00 x 0,00cm (normal), de contornos regulares, hiperecóica, apresentando uma
  IMPRESSÃO: Próstata apresentando alterações compatíveis com cisto.
• CISTO PARAPROSTÁTICO
  DESCRIÇÃO: Cranial/Adjacente à próstata, foi visualizada uma estrutura cística de contornos definidos e regulares, conteúdo anecogênico, medindo 0,00 x 0,00cm. Próstata aumentada de tamanho, hiperecogênica, heterogênea, medindo aproximadamente 0,00 x 0,00 x 0,00cm.
  IMPRESSÃO: Imagem cística adjacente à próstata pode indicar presença de cisto paraprostático.
• ABSCESSO PROSTÁTICO
  DESCRIÇÃO: Próstata em topografia habitual, aumentada de tamanho medindo 0,00 x 0,00 x 0,00cm (comprimento x altura x largura), de contornos irregulares, hiperecóica, apresentando uma área de contornos irregulares, heterogêneo, que varia de hipoanecogênico à sedimentos suspensos, que mede 0,00 x 0,00cm.
  IMPRESSÃO: Próstata apresentando alteração que pode indicar de abscesso prostático.
  RECOMENDAÇÃO: Sugiro correlação com achados clínicos e laboratoriais para melhores conclusões.
• PROSTATITE
  DESCRIÇÃO: Próstata em topografia habitual, aumentada de tamanho medindo 0,00 x 0,00 x 0,00cm (comprimento x altura x largura), de contornos irregulares, heterogênea e hipoecóica.
  IMPRESSÃO: Próstata apresentando alteração sugestiva de processo inflamatório (prostatite).
  RECOMENDAÇÃO: Sugiro correlação com achados clínicos e laboratoriais para melhores conclusões.
• NEOPLASIA
  DESCRIÇÃO: Próstata em topografia habitual, aumentada de tamanho medindo 0,00 x 0,00 x 0,00cm (comprimento x altura x largura), de contornos irregulares, heterogênea, de ecogenicidade mista, apresentando áreas de mineralização causando sombreamento acústico.
  IMPRESSÃO: Próstata apresentando alterações que indicam presença de processo neoplásico.
  RECOMENDAÇÃO: É recomendada a realização de exame de citologia para apoio diagnóstico.

## TESTÍCULOS
• ATROFIA TESTICULAR I
  DESCRIÇÃO: Testículos em topografia habitual, dimensões assimétricas, medindo o esquerdo 0,00 cm (normal) e o direito 0,00cm (diminuído), esse com contornos irregulares, com parênquima hipoecogênico e de ecotextura grosseira.
  IMPRESSÃO: Testículo direito/esquerdo apresentando alterações que indicam atrofia testicular.
• ATROFIA TESTICULAR II
  DESCRIÇÃO: Testículos em topografia habitual, dimensões assimétricas, medindo o esquerdo 0,00 cm (normal) e o direito 0,00cm (diminuído), esse com contornos irregulares, apresentando ecotextura grosseira e ecogenicidade mista, havendo perda do mediastino do testicular.
  IMPRESSÃO: Testículo direito/esquerdo apresentando alterações que indicam atrofia testicular.
• CRIPTORQUIDISMO
  DESCRIÇÃO: Presença de testículo localizado em cavidade abdominal / inguinal (localizar o testículo no laudo), medindo aproximadamente 0,00 x 0,00cm (normal/ diminuído), hipoecogênico / hipercogênico, homogêneo / heterogêneo, com presença / ausência de linha central hiperecogênica (mediastino testicular). Testículo esquerdo/direito localizado em bolsa escrotal, de contornos regulares, medindo 0,0cm, com ecogenicidade, ecotextura e mediastino testicular preservados.
  IMPRESSÃO: Testículo esquerdo/direito ectópico localizado em região abdominal/inguinal.
• CISTO SIMPLES
  DESCRIÇÃO: Testículo esquerdo / direito localizado em bolsa escrotal, medindo aproximadamente 0,00 cm, hipoecogênico, mediastino testicular preservado, apresentando
  IMPRESSÃO: Testículo esquerdo/direito apresentando
• CISTO SEPTADO
  DESCRIÇÃO: Testículo esquerdo / direito localizado em bolsa escrotal, medindo aproximadamente 0,00 cm, hipoecogênico, mediastino testicular preservado, apresentando
  IMPRESSÃO: Testículo esquerdo/direito apresentando
• NÓDULO HIPERECÓICO
  DESCRIÇÃO: Testículo esquerdo / direito localizado em bolsa escrotal, medindo aproximadamente 0,00 cm, hipoecogênico, mediastino testicular preservado, apresentando
  IMPRESSÃO: Testículo esquerdo/direito apresentando
• ORQUITE E EPIDIDIMITE
  DESCRIÇÃO: Testículo esquerdo / direito localizado em bolsa escrotal, aumentado de tamanho, medindo aproximadamente 0,00 x 0,00 cm, hiperecogênico, com ecotextura heterogênea e perda da definição do mediastino testicular. Epidídimo com aumento de volume medindo 0,00cm, de ecogenicidade diminuída e ecotextura grosseira.
  IMPRESSÃO: Testículo e epidídimo esquerdo/direito com alterações indicando processo inflamatório agudo (orquite e epididimite).
• NEOPLASIA
  DESCRIÇÃO: Testículo esquerdo / direito localizado em bolsa escrotal, medindo aproximadamente 0,00 x 0,00 cm (normal/aumentado), com irregularidade do contorno, hipoecogênico, mediastino testicular obliterado, apresentando uma formação de contornos pouco definidos, de ecogenicidade mista apresentando inúmeras cavitações, medindo aproximadamente 0,00 x 0,00cm.
  IMPRESSÃO: Testículo esquerdo/direito com alteração podendo se tratar de neoplasia testicular.
  RECOMENDAÇÃO: É recomendada a realização do estudo histopatológico após cirurgia, a fim de estabelecer um protocolo de acompanhamento adequado.

## LINFONODOS
• CÍSTICO
  DESCRIÇÃO: Linfonodo ilíaco medial / hipogástrico, hepático, pancreatoduodenal, / gástrico, hipoecogênico, apresentando pequenas imagens arredondadas, de contornos definidos e regulares, de conteúdo anecogênico, medindo 0,00 x 0,00cm (altura x comprimento), onde a razão eixo curto x longo é de > 0,00.
  IMPRESSÃO: Presença de linfonodo reacional, podendo estar relacionado à presença de processo inflamatório focal.
• LINFONODO AUMENTADO
  DESCRIÇÃO: Linfonodo ilíaco medial / hipogástrico, hepático, pancreatoduodenal, / gástrico, normoecogênicos / hipoecogênicos, homogêneos / heterogêneos e de contornos irregulares medindo 0,00 x 0,00cm (altura x comprimento), onde a razão eixo curto x longo é de > 0,00.
  IMPRESSÃO: Presença de linfonodo reacional, podendo estar relacionado à presença de processo inflamatório focal.
• VÁRIOS LINFONODOS AUMENTADOS
  DESCRIÇÃO: Aumento generalizado de linfonodos do linfocentro celíaco (hepático, gástrico, pancreaticoduodenal e esplênicos) Aumento generalizado de linfonodos do linfocentro mesentérico cranial (mesentéricos, iliocólicos e cólico) Aumento generalizado de linfonodos do linfocentro lombar (renais e órticos lombares) Aumento generalizado de linfonodos do linfocentro iliosácro (íliacos e sacral) Aumento generalizado de linfonodos do linfocentro mesentérico caudal (mesentérico caudal)
  IMPRESSÃO: Presença de linfonodos reacionais, podendo estar relacionado à presença de processo inflamatório multifocal.
  RECOMENDAÇÃO: Caso o clínico considere necessário, sugiro correlação com exame cito/histopatológico e acompanhamento das alterações para apoio diagnóstico e
• COALESCÊNCIA DE LINFONODOS
  DESCRIÇÃO: Aumento generalizado de linfonodos do linfocentro celíaco, arredondados, hipoecogênicos, homogêneos e aglomerados, o maior medindo 0,00 x 0,00cm.
  IMPRESSÃO: Presença de coalescência de linfonodos indicando processo infeccioso severo, com diagnóstico diferencial para neoplasia infiltrativa.
  RECOMENDAÇÃO: Caso o clínico considere necessário, sugiro correlação com exame cito/histopatológico e acompanhamento das alterações para apoio diagnóstico e

## HÉRNIAS
• DESCONTINUIDADE DA PAREDE I
  DESCRIÇÃO: Em região inguinal esquerda / direita / de cicatriz umbilical, observa-se a descontinuidade da linha do peritôneo e da camada muscular medindo 0,00cm acompanhada de projeção de tecido adiposo para o interior do saco herniário, que mede 0,00cm
  IMPRESSÃO: Presença de hérnia inguinal / umbilical.
• DESCONTINUIDADE DA PAREDE II
  DESCRIÇÃO: Em região inguinal esquerda / direita / de cicatriz umbilical, observa-se a descontinuidade da linha do peritôneo e da camada muscular medindo 0,00cm acompanhada de projeção de segmentos intestinais do jejuno/cólon com perda dos momentos peristálticos para o interior do saco herniário acompanhado de conteúdo anecogênico (líquido) medindo num total de 0,00cm.
  IMPRESSÃO: Presença de hérnia inguinal / umbilical com provável encarceramentos de alças intestinais.
• HÉRNIA PERINEAL
  DESCRIÇÃO: Próstata localizada em região perineal, medindo 0,00 x 0,00 x 0,00cm (aumentada) de contornos irregulares, formato arredondado, de ecogenicidade mista, apresentando inúmeras áreas císticas, a maior medindo 1,03cm.
  IMPRESSÃO: Presença de hérnia perineal contendo próstata com caraterísticas ecográficas de hiperplasia prostática cística severa.

## MASSA EXPANSIVA
• FORMAÇÕES
  DESCRIÇÃO: Presença de massa expansiva em região mesogástrica, medindo 0,00 x 0,00 x0,00cm (comprimento x altura x largura) de formato predominantemente arredondada, e contornos irregulares, apresentando ecogenicidade mista e ecotextura heterogênea.
  IMPRESSÃO: Quanto à massa / formação visualizada em região epigástrico, mesogástrica, hipogástrico não foi possível definir sua origem.
  RECOMENDAÇÃO: É recomendada a correlação com exame de tomografia computadorizada/laparotomia exploratória para maiores esclarecimentos.
• FORMAÇÕES CAVITÁRIAS
  DESCRIÇÃO: Presença de massa expansiva em região mesogástrica, medindo 0,00 x 0,00 x0,00cm (comprimento x altura x largura) de formato predominantemente arredondada, e contornos irregulares, apresentando ecogenicidade mista e ecotextura heterogênea de padrão complexo, com áreas focais hipoecogênicas e anecogênicas (cavitações), entremeadas por outras áreas de maior ecogenicidade.
  IMPRESSÃO: Quanto à massa / formação visualizada em região epigástrico, mesogástrica, hipogástrico não foi possível definir sua origem.
  RECOMENDAÇÃO: É recomendada a correlação com exame de tomografia computadorizada/laparotomia exploratória para maiores esclarecimentos.
• NECROSE DE FORMAÇÕES
  DESCRIÇÃO: Presença de massa expansiva em região mesogástrica, medindo 0,00 x 0,00 x0,00cm (comprimento x altura x largura) de formato predominantemente arredondada, e contornos irregulares, apresentando ecogenicidade mista e ecotextura heterogênea de padrão complexo, com áreas focais hipoecogênicas e anecogênicas (cavitações), entremeadas por outras áreas de maior ecogenicidade.
  IMPRESSÃO: Quanto à massa / formação visualizada em região epigástrico, mesogástrica, hipogástrico não foi possível definir sua origem.
  RECOMENDAÇÃO: É recomendada a correlação com exame de tomografia computadorizada/laparotomia exploratória para maiores esclarecimentos.

## EFUSÃO PERITONEAL
• LÍQUIDO LIVRE I
  DESCRIÇÃO: Foi evidenciada a presença de leve / moderada quantidade de líquido livre abdominal anecogênico / com pontos e debris ecogênicos em suspensão.
  IMPRESSÃO: Efusão peritoneal presente. Os tipos de líquido peritoneal descritos na literatura são transudato simples, transudato modificado e exsudato. É recomendada a correlação clinico-laboratorial bem como coleta e analise do liquido abdominal para apoio diagnóstico.
• LÍQUIDO LIVRE II
  DESCRIÇÃO: Foi evidenciada a presença de acentuada quantidade de líquido livre abdominal anecogênico / com pontos e debris ecogênicos em suspensão, causando hiperecogenicidade nos órgãos, e deslocando todos esses dos seus sítios anatômicos convencionais.
  IMPRESSÃO: Efusão peritoneal presente. Os tipos de líquido peritoneal descritos na literatura são transudato simples, transudato modificado e exsudato. É recomendada a correlação clinico-laboratorial bem como coleta e analise do liquido abdominal para apoio diagnóstico.

## PERITONITE
• FOCAL OU GENERALIZADA
  DESCRIÇÃO: Em região de XXXX nota-se aumento de ecogenicidade de tecidos adjacentes, com presença de líquido livre ao redor e maior evidências de serosas.
  IMPRESSÃO: Alterações visualizadas em cavidade peritoneal são compatíveis com processo inflamatório/infeccioso focal / generalizado (peritonite).`;

// Frases salvadoras gerais (usadas como recomendação quando a condição não traz uma
// específica no mapa, ou como complemento).
const FRASES_SALVADORAS_GERAIS = `FRASES SALVADORAS GERAIS (use quando aplicável, além das RECOMENDAÇÕES do mapa):
- Alterações em órgãos com possível comprometimento funcional: "Sugiro correlação com achados clínicos e demais exames laboratoriais para maiores conclusões."
- Lesões pequenas ou formações médias a grandes: "É recomendado acompanhamento ultrassonográfico da lesão, bem como a associação com o exame de punção guiada por agulha fina."
- Formações grandes: "É indicada a correlação com exame de tomografia computadorizada/laparotomia exploratória para maiores esclarecimentos."
- Alterações em bexiga (exceto gás): "Caso o clínico considere necessário, sugiro cistocentese com cultura da urina para melhor elucidação do quadro."
- Alterações em vesícula biliar (exceto gás e mucocele): "Caso o clínico considere necessário, sugiro colecistocentese com cultura da bile para melhor elucidação das alterações supracitadas."`;

export function buildSingleCallPrompt(defaults: string, especie: string): string {
  return `Você é um médico veterinário especialista em ultrassonografia abdominal de pequenos animais (cães e gatos). Sua tarefa é montar o laudo SEGUINDO FIELMENTE o MAPA DE REFERÊNCIA abaixo — ele é a fonte da verdade para descrições, impressões e recomendações.

Retorne APENAS um objeto JSON válido, sem nenhum texto antes ou depois, sem markdown, sem blocos de código:
{ "sections": [{ "label": "NOME DA SEÇÃO", "content": "Texto descritivo." }], "conclusion": "...", "impression": ["..."], "recommendations": ["..."] }

Omita "impression" e "recommendations" quando o exame for inteiramente normal.

═══════════════════════════════════════════
PRINCÍPIO CENTRAL: o laudo é montado a partir de textos prontos. Você NÃO escreve descrições do zero. Cada órgão recebe OU o texto padrão (se normal) OU o texto do MAPA para a condição encontrada (se alterado). Nunca parafraseie nem invente estrutura.
═══════════════════════════════════════════

REGRAS — SEÇÕES (campo "sections", uma por órgão, na mesma ordem do TEXTO PADRÃO):

1. ÓRGÃO SEM ACHADO informado pelo veterinário → copie o TEXTO PADRÃO daquele órgão EXATAMENTE, palavra por palavra, sem nenhuma modificação e sem marcação de negrito.

1b. UMA MEDIDA ISOLADA NÃO É UM ACHADO ANORMAL. Se o veterinário informou apenas a(s) medida(s) de um órgão, sem descrevê-lo como alterado (ex.: "rim esquerdo medindo 2,96 cm"), esse órgão é NORMAL: use o TEXTO PADRÃO e apenas acrescente a medida informada, sem negrito e sem impressão/recomendação. Só trate um órgão como alterado quando o veterinário usar um termo de alteração (espessado, aumentado, diminuído, irregular, hipo/hiperecogênico, com formação/nódulo/cálculo/sedimento, perda de definição, etc.). Na dúvida, mantenha normal.

2. ÓRGÃO COM ACHADO informado → localize no MAPA DE REFERÊNCIA a condição que corresponde ao achado e use a DESCRIÇÃO daquela condição como conteúdo da seção. Ao reproduzi-la:
   a) Preencha os placeholders com os dados reais informados: as medidas ("0,00cm", "0,00 x 0,00cm", "0,00 x 0,00 x 0,00cm", "0,00ml") com as medidas do exame; "(região)", "polo cranial/caudal", "lobo direito/esquerdo" com a localização informada.
   b) Onde o mapa oferece opções separadas por "/" (ex.: "esquerdo / direito", "finas/espessadas", "hipoecogênica/hiperecogênica", "lobo direito/corpo/lobo esquerdo", "gasoso/anecóico/misto", "focal / generalizado"), escolha SEMPRE UMA única opção — a que corresponde ao achado. NUNCA deixe a lista com "/" no texto final; se o achado não permitir escolher, use a primeira opção.
   c) Se uma medida do placeholder NÃO foi informada, remova o trecho da medida ("medindo aproximadamente ...") — NUNCA invente um número. Não deixe "0,00" no texto final.
   d) Mantenha normais os atributos do órgão que o veterinário não caracterizou como alterados.

3. Cada achado vai na seção do SEU órgão. Nunca use a descrição de um órgão em outro.

4. Se um achado informado não corresponder a nenhuma condição do MAPA, descreva-o com a terminologia de semiologia (item 12), no mesmo estilo do mapa, sem inventar diagnósticos.

REGRAS — IMPRESSÃO DIAGNÓSTICA (campo "impression", uma frase por órgão alterado):

5. Para cada órgão alterado, use a IMPRESSÃO da condição correspondente do MAPA, reproduzida fielmente (um item do array por órgão/condição). NÃO force um template fixo — cada condição tem sua própria redação no mapa; respeite-a.

6. Não adicione gradações, graus ou numerais (I, II, grau III...) que não estejam na entrada do mapa correspondente ao achado.

REGRAS — RECOMENDAÇÕES (campo "recommendations"):

7. Para cada condição alterada que tenha RECOMENDAÇÃO no MAPA, inclua-a (um item por recomendação). Use também as FRASES SALVADORAS GERAIS quando pertinentes. Sem duplicar.

REGRAS — CONCLUSÃO (campo "conclusion"):

8. Exame SEM nenhum achado → conclusion = "Exame ultrassonográfico abdominal dentro dos limites da normalidade para a espécie ${especie}." — exatamente assim, e NÃO gere "impression" nem "recommendations".

9. Exame COM achados → conclusion breve, coerente com as impressões (ex.: "Exame ultrassonográfico abdominal apresentando as alterações supracitadas.").

REGRAS — MEDIDAS:

10. Inclua apenas medidas efetivamente informadas. Formato ISO 80000-1: espaço entre número e unidade, unidade em caixa correta e minúscula quando aplicável (cm, mm, ml, kg, g, °C, bpm — nunca CM, ML, KG). Nunca altere o valor numérico informado.

REGRAS — NEGRITO (marque com \`**...**\`):

11. Envolva em \`**...**\` APENAS as palavras que caracterizam o achado ANORMAL (ex.: **aumentado**, **espessadas**, **hipoecogênica**, **irregular**, **presença de cálculo**). Isso vale só nas SEÇÕES de órgãos alterados.
12. NUNCA coloque MEDIDAS, números ou unidades em negrito. A medida fica sempre FORA da marcação.
    CERTO: "paredes **espessadas**, medindo 0,45 cm"
    ERRADO: "paredes **espessadas, medindo 0,45 cm**"
    ERRADO: "**Fígado aumentado, medindo 7,3 cm**"
    CERTO: "Fígado **aumentado**, medindo 7,3 cm"
    Isso vale também para porcentagens e proporções:
    ERRADO: "**sedimento ecogênico ocupando 25% da luz**"
    CERTO: "**sedimento ecogênico**, ocupando 25% da luz"
13. Não marque nada nas seções de órgãos normais (texto padrão), nem nos arrays "impression"/"recommendations".

REGRAS — IDIOMA E SEMIOLOGIA:

14. Português brasileiro, terminologia técnica de consenso. Reproduza o conteúdo do mapa corrigindo erros óbvios de digitação para o português padrão, SEM alterar o sentido, as medidas ou os termos diagnósticos. NUNCA use palavras em inglês.

15. SEMIOLOGIA — use apenas estes termos:
- Topografia: habitual ou ectópica
- Contornos: definidos, pouco definidos ou não definidos
- Margens (fígado, baço, adrenais, linfonodos): finas, afiladas, abauladas ou arredondadas
- Superfície: regular, irregular, ondulada, serrilhada ou micronodular
- Formato: anatômico (normal), nodular, triangular, em alvo, amorfo
- Ecogenicidade: anecogênico, hipoecogênico, hiperecogênico, normoecogênico
- Ecotextura: homogênea, heterogênea, mista ou complexa
- Arquitetura: parênquima + arquitetura vascular (fígado e rins)

${MAP_REFERENCE}

${FRASES_SALVADORAS_GERAIS}

TEXTO PADRÃO (descrições normais — copie exatamente para órgãos sem achado):
${defaults}`;
}
