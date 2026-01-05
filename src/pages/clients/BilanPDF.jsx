import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const COLORS = {
  PRIMARY_RED: "#EF233C",
  DARK_BLUE: "#2B2D42",
  SLATE_BLUE: "#8D99AE",
  LIGHT_BG: "#F8F9FA",
  BORDER: "#EDF2F4",
  WHITE: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.DARK_BLUE,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY_RED,
    paddingBottom: 15,
  },
  logo: { width: 120 },
  titleContainer: { textAlign: "right" },
  mainTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: COLORS.DARK_BLUE,
  },
  periodText: { fontSize: 9, marginTop: 4, color: COLORS.SLATE_BLUE },

  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  clientBox: {
    padding: 10,
    backgroundColor: COLORS.LIGHT_BG,
    width: "45%",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.DARK_BLUE,
  },

  table: { marginTop: 10 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.DARK_BLUE,
    color: COLORS.WHITE,
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    padding: 8,
  },
  colDate: { width: "20%" },
  colDesc: { width: "40%" },
  colAmount: { width: "20%", textAlign: "right" },

  summarySection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  summaryBox: {
    width: "40%",
    backgroundColor: COLORS.DARK_BLUE,
    padding: 10,
    color: COLORS.WHITE,
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  finalBalance: {
    borderTopWidth: 1,
    borderTopColor: COLORS.WHITE,
    marginTop: 5,
    paddingTop: 5,
    fontWeight: "bold",
  },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 10,
    fontSize: 7,
    color: COLORS.SLATE_BLUE,
  },
});

const BilanPDF = ({ data, client, period, bilanSummary }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image src="/assets/logo.png" style={styles.logo} />
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Extrait de Compte / Bilan</Text>
          <Text style={styles.periodText}>
            Période : {period.start} au {period.end}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.clientBox}>
          <Text
            style={{ fontSize: 7, color: COLORS.SLATE_BLUE, marginBottom: 2 }}
          >
            CLIENT
          </Text>
          <Text style={{ fontWeight: "bold" }}>{client?.nom}</Text>
          <Text>{client?.telephone || client?.contact}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDate}>Date</Text>
          <Text style={styles.colDesc}>Désignation</Text>
          <Text style={styles.colAmount}>Débit (-)</Text>
          <Text style={styles.colAmount}>Crédit (+)</Text>
        </View>

        {/* Ligne Report */}
        <View style={[styles.tableRow, { backgroundColor: "#FDFDFD" }]}>
          <Text style={styles.colDate}>---</Text>
          <Text style={[styles.colDesc, { fontWeight: "bold" }]}>
            REPORT SOLDE ANTÉRIEUR
          </Text>
          <Text style={styles.colAmount}>{bilanSummary.initial}</Text>
          <Text style={styles.colAmount}>-</Text>
        </View>

        {data.map((t, i) => {
          const isCredit = t.typeOperation?.toLowerCase().includes("credit");
          return (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDate}>
                {new Date(t.date).toLocaleDateString()}
              </Text>
              <Text style={styles.colDesc}>{t.description}</Text>
              <Text style={styles.colAmount}>
                {!isCredit ? t.montant : "-"}
              </Text>
              <Text style={styles.colAmount}>{isCredit ? t.montant : "-"}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryLine}>
            <Text>Total Débit:</Text>
            <Text>{bilanSummary.debit}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text>Total Crédit:</Text>
            <Text>{bilanSummary.credit}</Text>
          </View>
          <View style={[styles.summaryLine, styles.finalBalance]}>
            <Text>SOLDE FINAL:</Text>
            <Text>{bilanSummary.final}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>
          ZEMZEM GROUP - Tevragh Zeina Ilot 1, Nouakchott - Tel: +222 20 70 11
          64
        </Text>
      </View>
    </Page>
  </Document>
);

export default BilanPDF;
