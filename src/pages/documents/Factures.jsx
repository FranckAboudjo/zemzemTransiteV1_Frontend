import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Printer,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  FileText,
} from "lucide-react";
import Select from "react-select";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const Factures = () => {
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form State
  const [selectedClient, setSelectedClient] = useState(null);
  const [availableBLs, setAvailableBLs] = useState([]);
  const [availableExtras, setAvailableExtras] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTab, setActiveTab] = useState("bl");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFact, resCli] = await Promise.all([
        API.get(API_PATHS.FACTURATION.GET_ALL_FACTURATION),
        API.get(API_PATHS.CLIENTS.GET_ALL_CLIENTS),
      ]);
      setFactures(resFact.data?.data || []);
      setClients(
        resCli.data?.data?.map((c) => ({ value: c._id, label: c.nom, ...c })) ||
          []
      );
    } catch (err) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Charger les éléments facturables quand le client change
  const handleClientChange = async (option) => {
    setSelectedClient(option);
    setSelectedItems([]);
    try {
      const [resBl, resExtras] = await Promise.all([
        API.get(
          `${API_PATHS.BLS.GET_ALL_BL}?id_client=${option.value}&etatBl=Non Facturé`
        ),
        API.get(
          `${API_PATHS.FACTURATION_EXTRA.GET_ALL_BY_CLIENT.replace(
            ":id_client",
            option.value
          )}?statut=En attente`
        ),
      ]);
      setAvailableBLs(resBl.data?.data || []);
      setAvailableExtras(resExtras.data?.data || []);
    } catch (err) {
      toast.error(
        err.message || "Erreur lors de la récupération des éléments du client"
      );
    }
  };

  const toggleSelection = (item, type) => {
    const exists = selectedItems.find((i) => i.id === item._id);
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item._id));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: item._id,
          type: type,
          description:
            type === "BL" ? `Dossier BL: ${item.numBl}` : item.description,
          montant: type === "BL" ? item.montantFacturer : item.montant,
        },
      ]);
    }
  };

  const totalTTC = useMemo(
    () => selectedItems.reduce((acc, curr) => acc + curr.montant, 0),
    [selectedItems]
  );

  const handleCreateFacture = async () => {
    setSubmitting(true);
    try {
      const payload = {
        id_client: selectedClient.value,
        selection: selectedItems.map((i) => ({ id: i.id, type: i.type })),
        statut: "Validée",
      };
      await API.post(API_PATHS.FACTURATION.CREATE_FACTURATION, payload);
      toast.success("Facture créée avec succès");
      setShowPreview(false);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de création");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-red-600" /> Gestion des Factures
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
        >
          <Plus size={20} /> Nouvelle Facture
        </button>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-4">Numéro</th>
              <th className="p-4">Client</th>
              <th className="p-4">Date</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold">{f.numeroFacture}</td>
                <td className="p-4">{f.id_client?.nom}</td>
                <td className="p-4">
                  {new Date(f.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 font-bold">
                  {f.totalTTC?.toLocaleString()} MRU
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      f.statut === "Payée"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {f.statut}
                  </span>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button className="p-2 text-gray-600 hover:text-red-600">
                    <Printer size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm("Supprimer cette facture ?")) {
                        await API.delete(
                          API_PATHS.FACTURATION.DELETE_FACTURATION.replace(
                            ":id",
                            f._id
                          )
                        );
                        fetchData();
                      }
                    }}
                    className="p-2 text-gray-600 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de sélection des éléments */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Sélectionner les éléments à facturer
              </h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 ">
              <label className="block text-sm font-medium mb-2">
                Choisir le client
              </label>
              <Select
                options={clients}
                onChange={handleClientChange}
                placeholder="Rechercher un client..."
              />

              {selectedClient && (
                <div className="mt-6">
                  <div className="flex border-b mb-4">
                    <button
                      onClick={() => setActiveTab("bl")}
                      className={`px-4 py-2 ${
                        activeTab === "bl"
                          ? "border-b-2 border-red-600 text-red-600 font-bold"
                          : "text-gray-500"
                      }`}
                    >
                      Dossiers BL ({availableBLs.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("extra")}
                      className={`px-4 py-2 ${
                        activeTab === "extra"
                          ? "border-b-2 border-red-600 text-red-600 font-bold"
                          : "text-gray-500"
                      }`}
                    >
                      Frais Extras ({availableExtras.length})
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(activeTab === "bl" ? availableBLs : availableExtras).map(
                      (item) => (
                        <div
                          key={item._id}
                          onClick={() =>
                            toggleSelection(
                              item,
                              activeTab === "bl" ? "BL" : "FacturationExtra"
                            )
                          }
                          className={`p-4 border rounded-xl cursor-pointer flex justify-between items-center transition ${
                            selectedItems.find((i) => i.id === item._id)
                              ? "border-red-600 bg-red-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div>
                            <p className="font-bold">
                              {activeTab === "bl"
                                ? `BL: ${item.numBl}`
                                : item.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activeTab === "bl"
                                ? item.typeConteneur
                                : "Frais additionnel"}
                            </p>
                          </div>
                          <p className="font-bold">
                            {(activeTab === "bl"
                              ? item.montantFacturer
                              : item.montant
                            )?.toLocaleString()}{" "}
                            MRU
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total sélectionné</p>
                <p className="text-2xl font-bold text-red-600">
                  {totalTTC.toLocaleString()} MRU
                </p>
              </div>
              <button
                disabled={selectedItems.length === 0}
                onClick={() => setShowPreview(true)}
                className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
              >
                Générer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aperçu final */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8">
            <h2 className="text-2xl font-black mb-6 text-center underline">
              APERÇU DE LA FACTURE
            </h2>
            <div className="mb-6 space-y-1">
              <p>
                <strong>Client :</strong> {selectedClient.nom}
              </p>
              <p>
                <strong>Date :</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
            <table className="w-full mb-6">
              <thead className="border-b-2 border-black">
                <tr>
                  <th className="text-left py-2">Désignation</th>
                  <th className="text-right py-2">Montant</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">
                      {item.montant.toLocaleString()} MRU
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-4 font-black text-lg">TOTAL TTC</td>
                  <td className="py-4 text-right font-black text-lg text-red-600">
                    {totalTTC.toLocaleString()} MRU
                  </td>
                </tr>
              </tfoot>
            </table>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-gray-200 py-3 rounded-xl font-bold"
              >
                Retour
              </button>
              <button
                onClick={handleCreateFacture}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CheckCircle />
                )}{" "}
                Confirmer & Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Factures;
