import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 9,
    fontFamily: "Courier",
    color: "#1a1a1a",
  },
  content: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
  },
  imagesSection: {
    marginTop: 24,
  },
  imagesLabel: {
    fontSize: 9,
    fontFamily: "Courier-Bold",
    marginBottom: 8,
    color: "#374151",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  image: {
    width: "48%",
    objectFit: "contain",
    backgroundColor: "#000",
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface LaudoPDFProps {
  content: string;
  images: { url: string; file_name: string }[];
}

export function LaudoPDF({ content, images }: LaudoPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.content}>{content}</Text>

        {images.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.imagesLabel}>Imagens do exame</Text>
            <View style={styles.imageGrid}>
              {images.map((img, i) => (
                <Image key={i} src={img.url} style={styles.image} />
              ))}
            </View>
          </View>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""
          }
          fixed
        />
      </Page>
    </Document>
  );
}
