import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateBLReceipt = (bl) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(18);
  doc.text("RECU DE REGLEMENT - ATLANTIC TRANSIT", 105, 20, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text(`Référence BL: ${bl.numDeBl}`, 20, 40);
  doc.text(`Client: ${bl.client?.nom || "N/A"}`, 20, 45);
  doc.text(`Date: ${dateStr}`, 150, 40);

  // Table Data
  const tableRows = []; // On définit bien la variable ici

  // 1. Les charges
  bl.charges?.forEach((charge) => {
    const paiement = bl.paiements?.find((p) => p.chargeId === charge._id);
    tableRows.push([
      charge.designation,
      "1",
      paiement ? new Date(paiement.createdAt).toLocaleDateString() : "---",
      `${charge.montant?.toLocaleString() || 0} MRU`,
    ]);
  });

  // 2. La Marge
  tableRows.push([
    "Prestation de service ATLANTIC TRANSIT",
    "1",
    dateStr,
    `${bl.marge?.toLocaleString() || 0} MRU`,
  ]);

  // CORRECTION ICI : Utiliser autoTable(doc, options)
  autoTable(doc, {
    startY: 60,
    head: [["Désignation", "Qté", "Date Paiement", "Montant"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42] },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`TOTAL GENERAL: ${bl.total?.toLocaleString()} MRU`, 140, finalY);

  doc.save(`Recu_${bl.numDeBl}.pdf`);
};
