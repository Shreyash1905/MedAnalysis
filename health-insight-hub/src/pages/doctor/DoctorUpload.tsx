import DashboardLayout from "@/components/DashboardLayout";
import { Upload, Pill } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const DoctorUpload = () => {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", instructions: "" }]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const qPatients = query(collection(db, "Users"), where("role", "==", "Patient"), where("assignedDoctorId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(qPatients, (snapshot) => {
      const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(pData);
      if (pData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pData[0].id);
      }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleUploadReport = async () => {
    if (!selectedPatientId) return toast.error("Please select a patient.");
    setIsUploading(true);
    try {
      const selectedPatient = patients.find(p => p.id === selectedPatientId);
      await addDoc(collection(db, "MedicalReports"), {
        patientId: selectedPatientId,
        patientName: selectedPatient?.name || "Unknown",
        doctorId: currentUser.uid,
        doctorName: currentUser.displayName || "Doctor User",
        type: "Doctor Uploaded Report",
        date: new Date().toISOString(),
        status: "Pending"
      });
      toast.success("Report uploaded!");
    } catch (e) {
      toast.error("Failed to upload report.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!selectedPatientId) return toast.error("Please select a patient.");
    const validMedicines = medicines.filter(m => m.name.trim() !== "");
    if (validMedicines.length === 0) return toast.error("Please add at least one medicine.");
    
    setIsSavingPrescription(true);
    try {
      const selectedPatient = patients.find(p => p.id === selectedPatientId);
      for (const med of validMedicines) {
        await addDoc(collection(db, "Prescriptions"), {
          patientId: selectedPatientId,
          patientName: selectedPatient?.name || "Unknown",
          doctorId: currentUser.uid,
          doctorName: currentUser.displayName || "Doctor User",
          date: new Date().toISOString(),
          medication: med.name,
          dosage: med.dosage,
          instructions: med.instructions
        });
      }
      toast.success("Prescription saved!");
      setMedicines([{ name: "", dosage: "", instructions: "" }]);
    } catch (e) {
      toast.error("Failed to save prescription.");
    } finally {
      setIsSavingPrescription(false);
    }
  };

  const addMedicine = () => setMedicines([...medicines, { name: "", dosage: "", instructions: "" }]);
  const updateMedicine = (i: number, field: string, value: string) => {
    const updated = [...medicines];
    (updated[i] as any)[field] = value;
    setMedicines(updated);
  };

  if (!currentUser) return null;

  return (
    <DashboardLayout role="doctor" userName={currentUser.displayName || "Doctor User"}>
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" /> Upload Report & Prescribe
        </h2>

        <div className="dashboard-section space-y-4">
          <h3 className="font-semibold text-foreground">Upload Patient Report</h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Select Patient</label>
            <select 
              value={selectedPatientId} 
              onChange={(e) => setSelectedPatientId(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {patients.length > 0 ? patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              )) : (
                <option value="">No patients available</option>
              )}
            </select>
          </div>
          <div className="upload-zone">
            <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Drag & drop report file</p>
          </div>
          <button onClick={handleUploadReport} disabled={isUploading || patients.length === 0} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:opacity-90">
            {isUploading ? "Uploading..." : "Upload Report"}
          </button>
        </div>

        {/* Prescription */}
        <div className="dashboard-section space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Pill className="w-5 h-5 text-medical-green" /> Add Prescription
          </h3>
          {medicines.map((med, i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <input placeholder="Medicine Name" value={med.name} onChange={(e) => updateMedicine(i, "name", e.target.value)} className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedicine(i, "dosage", e.target.value)} className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input placeholder="Instructions" value={med.instructions} onChange={(e) => updateMedicine(i, "instructions", e.target.value)} className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={addMedicine} className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">+ Add Medicine</button>
            <button onClick={handleSavePrescription} disabled={isSavingPrescription || patients.length === 0} className="px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-50 hover:opacity-90">
              {isSavingPrescription ? "Saving..." : "Save Prescription"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorUpload;
