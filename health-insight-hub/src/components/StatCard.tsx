import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  variant?: "blue" | "green" | "orange" | "red" | "purple";
}

const variantClasses: Record<string, string> = {
  blue: "bg-medical-light-blue text-medical-blue",
  green: "bg-medical-light-green text-medical-green",
  orange: "bg-medical-light-orange text-medical-orange",
  red: "bg-medical-light-red text-medical-red",
  purple: "bg-purple-100 text-purple-600",
};

const StatCard = ({ icon: Icon, label, value, variant = "blue" }: StatCardProps) => (
  <div className="stat-card flex items-center gap-4 animate-fade-in">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${variantClasses[variant]}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

export default StatCard;
