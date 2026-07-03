import { readFile } from "node:fs/promises";
import path from "node:path";
import { ParsedReport } from "@/shared/models";
import { PdfData } from "@/shared/interfaces";
import { splitBoldSegments } from "@/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require("pdfmake");

// Vendored in lib/report/fonts/ (traced into the function bundle via
// outputFileTracingIncludes) — no runtime CDN dependency for PDF generation.
const SIGNATURE_FONT_FILES: Record<string, string> = {
  sacramento: "Sacramento-Regular.ttf",
  "pinyon-script": "PinyonScript-Regular.ttf",
  "alex-brush": "AlexBrush-Regular.ttf",
  "homemade-apple": "HomemadeApple-Regular.ttf",
};

const FONTS_DIR = path.join(process.cwd(), "lib", "report", "fonts");

const fontCache = new Map<string, Buffer>();

async function loadFont(file: string): Promise<Buffer> {
  const cached = fontCache.get(file);
  if (cached) return cached;
  const buf = await readFile(path.join(FONTS_DIR, file));
  fontCache.set(file, buf);
  return buf;
}

// ─── pdfmake content builder ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Content = any;

function richText(text: string): Content[] {
  return splitBoldSegments(text).map((seg) => ({ text: seg.text, ...(seg.bold ? { bold: true } : {}) }));
}

function pushBulletSection(items: Content[], title: string, lines: string[], topMargin: number) {
  items.push({ text: title, bold: true, font: "Roboto", margin: [0, topMargin, 0, 4], fontSize: 12 });
  for (const line of lines) {
    items.push({
      columns: [
        { text: "•", bold: true, width: 10, fontSize: 12 },
        { text: richText(line), alignment: "justify", width: "*", fontSize: 12 },
      ],
      margin: [14, 0, 0, 3],
    });
  }
}

function buildBodyFromParsed(parsedReport: ParsedReport): Content[] {
  const items: Content[] = [];

  for (const section of parsedReport.sections) {
    items.push({
      text: [{ text: section.label + ": ", bold: true, font: "Roboto" }, ...richText(section.content)],
      margin: [0, 2, 0, 5],
      alignment: "justify",
      fontSize: 12,
    });
  }

  if (parsedReport.conclusion || parsedReport.impression?.length) {
    items.push({
      text: "CONCLUSÃO",
      bold: true,
      font: "Roboto",
      decoration: "underline",
      margin: [0, 12, 0, 6],
      fontSize: 12.5,
    });
  }

  if (parsedReport.conclusion && !parsedReport.impression?.length) {
    items.push({
      text: richText(parsedReport.conclusion),
      alignment: "justify",
      margin: [0, 0, 0, 5],
      fontSize: 12,
    });
  }

  if (parsedReport.impression?.length) pushBulletSection(items, "IMPRESSÃO DIAGNÓSTICA:", parsedReport.impression, 4);
  if (parsedReport.recommendations?.length) pushBulletSection(items, "RECOMENDAÇÕES:", parsedReport.recommendations, 8);

  if (parsedReport.observations?.length) {
    items.push({
      text: "OBS:",
      bold: true,
      font: "Roboto",
      margin: [0, 8, 0, 4],
      fontSize: 12,
    });
    for (const line of parsedReport.observations) {
      items.push({
        text: richText(line),
        alignment: "justify",
        margin: [0, 0, 0, 4],
        fontSize: 12,
      });
    }
  }

  // Fallback: if raw plain text from old records, render as paragraph
  if (!parsedReport.sections.length && parsedReport.raw) {
    items.push({
      text: richText(parsedReport.raw),
      alignment: "justify",
      fontSize: 12,
      margin: [0, 0, 0, 5],
    });
  }

  return items;
}

export async function generatePdfBuffer(data: PdfData): Promise<Buffer> {
  const {
    patientName,
    species,
    breed,
    age,
    sex,
    neutered,
    ownerName,
    clientName,
    responsibleVet,
    date,
    reportTitle,
    vetName,
    signatureText,
    crmv,
    parsedReport,
    imageBase64List,
    logoBase64,
    signatureFont,
    signatureImageBase64,
    crmvState,
  } = data;
  const crmvLabel = crmvState ? `CRMV-${crmvState} ${crmv}` : `CRMV ${crmv}`;

  const [fontRegular, fontBold] = await Promise.all([loadFont("Roboto-Regular.ttf"), loadFont("Roboto-Bold.ttf")]);

  // Register fonts via VFS Buffers on the singleton each call
  pdfmake.virtualfs.writeFileSync("Roboto-Regular.ttf", fontRegular);
  pdfmake.virtualfs.writeFileSync("Roboto-Bold.ttf", fontBold);

  const fontDefs: Record<string, object> = {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Bold.ttf",
      italics: "Roboto-Regular.ttf",
      bolditalics: "Roboto-Bold.ttf",
    },
  };

  if (signatureFont && SIGNATURE_FONT_FILES[signatureFont]) {
    const sigFontBuf = await loadFont(SIGNATURE_FONT_FILES[signatureFont]);
    pdfmake.virtualfs.writeFileSync(`${signatureFont}.ttf`, sigFontBuf);
    fontDefs["SignatureFont"] = {
      normal: `${signatureFont}.ttf`,
      bold: `${signatureFont}.ttf`,
      italics: `${signatureFont}.ttf`,
      bolditalics: `${signatureFont}.ttf`,
    };
  }

  pdfmake.setFonts(fontDefs);

  // A4 dimensions in points: 595.28 x 841.89
  const PAGE_W = 595.28;
  const LOGO_H = 120;

  const row = (label: string, value: string) => ({
    text: [{ text: label, bold: true }, value],
    fontSize: 12,
    margin: [0, 0, 0, 2],
  });

  const leftCol = [
    row("Paciente: ", patientName),
    row("Espécie: ", species),
    row("Raça: ", breed),
    row("Idade: ", age),
    row("Sexo: ", sex === "M" ? "Macho" : "Fêmea"),
    row("Castrado(a): ", neutered ? "Sim" : "Não"),
  ];

  const rightCol = [
    row("Cliente: ", clientName),
    row("Médico Responsável: ", responsibleVet),
    row("Responsável: ", ownerName),
    row("Data: ", date),
  ];

  const imageContent: Content[] = [];
  for (let i = 0; i < imageBase64List.length; i += 2) {
    const right = imageBase64List[i + 1];
    const isFirst = i === 0;
    // Content width: 595.28 - 50 - 50 = 495.28pt. Gutter: 16pt. Each image: (495 - 16) / 2 = 239pt
    if (right) {
      imageContent.push({
        columns: [
          { image: imageBase64List[i], fit: [239, 300] },
          { text: "", width: 16 },
          { image: right, fit: [239, 300] },
        ],
        margin: [0, isFirst ? 20 : 0, 0, 16],
      });
    } else {
      imageContent.push({
        columns: [
          { image: imageBase64List[i], fit: [239, 300] },
          { text: "", width: 16 },
          { text: "", width: 239 },
        ],
        margin: [0, isFirst ? 20 : 0, 0, 16],
      });
    }
  }

  const docDefinition: Content = {
    pageSize: "A4",
    pageMargins: [
      50,
      36,
      50,
      (signatureFont && SIGNATURE_FONT_FILES[signatureFont]) || signatureImageBase64 ? 130 : 48,
    ],

    // Centered watermark on every page
    background: logoBase64
      ? () => ({
          image: logoBase64,
          width: 280,
          opacity: 0.15,
          absolutePosition: { x: (PAGE_W - 280) / 2, y: (841.89 - 280) / 2 },
        })
      : () => ({
          text: "LAUDAI",
          bold: true,
          color: "#1e3a5f",
          opacity: 0.06,
          fontSize: 90,
          characterSpacing: 10,
          alignment: "center",
          margin: [0, 360, 0, 0],
        }),

    content: [
      logoBase64
        ? { image: logoBase64, fit: [PAGE_W - 100, LOGO_H], alignment: "center", margin: [0, 0, 0, 20] }
        : {
            stack: [
              {
                canvas: [{ type: "rect", x: (PAGE_W - 100 - 210) / 2, y: 0, w: 210, h: 58, r: 10, color: "#1e3a5f" }],
              },
              {
                text: "LAUDAI",
                bold: true,
                color: "#ffffff",
                fontSize: 26,
                characterSpacing: 5,
                alignment: "center",
                relativePosition: { x: 0, y: -44 },
              },
            ],
            margin: [0, 0, 0, 20],
          },
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
      ...buildBodyFromParsed(parsedReport),
      ...imageContent,
    ],

    footer: (currentPage: number, pageCount: number) => {
      const hasSignatureFont = !!(signatureFont && SIGNATURE_FONT_FILES[signatureFont]);
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
              text: signatureText,
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
