import { useNavigate } from "react-router-dom";
import { Brain, Stethoscope, QrCode, BarChart3, ArrowRight, Shield } from "lucide-react";
import Logo from "../components/Logo";

const features = [
  { icon: Brain, title: "AI Medical Report Analysis", desc: "Automatically extract diagnosis, medicines, and test values from unstructured reports." },
  { icon: Stethoscope, title: "Doctor Decision Support", desc: "Doctors quickly understand reports with structured, actionable insights." },
  { icon: QrCode, title: "Emergency QR Health Tag", desc: "Emergency contacts accessible during accidents via a simple QR scan." },
  { icon: BarChart3, title: "Healthcare Analytics", desc: "Track disease trends, monitor insights, and make data-driven decisions." },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Logo className="w-7 h-7" />
          <span className="font-bold text-lg text-foreground">MedAnalysis – Automated Medical Report Analysis System</span>
        </div>
        <button onClick={() => navigate("/login")} className="px-5 py-2 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-colors">
          Login
        </button>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-20 lg:py-32 text-center max-w-4xl mx-auto animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medical-light-blue text-primary text-sm font-medium mb-6">
          <Shield className="w-4 h-4" /> AI-Powered Healthcare
        </div>
        <h1 className="text-4xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
          AI Powered Medical Report{" "}
          <span className="text-primary">Analysis System</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Convert unstructured medical reports into structured digital health records using advanced AI and Natural Language Processing.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate("/login")} className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/login")} className="px-8 py-3 rounded-xl border-2 border-primary text-primary font-semibold text-base hover:bg-primary hover:text-primary-foreground transition-colors">
            Login
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-20 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">Key Features</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Everything you need to digitize and analyze medical records efficiently.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="stat-card flex flex-col items-start gap-4 animate-fade-in">
                <div className="w-12 h-12 rounded-xl bg-medical-light-blue text-primary flex items-center justify-center">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-16 py-8 border-t border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Logo className="w-6 h-6" />
          <span className="font-bold text-foreground">MedAnalysis</span>
        </div>
        <p className="text-sm text-muted-foreground">Automated Medical Report Analysis System — Hackathon Project</p>
      </footer>
    </div>
  );
};

export default Landing;
