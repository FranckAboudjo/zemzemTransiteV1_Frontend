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
    color: COLORS.PRIMARY_RED,
    textTransform: "uppercase",
  },
  refText: { fontSize: 9, color: COLORS.LIGHT_BLUE, marginTop: 4 },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "black",
    color: COLORS.LIGHT_BLUE,
    textTransform: "uppercase",
    tracking: 1.5,
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.BORDER,
    paddingBottom: 3,
  },
  row: { flexDirection: "row", marginBottom: 8 },
  label: {
    width: 120,
    fontSize: 8,
    color: COLORS.LIGHT_BLUE,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  value: { flex: 1, fontSize: 10, fontWeight: "bold", color: COLORS.DARK_BLUE },
  amountBox: {
    backgroundColor: COLORS.SOFT_GRAY,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: "black",
    color: COLORS.DARK_BLUE,
    textTransform: "uppercase",
  },
  totalValue: { fontSize: 16, fontWeight: "black", color: COLORS.PRIMARY_RED },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.BORDER,
    paddingTop: 15,
    textAlign: "center",
  },
  footerText: { fontSize: 7, color: COLORS.LIGHT_BLUE, marginBottom: 2 },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.BORDER,
    paddingTop: 10,
  },
  signatureSpace: { height: 60 },
});

const BordereauRetrait = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "black",
              color: COLORS.PRIMARY_RED,
            }}
          >
            ZEMZEM
          </Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Bordereau de Retrait</Text>
          <Text style={styles.refText}>Réf: {data.reference}</Text>
          <Text style={styles.refText}>
            Date: {new Date(data.date).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bénéficiaire</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom du Client :</Text>
          <Text style={styles.value}>
            {data.idClient?.nom || "Client non spécifié"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mode de Paiement :</Text>
          <Text style={styles.value}>{data.modePaiement || "Espèces"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails de la Transaction</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Motif :</Text>
          <Text style={styles.value}>
            {data.description || "Retrait de fonds"}
          </Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.totalLabel}>Montant Décaissé</Text>
          <Text style={styles.totalValue}>
            {data.montant?.toLocaleString()} MRU
          </Text>
        </View>
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.label}>Décharge Client (Signature)</Text>
          <View style={styles.signatureSpace} />
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.label}>Autorisation Caisse</Text>
          <View style={styles.signatureSpace} />
        </View>
      </View>

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
      </View>
    </Page>
  </Document>
);

export default BordereauRetrait;
