import "./index.css";
import App from "./App.jsx";
import { StrictMode } from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
);
