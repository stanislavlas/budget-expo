import { StyleSheet } from "react-native";

export const C = {
  // Brand
  green:        "#1D9E75",
  greenLight:   "#E1F5EE",
  greenDark:    "#0F6E56",
  greenBorder:  "#5DCAA5",
  red:          "#D85A30",
  redLight:     "#FAECE7",
  redDark:      "#993C1D",
  redBorder:    "#F0997B",
  amber:        "#EF9F27",
  blue:         "#378ADD",
  // Neutral
  bg:           "#FFFFFF",
  bgSecondary:  "#F5F5F3",
  bgTertiary:   "#EBEBEA",
  text:         "#1A1A18",
  textSecondary:"#6B6B68",
  textTertiary: "#A3A3A0",
  border:       "rgba(0,0,0,0.1)",
  borderMed:    "rgba(0,0,0,0.15)",
};

export const FONTS = {
  regular:  "System",
  mono:     "Courier",
};

export const S = StyleSheet.create({
  // Layout
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  pad:    { paddingHorizontal: 20 },

  // Typography
  h1:     { fontSize: 28, fontWeight: "700", color: C.text, letterSpacing: -0.5 },
  h2:     { fontSize: 20, fontWeight: "700", color: C.text, letterSpacing: -0.3 },
  h3:     { fontSize: 16, fontWeight: "600", color: C.text },
  body:   { fontSize: 15, fontWeight: "400", color: C.text, lineHeight: 22 },
  small:  { fontSize: 13, fontWeight: "400", color: C.textSecondary },
  label:  { fontSize: 11, fontWeight: "600", color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.8 },
  mono:   { fontFamily: FONTS.mono },

  // Card
  card: {
    backgroundColor: C.bg,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },

  // Input
  input: {
    backgroundColor: C.bgSecondary,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.borderMed,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
    marginBottom: 12,
  },

  // Buttons
  btnPrimary: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // Row
  row:         { flexDirection: "row", alignItems: "center" },
  rowBetween:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  // Divider
  divider: { height: 0.5, backgroundColor: C.border },

  // Section title
  sectionTitle: { fontSize: 11, fontWeight: "600", color: C.textTertiary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
});

export function fmt(n) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
}

export const MONTH_LABELS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const MONTH_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
