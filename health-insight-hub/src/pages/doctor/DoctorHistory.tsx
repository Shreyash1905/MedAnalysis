import DashboardLayout from "@/components/DashboardLayout";
import { History, Filter, Search, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subDays, subWeeks, subMonths, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

type FilterType = "all" | "day" | "week" | "month" | "custom";

const DoctorHistory = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;
    const qAnalysis = query(collection(db, "ReportAnalysis"), where("doctorId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(qAnalysis, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // @ts-ignore
      setRecords(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const filteredRecords = useMemo(() => {
    let result = records;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.patientName && r.patientName.toLowerCase().includes(q)) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
        (r.testNames && r.testNames.join(" ").toLowerCase().includes(q))
      );
    }

    // Date filter
    if (filterType !== "all") {
      const now = new Date();
      result = result.filter(r => {
        if (!r.date) return false;
        try {
          const recordDate = new Date(r.date);
          
          if (filterType === "day") {
            return isAfter(recordDate, subDays(now, 1));
          } else if (filterType === "week") {
            return isAfter(recordDate, subWeeks(now, 1));
          } else if (filterType === "month") {
            return isAfter(recordDate, subMonths(now, 1));
          } else if (filterType === "custom" && customStartDate && customEndDate) {
            const start = startOfDay(new Date(customStartDate));
            const end = endOfDay(new Date(customEndDate));
            return isAfter(recordDate, start) && isBefore(recordDate, end);
          }
        } catch (e) {
          return false;
        }
        return true;
      });
    }

    return result;
  }, [records, filterType, customStartDate, customEndDate, searchQuery]);

  if (!currentUser) return null;

  return (
    <DashboardLayout role="doctor" userName={currentUser.displayName || "Doctor User"}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="w-6 h-6 text-primary" /> Medical History
        </h2>

        <div className="dashboard-section space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by patient name, diagnosis, or test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="px-3 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm min-w-[160px]"
              >
                <option value="all">All Time</option>
                <option value="day">Previous Day</option>
                <option value="week">Previous Week</option>
                <option value="month">Previous Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {filterType === "custom" && (
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex-1">
                <label className="text-xs font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" /> Start Date
                </label>
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" /> End Date
                </label>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-section overflow-x-auto">
          <table className="table-medical">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Diagnosis</th>
                <th>Test</th>
                <th>Result</th>
                <th>Medication</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td className="text-foreground">{r.date ? new Date(r.date).toLocaleDateString() : "Unknown"}</td>
                    <td className="text-foreground font-medium">{r.patientName || "Unknown Patient"}</td>
                    <td className="text-foreground">{r.diagnosis || "No Diagnosis"}</td>
                    <td className="text-foreground">{r.testNames?.join(", ") || "N/A"}</td>
                    <td className="text-foreground max-w-[150px] truncate" title={r.testValues?.join(", ")}>{r.testValues?.join(", ") || "N/A"}</td>
                    <td className="text-foreground max-w-[150px] truncate" title={r.medications?.join(", ")}>{r.medications?.join(", ") || "None"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-muted/50" />
                        <p>No medical history records found for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHistory;
