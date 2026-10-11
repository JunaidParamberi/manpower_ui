import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { UserExportBundle } from "@/lib/account/export-data";
import { summarizeBundle } from "@/lib/account/export-data";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 40,
    color: "#14161A",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: "#5C6370",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
    paddingVertical: 6,
  },
  label: {
    color: "#3B4048",
  },
  count: {
    fontWeight: 700,
  },
  footer: {
    marginTop: 24,
    fontSize: 9,
    color: "#5C6370",
    lineHeight: 1.4,
  },
});

type Props = {
  bundle: UserExportBundle;
  email: string | null;
};

export function AccountExportPdf({ bundle, email }: Props) {
  const summary = summarizeBundle(bundle);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Manpower data export</Text>
        <Text style={styles.subtitle}>
          Account: {email ?? bundle.userId} · Exported {bundle.exportedAt}
        </Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        {summary.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.count}>{item.count}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Profile</Text>
        <Text>
          {bundle.profile?.full_name
            ? String(bundle.profile.full_name)
            : "No name on file"}
          {bundle.profile?.company_name
            ? ` · ${String(bundle.profile.company_name)}`
            : ""}
        </Text>

        <Text style={styles.footer}>
          This PDF is a human-readable summary. For a complete machine-readable
          copy of your data, export as JSON or CSV from Settings → Account.
        </Text>
      </Page>
    </Document>
  );
}
