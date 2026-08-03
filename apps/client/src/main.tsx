import "./styles/global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          containerStyle={{ top: 80, right: 10 }}
          toastOptions={{
            duration: 2000,
            style: {
              minHeight: "50px",
              background: "#ffffff", 
              color: "#1f2937",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
            className: "progress-bar-toast",
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
