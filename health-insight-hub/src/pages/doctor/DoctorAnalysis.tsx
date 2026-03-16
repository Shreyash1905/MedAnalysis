import DashboardLayout from "@/components/DashboardLayout";
import { Brain, Upload, FileJson, Table2, StickyNote, Activity, AlertCircle, Save, User } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { extractPDFText } from "@/utils/pdfExtractor";
import { extractMedicalData } from "@/services/geminiExtractor";
const DoctorAnalysis = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');
  
  const [extractedData, setExtractedData] = useState<any>(null);
  const [reportRefId, setReportRefId] = useState("");

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient first.");
      return;
    }
    if (!file) {
      toast.error("Please upload a medical report (PDF or Image).");
      return;
    }
    
    setIsAnalyzing(true);
    setExtractedData(null);
    try {
      const selectedUser = patients.find(p => p.id === selectedPatientId);
      
      const fileRef = ref(storage, `medical_reports/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const reportRef = await addDoc(collection(db, "MedicalReports"), {
        patientId: selectedPatientId,
        patientName: selectedUser?.name || "Unknown Patient",
        doctorId: currentUser.uid,
        doctorName: currentUser.displayName || "Doctor User",
        reportUrl: fileUrl,
        reportType: file.type,
        uploadedAt: new Date().toISOString(),
        analysisStatus: "Processing"
      });

      setReportRefId(reportRef.id);

      setReportRefId(reportRef.id);

      let extracted = "";
      if (file.type === "application/pdf") {
        const text = await extractPDFText(file);
        extracted = await extractMedicalData(text);
      } else {
        const base64File = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        extracted = await extractMedicalData(null, base64File, file.type);
      }
      
      let structured;
      const jsonMatch = extracted.match(/```(?:json)?\n?(.*?)\n?```/s);
      if (jsonMatch) {
          structured = JSON.parse(jsonMatch[1].trim());
      } else {
          structured = JSON.parse(extracted.trim());
      }
      
      toast.success("Extraction complete. Please review before saving.");

      setExtractedData({
        patientDetails: {
           name: structured.patient?.name || structured.patientDetails?.name || selectedUser?.name || "Unknown",
           age: structured.patient?.age || structured.patientDetails?.age || selectedUser?.age || "N/A",
           gender: structured.patient?.gender || structured.patientDetails?.gender || selectedUser?.gender || "N/A",
           hospital: structured.patient?.hospital || structured.patientDetails?.hospital || "N/A"
        },
        testResults: structured.tests || structured.testResults || []
      });
      
    } catch (error) {
      console.error(error);
      toast.error("Unable to extract medical entities from this report.");
      // Set empty editable state instead of completely failing
      const selectedUser = patients.find(p => p.id === selectedPatientId);
      setExtractedData({
        patientDetails: {
           name: selectedUser?.name || "Unknown",
           age: selectedUser?.age || "N/A",
           gender: selectedUser?.gender || "N/A",
           hospital: "N/A"
        },
        testResults: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!extractedData || !reportRefId) return;
    setIsSaving(true);
    try {
      const selectedUser = patients.find(p => p.id === selectedPatientId);
      
      const analysisData = {
        reportId: reportRefId,
        patientId: selectedPatientId,
        patientName: extractedData.patientDetails.name || selectedUser?.name || "Unknown Patient",
        doctorId: currentUser.uid,
        doctorName: currentUser.displayName || "Doctor User",
        analyzedAt: new Date().toISOString(),
        testResults: extractedData.testResults,
        diagnosis: "Lab Report Summary",
        tests: extractedData.testResults.map((t: any) => t.test),
        testValues: extractedData.testResults.map((t: any) => t.value),
        medications: [],
        notes: "Automatically processed via Rule-Based Extraction"
      };

      await addDoc(collection(db, "ReportAnalysis"), analysisData);
      
      await updateDoc(doc(db, "MedicalReports", reportRefId), {
         analysisStatus: "Completed",
         diagnosis: "Lab Report Summary"
      });

      toast.success("Medical data saved to patient record successfully.");
      setExtractedData(null);
      setFile(null);
      setReportRefId("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateArrayItem = (index: number, field: string, value: string) => {
    const newArray = [...extractedData.testResults];
    newArray[index] = { ...newArray[index], [field]: value };
    setExtractedData({ ...extractedData, testResults: newArray });
  };
  
  const addTestItem = () => {
    setExtractedData({
        ...extractedData,
        testResults: [...extractedData.testResults, {test: "", value: "", unit: ""}]
    });
  };

  if (!currentUser) return null;

  return (
    <DashboardLayout role="doctor" userName={currentUser.displayName || "Doctor User"}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" /> Medical Report NLP Analyzer
        </h2>

        <div className="dashboard-section space-y-4 max-w-2xl">
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
            <label className="text-sm font-medium text-foreground mb-1.5 block">Upload Medical Report (PDF/Image)</label>
            <div className="relative upload-zone overflow-hidden cursor-pointer hover:border-primary transition-colors flex justify-center items-center">
              <input 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="pointer-events-none flex flex-col items-center">
                  {file ? (
                      <div className="text-center">
                         <StickyNote className="w-10 h-10 text-primary mx-auto mb-3" />
                         <p className="text-sm font-medium text-foreground">{file.name}</p>
                         <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                  ) : (
                      <div className="text-center">
                        <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
                         <p className="text-sm text-foreground">Drag & drop or click to upload</p>
                         <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG</p>
                      </div>
                  )}
              </div>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || patients.length === 0 || !file}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            <Brain className="w-4 h-4" /> {isAnalyzing ? "Analyzing and Extracting..." : "Analyze and Extract"}
          </button>
        </div>

        {extractedData && (
          <div className="animate-fade-in mt-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                   <Activity className="w-6 h-6 text-primary"/> Extracted Medical Data
                </h3>
                
                <div className="flex bg-muted rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('table')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Table2 className="w-4 h-4" /> Table View
                    </button>
                    <button 
                        onClick={() => setActiveTab('json')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'json' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <FileJson className="w-4 h-4" /> JSON Viewer
                    </button>
                </div>
            </div>

            {activeTab === 'json' ? (
                <div className="bg-black/90 text-green-400 p-6 rounded-xl font-mono text-sm overflow-auto max-h-[500px]">
                    <pre>{JSON.stringify(extractedData, null, 2)}</pre>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {/* Patient Information */}
                    <div className="stat-card space-y-3 col-span-full">
                      <div className="flex items-center gap-2 text-primary">
                        <User className="w-5 h-5" />
                        <h3 className="font-semibold">Patient Details</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                          <div>
                              <label className="text-xs text-muted-foreground">Patient Name</label>
                              <input 
                                value={extractedData.patientDetails.name || ""}
                                onChange={(e) => setExtractedData({...extractedData, patientDetails: {...extractedData.patientDetails, name: e.target.value}})}
                                className="w-full mt-1 p-2 bg-background border rounded-md text-sm" 
                              />
                          </div>
                          <div>
                              <label className="text-xs text-muted-foreground">Age</label>
                              <input 
                                value={extractedData.patientDetails.age || ""}
                                onChange={(e) => setExtractedData({...extractedData, patientDetails: {...extractedData.patientDetails, age: e.target.value}})}
                                className="w-full mt-1 p-2 bg-background border rounded-md text-sm" 
                              />
                          </div>
                          <div>
                              <label className="text-xs text-muted-foreground">Gender</label>
                              <input 
                                value={extractedData.patientDetails.gender || ""}
                                onChange={(e) => setExtractedData({...extractedData, patientDetails: {...extractedData.patientDetails, gender: e.target.value}})}
                                className="w-full mt-1 p-2 bg-background border rounded-md text-sm" 
                              />
                          </div>
                          <div>
                              <label className="text-xs text-muted-foreground">Hospital Name</label>
                              <input 
                                value={extractedData.patientDetails.hospital || ""}
                                onChange={(e) => setExtractedData({...extractedData, patientDetails: {...extractedData.patientDetails, hospital: e.target.value}})}
                                className="w-full mt-1 p-2 bg-background border rounded-md text-sm" 
                              />
                          </div>
                      </div>
                    </div>

                    {/* Test Results Table */}
                    <div className="stat-card space-y-3 col-span-full">
                      <div className="flex items-center gap-2 text-medical-orange">
                        <Activity className="w-5 h-5" />
                        <h3 className="font-semibold">Test Results</h3>
                      </div>
                      
                      <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-sm text-left">
                              <thead className="text-xs text-muted-foreground bg-muted uppercase">
                                  <tr>
                                      <th className="px-4 py-3 font-semibold">Test Name</th>
                                      <th className="px-4 py-3 font-semibold">Value</th>
                                      <th className="px-4 py-3 font-semibold">Unit</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {extractedData.testResults.map((item: any, idx: number) => (
                                      <tr key={idx} className="border-b border-border bg-background">
                                          <td className="p-2">
                                              <input 
                                                type="text" 
                                                value={item.test || ""}
                                                onChange={(e) => updateArrayItem(idx, 'test', e.target.value)}
                                                placeholder="Test Name"
                                                className="w-full px-3 py-2 rounded-md border-transparent bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                              />
                                          </td>
                                          <td className="p-2">
                                              <input 
                                                type="text" 
                                                value={item.value || ""}
                                                onChange={(e) => updateArrayItem(idx, 'value', e.target.value)}
                                                placeholder="Value"
                                                className="w-full px-3 py-2 rounded-md border-transparent bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                              />
                                          </td>
                                          <td className="p-2">
                                              <input 
                                                type="text" 
                                                value={item.unit || ""}
                                                onChange={(e) => updateArrayItem(idx, 'unit', e.target.value)}
                                                placeholder="Unit"
                                                className="w-full px-3 py-2 rounded-md border-transparent bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                              />
                                          </td>
                                      </tr>
                                  ))}
                                  {extractedData.testResults.length === 0 && (
                                       <tr className="bg-background">
                                           <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                                              No lab values dynamically retrieved. Add manully.
                                           </td>
                                       </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                      <button onClick={addTestItem} className="text-sm text-primary hover:underline font-medium">+ Add Row</button>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSaveToDatabase}
                    disabled={isSaving}
                    className="px-8 py-3 rounded-lg bg-medical-green text-white font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? "Saving..." : "Save to Patient Record"}
                </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorAnalysis;
