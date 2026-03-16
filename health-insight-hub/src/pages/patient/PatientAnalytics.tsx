import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const PatientAnalytics = () => {
  const { currentUser } = useAuth();
  const [monthlyData, setMonthlyData] = useState<{ month: string, reports: number }[]>([]);
  const [healthData, setHealthData] = useState<{ month: string, hb: number, sugar: number }[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const qReports = query(collection(db, "MedicalReports"), where("patientId", "==", currentUser.uid));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const reports = snapshot.docs.map(doc => doc.data());
      
      const counts: Record<string, number> = {};
      reports.forEach(r => {
        if (r.date) {
          try {
            const m = format(new Date(r.date), "MMM");
            counts[m] = (counts[m] || 0) + 1;
          } catch (e) { }
        }
      });
      
      const chartData = Object.keys(counts).map(k => ({ month: k, reports: counts[k] }));
      setMonthlyData(chartData);
    });

    const qAnalysis = query(collection(db, "ReportAnalysis"), where("patientId", "==", currentUser.uid));
    const unsubscribeAnalysis = onSnapshot(qAnalysis, (snapshot) => {
      // In a real scenario, this extracts metrics from NLP output.
      // We will provide an empty or derived structure.
      const analysis = snapshot.docs.map(doc => doc.data());
      const trends: Record<string, any> = {};
      analysis.forEach(a => {
         if (a.date) {
           try {
             const m = format(new Date(a.date), "MMM");
             if (!trends[m]) trends[m] = { month: m, hb: 0, sugar: 0, count: 0 };
             // Use mocked metrics parsed from real data if available, else fake 0.
             // Assume a.metrics object exists in a real app, e.g., { hb: 12, sugar: 110 }
             trends[m].hb += (a.metrics?.hb || 0);
             trends[m].sugar += (a.metrics?.sugar || 0);
             trends[m].count += 1;
           } catch (e) {}
         }
      });
      const healthChart = Object.values(trends).map(t => ({
        month: t.month,
        hb: t.count > 0 ? t.hb / t.count : 0,
        sugar: t.count > 0 ? t.sugar / t.count : 0
      }));
      setHealthData(healthChart);
    });

    return () => {
      unsubscribeReports();
      unsubscribeAnalysis();
    };
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  return (
    <DashboardLayout role="patient" userName={currentUser.displayName || "Patient User"}>
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" /> My Analytics
      </h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="dashboard-section">
          <h3 className="text-base font-semibold text-foreground mb-4">Monthly Reports</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="reports" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-section">
          <h3 className="text-base font-semibold text-foreground mb-4">Health Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="hb" stroke="hsl(217 91% 60%)" strokeWidth={2} name="Hemoglobin" />
              <Line type="monotone" dataKey="sugar" stroke="hsl(160 84% 39%)" strokeWidth={2} name="Blood Sugar" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
};

export default PatientAnalytics;
