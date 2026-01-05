import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// PALETTE ÉPURÉE ZEMZEM
const COLORS = {
  PRIMARY_RED: "#EF233C",
  DARK_BLUE: "#2B2D42",
  LIGHT_BLUE: "#8D99AE",
  SOFT_GRAY: "#F3F4F6",
  BORDER: "#E5E7EB",
  TEXT_MAIN: "#1F2937",
  WHITE: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.TEXT_MAIN,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    paddingBottom: 20,
  },
  logo: { width: 130 },
  titleContainer: { textAlign: "right" },
  mainTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.DARK_BLUE,
    textTransform: "uppercase",
  },
  referenceText: {
    fontSize: 10,
    marginTop: 4,
    color: COLORS.PRIMARY_RED,
    fontWeight: "bold",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  infoBox: {
    width: "45%",
  },
  label: {
    fontSize: 8,
    color: COLORS.LIGHT_BLUE,
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "bold",
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.DARK_BLUE,
  },
  // Tableau épuré
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.DARK_BLUE,
    paddingBottom: 8,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SOFT_GRAY,
    alignItems: "center",
  },
  colDesc: { flex: 3 },
  colAmount: { flex: 1, textAlign: "right" },

  totalContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalBox: {
    width: "40%",
    backgroundColor: COLORS.DARK_BLUE,
    padding: 12,
    borderRadius: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { color: COLORS.WHITE, fontSize: 9, fontWeight: "bold" },
  totalValue: { color: COLORS.WHITE, fontSize: 13, fontWeight: "bold" },

  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 80,
  },
  signatureBox: {
    width: "40%",
    textAlign: "center",
  },
  signatureSpace: {
    height: 70,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    marginBottom: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.SOFT_GRAY,
    paddingTop: 15,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.LIGHT_BLUE,
    lineHeight: 1.5,
  },
});

const BordereauVersement = ({ data }) => {
  // Formatage propre : 20 000 MRU
  const formatMRU = (amount) => {
    return new Intl.NumberFormat("fr-FR").format(amount || 0) + " MRU";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image src="/assets/logo.png" style={styles.logo} />
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Bordereau de Versement</Text>
            <Text style={styles.referenceText}>
              REF : {data.reference || "N/A"}
            </Text>
          </View>
        </View>

        {/* INFOS CLIENT & DATE */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>
              {data.idClient?.nom || "Client Divers"}
            </Text>
            <Text style={{ fontSize: 9, marginTop: 2 }}>
              {data.idClient?.contact || ""}
            </Text>
          </View>
          <View style={[styles.infoBox, { textAlign: "right" }]}>
            <Text style={styles.label}>Date de l'opération</Text>
            <Text style={styles.value}>
              {new Date(data.date).toLocaleDateString("fr-FR")} à{" "}
              {new Date(data.date).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <Text
              style={{ fontSize: 9, marginTop: 2, color: COLORS.PRIMARY_RED }}
            >
              Versement à la caisse
            </Text>
          </View>
        </View>

        {/* TABLEAU */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.label, styles.colDesc]}>Désignation</Text>
            <Text style={[styles.label, styles.colAmount]}>Montant</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={{ fontWeight: "bold", fontSize: 11 }}>
                Versement sur compte
              </Text>
              <Text
                style={{ fontSize: 9, color: COLORS.LIGHT_BLUE, marginTop: 3 }}
              >
                {data.description || "Aucune description"}
              </Text>
            </View>
            <Text
              style={[styles.colAmount, { fontWeight: "bold", fontSize: 11 }]}
            >
              {data.montant} MRU
            </Text>
          </View>
        </View>

        {/* TOTAL */}
        <View style={styles.totalContainer}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{data.montant} MRU </Text>
          </View>
        </View>

        <Text
          style={{
            marginTop: 15,
            fontSize: 8,
            fontStyle: "italic",
            color: COLORS.LIGHT_BLUE,
          }}
        >
          Arrêté le présent bordereau à la somme de : {data.montant} MRU
        </Text>

        {/* SIGNATURES */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.label}>Signature Client</Text>
            <View style={styles.signatureSpace} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.label}>Le Caissier (Cachet)</Text>
            <View style={styles.signatureSpace} />
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { fontWeight: "bold", color: COLORS.DARK_BLUE },
            ]}
          >
            ZEMZEM GROUP - TRANSIT & LOGISTIQUE
          </Text>
          <Text style={styles.footerText}>
            Tevragh Zeina Ilot 1, Nouakchott, Mauritanie | +222 20 70 11 64
          </Text>
          <Text style={[styles.footerText, { marginTop: 5, fontSize: 6 }]}>
            ID Transaction : {data._id}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default BordereauVersement;
