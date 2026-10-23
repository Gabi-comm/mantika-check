import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import { Home } from "./pages/public/Home";
import { Features } from "./pages/public/Features";
import { Methodology } from "./pages/public/Methodology";
import { About } from "./pages/public/About";
import { Dashboard } from "./pages/app/Dashboard";
import { Analyze } from "./pages/app/Analyze";
import { Results } from "./pages/app/Results";
import { History } from "./pages/app/History";
import { Reference } from "./pages/app/Reference";
import { Settings } from "./pages/app/Settings";

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/about" element={<About />} />
          </Route>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analyze" element={<Analyze />} />
            <Route path="results" element={<Results />} />
            <Route path="history" element={<History />} />
            <Route path="reference" element={<Reference />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
