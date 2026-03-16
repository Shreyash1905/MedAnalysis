import DashboardLayout from "@/components/DashboardLayout";
import { Video, Mic, FileText, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DoctorConsultation = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleGenerateSummary = async () => {
    if (!notes.trim()) {
      toast.error("Please enter consultation notes first.");
      return;
    }
    
    setIsGenerating(true);
    // Simulate AI generation time
    setTimeout(() => {
      setSummary(`AI Summary: Patient presented with ${notes.substring(0, 30)}... Recommended adequate rest and hydration. Follow up if symptoms persist.`);
      setIsGenerating(false);
      toast.success("AI Summary generated!");
    }, 1500);
  };

  const handleSaveConsultation = async () => {
    if (!selectedPatientId) return toast.error("Please select a patient.");
    if (!summary) return toast.error("Please generate an AI summary first.");

    setIsSaving(true);
    try {
      const selectedPatient = patients.find(p => p.id === selectedPatientId);
      await addDoc(collection(db, "Consultations"), {
        patientId: selectedPatientId,
        patientName: selectedPatient?.name || "Unknown Patient",
        doctorId: currentUser?.uid,
        doctorName: currentUser?.displayName || "Doctor User",
        summary: summary,
        originalNotes: notes,
        createdAt: new Date().toISOString()
      });
      toast.success("Consultation saved successfully!");
      setNotes("");
      setSummary("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save consultation.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) return null;

  return (
    <DashboardLayout role="doctor" userName={currentUser.displayName || "Doctor User"}>
      <div className="space-y-6 max-w-3xl">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Video className="w-6 h-6 text-primary" /> Telemedicine Assistant
        </h2>

        <div className="dashboard-section space-y-5">
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

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" /> Consultation Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record your observation notes here..."
              className="w-full px-4 py-3 h-32 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleGenerateSummary} 
              disabled={isGenerating || !notes.trim()}
              className="px-6 py-2.5 rounded-lg bg-medical-light-blue text-primary font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate AI Summary"}
            </button>
          </div>

          {summary && (
            <div className="mt-4 p-4 bg-muted rounded-xl border border-border animate-fade-in space-y-4">
              <h3 className="font-semibold text-foreground text-sm mb-2">Generated Summary</h3>
              <p className="text-sm text-foreground leading-relaxed">{summary}</p>
              
              <div className="flex justify-end pt-4 border-t border-border">
                  <button 
                    onClick={handleSaveConsultation} 
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save to Patient Record"}
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorConsultation;
