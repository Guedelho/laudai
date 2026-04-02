import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const MARGIN = 50;
const FOOTER_RESERVED = 40;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: FOOTER_RESERVED + 16,
    paddingHorizontal: MARGIN,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#000",
    lineHeight: 1.35,
  },
  imagePage: {
    paddingTop: 36,
    paddingBottom: FOOTER_RESERVED + 16,
    paddingHorizontal: MARGIN,
  },

  // Patient header
  headerRow: { flexDirection: "row", marginBottom: 14 },
  headerCol: { flex: 1 },
  headerField: { fontSize: 10, marginBottom: 2 },
  headerBold: { fontFamily: "Times-Bold" },

  // Title
  titleWrap: { alignItems: "center", marginBottom: 14 },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    textDecoration: "underline",
    textAlign: "center",
  },

  // Section paragraph: **LABEL:** inline text
  sectionPara: { marginBottom: 7, textAlign: "justify" },
  sectionLabel: { fontFamily: "Times-Bold" },

  // Standalone section header (multi-line sections)
  sectionHeader: { fontFamily: "Times-Bold", marginTop: 6, marginBottom: 2 },

  // Bullet item
  bulletRow: { flexDirection: "row", paddingLeft: 14, marginBottom: 2 },
  bulletDot: { width: 10, fontFamily: "Times-Bold", fontSize: 10 },
  bulletText: { flex: 1, textAlign: "justify" },

  // Numbered item
  numberedRow: { flexDirection: "row", paddingLeft: 6, marginBottom: 4 },
  numberedN: { width: 16, fontFamily: "Times-Bold" },
  numberedText: { flex: 1, textAlign: "justify" },

  // Conclusion header
  conclusionHeader: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    marginTop: 12,
    marginBottom: 6,
    textDecoration: "underline",
  },

  // OBS block (bold justified)
  obsBlock: { marginTop: 8, textAlign: "justify", fontFamily: "Times-Bold" },

  // Images section
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  image: { width: "49.5%", objectFit: "contain", backgroundColor: "#000" },

  // Fixed footer on every page
  footer: {
    position: "absolute",
    bottom: 14,
    left: MARGIN,
    right: MARGIN,
    borderTop: "0.5pt solid #c00",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerName: { fontFamily: "Times-Bold", fontSize: 8.5, color: "#c00" },
  footerCrmv: { fontFamily: "Times-Bold", fontSize: 8.5, color: "#c00" },
});

// ─── Inline bold parser ───────────────────────────────────────────────────────

type Seg = { text: string; bold: boolean };

function parseInline(text: string): Seg[] {
  // Strip leading bullet marker
  const t = text.replace(/^\s*\*{1,2}\s+/, "").replace(/^\s*-\s+/, "");
  const segs: Seg[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    if (m.index > last) segs.push({ text: t.slice(last, m.index), bold: false });
    segs.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < t.length) segs.push({ text: t.slice(last), bold: false });
  return segs.filter((s) => s.text.trim());
}

function InlineText({ segs, style }: { segs: Seg[]; style?: Style }) {
  if (segs.length === 1 && !segs[0].bold) return <Text style={style}>{segs[0].text}</Text>;
  return (
    <Text style={style}>
      {segs.map((seg, i) =>
        seg.bold ? (
          <Text key={i} style={{ fontFamily: "Times-Bold" }}>{seg.text}</Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

// ─── Body parser ─────────────────────────────────────────────────────────────

// A "block" is a group of lines separated by blank lines
type Block =
  | { kind: "section"; label: string; inline: string } // FÍGADO: text...
  | { kind: "section-header"; label: string } // RINS: (alone, bullets follow)
  | { kind: "bullet"; segs: Seg[] }
  | { kind: "numbered"; n: string; segs: Seg[] }
  | { kind: "conclusion" }
  | { kind: "impression" }
  | { kind: "obs"; segs: Seg[] }
  | { kind: "paragraph"; segs: Seg[] };

// Regex: starts with all-caps word(s) (may include accents, spaces, /) then colon
const SECTION_RE = /^([A-ZÁÂÃÀÉÊÍÓÔÕÚÇ][A-ZÁÂÃÀÉÊÍÓÔÕÚÇ\s\/\-]{0,40}):\s*(.*)/;

function parseBody(content: string): Block[] {
  const lines = content.split("\n");
  // Strip header: skip title + info lines (everything before first blank line at top)
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  // skip title
  i++;
  // skip header info + first blank line
  let foundBlank = false;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { foundBlank = true; i++; break; }
    if (foundBlank) break;
    i++;
  }

  const blocks: Block[] = [];

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();

    if (!t) continue;

    // Skip vet signature lines
    if (/^M[eé]dico\s+Veterin/i.test(t)) continue;

    // CONCLUSÃO
    if (/^CONCLUS[ÃA]O\s*:?\s*$/i.test(t)) { blocks.push({ kind: "conclusion" }); continue; }

    // IMPRESSÃO DIAGNÓSTICA
    if (/^IMPRESS[ÃA]O\s+DIAGN[ÓO]STICA\s*:?\s*$/i.test(t)) { blocks.push({ kind: "impression" }); continue; }

    // OBS:
    if (/^OBS\s*:\s*/i.test(t)) {
      blocks.push({ kind: "obs", segs: parseInline(t.replace(/^OBS\s*:\s*/i, "")) });
      continue;
    }

    // Numbered item
    const numM = t.match(/^(\d+)[.)]\s+(.*)/);
    if (numM) { blocks.push({ kind: "numbered", n: `${numM[1]}.`, segs: parseInline(numM[2]) }); continue; }

    // Bullet item
    if (/^\*\s/.test(t) || /^-\s/.test(t)) {
      blocks.push({ kind: "bullet", segs: parseInline(t) }); continue;
    }

    // Section
    const secM = t.match(SECTION_RE);
    if (secM) {
      const label = secM[1].trim();
      const rest = secM[2].trim();
      if (rest) {
        blocks.push({ kind: "section", label, inline: rest });
      } else {
        blocks.push({ kind: "section-header", label: label + ":" });
      }
      continue;
    }

    // Paragraph
    blocks.push({ kind: "paragraph", segs: parseInline(t) });
  }

  return blocks;
}

// ─── PDF document ─────────────────────────────────────────────────────────────

export interface LaudoPDFData {
  patientName: string;
  species: string;
  breed?: string;
  age?: string;
  ownerName: string;
  date: string;
  reportTitle: string; // e.g. "RELATÓRIO ULTRASSONOGRÁFICO"
  vetName: string;
  crmv: string;
  generatedContent: string;
  images: { url: string }[];
}

function Footer({ vetName, crmv }: { vetName: string; crmv: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerName}>{vetName}{"\n"}Médico(a) Veterinário(a)</Text>
      <Text style={s.footerCrmv}>CRMV {crmv}</Text>
    </View>
  );
}

export function LaudoPDF({ data }: { data: LaudoPDFData }) {
  const { patientName, species, breed, age, ownerName, date, reportTitle, vetName, crmv, generatedContent, images } = data;
  const blocks = parseBody(generatedContent);

  // Split images into groups of 6 (2×3) per page
  const imagePages: { url: string }[][] = [];
  for (let i = 0; i < images.length; i += 6) imagePages.push(images.slice(i, i + 6));

  return (
    <Document>
      {/* ── Report page(s) ── */}
      <Page size="A4" style={s.page}>
        {/* Patient header */}
        <View style={s.headerRow}>
          <View style={s.headerCol}>
            <Text style={s.headerField}>
              <Text style={s.headerBold}>Animal: </Text>{patientName}
            </Text>
            <Text style={s.headerField}>
              <Text style={s.headerBold}>Espécie: </Text>{species}
            </Text>
            {breed ? (
              <Text style={s.headerField}>
                <Text style={s.headerBold}>Raça: </Text>{breed}
              </Text>
            ) : null}
            {age ? (
              <Text style={s.headerField}>
                <Text style={s.headerBold}>Idade: </Text>{age}
              </Text>
            ) : null}
          </View>
          <View style={s.headerCol}>
            <Text style={s.headerField}>
              <Text style={s.headerBold}>Tutor: </Text>{ownerName}
            </Text>
            <Text style={s.headerField}>
              <Text style={s.headerBold}>Veterinário: </Text>{vetName}
            </Text>
            <Text style={s.headerField}>
              <Text style={s.headerBold}>Data: </Text>{date}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.titleWrap}>
          <Text style={s.title}>{reportTitle}</Text>
        </View>

        {/* Body blocks */}
        {blocks.map((block, i) => {
          if (block.kind === "section") {
            return (
              <Text key={i} style={s.sectionPara}>
                <Text style={s.sectionLabel}>{block.label}: </Text>
                {block.inline}
              </Text>
            );
          }
          if (block.kind === "section-header") {
            return <Text key={i} style={s.sectionHeader}>{block.label}</Text>;
          }
          if (block.kind === "conclusion" || block.kind === "impression") {
            return (
              <Text key={i} style={s.conclusionHeader}>
                IMPRESSÃO DIAGNÓSTICA:
              </Text>
            );
          }
          if (block.kind === "numbered") {
            return (
              <View key={i} style={s.numberedRow}>
                <Text style={s.numberedN}>{block.n}</Text>
                <InlineText segs={block.segs} style={s.numberedText} />
              </View>
            );
          }
          if (block.kind === "bullet") {
            return (
              <View key={i} style={s.bulletRow}>
                <Text style={s.bulletDot}>•</Text>
                <InlineText segs={block.segs} style={s.bulletText} />
              </View>
            );
          }
          if (block.kind === "obs") {
            return <InlineText key={i} segs={[{ text: "OBS: ", bold: true }, ...block.segs]} style={s.obsBlock} />;
          }
          if (block.kind === "paragraph") {
            return <InlineText key={i} segs={block.segs} style={s.sectionPara} />;
          }
          return null;
        })}

        <Footer vetName={vetName} crmv={crmv} />
      </Page>

      {/* ── Image page(s) ── */}
      {imagePages.map((pageImgs, pi) => (
        <Page key={`img-${pi}`} size="A4" style={s.imagePage}>
          <View style={s.imageGrid}>
            {pageImgs.map((img, ii) => (
              <Image key={ii} src={img.url} style={s.image} />
            ))}
          </View>
          <Footer vetName={vetName} crmv={crmv} />
        </Page>
      ))}
    </Document>
  );
}
