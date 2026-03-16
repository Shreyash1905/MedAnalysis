import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, FileText, CheckCircle, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const DoctorDashboard = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [reportsPending, setReportsPending] = useState(0);
  const [reportsAnalyzed, setReportsAnalyzed] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    // Fetch Patients
    const qPatients = query(collection(db, "Users"), where("role", "==", "Patient"), where("assignedDoctorId", "==", currentUser.uid));
    const unsubscribePatients = onSnapshot(qPatients, (snapshot) => {
      const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(pData);
      setTotalPatients(pData.length);
    });

    // Fetch Reports
    const qReports = query(collection(db, "MedicalReports"), where("doctorId", "==", currentUser.uid));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      let pending = 0;
      let analyzed = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "Pending") pending++;
        else if (data.status === "Analyzed") analyzed++;
      });
      setReportsPending(pending);
      setReportsAnalyzed(analyzed);
    });

    return () => {
      unsubscribePatients();
      unsubscribeReports();
    };
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  return (
    <DashboardLayout role="doctor" userName={currentUser?.displayName || "Doctor User"}>
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Doctor Dashboard</h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Patients" value={totalPatients} variant="blue" />
        <StatCard icon={FileText} label="Reports Pending" value={reportsPending} variant="orange" />
        <StatCard icon={CheckCircle} label="Reports Analyzed" value={reportsAnalyzed} variant="green" />
      </div>

      <div className="dashboard-section">
        <h3 className="text-lg font-semibold text-foreground mb-4">Patient List</h3>
        <div className="overflow-x-auto">
          <table className="table-medical">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Age</th>
                <th>Last Diagnosis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? (
                patients.map((p) => (
                  <tr key={p.id}>
                    <td className="text-foreground font-medium">{p.name || "Unknown"}</td>
                    <td className="text-foreground">{p.age || "N/A"}</td>
                    <td className="text-foreground">{p.diagnosis || "No Diagnosis"}</td>
                    <td>
                      <button className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted-foreground">
                    No patients assigned to you yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
};

export default DoctorDashboard;
