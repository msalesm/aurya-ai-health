import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'pending';
}

interface ProgressStepperProps {
  steps: Step[];
  currentStepId: string;
  className?: string;
}

export const ProgressStepper = ({ steps, currentStepId, className }: ProgressStepperProps) => {
  return (
    <div className={cn("w-full py-4", className)} role="progressbar" aria-label="Progresso da triagem">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                  step.status === 'completed' && "bg-success border-success",
                  step.status === 'current' && "bg-primary border-primary animate-pulse-glow",
                  step.status === 'pending' && "bg-muted border-muted-foreground"
                )}
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {step.status === 'completed' ? (
                  <Check className="w-4 h-4 text-success-foreground" />
                ) : (
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      step.status === 'current' && "text-primary-foreground",
                      step.status === 'pending' && "text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "ml-2 text-sm font-medium transition-colors duration-200",
                  step.status === 'completed' && "text-success",
                  step.status === 'current' && "text-primary",
                  step.status === 'pending' && "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-12 ml-4 transition-colors duration-300",
                  steps[index + 1].status !== 'pending' ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};