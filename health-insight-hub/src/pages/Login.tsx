import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Shield } from "lucide-react";
import Logo from "../components/Logo";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

const generatePatientId = () => `PAT-${Math.floor(1000 + Math.random() * 9000)}`;

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | "authority">("patient");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill required fields");
    if (!isLogin && !name) return toast.error("Name is required");

    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, "Users", userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        
        let path = "/patient";
        if (userSnap.exists()) {
          const role = userSnap.data().role?.toLowerCase();
          if (role === "doctor") path = "/doctor";
          if (role === "authority") path = "/authority";
        }
        toast.success("Logged in successfully");
        navigate(path);
      } else {
        // Register flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        const userData: any = {
          name,
          email,
          role: selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1),
          createdAt: new Date().toISOString()
        };

        if (selectedRole === "patient") {
          userData.patientId = generatePatientId();
          userData.aadhaarSimulatedId = aadhaar || "0000-0000-0000";
        } else if (selectedRole === "doctor") {
          userData.department = "General"; // placeholder
        }

        await setDoc(doc(db, "Users", userCredential.user.uid), userData);
        toast.success("Account created successfully");
        navigate(`/${selectedRole}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold text-foreground">MedAnalysis</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p className="text-muted-foreground text-sm mt-1">{isLogin ? "Sign in to your account" : "Register a new account"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(["patient", "doctor", "authority"] as const).map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors border ${selectedRole === role ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input hover:bg-muted'}`}
                >
                  <span className="capitalize">{role}</span>
                </button>
              ))}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          )}

          {!isLogin && selectedRole === "patient" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Simulated Aadhaar ID</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} placeholder="1234-5678-9012" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 mt-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline font-medium">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
