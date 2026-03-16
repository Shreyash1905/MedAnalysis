import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

const regionDataFallback = [
  { region: "North", patients: 320 },
  { region: "South", patients: 280 },
  { region: "East", patients: 410 },
  { region: "West", patients: 237 },
];

const AuthorityAnalytics = () => {
  const [trendData, setTrendData] = useState<{ month: string, reports: number }[]>([]);
  const [regionData, setRegionData] = useState(regionDataFallback);

  useEffect(() => {
    const qReports = query(collection(db, "MedicalReports"));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const monthCounts: Record<string, number> = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.date) {
            try {
                const m = format(new Date(data.date), "MMM");
                monthCounts[m] = (monthCounts[m] || 0) + 1;
            } catch (e) {}
        }
      });
      
      const chartData = Object.keys(monthCounts).map(k => ({ month: k, reports: monthCounts[k] }));
      // Sort by basic assuming current year (simplified sorting for demo)
      setTrendData(chartData.length > 0 ? chartData : [{ month: "No Data", reports: 0 }]);
    });
    
    return () => unsubscribeReports();
  }, []);

  return (
    <DashboardLayout role="authority" userName="Admin">
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" /> Healthcare Analytics
      </h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="dashboard-section">
          <h3 className="text-base font-semibold text-foreground mb-4">Patients by Region</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="region" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="patients" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-section">
          <h3 className="text-base font-semibold text-foreground mb-4">Reports Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="reports" stroke="hsl(160 84% 39%)" fill="hsl(160 84% 94%)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
};

export default AuthorityAnalytics;
