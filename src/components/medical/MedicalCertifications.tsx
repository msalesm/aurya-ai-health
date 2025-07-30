import { Shield, CheckCircle, Lock, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MedicalCertifications = () => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary" className="bg-success/10 text-success border-success/20 hover:bg-success/20">
        <Shield className="h-3 w-3 mr-1" />
        ANVISA
      </Badge>
      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
        <CheckCircle className="h-3 w-3 mr-1" />
        CFM
      </Badge>
      <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
        <Lock className="h-3 w-3 mr-1" />
        LGPD
      </Badge>
      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20">
        <Award className="h-3 w-3 mr-1" />
        ISO 27001
      </Badge>
    </div>
  );
};

export default MedicalCertifications;