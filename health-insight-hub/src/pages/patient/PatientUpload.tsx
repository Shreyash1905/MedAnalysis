import DashboardLayout from "@/components/DashboardLayout";
import { Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const PatientUpload = () => {
  const { currentUser } = useAuth();
  const [patientInfo, setPatientInfo] = useState({ 
    name: "Patient User", 
    patientId: "Loading...",
    assignedDoctorId: "",
    assignedDoctorName: ""
  });
  const [dragOver, setDragOver] = useState(false);
  const [reportType, setReportType] = useState("Blood Test");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser?.uid) return;
      const userRef = doc(db, "Users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setPatientInfo({ 
            name: data.name || "Patient User", 
            patientId: data.patientId || "Unknown",
            assignedDoctorId: data.assignedDoctorId || "",
            assignedDoctorName: data.assignedDoctorName || ""
        });
      }
    };
    fetchUser();
  }, [currentUser?.uid]);

  const handleUpload = async () => {
    if (!currentUser?.uid) return;
    setIsUploading(true);
    try {
      await addDoc(collection(db, "MedicalReports"), {
        patientId: currentUser.uid,
        patientDisplayId: patientInfo.patientId, // The string ID like PAT-0001
        patientName: patientInfo.name,
        type: reportType,
        date: new Date().toISOString(),
        status: "Pending", // Pending analysis
        doctorId: (patientInfo as any).assignedDoctorId || "", // Assigned doctor
        doctorName: (patientInfo as any).assignedDoctorName || ""
      });
      toast.success("Report uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload report.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout role="patient" userName={patientInfo.name}>
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" /> Upload Medical Report
        </h2>
        <div className="dashboard-section space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option>Blood Test</option><option>X-Ray</option><option>MRI Scan</option><option>CT Scan</option><option>Urine Test</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Upload File</label>
            <div
              className={`upload-zone ${dragOver ? "border-primary/60 bg-primary/5" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); toast.success("File uploaded successfully!"); }}
            >
              <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Drag & drop your report here</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 10MB)</p>
              <input type="file" className="hidden" />
            </div>
          </div>
          <button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload Report"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientUpload;
