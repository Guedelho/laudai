import path from "path";
import fs from "fs";
import { ParsedLaudo } from "@/types";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require("pdfmake");

const FONTS_DIR = path.resolve(process.cwd(), "node_modules/pdfmake/build/fonts/Roboto");

// Read at module load — Buffers embedded in the VFS, no runtime path resolution
const FONT_REGULAR = fs.readFileSync(path.join(FONTS_DIR, "Roboto-Regular.ttf"));
const FONT_BOLD = fs.readFileSync(path.join(FONTS_DIR, "Roboto-Bold.ttf"));

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
  ownerName: string;
  clinicName?: string;
  responsibleVet?: string;
  date: string;
  reportTitle: string;
  vetName: string;
  crmv: string;
  parsedLaudo: ParsedLaudo;
  imageBase64List: string[];
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
      fontSize: 10,
    });
  }

  if (parsedLaudo.conclusion || parsedLaudo.impressao?.length) {
    items.push({
      text: "CONCLUSÃO",
      bold: true,
      font: "Roboto",
      decoration: "underline",
      margin: [0, 12, 0, 6],
      fontSize: 10.5,
    });
  }

  if (parsedLaudo.conclusion && !parsedLaudo.impressao?.length) {
    items.push({
      text: parsedLaudo.conclusion,
      alignment: "justify",
      margin: [0, 0, 0, 5],
      fontSize: 10,
    });
  }

  if (parsedLaudo.impressao?.length) {
    items.push({
      text: "IMPRESSÃO DIAGNÓSTICA:",
      bold: true,
      font: "Roboto",
      margin: [0, 4, 0, 4],
      fontSize: 10,
    });
    for (const line of parsedLaudo.impressao) {
      items.push({
        text: line,
        alignment: "justify",
        margin: [0, 0, 0, 4],
        fontSize: 10,
      });
    }
  }

  if (parsedLaudo.recomendacoes?.length) {
    items.push({
      text: "RECOMENDAÇÕES:",
      bold: true,
      font: "Roboto",
      margin: [0, 8, 0, 4],
      fontSize: 10,
    });
    for (const line of parsedLaudo.recomendacoes) {
      items.push({
        columns: [
          { text: "•", bold: true, width: 10, fontSize: 10 },
          { text: line, alignment: "justify", width: "*", fontSize: 10 },
        ],
        margin: [14, 0, 0, 3],
      });
    }
  }

  // Fallback: if raw plain text from old records, render as paragraph
  if (!parsedLaudo.sections.length && parsedLaudo.raw) {
    items.push({
      text: parsedLaudo.raw,
      alignment: "justify",
      fontSize: 10,
      margin: [0, 0, 0, 5],
    });
  }

  return items;
}

export async function generatePdfBuffer(data: PdfData): Promise<Buffer> {
  const { patientName, species, breed, age, ownerName, clinicName, responsibleVet, date, reportTitle, vetName, crmv, parsedLaudo, imageBase64List } = data;

  // Register fonts via VFS Buffers on the singleton each call
  pdfmake.virtualfs.writeFileSync("Roboto-Regular.ttf", FONT_REGULAR);
  pdfmake.virtualfs.writeFileSync("Roboto-Bold.ttf", FONT_BOLD);
  pdfmake.setFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Bold.ttf",
      italics: "Roboto-Regular.ttf",
      bolditalics: "Roboto-Bold.ttf",
    },
  });

  const logoBase64 = getLogoBase64();

  // A4 dimensions in points: 595.28 x 841.89
  const PAGE_W = 595.28;
  const LOGO_W = 120;
  const LOGO_H = 32; // approximate height after scaling

  const leftCol = [
    ...(clinicName ? [[{ text: "Clínica: ", bold: true }, clinicName]] : []),
    ...(responsibleVet ? [[{ text: "Médico Vet.: ", bold: true }, responsibleVet]] : []),
    [{ text: "Animal: ", bold: true }, patientName],
    [{ text: "Espécie: ", bold: true }, species],
    ...(breed ? [[{ text: "Raça: ", bold: true }, breed]] : []),
    ...(age ? [[{ text: "Idade: ", bold: true }, age]] : []),
  ].map(([label, value]) => ({ text: [label, value], fontSize: 10, margin: [0, 0, 0, 2] }));

  const rightCol = [
    [{ text: "Tutor: ", bold: true }, ownerName],
    [{ text: "Data: ", bold: true }, date],
  ].map(([label, value]) => ({ text: [label, value], fontSize: 10, margin: [0, 0, 0, 2] }));

  const imageContent: Content[] = [];
  for (let i = 0; i < imageBase64List.length; i += 2) {
    imageContent.push({
      columns: [
        { image: imageBase64List[i], width: 230, margin: [0, 0, 4, 6] },
        imageBase64List[i + 1]
          ? { image: imageBase64List[i + 1], width: 230, margin: [0, 0, 0, 6] }
          : { text: "", width: 230 },
      ],
    });
  }

  const docDefinition: Content = {
    pageSize: "A4",
    pageMargins: [50, logoBase64 ? 80 : 36, 50, 36],

    // Centered watermark on every page
    ...(logoBase64 ? {
      background: () => ({
        image: logoBase64,
        width: 280,
        opacity: 0.07,
        absolutePosition: { x: (PAGE_W - 280) / 2, y: (841.89 - LOGO_H * (280 / LOGO_W)) / 2 },
      }),
    } : {}),

    // Logo only on first page
    ...(logoBase64 ? {
      header: (currentPage: number) => currentPage === 1 ? ({
        image: logoBase64,
        width: LOGO_W,
        alignment: "center",
        margin: [0, 16, 0, 0],
      }) : null,
    } : {}),

    content: [
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
        fontSize: 11,
        alignment: "center",
        decoration: "underline",
        margin: [0, 0, 0, 12],
      },
      ...buildBodyFromParsed(parsedLaudo),
      ...(imageContent.length > 0
        ? [{ text: "", pageBreak: "before" }, ...imageContent]
        : []),
    ],

    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.35,
    },
  };

  const doc = pdfmake.createPdf(docDefinition);
  return doc.getBuffer();
}
