import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, FileText, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

const COLORS = ["hsl(160 84% 39%)", "hsl(25 95% 53%)", "hsl(0 84% 60%)"];

const AuthorityDashboard = () => {
  const [totalPatients, setTotalPatients] = useState(0);
  const [reportsUploaded, setReportsUploaded] = useState(0);
  const [reportAnalysis, setReportAnalysis] = useState([
    { name: "Analyzed", value: 0 },
    { name: "Pending", value: 0 },
    { name: "Failed", value: 0 },
  ]);
  const [monthlyData, setMonthlyData] = useState<{ month: string, cases: number }[]>([]);
  const [diseaseData, setDiseaseData] = useState<any[]>([]);

  useEffect(() => {
    const qPatients = query(collection(db, "Users"), where("role", "==", "Patient"));
    const unsubscribePatients = onSnapshot(qPatients, (snapshot) => {
      setTotalPatients(snapshot.docs.length);
    });

    const qReports = query(collection(db, "MedicalReports"));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      setReportsUploaded(snapshot.docs.length);
      let analyzed = 0;
      let pending = 0;
      let failed = 0;
      const monthCounts: Record<string, number> = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "Analyzed") analyzed++;
        else if (data.status === "Failed") failed++;
        else pending++;

        if (data.date) {
            try {
                const m = format(new Date(data.date), "MMM");
                monthCounts[m] = (monthCounts[m] || 0) + 1;
            } catch (e) {}
        }
      });
      setReportAnalysis([
        { name: "Analyzed", value: analyzed },
        { name: "Pending", value: pending },
        { name: "Failed", value: failed },
      ]);

      const mChart = Object.keys(monthCounts).map(k => ({ month: k, cases: monthCounts[k] }));
      setMonthlyData(mChart);
    });

    const qAnalysis = query(collection(db, "ReportAnalysis"));
    const unsubscribeAnalysis = onSnapshot(qAnalysis, (snapshot) => {
      const diagMap: Record<string, any> = {};
      snapshot.forEach(doc => {
          const data = doc.data();
          if (data.date && data.diagnosis) {
              try {
                  const m = format(new Date(data.date), "MMM");
                  if (!diagMap[m]) diagMap[m] = { month: m, diabetes: 0, anemia: 0, infections: 0, cardiac: 0, other: 0 };
                  const diag = data.diagnosis.toLowerCase();
                  if (diag.includes("diabet")) diagMap[m].diabetes++;
                  else if (diag.includes("anemia")) diagMap[m].anemia++;
                  else if (diag.includes("infect")) diagMap[m].infections++;
                  else if (diag.includes("cardia") || diag.includes("heart")) diagMap[m].cardiac++;
                  else diagMap[m].other++;
              } catch(e) {}
          }
      });
      setDiseaseData(Object.values(diagMap));
    });

    return () => {
      unsubscribePatients();
      unsubscribeReports();
      unsubscribeAnalysis();
    };
  }, []);

const COLORS = ["hsl(160 84% 39%)", "hsl(25 95% 53%)", "hsl(0 84% 60%)"];

  return (
  <DashboardLayout role="authority" userName="Admin">
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Authority Dashboard</h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Patients" value={totalPatients} variant="blue" />
        <StatCard icon={FileText} label="Reports Uploaded" value={reportsUploaded} variant="orange" />
        <StatCard icon={CheckCircle} label="Reports Analyzed" value={reportAnalysis[0].value} variant="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="dashboard-section">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Disease Trend
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={diseaseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="diabetes" stroke="hsl(217 91% 60%)" strokeWidth={2} name="Diabetes" />
              <Line type="monotone" dataKey="anemia" stroke="hsl(160 84% 39%)" strokeWidth={2} name="Anemia" />
              <Line type="monotone" dataKey="infections" stroke="hsl(25 95% 53%)" strokeWidth={2} name="Infections" />
              <Line type="monotone" dataKey="cardiac" stroke="hsl(0 84% 60%)" strokeWidth={2} name="Cardiac" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-section">
          <h3 className="text-base font-semibold text-foreground mb-4">Monthly Cases</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cases" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-section lg:col-span-2">
          <h3 className="text-base font-semibold text-foreground mb-4">Report Analysis Status</h3>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={reportAnalysis} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {reportAnalysis.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {reportAnalysis.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-sm text-foreground">{item.name}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
};

export default AuthorityDashboard;
