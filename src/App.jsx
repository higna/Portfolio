import { useEffect } from "react";
import { Route, Routes } from "react-router";
import { useTheme } from "./context/ThemeContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NavBar, Footer } from "./components";
import { HomePage } from "./pages";

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
