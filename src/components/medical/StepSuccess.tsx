import React from "react";
import { CheckCircle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StepSuccessProps {
  stepTitle: string;
  isVisible: boolean;
  onComplete: () => void;
}

export const StepSuccess: React.FC<StepSuccessProps> = ({
  stepTitle,
  isVisible,
  onComplete
}) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-80 shadow-lg animate-in zoom-in-95 duration-300">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-success flex items-center justify-center gap-2">
              <Star className="h-4 w-4" />
              Etapa Concluída!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {stepTitle} foi realizada com sucesso
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            Avançando para próxima etapa...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};