import { useState, useEffect } from "react";
import { Heart, TrendingUp, Award, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface HealthScoreProps {
  consultationsCompleted?: number;
  recommendationsFollowed?: number;
  dataQuality?: number;
}

const HealthScore = ({ 
  consultationsCompleted = 3, 
  recommendationsFollowed = 2,
  dataQuality = 85 
}: HealthScoreProps) => {
  const [score, setScore] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    // Calculate health score based on user activities
    const baseScore = Math.min(consultationsCompleted * 15, 45); // Max 45 from consultations
    const recommendationScore = Math.min(recommendationsFollowed * 20, 40); // Max 40 from recommendations
    const qualityScore = Math.min(dataQuality * 0.15, 15); // Max 15 from data quality

    const totalScore = Math.round(baseScore + recommendationScore + qualityScore);
    setScore(totalScore);

    // Update achievements
    const newAchievements = [];
    if (consultationsCompleted >= 1) newAchievements.push("Primeira Consulta");
    if (consultationsCompleted >= 3) newAchievements.push("Triagem Completa");
    if (recommendationsFollowed >= 2) newAchievements.push("Saúde em Dia");
    if (dataQuality >= 80) newAchievements.push("Dados Completos");
    
    setAchievements(newAchievements);
  }, [consultationsCompleted, recommendationsFollowed, dataQuality]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bom";
    if (score >= 40) return "Regular";
    return "Precisa Melhorar";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Health Score</h3>
          <p className="text-sm text-muted-foreground">Seu índice de saúde pessoal</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Score Display */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}/100
          </div>
          <div className="text-sm text-muted-foreground">
            {getScoreLabel(score)}
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={score} className="h-3" />

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-xs font-medium">{consultationsCompleted}</div>
            <div className="text-xs text-muted-foreground">Consultas</div>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <Target className="h-4 w-4 mx-auto mb-1 text-success" />
            <div className="text-xs font-medium">{recommendationsFollowed}</div>
            <div className="text-xs text-muted-foreground">Seguindo</div>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <Award className="h-4 w-4 mx-auto mb-1 text-warning" />
            <div className="text-xs font-medium">{dataQuality}%</div>
            <div className="text-xs text-muted-foreground">Qualidade</div>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Conquistas</h4>
            <div className="flex flex-wrap gap-1">
              {achievements.map((achievement) => (
                <Badge key={achievement} variant="secondary" className="text-xs">
                  🏆 {achievement}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Next Goal */}
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium">Próxima meta:</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {score < 40 
              ? "Complete mais consultas para melhorar seu score"
              : score < 60
              ? "Siga mais recomendações médicas"
              : score < 80
              ? "Mantenha dados atualizados regularmente"
              : "Continue mantendo sua saúde em dia!"
            }
          </p>
        </div>
      </div>
    </Card>
  );
};

export default HealthScore;