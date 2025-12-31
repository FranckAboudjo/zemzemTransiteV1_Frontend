import React, { useState, useMemo, useEffect } from "react";
import {
  FolderPlus,
  FilePlus,
  Search,
  Grid,
  List,
  Folder,
  FileText,
  ChevronRight,
  Trash2,
  Edit3,
  Download,
  UploadCloud,
  X,
  HardDrive,
  File,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import API from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const handleFileAction = async (item) => {
  if (item.type === "folder") {
    handleFolderClick(item);
    return;
  }

  const ext = item.name.split(".").pop().toLowerCase();

  if (ext === "pdf" || ext === "txt") {
    try {
      // On demande le fichier via Axios (qui inclut le token automatiquement)
      const response = await API.get(
        `${API_PATHS.ARCHIVES.DOWNLOAD_FILE}/${item._id}`,
        {
          responseType: "blob", // Important pour gérer les fichiers binaires
        }
      );

      // Création d'un lien local vers le fichier téléchargé
      const file = new Blob([response.data], {
        type: ext === "pdf" ? "application/pdf" : "text/plain",
      });
      const fileURL = URL.createObjectURL(file);

      // Ouverture dans un nouvel onglet
      window.open(fileURL, "_blank");
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du fichier");
    }
  } else {
    handleDownload(item);
  }
};

// --- COMPOSANT : MODALE DE CONFIRMATION ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="size-16 bg-red-50 text-[#EF233C] rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 font-medium mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
          >
            Annuler
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-[#EF233C] text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Supprimer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT : MODALE DE SAISIE ---
const InputModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  defaultValue,
  loading,
}) => {
  const [value, setValue] = useState(defaultValue || "");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(value);
        }}
        className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300"
      >
        <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">
          {title}
        </h3>
        <input
          autoFocus
          className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#EF233C] rounded-2xl outline-none transition-all font-bold text-slate-700 mb-8"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#EF233C] text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Valider"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const Archives = () => {
  // States de Base
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // States de Navigation
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);

  // States des Modales
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: null, data: null });

  // --- CHARGEMENT ---
  const fetchItems = async (folderId = null) => {
    setLoading(true);
    try {
      const response = await API.get(API_PATHS.ARCHIVES.GET_ITEMS, {
        params: { parentId: folderId },
      });
      setItems(response.data);
    } catch (error) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentFolderId);
  }, [currentFolderId]);

  // --- NAVIGATION ---
  const handleFolderClick = (folder) => {
    setCurrentPath([...currentPath, { id: folder._id, name: folder.name }]);
    setCurrentFolderId(folder._id);
  };

  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      setCurrentPath([]);
      setCurrentFolderId(null);
    } else {
      const newPath = currentPath.slice(0, index + 1);
      setCurrentPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1].id);
    }
  };

  // --- ACTIONS API ---
  const executeAction = async (val) => {
    const { type, data } = modalConfig;
    setActionLoading(true);
    try {
      if (type === "createFolder") {
        await API.post(API_PATHS.ARCHIVES.CREATE_FOLDER, {
          name: val,
          parentId: currentFolderId,
        });
        toast.success("Dossier créé");
      } else if (type === "rename") {
        const url =
          data.type === "folder"
            ? `${API_PATHS.ARCHIVES.RENAME_FOLDER}/${data._id}`
            : `${API_PATHS.ARCHIVES.RENAME_FILE}/${data._id}`;
        await API.put(url, { newName: val });
        toast.success("Renommé");
      } else if (type === "delete") {
        const url =
          data.type === "folder"
            ? `${API_PATHS.ARCHIVES.DELETE_FOLDER}/${data._id}`
            : `${API_PATHS.ARCHIVES.DELETE_FILE}/${data._id}`;
        await API.delete(url);
        toast.success("Supprimé");
      }
      fetchItems(currentFolderId);
      setModalConfig({ type: null, data: null });
    } catch (e) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (item) => {
    const url =
      item.type === "folder"
        ? `${API_PATHS.ARCHIVES.DOWNLOAD_FOLDER}/${item._id}`
        : `${API_PATHS.ARCHIVES.DOWNLOAD_FILE}/${item._id}`;
    window.open(`${API.defaults.baseURL}${url}`, "_blank");
  };

  // --- UPLOAD ---
  const onDrop = async (acceptedFiles) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append("files", file));
    formData.append("parentId", currentFolderId || "null");

    setActionLoading(true);
    try {
      await API.post("/archives/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Importé avec succès");
      fetchItems(currentFolderId);
      setIsUploadModalOpen(false);
    } catch (e) {
      toast.error("Erreur lors de l'import");
    } finally {
      setActionLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 3145728,
  });

  // --- FILTRE ---
  const filteredItems = useMemo(
    () =>
      items.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [items, searchQuery]
  );

  // --- RENDER HELPERS ---
  const formatBytes = (b) => {
    if (!b) return "--";
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (
      parseFloat((b / Math.pow(1024, i)).toFixed(2)) +
      " " +
      ["B", "KB", "MB", "GB"][i]
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <HardDrive className="text-[#EF233C]" size={32} /> Gestion des
              Archives
            </h1>
            <p className="text-slate-500 font-medium">
              Espace sécurisé Atlantic Transit
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setModalConfig({ type: "createFolder", data: null })
              }
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <FolderPlus size={18} className="text-[#EF233C]" /> Dossier
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-[#EF233C] text-white rounded-xl font-black shadow-lg shadow-red-200 hover:scale-105 transition-all"
            >
              <FilePlus size={18} /> Importer
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher dans vos archives..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#EF233C] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid"
                  ? "bg-slate-100 text-[#EF233C]"
                  : "text-slate-400"
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list"
                  ? "bg-slate-100 text-[#EF233C]"
                  : "text-slate-400"
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* BREADCRUMBS */}
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <span
            onClick={() => navigateToBreadcrumb(-1)}
            className="hover:text-[#EF233C] cursor-pointer transition-colors"
          >
            Mes Archives
          </span>
          {currentPath.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              <ChevronRight size={14} />
              <span
                onClick={() => navigateToBreadcrumb(idx)}
                className="hover:text-[#EF233C] cursor-pointer transition-colors"
              >
                {folder.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* MAIN CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 italic">
            <Loader2 className="animate-spin mb-4" size={40} /> Chargement de
            vos documents...
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="group relative bg-white p-6 rounded-[32px] border border-slate-100 hover:border-[#EF233C] hover:shadow-xl transition-all cursor-pointer overflow-hidden"
              >
                <div
                  className="mb-4"
                  onClick={() =>
                    item.type === "folder" && handleFolderClick(item)
                  }
                >
                  {item.type === "folder" ? (
                    <Folder
                      size={40}
                      className="text-[#EF233C] fill-[#EF233C]/10"
                    />
                  ) : (
                    <FileText size={40} className="text-slate-400" />
                  )}
                </div>
                <h3 className="font-bold text-slate-900 truncate text-sm mb-1">
                  {item.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                  {item.type === "folder" ? "Dossier" : formatBytes(item.size)}
                </p>
                <div className="absolute inset-x-0 bottom-0 bg-[#EF233C] p-2 flex justify-around translate-y-full group-hover:translate-y-0 transition-transform">
                  <button
                    onClick={() =>
                      setModalConfig({ type: "delete", data: item })
                    }
                    className="text-white hover:scale-125 transition-transform"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setModalConfig({ type: "rename", data: item })
                    }
                    className="text-white hover:scale-125 transition-transform"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="text-white hover:scale-125 transition-transform"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">
                  <th className="px-8 py-4">Nom</th>
                  <th className="px-8 py-4">Taille</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50 transition-all group"
                  >
                    <td
                      className="px-8 py-4 font-bold text-slate-700 text-sm cursor-pointer"
                      onClick={() =>
                        item.type === "folder" && handleFolderClick(item)
                      }
                    >
                      <div className="flex items-center gap-3">
                        {item.type === "folder" ? (
                          <Folder size={18} className="text-[#EF233C]" />
                        ) : (
                          <File size={18} className="text-slate-400" />
                        )}
                        {item.name}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-xs text-slate-500 font-medium">
                      {formatBytes(item.size)}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() =>
                            setModalConfig({ type: "delete", data: item })
                          }
                          className="text-slate-400 hover:text-[#EF233C]"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() =>
                            setModalConfig({ type: "rename", data: item })
                          }
                          className="text-slate-400 hover:text-blue-500"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="text-slate-400 hover:text-slate-900"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALES CUSTOM */}
      <ConfirmModal
        isOpen={modalConfig.type === "delete"}
        title="Supprimer ?"
        message={`Voulez-vous supprimer "${modalConfig.data?.name}" ?`}
        loading={actionLoading}
        onClose={() => setModalConfig({ type: null, data: null })}
        onConfirm={() => executeAction()}
      />

      {(modalConfig.type === "createFolder" ||
        modalConfig.type === "rename") && (
        <InputModal
          isOpen={true}
          title={
            modalConfig.type === "createFolder" ? "Nouveau Dossier" : "Renommer"
          }
          defaultValue={modalConfig.data?.name || ""}
          loading={actionLoading}
          onClose={() => setModalConfig({ type: null, data: null })}
          onSubmit={(val) => executeAction(val)}
        />
      )}

      {/* MODALE UPLOAD */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-slate-900 uppercase text-xl">
                Importer
              </h4>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div
              {...getRootProps()}
              className={`border-4 border-dashed rounded-[32px] p-16 flex flex-col items-center justify-center transition-all cursor-pointer ${
                isDragActive
                  ? "border-[#EF233C] bg-red-50 text-[#EF233C]"
                  : "border-slate-100 bg-slate-50 hover:border-[#EF233C]"
              }`}
            >
              <input {...getInputProps()} />
              <div className="size-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
                <UploadCloud size={38} />
              </div>
              <p className="text-lg font-black text-slate-900">
                {isDragActive ? "Déposez ici !" : "Cliquez ou glissez"}
              </p>
              {actionLoading && (
                <Loader2 className="animate-spin mt-4 text-[#EF233C]" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archives;
