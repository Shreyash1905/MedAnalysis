import DashboardLayout from "@/components/DashboardLayout";
import { QrCode, Phone, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const EmergencyQR = () => {
  const { currentUser } = useAuth();
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");
  const [generated, setGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const userDocRef = doc(db, "Users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.emergencyContact1 || data.emergencyContact2) {
          setContact1(data.emergencyContact1 || "");
          setContact2(data.emergencyContact2 || "");
          setGenerated(true);
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleSaveContact = async () => {
    setIsSaving(true);
    try {
      if (!currentUser?.uid) return;
      const userDocRef = doc(db, "Users", currentUser.uid);
      await setDoc(userDocRef, {
        emergencyContact1: contact1 || "",
        emergencyContact2: contact2 || ""
      }, { merge: true });
      setGenerated(true);
      toast.success("Emergency contacts saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save emergency contacts");
    } finally {
      setIsSaving(false);
    }
  };

  // Extract the current origin dynamically
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://health-insight-hub.com';
  const qrData = `${appUrl}/emergency.html?uid=${currentUser?.uid || ''}`;

  if (!currentUser) return null;

  return (
    <DashboardLayout role="patient" userName={currentUser.displayName || "Patient User"}>
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <QrCode className="w-6 h-6 text-primary" /> Emergency QR Health Tag
        </h2>

        <div className="dashboard-section space-y-4 animate-fade-in">
          <p className="text-sm text-muted-foreground">Generate a QR code containing a secure link to your emergency contact numbers. This QR can be scanned by any smartphone camera or Google Lens.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Emergency Contact 1</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={contact1} onChange={(e) => setContact1(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Emergency Contact 2</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={contact2} onChange={(e) => setContact2(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
          <button 
            onClick={handleSaveContact} 
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save & Generate QR"}
          </button>
        </div>

        {generated && (
          <div className="dashboard-section flex flex-col items-center gap-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground">Your Emergency QR Code</h3>
            <div className="p-4 bg-white rounded-2xl border border-border shadow-sm">
              <QRCodeSVG value={qrData} size={200} level="H" />
            </div>
            <p className="text-sm font-medium text-foreground text-center">
              In case of emergency, scan this code to contact family.
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              This QR code opens a secure page containing only emergency contact numbers. No patient name, medical history, or personal data is exposed.
            </p>
            <div className="flex gap-4 mt-2">
              {contact1 && (
                <a href={`tel:${contact1}`} className="px-5 py-2.5 rounded-lg bg-medical-light-blue text-primary text-sm font-semibold flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Phone className="w-4 h-4" /> Call Contact 1
                </a>
              )}
              {contact2 && (
                <a href={`tel:${contact2}`} className="px-5 py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Phone className="w-4 h-4" /> Call Contact 2
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmergencyQR;
