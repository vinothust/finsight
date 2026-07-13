import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { RoleSwitcher } from "./components/RoleSwitcher";
import { RoleProvider } from "./context/RoleContext";
import { AskFinSight } from "./pages/AskFinSight";
import { Dashboard } from "./pages/Dashboard";
import { Insights } from "./pages/Insights";
import { Scorecards } from "./pages/Scorecards";
import { Uploads } from "./pages/Uploads";
import { Utilization } from "./pages/Utilization";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/utilization", label: "Utilization" },
  { to: "/scorecards", label: "Scorecards" },
  { to: "/insights", label: "Insights" },
  { to: "/ask", label: "Ask FinSight" },
  { to: "/uploads", label: "Uploads" },
];

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
          <span className="font-semibold text-lg">FinSight</span>
          <nav className="flex gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "font-medium text-blue-600" : "text-slate-600")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <RoleSwitcher />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/utilization" element={<Utilization />} />
            <Route path="/scorecards" element={<Scorecards />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/ask" element={<AskFinSight />} />
            <Route path="/uploads" element={<Uploads />} />
          </Routes>
        </main>
      </BrowserRouter>
    </RoleProvider>
  );
}
