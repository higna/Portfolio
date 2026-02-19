import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router";
import { HomePage, AboutPage } from "./pages/Index";
import { ServicesPage } from "./pages/Content";
import { NavBar, Footer } from "./components/Bar";
import { useTheme } from "./context/ThemeContext";
import { ThemeProvider } from "./context/ThemeContext";

const AppLayout = () => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen">
      <div className="flex-1 flex flex-col">
        <NavBar theme={theme} setTheme={setTheme} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
};

export default App;
