import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ["hsl(217 91% 60%)", "hsl(160 84% 39%)", "hsl(25 95% 53%)", "hsl(0 84% 60%)", "hsl(215 15% 50%)"];

const DoctorAnalytics = () => {
  const { currentUser } = useAuth();
  const [weeklyData, setWeeklyData] = useState<{ day: string, analyzed: number }[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<{ name: string, value: number }[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const qAnalysis = query(collection(db, "ReportAnalysis"), where("doctorId", "==", currentUser.uid));
    const unsubscribeAnalysis = onSnapshot(qAnalysis, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      
      const dayCounts: Record<string, number> = {};
      const diagCounts: Record<string, number> = {};

      data.forEach(item => {
        // Process day counts
        if (item.date) {
            try {
                const day = format(new Date(item.date), "EEE"); // Mon, Tue, etc.
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            } catch (e) {}
        }
        // Process diagnosis counts
        if (item.diagnosis) {
            diagCounts[item.diagnosis] = (diagCounts[item.diagnosis] || 0) + 1;
        }
      });

      // Format weekly data
      const weekChart = Object.keys(dayCounts).map(k => ({ day: k, analyzed: dayCounts[k] }));
      setWeeklyData(weekChart);

      // Format diagnosis data
      const diagChart = Object.keys(diagCounts).map(k => ({ name: k, value: diagCounts[k] }));
      setDiagnosisData(diagChart);
    });

    return () => unsubscribeAnalysis();
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  return (
    <DashboardLayout role="doctor" userName={currentUser.displayName || "Doctor User"}>
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" /> Analytics
      </h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="dashboard-section">
          <h3 className="text-base font-semibold text-foreground mb-4">Reports Analyzed This Week</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="analyzed" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-section">
          <h3 className="text-base font-semibold text-foreground mb-4">Diagnosis Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={diagnosisData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {diagnosisData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
};

export default DoctorAnalytics;
