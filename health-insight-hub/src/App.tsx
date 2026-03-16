import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientUpload from "./pages/patient/PatientUpload";
import MedicalHistory from "./pages/patient/MedicalHistory";
import PatientAnalytics from "./pages/patient/PatientAnalytics";
import EmergencyQR from "./pages/patient/EmergencyQR";

// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAnalysis from "./pages/doctor/DoctorAnalysis";
import DoctorHistory from "./pages/doctor/DoctorHistory";
import DoctorUpload from "./pages/doctor/DoctorUpload";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorAnalytics from "./pages/doctor/DoctorAnalytics";
import DoctorConsultation from "./pages/doctor/DoctorConsultation";

// Authority pages
import AuthorityDashboard from "./pages/authority/AuthorityDashboard";
import AuthorityPatients from "./pages/authority/AuthorityPatients";
import AuthorityAnalytics from "./pages/authority/AuthorityAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Patient routes */}
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/patient/upload" element={<PatientUpload />} />
          <Route path="/patient/history" element={<MedicalHistory />} />
          <Route path="/patient/analytics" element={<PatientAnalytics />} />
          <Route path="/patient/emergency-qr" element={<EmergencyQR />} />

          {/* Doctor routes */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/analysis" element={<DoctorAnalysis />} />
          <Route path="/doctor/history" element={<DoctorHistory />} />
          <Route path="/doctor/upload" element={<DoctorUpload />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/analytics" element={<DoctorAnalytics />} />
          <Route path="/doctor/consultation" element={<DoctorConsultation />} />

          {/* Authority routes */}
          <Route path="/authority" element={<AuthorityDashboard />} />
          <Route path="/authority/patients" element={<AuthorityPatients />} />
          <Route path="/authority/analytics" element={<AuthorityAnalytics />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
