import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/ui/Toast"; // Ajuste le chemin

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  // useCallback pour éviter de recréer la fonction à chaque rendu
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </ToastContext.Provider>
  );
};

// Hook personnalisé pour utiliser le toast facilement
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(
      "useToast doit être utilisé à l'intérieur de ToastProvider"
    );
  }
  return context;
};
