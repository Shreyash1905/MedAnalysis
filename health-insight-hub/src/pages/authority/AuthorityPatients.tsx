import DashboardLayout from "@/components/DashboardLayout";
import { Users, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

const AuthorityPatients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    // Fetch Patients
    const qPatients = query(collection(db, "Users"), where("role", "==", "Patient"));
    const unsubscribePatients = onSnapshot(qPatients, (snapshot) => {
      const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(pData);
    });

    // Fetch Doctors
    const qDoctors = query(collection(db, "Users"), where("role", "==", "Doctor"));
    const unsubscribeDoctors = onSnapshot(qDoctors, (snapshot) => {
      const dData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctors(dData);
    });

    return () => {
      unsubscribePatients();
      unsubscribeDoctors();
    };
  }, []);

  const filteredPatients = useMemo(() => {
    if (filter === "assigned") return patients.filter(p => !!p.assignedDoctorId);
    if (filter === "unassigned") return patients.filter(p => !p.assignedDoctorId);
    return patients;
  }, [patients, filter]);

  const openAssignModal = (patient: any) => {
    setSelectedPatient(patient);
    setSelectedDoctorId("");
    setIsModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handleAssignDoctor = async () => {
    if (!selectedPatient || !selectedDoctorId) return;
    
    const docToAssign = doctors.find(d => d.id === selectedDoctorId);
    if (!docToAssign) return;

    setIsAssigning(true);
    try {
      const patientRef = doc(db, "Users", selectedPatient.id);
      await updateDoc(patientRef, {
        assignedDoctorId: docToAssign.id,
        assignedDoctorName: docToAssign.name,
        appointmentCreatedAt: serverTimestamp(),
        appointmentStatus: "Pending"
      });
      toast.success(`Successfully assigned Dr. ${docToAssign.name}`);
      closeAssignModal();
    } catch (e) {
      console.error(e);
      toast.error("Failed to assign doctor.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <DashboardLayout role="authority" userName="Admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> All Patients
          </h2>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              All Patients
            </button>
            <button 
              onClick={() => setFilter("assigned")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === "assigned" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Assigned
            </button>
            <button 
              onClick={() => setFilter("unassigned")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === "unassigned" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Unassigned
            </button>
          </div>
        </div>
        <div className="dashboard-section overflow-x-auto">
          <table className="table-medical">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Reports</th>
                <th>Last Visit</th>
                <th>Assigned Doctor</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <tr key={p.id}>
                    <td className="text-muted-foreground font-mono">{(p.patientId || p.id).substring(0, 8)}</td>
                    <td className="text-foreground font-medium">{p.name || "Unknown"}</td>
                    <td className="text-foreground">{p.age || "N/A"}</td>
                    <td className="text-foreground">{p.reports || 0}</td>
                    <td className="text-foreground">{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : "N/A"}</td>
                    <td className="text-foreground">
                      {p.assignedDoctorName ? (
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-medical-light-blue text-primary">
                           {p.assignedDoctorName}
                         </span>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => openAssignModal(p)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                          p.assignedDoctorId 
                            ? "border-border text-foreground hover:bg-muted" 
                            : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {p.assignedDoctorId ? "Reassign Doctor" : "Assign Doctor"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-muted/50" />
                      <p>No patients found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-background rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-semibold text-lg text-foreground">Assign Doctor to Patient</h3>
              <button onClick={closeAssignModal} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Patient Name</label>
                  <p className="font-medium text-foreground">{selectedPatient.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Patient ID</label>
                  <p className="font-mono text-sm text-foreground">{selectedPatient.patientId || selectedPatient.id.substring(0,8)}</p>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-sm font-medium text-foreground block mb-2">Select Doctor</label>
                {doctors.length > 0 ? (
                  <select 
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="" disabled>-- Select a Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name || "Unknown"} {(d.department) ? `(${d.department})` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 text-sm text-center text-medical-red bg-medical-light-red rounded-lg">
                    No doctors available to assign.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
              <button 
                onClick={closeAssignModal}
                disabled={isAssigning}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignDoctor}
                disabled={!selectedDoctorId || isAssigning}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50"
              >
                {isAssigning ? "Assigning..." : "Assign Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AuthorityPatients;
