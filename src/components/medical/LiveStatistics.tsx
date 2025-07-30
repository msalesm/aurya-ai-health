import { useState, useEffect } from "react";
import { Users, Activity, Star, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const LiveStatistics = () => {
  const [stats, setStats] = useState({
    consultasHoje: 1247,
    medicosOnline: 23,
    satisfacao: 98,
    crescimento: 156
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        consultasHoje: prev.consultasHoje + Math.floor(Math.random() * 3),
        medicosOnline: 20 + Math.floor(Math.random() * 8),
        satisfacao: 97 + Math.floor(Math.random() * 3),
        crescimento: prev.crescimento + Math.floor(Math.random() * 2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-4 text-center bg-gradient-medical text-primary-foreground">
        <Activity className="h-6 w-6 mx-auto mb-2" />
        <div className="text-2xl font-bold">{stats.consultasHoje.toLocaleString()}</div>
        <div className="text-sm opacity-90">Consultas hoje</div>
      </Card>
      
      <Card className="p-4 text-center bg-gradient-health text-secondary-foreground">
        <Users className="h-6 w-6 mx-auto mb-2" />
        <div className="text-2xl font-bold">{stats.medicosOnline}</div>
        <div className="text-sm opacity-90">Médicos online</div>
      </Card>
      
      <Card className="p-4 text-center bg-success text-success-foreground">
        <Star className="h-6 w-6 mx-auto mb-2" />
        <div className="text-2xl font-bold">{stats.satisfacao}%</div>
        <div className="text-sm opacity-90">Satisfação</div>
      </Card>
      
      <Card className="p-4 text-center bg-warning text-warning-foreground">
        <TrendingUp className="h-6 w-6 mx-auto mb-2" />
        <div className="text-2xl font-bold">+{stats.crescimento}%</div>
        <div className="text-sm opacity-90">Crescimento</div>
      </Card>
    </div>
  );
};

export default LiveStatistics;