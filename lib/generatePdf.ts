import fs from "fs";
import path from "path";
import { ParsedLaudo } from "@/types";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require("pdfmake");

const FONT_URLS: Record<string, string> = {
  "Roboto-Regular.ttf": "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/fonts/Roboto/Roboto-Regular.ttf",
  "Roboto-Medium.ttf": "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/fonts/Roboto/Roboto-Medium.ttf",
};

const SIGNATURE_FONT_URLS: Record<string, string> = {
  "sacramento":      "https://raw.githubusercontent.com/google/fonts/main/ofl/sacramento/Sacramento-Regular.ttf",
  "pinyon-script":   "https://raw.githubusercontent.com/google/fonts/main/ofl/pinyonscript/PinyonScript-Regular.ttf",
  "alex-brush":      "https://raw.githubusercontent.com/google/fonts/main/ofl/alexbrush/AlexBrush-Regular.ttf",
  "homemade-apple":  "https://raw.githubusercontent.com/google/fonts/main/apache/homemadeapple/HomemadeApple-Regular.ttf",
};

const fontCache = new Map<string, Buffer>();

async function fetchFont(name: string): Promise<Buffer> {
  if (fontCache.has(name)) return fontCache.get(name)!;
  const url = FONT_URLS[name] ?? SIGNATURE_FONT_URLS[name];
  if (!url) throw new Error(`Unknown font: ${name}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font ${name}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fontCache.set(name, buf);
  return buf;
}

function getLogoBase64(): string | null {
  try {
    const buf = fs.readFileSync(path.resolve(process.cwd(), "public/logo.png"));
    return "data:image/png;base64," + buf.toString("base64");
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfData {
  patientName: string;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  neutered?: boolean;
  ownerName: string;
  clinicName?: string;
  responsibleVet?: string;
  date: string;
  reportTitle: string;
  vetName: string;
  crmv: string;
  parsedLaudo: ParsedLaudo;
  imageBase64List: string[];
  logoBase64?: string;
  signatureFont?: string;
  signatureImageBase64?: string;
  crmvState?: string;
}

// ─── pdfmake content builder ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Content = any;

function buildBodyFromParsed(parsedLaudo: ParsedLaudo): Content[] {
  const items: Content[] = [];

  for (const section of parsedLaudo.sections) {
    items.push({
      text: [
        { text: section.label + ": ", bold: true, font: "Roboto" },
        { text: section.content },
      ],
      margin: [0, 2, 0, 5],
      alignment: "justify",
      fontSize: 12,
    });
  }

  if (parsedLaudo.conclusion || parsedLaudo.impressao?.length) {
    items.push({
      text: "CONCLUSÃO",
      bold: true,
      font: "Roboto",
      decoration: "underline",
      margin: [0, 12, 0, 6],
      fontSize: 12.5,
    });
  }

  if (parsedLaudo.conclusion && !parsedLaudo.impressao?.length) {
    items.push({
      text: parsedLaudo.conclusion,
      alignment: "justify",
      margin: [0, 0, 0, 5],
      fontSize: 12,
    });
  }

  if (parsedLaudo.impressao?.length) {
    items.push({
      text: "IMPRESSÃO DIAGNÓSTICA:",
      bold: true,
      font: "Roboto",
      margin: [0, 4, 0, 4],
      fontSize: 12,
    });
    for (const line of parsedLaudo.impressao) {
      items.push({
        text: line,
        alignment: "justify",
        margin: [0, 0, 0, 4],
        fontSize: 12,
      });
    }
  }

  if (parsedLaudo.recomendacoes?.length) {
    items.push({
      text: "RECOMENDAÇÕES:",
      bold: true,
      font: "Roboto",
      margin: [0, 8, 0, 4],
      fontSize: 12,
    });
    for (const line of parsedLaudo.recomendacoes) {
      items.push({
        columns: [
          { text: "•", bold: true, width: 10, fontSize: 12 },
          { text: line, alignment: "justify", width: "*", fontSize: 12 },
        ],
        margin: [14, 0, 0, 3],
      });
    }
  }

  if (parsedLaudo.observacoes?.length) {
    items.push({
      text: "OBS:",
      bold: true,
      font: "Roboto",
      margin: [0, 8, 0, 4],
      fontSize: 12,
    });
    for (const line of parsedLaudo.observacoes) {
      items.push({
        text: line,
        alignment: "justify",
        margin: [0, 0, 0, 4],
        fontSize: 12,
      });
    }
  }

  // Fallback: if raw plain text from old records, render as paragraph
  if (!parsedLaudo.sections.length && parsedLaudo.raw) {
    items.push({
      text: parsedLaudo.raw,
      alignment: "justify",
      fontSize: 12,
      margin: [0, 0, 0, 5],
    });
  }

  return items;
}

export async function generatePdfBuffer(data: PdfData): Promise<Buffer> {
  const { patientName, species, breed, age, sex, neutered, ownerName, clinicName, responsibleVet, date, reportTitle, vetName, crmv, parsedLaudo, imageBase64List, logoBase64: providedLogo, signatureFont, signatureImageBase64, crmvState } = data;
  const crmvLabel = crmvState ? `CRMV-${crmvState} ${crmv}` : `CRMV ${crmv}`;

  // Fetch fonts from CDN (cached after first call)
  const [fontRegular, fontMedium] = await Promise.all([
    fetchFont("Roboto-Regular.ttf"),
    fetchFont("Roboto-Medium.ttf"),
  ]);

  // Register fonts via VFS Buffers on the singleton each call
  pdfmake.virtualfs.writeFileSync("Roboto-Regular.ttf", fontRegular);
  pdfmake.virtualfs.writeFileSync("Roboto-Medium.ttf", fontMedium);

  const fontDefs: Record<string, object> = {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Regular.ttf",
      bolditalics: "Roboto-Medium.ttf",
    },
  };

  if (signatureFont && SIGNATURE_FONT_URLS[signatureFont]) {
    const sigFontBuf = await fetchFont(signatureFont);
    pdfmake.virtualfs.writeFileSync(`${signatureFont}.ttf`, sigFontBuf);
    fontDefs["SignatureFont"] = {
      normal: `${signatureFont}.ttf`,
      bold: `${signatureFont}.ttf`,
      italics: `${signatureFont}.ttf`,
      bolditalics: `${signatureFont}.ttf`,
    };
  }

  pdfmake.setFonts(fontDefs);

  const logoBase64 = providedLogo ?? getLogoBase64();

  // A4 dimensions in points: 595.28 x 841.89
  const PAGE_W = 595.28;
  const LOGO_W = 160;
  const LOGO_H = 120;

  const row = (label: string, value: string) => ({
    text: [{ text: label, bold: true }, value],
    fontSize: 12,
    margin: [0, 0, 0, 2],
  });

  const leftCol = [
    row("Paciente: ", patientName),
    row("Espécie: ", species),
    ...(breed ? [row("Raça: ", breed)] : []),
    ...(age ? [row("Idade: ", age)] : []),
    ...(sex ? [row("Sexo: ", sex === "M" ? "Macho" : "Fêmea")] : []),
    ...(neutered != null ? [row("Castrado(a): ", neutered ? "Sim" : "Não")] : []),
  ];

  const rightCol = [
    ...(clinicName ? [row("Clínica: ", clinicName)] : []),
    ...(responsibleVet ? [row("Médico Responsável: ", responsibleVet)] : []),
    row("Responsável: ", ownerName),
    row("Data: ", date),
  ];

  const imageContent: Content[] = [];
  for (let i = 0; i < imageBase64List.length; i += 2) {
    const right = imageBase64List[i + 1];
    // Content width: 595.28 - 50 - 50 = 495.28pt. Gutter: 16pt. Each image: (495 - 16) / 2 = 239pt
    if (right) {
      imageContent.push({
        columns: [
          { image: imageBase64List[i], fit: [239, 300] },
          { text: "", width: 16 },
          { image: right, fit: [239, 300] },
        ],
        margin: [0, 0, 0, 16],
      });
    } else {
      imageContent.push({
        columns: [
          { image: imageBase64List[i], fit: [239, 300] },
          { text: "", width: 16 },
          { text: "", width: 239 },
        ],
        margin: [0, 0, 0, 16],
      });
    }
  }

  const docDefinition: Content = {
    pageSize: "A4",
    pageMargins: [50, 36, 50, (signatureFont && SIGNATURE_FONT_URLS[signatureFont]) || signatureImageBase64 ? 130 : 48],

    // Centered watermark on every page
    ...(logoBase64 ? {
      background: () => ({
        image: logoBase64,
        width: 280,
        opacity: 0.15,
        absolutePosition: { x: (PAGE_W - 280) / 2, y: (841.89 - 280) / 2 },
      }),
    } : {}),

    content: [
      // Logo as first content item — only on page 1, naturally
      ...(logoBase64 ? [{
        image: logoBase64,
        fit: [PAGE_W - 100, LOGO_H],
        alignment: "center",
        margin: [0, 0, 0, 20],
      }] : []),
      {
        columns: [
          { stack: leftCol, width: "*" },
          { stack: rightCol, width: "*" },
        ],
        margin: [0, 0, 0, 12],
      },
      {
        text: reportTitle,
        bold: true,
        fontSize: 13,
        alignment: "center",
        decoration: "underline",
        margin: [0, 0, 0, 12],
      },
      ...buildBodyFromParsed(parsedLaudo),
      ...(imageContent.length > 0
        ? [{ text: "", pageBreak: "before" }, ...imageContent]
        : []),
    ],

    footer: (currentPage: number, pageCount: number) => {
      const hasSignatureFont = !!(signatureFont && SIGNATURE_FONT_URLS[signatureFont]);
      const hasSignature = hasSignatureFont || !!signatureImageBase64;

      // On non-last pages when signature is active, push footer to bottom of the larger area
      const redFooterMarginTop = hasSignature && currentPage !== pageCount ? 105 : 8;
      const redFooter = {
        text: [
          { text: `Dr(a). ${vetName}`, color: "#b91c1c", bold: true },
          { text: `  ·  ${crmvLabel}`, color: "#b91c1c" },
        ],
        alignment: "center",
        fontSize: 9,
        margin: [50, redFooterMarginTop, 50, 0],
      };

      if (hasSignatureFont && currentPage === pageCount) {
        return {
          stack: [
            {
              text: vetName,
              font: "SignatureFont",
              fontSize: 28,
              lineHeight: 1.4,
              alignment: "center",
              margin: [50, 4, 50, 0],
            },
            {
              canvas: [{ type: "line", x1: 198, y1: 0, x2: 397, y2: 0, lineWidth: 0.5, lineColor: "#9ca3af" }],
              margin: [0, -20, 0, 2],
            },
            {
              text: `Dr(a). ${vetName}`,
              fontSize: 9,
              alignment: "center",
              color: "#6b7280",
              margin: [50, 2, 50, 0],
            },
            {
              text: "Médico(a) Veterinário(a)",
              fontSize: 9,
              alignment: "center",
              color: "#6b7280",
              margin: [50, 0, 50, 0],
            },
            {
              text: crmvLabel,
              fontSize: 9,
              alignment: "center",
              color: "#6b7280",
              margin: [50, 0, 50, 2],
            },
          ],
        };
      }

      if (signatureImageBase64 && currentPage === pageCount) {
        return {
          columns: [
            { width: "*", text: "" },
            {
              width: "auto",
              stack: [
                {
                  image: signatureImageBase64,
                  fit: [200, 70],
                  margin: [0, 4, 0, 2],
                },
              ],
            },
            { width: "*", text: "" },
          ],
        };
      }

      return { columns: [redFooter] };
    },

    defaultStyle: {
      font: "Roboto",
      fontSize: 12,
      lineHeight: 1.35,
    },
  };

  const doc = pdfmake.createPdf(docDefinition);
  return doc.getBuffer();
}
