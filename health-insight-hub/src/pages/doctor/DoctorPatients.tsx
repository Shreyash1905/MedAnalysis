import DashboardLayout from "@/components/DashboardLayout";
import { Users, Eye, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type FilterType = "all" | "day" | "7days" | "30days" | "custom";

const DoctorPatients = () => {
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [customDate, setCustomDate] = useState("");
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    // Fetch History Analyses
    const qAnalysis = query(collection(db, "ReportAnalysis"), where("doctorId", "==", currentUser.uid));
    const unsubscribeAnalysis = onSnapshot(qAnalysis, (snapshot) => {
      setAnalyses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(collection(db, "Users"), where("role", "==", "Patient"));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Doctor's Assigned Patients directly
    const qAssigned = query(collection(db, "Users"), where("assignedDoctorId", "==", currentUser.uid));
    const unsubscribeAssigned = onSnapshot(qAssigned, (snapshot) => {
      setAssignedPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAnalysis();
      unsubscribeUsers();
      unsubscribeAssigned();
    };
  }, [currentUser?.uid]);

  const handleAcceptAppointment = async (patientId: string) => {
    setIsAccepting(patientId);
    try {
      await updateDoc(doc(db, "Users", patientId), {
        appointmentStatus: "Accepted"
      });
      toast.success("Appointment Accepted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to accept appointment");
    } finally {
      setIsAccepting(null);
    }
  };

  const filteredPatients = useMemo(() => {
    let recentFiltered = analyses;
    const now = new Date();

    if (filter === "day") {
      recentFiltered = recentFiltered.filter(a => a.date && isAfter(new Date(a.date), subDays(now, 1)));
    } else if (filter === "7days") {
      recentFiltered = recentFiltered.filter(a => a.date && isAfter(new Date(a.date), subDays(now, 7)));
    } else if (filter === "30days") {
      recentFiltered = recentFiltered.filter(a => a.date && isAfter(new Date(a.date), subDays(now, 30)));
    } else if (filter === "custom" && customDate) {
      const start = startOfDay(new Date(customDate));
      const end = endOfDay(new Date(customDate));
      recentFiltered = recentFiltered.filter(a => a.date && isAfter(new Date(a.date), start) && isBefore(new Date(a.date), end));
    }

    const patientMap: Record<string, any> = {};
    
    // Seed map with all currently assigned patients (even if no history)
    assignedPatients.forEach(ap => {
      patientMap[ap.id] = {
        patientId: ap.id,
        patientNameFallback: ap.name,
        patientDisplayId: ap.patientId,
        lastVisitDate: "",
        diagnosis: "",
        totalVisits: 0,
        appointmentStatus: ap.appointmentStatus || "Pending"
      };
    });

    recentFiltered.forEach(a => {
      if (!a.patientId) return;
      if (!patientMap[a.patientId]) {
        patientMap[a.patientId] = { 
          patientId: a.patientId, 
          lastVisitDate: a.date, 
          diagnosis: a.diagnosis, 
          totalVisits: 1, 
          patientNameFallback: a.patientName || "",
          appointmentStatus: "Accepted",
          patientDisplayId: a.patientDisplayId || ""
        };
      } else {
        patientMap[a.patientId].totalVisits++;
        if (!patientMap[a.patientId].lastVisitDate || new Date(a.date) > new Date(patientMap[a.patientId].lastVisitDate)) {
          patientMap[a.patientId].lastVisitDate = a.date;
          patientMap[a.patientId].diagnosis = a.diagnosis;
        }
      }
    });

    let mapped = Object.values(patientMap).map((pData: any) => {
      const userDoc = users.find(u => u.id === pData.patientId) || assignedPatients.find(u => u.id === pData.patientId);
      return {
        ...pData,
        patientName: userDoc?.name || pData.patientNameFallback || "Unknown",
        patientDisplayId: userDoc?.patientId || pData.patientDisplayId || pData.patientId, 
      };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      mapped = mapped.filter(m => 
        m.patientName.toLowerCase().includes(q) || 
        m.patientDisplayId.toLowerCase().includes(q) ||
        m.patientId.toLowerCase().includes(q)
      );
    }

    return mapped.sort((a, b) => {
      // Sort newly assigned (pending) to top, then by last visit date
      if (a.appointmentStatus === "Pending" && b.appointmentStatus !== "Pending") return -1;
      if (b.appointmentStatus === "Pending" && a.appointmentStatus !== "Pending") return 1;
      return new Date(b.lastVisitDate || 0).getTime() - new Date(a.lastVisitDate || 0).getTime();
    });
  }, [analyses, users, assignedPatients, filter, customDate, searchQuery]);

  if (!currentUser) return null;

  return (
    <DashboardLayout role="doctor" userName="Doctor User">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Patients
        </h2>

        <div className="dashboard-section space-y-4">
          <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search patient by name or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setFilter("day")} 
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filter === "day" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"}`}
              >
                Previous Day
              </button>
              <button 
                onClick={() => setFilter("7days")} 
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filter === "7days" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"}`}
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setFilter("30days")} 
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filter === "30days" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"}`}
              >
                Last 30 Days
              </button>
              <button 
                onClick={() => setFilter("all")} 
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"}`}
              >
                All
              </button>
              
              <div className="relative flex items-center ml-2">
                <input 
                  type="date"
                  value={customDate}
                  onChange={(e) => { setCustomDate(e.target.value); setFilter("custom"); }}
                  className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none text-sm ${filter === "custom" ? "border-primary ring-2 ring-primary/20" : "border-input bg-background"}`}
                  title="Select Date"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-section overflow-x-auto">
          <table className="table-medical">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Patient ID</th>
                <th>Diagnosis</th>
                <th>Last Visit Date</th>
                <th>Total Visits</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <tr key={p.patientId}>
                    <td className="text-foreground font-medium">{p.patientName}</td>
                    <td className="text-muted-foreground text-sm font-mono">{p.patientDisplayId.length > 10 ? p.patientDisplayId.substring(0, 8) + '...' : p.patientDisplayId}</td>
                    <td className="text-foreground">{p.diagnosis || "No Diagnosis"}</td>
                    <td className="text-foreground">{p.lastVisitDate ? new Date(p.lastVisitDate).toLocaleDateString() : "N/A"}</td>
                    <td className="text-foreground">
                        <span className="px-2.5 py-1 rounded-full bg-medical-light-blue text-primary text-xs font-semibold">
                            {p.totalVisits}
                        </span>
                    </td>
                    <td>
                      {p.appointmentStatus === "Pending" ? (
                        <button 
                          onClick={() => handleAcceptAppointment(p.patientId)}
                          disabled={isAccepting === p.patientId}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          {isAccepting === p.patientId ? "Accepting..." : "Accept Appointment"}
                        </button>
                      ) : (
                        <button className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View Medical History
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-muted/50" />
                        <p>No patients found for the selected filter.</p>
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

export default DoctorPatients;
