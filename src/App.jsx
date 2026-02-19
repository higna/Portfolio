import { useEffect } from "react";
import { useTheme } from "./context/ThemeContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NavBar, Footer } from "./layout";
import {
  Hero,
  About,
  Projects,
  Experience,
  Testimonials,
  Contact,
} from "./sections";

const AppLayout = () => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar theme={theme} setTheme={setTheme} />
      <main>
        <Hero />
        <About />
        <Projects />
        <Experience />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
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
