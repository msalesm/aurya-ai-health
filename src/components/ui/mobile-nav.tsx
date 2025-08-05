import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  trigger?: React.ReactNode;
}

export const MobileNav = ({ children, className, trigger }: MobileNavProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("md:hidden", className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu de navegação</span>
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

interface MobileNavItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export const MobileNavItem = ({ children, onClick, active, className }: MobileNavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center px-6 py-4 text-left hover:bg-accent transition-colors",
        active && "bg-accent text-accent-foreground font-medium",
        className
      )}
    >
      {children}
    </button>
  );
};