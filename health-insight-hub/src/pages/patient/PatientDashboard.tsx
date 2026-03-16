import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { FileText, Stethoscope, Pill, Upload, ChevronRight, Fingerprint } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

// Generate a random ID if not exists helper (typically done on auth signup)
const generatePatientId = () => `PAT-${Math.floor(1000 + Math.random() * 9000)}`;

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [lastDiagnosis, setLastDiagnosis] = useState("No data");
  const [activePrescriptions, setActivePrescriptions] = useState(0);
  const [patientInfo, setPatientInfo] = useState({ 
    patientId: "Loading...", 
    name: "Patient User", 
    email: "patient@example.com",
    assignedDoctorName: ""
  });

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    // Fetch or Initialize User
    const fetchUser = async () => {
      const userRef = doc(db, "Users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (!data.patientId) {
          const newId = generatePatientId();
          await setDoc(userRef, { patientId: newId }, { merge: true });
          setPatientInfo(prev => ({ ...prev, patientId: newId, name: data.name || "Patient User", email: data.email || "patient@example.com", assignedDoctorName: data.assignedDoctorName || "" }));
        } else {
          setPatientInfo(prev => ({ ...prev, patientId: data.patientId, name: data.name || "Patient User", email: data.email || "patient@example.com", assignedDoctorName: data.assignedDoctorName || "" }));
        }
      } else {
        // Mock user creation for demo if it doesn't exist
        const newId = generatePatientId();
        await setDoc(userRef, { 
          patientId: newId, 
          name: "Patient User", 
          email: "patient@medanalysis.com",
          role: "Patient",
          createdAt: new Date().toISOString()
        });
        setPatientInfo(prev => ({ ...prev, patientId: newId, name: "Patient User", email: "patient@medanalysis.com", assignedDoctorName: "" }));
      }
    };
    fetchUser();

    // Fetch Medical Reports
    const qReports = query(collection(db, "MedicalReports"), where("patientId", "==", currentUser.uid));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // @ts-ignore
      setReports(reportsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setTotalReports(reportsData.length);
    });

    // Fetch Last Diagnosis from ReportAnalysis
    const qAnalysis = query(collection(db, "ReportAnalysis"), where("patientId", "==", currentUser.uid));
    const unsubscribeAnalysis = onSnapshot(qAnalysis, (snapshot) => {
      const analysisData = snapshot.docs.map(doc => doc.data());
      if (analysisData.length > 0) {
        // @ts-ignore
        analysisData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLastDiagnosis(analysisData[0].diagnosis || "Healthy");
      } else {
        setLastDiagnosis("No data");
      }
    });

    // Fetch Prescriptions
    const qPrescriptions = query(collection(db, "Prescriptions"), where("patientId", "==", currentUser.uid));
    const unsubscribePrescriptions = onSnapshot(qPrescriptions, (snapshot) => {
      setActivePrescriptions(snapshot.docs.length);
    });

    return () => {
      unsubscribeReports();
      unsubscribeAnalysis();
      unsubscribePrescriptions();
    };
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  return (
    <DashboardLayout role="patient" userName={patientInfo.name}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Patient Dashboard</h2>

        <div className="dashboard-section p-4 bg-muted/30 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Patient Information</h3>
              <p className="text-lg font-bold text-foreground">{patientInfo.name}</p>
              <p className="text-sm text-muted-foreground">{patientInfo.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Assigned Doctor</h3>
              <p className="text-lg font-medium text-foreground">
                {patientInfo.assignedDoctorName ? `Dr. ${patientInfo.assignedDoctorName}` : <span className="text-muted-foreground italic">Unassigned</span>}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right mt-4 sm:mt-0">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Patient ID</h3>
            <p className="text-xl font-bold text-primary font-mono bg-primary/10 px-3 py-1 rounded-lg inline-block">{patientInfo.patientId}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard icon={Fingerprint} label="Patient ID" value={patientInfo.patientId} variant="purple" />
          <StatCard icon={FileText} label="Total Reports" value={totalReports} variant="blue" />
          <StatCard icon={Stethoscope} label="Last Diagnosis" value={lastDiagnosis} variant="green" />
          <StatCard icon={Pill} label="Active Prescriptions" value={activePrescriptions} variant="orange" />
        </div>

        {/* Upload */}
        <div className="dashboard-section">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Upload Medical Report
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Report Type</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Blood Test</option>
                <option>X-Ray</option>
                <option>MRI Scan</option>
                <option>CT Scan</option>
                <option>Urine Test</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Upload File</label>
              <div
                className={`upload-zone ${dragOver ? "border-primary/60 bg-primary/5" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={() => setDragOver(false)}
              >
                <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 10MB)</p>
              </div>
            </div>
          </div>
          <button className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            Upload Report
          </button>
        </div>

        {/* Recent Reports */}
        <div className="dashboard-section">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Reports</h3>
          <div className="overflow-x-auto">
            <table className="table-medical">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Report Type</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map((r) => (
                    <tr key={r.id}>
                      <td className="text-foreground">{r.date || "Unknown"}</td>
                      <td className="text-foreground">{r.type || "Report"}</td>
                      <td className="text-foreground">{r.doctorName || "Unknown Doctor"}</td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.status === "Analyzed"
                            ? "bg-medical-light-green text-medical-green"
                            : "bg-medical-light-orange text-medical-orange"
                        }`}>
                          {r.status || "Pending"}
                        </span>
                      </td>
                      <td><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted-foreground">
                      No reports uploaded yet.
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

export default PatientDashboard;
