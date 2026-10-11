import { Font, StyleSheet } from "@react-pdf/renderer";
import path from "path";

const fontsDir = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(fontsDir, "Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "Inter-Medium.ttf"), fontWeight: 500 },
    { src: path.join(fontsDir, "Inter-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(fontsDir, "Inter-Bold.ttf"), fontWeight: 700 },
  ],
});

Font.register({
  family: "Chillax",
  fonts: [
    { src: path.join(fontsDir, "Chillax_Complete", "Fonts", "WEB", "fonts", "Chillax-Semibold.ttf"), fontWeight: 600 },
    { src: path.join(fontsDir, "Chillax_Complete", "Fonts", "WEB", "fonts", "Chillax-Bold.ttf"), fontWeight: 700 },
  ],
});

// Wrap on whole words like the browser does; React-PDF hyphenates by default
// ("Down-town Dubai").
Font.registerHyphenationCallback((word) => [word]);

const FONT_MAP: Record<string, string> = {
  inter: "Inter",
  poppins: "Inter",
  "playfair display": "Times-Roman",
};

export function resolvePdfFont(brandFont: string | null | undefined): string {
  if (!brandFont) return "Inter";
  return FONT_MAP[brandFont.toLowerCase()] ?? "Inter";
}

export function makePdfStyles(primaryColor: string, fontFamily: string) {
  // Scale: web sheet 800px → A4 595pt = 0.744x
  return StyleSheet.create({
    page: {
      fontFamily,
      fontSize: 10,
      color: "#14161A",
      paddingTop: 0,
      paddingBottom: 60,
      paddingHorizontal: 0,
      backgroundColor: "#ffffff",
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: 48,
      paddingTop: 42,
      paddingBottom: 0,
      marginBottom: 27,
    },
    brandmark: {
      width: 28,
      height: 28,
      backgroundColor: "#14161A",
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    brandmarkLetter: {
      fontSize: 13,
      fontWeight: 700,
      color: "#ffffff",
    },
    logo: {
      width: 28,
      height: 28,
      objectFit: "contain",
    },
    headerLeft: {
      flexDirection: "column",
      gap: 10,
      flex: 1,
    },
    headerLeftText: {
      flexDirection: "column",
    },
    orgName: {
      fontFamily: "Chillax",
      fontSize: 12,
      fontWeight: 600,
      color: "#14161A",
      marginBottom: 2,
    },
    orgContact: {
      fontSize: 8.5,
      color: "#54585F",
      lineHeight: 1.5,
    },
    headerRight: {
      alignItems: "flex-end",
    },
    docType: {
      fontFamily: "Chillax",
      fontSize: 22,
      fontWeight: 600,
      color: "#14161A",
      letterSpacing: -0.7,
    },
    docNumber: {
      fontSize: 9,
      color: "#54585F",
      marginTop: 4,
      fontFamily: "Courier",
    },
    statusPill: {
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: "#ECECE7",
      borderRadius: 100,
    },
    statusPillText: {
      fontSize: 8,
      color: "#54585F",
      fontWeight: 600,
    },

    // Parties section — matches web .parties grid (no top/bottom borders)
    metaSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 48,
      paddingTop: 0,
      paddingBottom: 0,
      gap: 21,
      marginBottom: 24,
    },
    metaCol: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 7.5,
      fontWeight: 600,
      letterSpacing: 0.9,
      color: "#898E96",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    metaValue: {
      fontSize: 10,
      color: "#14161A",
      lineHeight: 1.5,
      fontWeight: 600,
    },
    metaMuted: {
      fontSize: 9,
      color: "#54585F",
      lineHeight: 1.55,
    },

    body: {
      paddingHorizontal: 48,
      paddingTop: 0,
      paddingBottom: 16,
      flex: 1,
    },

    // Content (Tiptap)
    content: {
      flex: 1,
    },
    h1: {
      fontSize: 18,
      fontWeight: 700,
      color: primaryColor,
      marginBottom: 8,
      marginTop: 16,
    },
    h2: {
      fontSize: 14,
      fontWeight: 700,
      color: primaryColor,
      marginBottom: 6,
      marginTop: 14,
    },
    h3: {
      fontSize: 11,
      fontWeight: 700,
      color: "#0f0f0f",
      marginBottom: 4,
      marginTop: 10,
    },
    p: {
      fontSize: 10,
      lineHeight: 1.6,
      marginBottom: 8,
      color: "#1a1a1a",
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
      borderLeftStyle: "solid",
      paddingLeft: 10,
      marginBottom: 8,
      color: "#555555",
    },
    listItem: {
      flexDirection: "row",
      marginBottom: 4,
    },
    listBullet: {
      width: 14,
      fontSize: 10,
      color: primaryColor,
    },
    listText: {
      flex: 1,
      fontSize: 10,
      lineHeight: 1.6,
      color: "#1a1a1a",
    },
    codeBlock: {
      backgroundColor: "#f4f4f5",
      borderRadius: 4,
      padding: 10,
      marginBottom: 8,
      fontFamily: "Courier",
      fontSize: 8.5,
      color: "#1a1a1a",
    },
    hr: {
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      borderBottomStyle: "solid",
      marginVertical: 12,
    },

    // Doc footer (payment instructions + notes) — matches web .doc-footer
    docFooter: {
      flexDirection: "row",
      paddingHorizontal: 48,
      paddingTop: 18,
      gap: 24,
      borderTopWidth: 1,
      borderTopColor: "#ECECE7",
      borderTopStyle: "solid",
    },
    docFooterLeft: {
      flex: 1.2,
    },
    docFooterRight: {
      flex: 1,
    },
    docFooterTitle: {
      fontSize: 7.5,
      fontWeight: 600,
      letterSpacing: 0.9,
      color: "#898E96",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    docFooterPayLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    docFooterPayLabel: {
      fontSize: 8.5,
      color: "#898E96",
    },
    docFooterPayValue: {
      fontSize: 8.5,
      color: "#14161A",
      fontWeight: 600,
    },
    docFooterText: {
      fontSize: 8.5,
      color: "#54585F",
      lineHeight: 1.55,
    },

    // ZATCA Phase 1 QR block — KSA VAT invoices only
    zatcaBlock: {
      marginTop: 14,
      alignItems: "flex-end",
    },
    zatcaQr: {
      width: 86,
      height: 86,
    },
    zatcaLabel: {
      marginTop: 4,
      fontSize: 7,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: "#898E96",
    },

    // Page marker — matches web .page-num
    footer: {
      position: "absolute",
      bottom: 21,
      left: 48,
      right: 48,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      fontSize: 7.5,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: "#898E96",
    },

    // Legacy — kept for tiptap-to-pdf compatibility
    metaBlock: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    metaColumn: {
      flexDirection: "column",
      gap: 6,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
      borderBottomStyle: "solid",
      marginBottom: 20,
      opacity: 0.3,
    },
  });
}

export type PdfStyles = ReturnType<typeof makePdfStyles>;
