import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar listener de mudanças de autenticação PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Criar perfil automaticamente quando usuário se cadastra
        if (event === 'SIGNED_IN' && session?.user && !user) {
          setTimeout(() => {
            createUserProfile(session.user);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // ENTÃO verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (user: User) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          avatar_url: user.user_metadata?.avatar_url,
          lgpd_consent: true,
          lgpd_consent_date: new Date().toISOString(),
          privacy_settings: {
            shareData: false,
            emailNotifications: true
          }
        });

      if (error && !error.message.includes('duplicate key')) {
        console.error('Erro ao criar perfil:', error);
      }
    } catch (error) {
      console.error('Erro inesperado ao criar perfil:', error);
    }
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      throw error;
    }
    // Estados serão limpos pelo listener
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};