import DashboardLayout from "@/components/DashboardLayout";
import { History, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const MedicalHistory = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, "ReportAnalysis"), where("patientId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // @ts-ignore
      setRecords(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  return (
    <DashboardLayout role="patient" userName={currentUser?.displayName || "Patient User"}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="w-6 h-6 text-primary" /> Medical History
        </h2>

        <div className="dashboard-section overflow-x-auto">
          <table className="table-medical">
            <thead>
              <tr>
                <th>Report Date</th>
                <th>Diagnosis</th>
                <th>Test Name</th>
                <th>Test Result</th>
                <th>Medication</th>
                <th>Doctor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id}>
                    <td className="text-foreground">{r.date || "Unknown"}</td>
                    <td className="text-foreground font-medium">{r.diagnosis || "Pending"}</td>
                    <td className="text-foreground">{r.testNames?.join(", ") || "Unknown"}</td>
                    <td className="text-foreground max-w-[150px] truncate" title={r.testValues?.join(", ")}>{r.testValues?.join(", ") || "N/A"}</td>
                    <td className="text-foreground max-w-[150px] truncate" title={r.medications?.join(", ")}>{r.medications?.join(", ") || "None"}</td>
                    <td className="text-foreground">{r.doctorName || "Unknown"}</td>
                    <td>
                      <button onClick={() => setSelectedRecord(r)} className="text-primary hover:underline text-sm flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted-foreground">
                    No medical history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 p-6" onClick={() => setSelectedRecord(null)}>
            <div className="bg-card rounded-2xl p-6 max-w-lg w-full space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground">Report Details</h3>
              {[
                ["Date", selectedRecord.date || "Unknown"],
                ["Diagnosis", selectedRecord.diagnosis || "N/A"],
                ["Test", selectedRecord.testNames?.join(", ") || "N/A"],
                ["Result", selectedRecord.testValues?.join(", ") || "N/A"],
                ["Medication", selectedRecord.medications?.join(", ") || "None"],
                ["Doctor", selectedRecord.doctorName || "Unknown"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
              <button onClick={() => setSelectedRecord(null)} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicalHistory;
