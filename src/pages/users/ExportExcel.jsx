import * as XLSX from "xlsx";

export const exportToExcel = (transactions, userName) => {
  // Préparation des données pour Excel
  const dataToExport = transactions.map((t) => ({
    Date: new Date(t.date).toLocaleDateString("fr-FR"),
    Heure: new Date(t.date).toLocaleTimeString("fr-FR"),
    Désignation: t.description,
    Type: t.type,
    "Numéro Dossier": t.id_bl?.numBl || "N/A",
    Montant: t.montant,
    "Solde Après": t.soldeApres,
  }));

  // Création du classeur
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Historique");

  // Ajustement automatique de la largeur des colonnes
  const wscols = [
    { wch: 15 },
    { wch: 10 },
    { wch: 40 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  worksheet["!cols"] = wscols;

  // Téléchargement
  XLSX.writeFile(
    workbook,
    `Historique_${userName}_${new Date().toLocaleDateString()}.xlsx`
  );
};
