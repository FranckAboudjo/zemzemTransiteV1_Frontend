import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 6000,
        style: {
          // Utilisation du blanc pur et de la police Rubik pour le corps du texte
          background: "#FFFFFF",
          color: "#101828", // Couleur secondaire (très sombre) pour le texte
          fontFamily: "'Rubik', sans-serif",
          borderRadius: "12px",
          padding: "16px",
          maxWidth: "400px",
          fontSize: "14px",
          fontWeight: "400",
          border: "1px solid #E2E8F0", // Bordure subtile pour le look "card"
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        },
        success: {
          // Utilisation du vert émeraude (proche de l'image de notification)
          iconTheme: {
            primary: "#10B981",
            secondary: "#FFFFFF",
          },
          style: {
            borderLeft: "6px solid #10B981", // Accentuation latérale comme sur l'image
          },
        },
        error: {
          // Utilisation du rouge corail de la palette (#EF233C)
          iconTheme: {
            primary: "#EF233C",
            secondary: "#FFFFFF",
          },
          style: {
            borderLeft: "6px solid #EF233C",
          },
        },
      }}
    />
  </StrictMode>
);
