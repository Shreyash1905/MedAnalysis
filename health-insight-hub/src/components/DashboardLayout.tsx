import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Upload, History, Users, Brain, BarChart3,
  QrCode, LogOut, Menu, X, Video
} from "lucide-react";
import Logo from "./Logo";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "patient" | "doctor" | "authority";
  userName?: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "" },
  { icon: Upload, label: "Upload Report", path: "/upload", roles: ["patient", "doctor"] },
  { icon: History, label: "Medical History", path: "/history", roles: ["patient", "doctor"] },
  { icon: Users, label: "Patients", path: "/patients", roles: ["doctor", "authority"] },
  { icon: Brain, label: "AI Report Analysis", path: "/analysis", roles: ["doctor"] },
  { icon: Video, label: "Telemedicine", path: "/consultation", roles: ["doctor"] },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: QrCode, label: "Emergency QR", path: "/emergency-qr", roles: ["patient"] },
];

const DashboardLayout = ({ children, role, userName = "User" }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = `/${role}`;

  const filteredMenu = menuItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 -ml-64"
        } lg:w-64 lg:ml-0 fixed lg:relative z-30 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <Logo className="w-7 h-7 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">MedAnalysis</h1>
            <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => {
            const fullPath = basePath + item.path;
            const isActive = location.pathname === fullPath || (item.path === "" && location.pathname === basePath);
            return (
              <button
                key={item.label}
                onClick={() => { 
                  if (item.label === "AI Report Analysis") {
                    window.location.href = "https://9000-firebase-studio-1773453306487.cluster-edb2jv34dnhjisxuq5m7l37ccy.cloudworkstations.dev";
                  } else {
                    navigate(fullPath); 
                  }
                  setSidebarOpen(false); 
                }}
                className={`nav-item w-full ${isActive ? "active" : ""}`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <button onClick={handleLogout} className="nav-item w-full text-medical-red hover:bg-medical-light-red">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-foreground">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <h2 className="text-sm font-semibold text-foreground truncate">MedAnalysis – Automated Medical Report Analysis System</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {userName[0]}
            </div>
            <span className="text-sm font-medium text-foreground">{userName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
