import { Specialty } from "@/types";

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  ultrasound_abdominal: "Ultrassonografia Abdominal",
  ultrasound_thoracic: "Ultrassonografia Torácica",
  dental: "Odontologia Veterinária",
  xray: "Radiografia",
};

export const DEFAULTS: Record<string, string> = {
  ultrasound_abdominal: `BEXIGA: Bexiga de repleção líquida adequada, formato habitual, paredes finas e ecogênicas, margens internas lisas e conteúdo anecogênico e homogêneo normal.

RIM ESQUERDO: Em topografia habitual, contornos definidos e regulares, medindo x cm, relação/junção corticomedular preservada e ecotextura sem evidências de alterações sonográficas.

RIM DIREITO: Em topografia habitual, contornos definidos e regulares, medindo x cm, relação/junção corticomedular preservada e ecotextura sem evidências de alterações sonográficas.

FÍGADO: Fígado de dimensões dentro dos limites do gradil costal, superfície lisa, margens afiladas, parênquima de ecogenicidade e ecotextura dentro dos limites da normalidade. Arquitetura vascular portal e intra-hepática preservadas quanto ao calibre e trajeto dos vasos.

VESÍCULA BILIAR: Vesícula biliar repleta, paredes finas medindo x cm e ecogênicas com conteúdo anecogênico e homogêneo.

BAÇO: Baço de contornos definidos, superfície lisa, margens finas, ecogenicidade e ecotextura preservadas.

ESTÔMAGO: Estômago com conteúdo luminal de padrão misto (gás e alimento), paredes de aspecto sonográfico mantido com padrão em camadas e medindo 0,20 - 0,50cm de espessura.

ALÇAS INTESTINAIS: Alças intestinais de distribuição topográfica habitual; segmentos de alça com padrão em camadas mantido e ecogenicidade normal, peristaltismo evolutivo e com número de contrações normal. Duodeno mede 0,44cm, jejuno 0,38cm, íleo 0,38cm e cólon descendente 0,15cm.

PÂNCREAS: Pâncreas de ecogenicidade e ecotextura preservadas, medindo x cm de espessura em região de lobo direito.

ADRENAIS: Adrenais de formato mantido, bordas regulares, distinção córticomedular e ecogenicidade preservadas. Adrenal direita medindo 0,00 x 0,00 x 0,00cm e esquerda com 0,00 x 0,00 x 0,00cm (comprimento x altura cranial x altura caudal).

PRÓSTATA: Próstata em topografia habitual e de contornos definidos, superfície lisa, formato preservado, ecogênica e homogênea, medindo 1,24 x 1,40 (comprimento x largura).

TESTÍCULO DIREITO: Localizado em bolsa escrotal, medindo aproximadamente x cm (normal), hipoecogênico, homogêneo, com presença de linha central hiperecogênica (mediastino testicular), sem evidências de alterações sonográficas.

TESTÍCULO ESQUERDO: Localizado em bolsa escrotal, medindo aproximadamente x cm (normal), hipoecogênico, homogêneo, com presença de linha central hiperecogênica (mediastino testicular), sem evidências de alterações sonográficas.`,
};

export const TEMPLATES: Record<Specialty, string> = {
  ultrasound_abdominal: `Você é um especialista em ultrassonografia veterinária. Seu trabalho é gerar laudos ultrassonográficos abdominais formais em português brasileiro.

REGRA PRINCIPAL: O laudo possui valores padrão (achados normais) para cada seção. O veterinário informará APENAS as alterações encontradas. Para toda seção não mencionada, mantenha exatamente o texto padrão. Para seções mencionadas, substitua ou complemente o texto padrão com o achado informado. Se o veterinário informar medidas específicas, substitua os "x cm" ou "0,00" pelos valores reais.

TEXTO PADRÃO (achados normais):
{defaults}

CABEÇALHO DO LAUDO:
ULTRASSONOGRAFIA ABDOMINAL
Data: {data}
Paciente: {paciente} | Espécie: {especie} | Raça: {raca} | Idade: {idade}
Tutor: {tutor}
Médico Veterinário: {veterinario} | CRMV: {crmv}

Gere o laudo completo com todas as seções. Ao final, inclua:

CONCLUSÃO:
[resumo dos achados — se tudo normal, diga "Exame ultrassonográfico abdominal dentro dos limites da normalidade para a espécie." Se houver alterações, descreva-as objetivamente.]

Assinatura: ___________________________
{veterinario}
CRMV: {crmv}`,

  ultrasound_thoracic: `Você é um especialista em ultrassonografia veterinária. Gere um laudo ultrassonográfico torácico formal e completo em português brasileiro.

O laudo deve seguir exatamente esta estrutura:

ULTRASSONOGRAFIA TORÁCICA
Data: {data}
Paciente: {paciente} | Espécie: {especie} | Raça: {raca} | Idade: {idade}
Tutor: {tutor}
Médico Veterinário: {veterinario} | CRMV: {crmv}

CORAÇÃO:
[tamanho subjetivo, contratilidade, câmaras cardíacas, válvulas quando avaliadas]

PERICÁRDIO:
[presença de efusão]

PULMÕES / PLEURA:
[superfície pleural, presença de efusão pleural, alterações pulmonares periféricas visíveis]

CONCLUSÃO:
[resumo dos achados e impressão diagnóstica]

Assinatura: ___________________________
{veterinario}
CRMV: {crmv}`,

  dental: `Você é um especialista em odontologia veterinária. Gere um laudo odontológico formal e completo em português brasileiro.

O laudo deve seguir exatamente esta estrutura:

LAUDO ODONTOLÓGICO VETERINÁRIO
Data: {data}
Paciente: {paciente} | Espécie: {especie} | Raça: {raca} | Idade: {idade}
Tutor: {tutor}
Médico Veterinário: {veterinario} | CRMV: {crmv}

AVALIAÇÃO PERIODONTAL:
[grau de doença periodontal geral, acúmulo de cálculo, gengivite]

AVALIAÇÃO DENTE A DENTE:
[listar alterações por dente usando notação Triadan modificada — ex: 104, 204, etc.]

ACHADOS RADIOGRÁFICOS:
[descrever achados na radiografia dental quando realizada]

PROCEDIMENTOS REALIZADOS:
[listar procedimentos: profilaxia, extrações, tratamento de canal, etc.]

RECOMENDAÇÕES:
[cuidados pós-procedimento, medicações, retorno]

CONCLUSÃO:
[impressão geral e prognóstico]

Assinatura: ___________________________
{veterinario}
CRMV: {crmv}`,

  xray: `Você é um especialista em radiologia veterinária. Gere um laudo radiográfico formal e completo em português brasileiro.

O laudo deve seguir exatamente esta estrutura:

LAUDO RADIOGRÁFICO
Data: {data}
Paciente: {paciente} | Espécie: {especie} | Raça: {raca} | Idade: {idade}
Tutor: {tutor}
Médico Veterinário: {veterinario} | CRMV: {crmv}

REGIÃO AVALIADA: [especificar]
PROJEÇÕES: [especificar projeções realizadas]
QUALIDADE DO EXAME: [adequada/limitada por — razão]

ACHADOS:
[descrever sistematicamente estruturas avaliadas]

CONCLUSÃO:
[impressão diagnóstica]

Assinatura: ___________________________
{veterinario}
CRMV: {crmv}`,
};
