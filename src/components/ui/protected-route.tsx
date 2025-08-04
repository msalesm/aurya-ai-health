import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md shadow-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Carregando...</h2>
            <p className="text-sm text-muted-foreground text-center">
              Verificando suas credenciais de acesso
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Vai redirecionar
  }

  return <>{children}</>;
};