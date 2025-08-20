/**
 * Enhanced Authentication Hook with Security Features
 * Provides secure authentication with role-based access control and audit logging
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/utils/secureLogging';

interface UserRole {
  id: string;
  role: 'admin' | 'moderator' | 'user' | 'patient' | 'doctor';
  created_at: string;
}

interface SecureAuthHook {
  user: User | null;
  session: Session | null;
  userRoles: UserRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshUserRoles: () => Promise<void>;
}

export const useSecureAuth = (): SecureAuthHook => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user roles with security validation
  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id, role, created_at')
        .eq('user_id', userId);

      if (error) {
        secureLogger.error('Failed to fetch user roles', error);
        return [];
      }

      return roles || [];
    } catch (error) {
      secureLogger.error('Error fetching user roles', error);
      return [];
    }
  }, []);

  // Refresh user roles
  const refreshUserRoles = useCallback(async () => {
    if (user?.id) {
      const roles = await fetchUserRoles(user.id);
      setUserRoles(roles);
    }
  }, [user?.id, fetchUserRoles]);

  // Create user profile with security checks
  const createUserProfile = async (user: User) => {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        secureLogger.info('User profile already exists', { userId: user.id });
        return;
      }

      // Create profile with sanitized data
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          avatar_url: user.user_metadata?.avatar_url,
          email: user.email,
          lgpd_consent: true,
          lgpd_consent_date: new Date().toISOString(),
          privacy_settings: {
            shareData: false,
            emailNotifications: true
          },
          role: 'patient' // Default role
        });

      if (error && !error.message.includes('duplicate key')) {
        secureLogger.error('Error creating user profile', error);
      } else {
        secureLogger.info('User profile created successfully', { userId: user.id });
        
        // Assign default role
        await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'user'
          });
      }
    } catch (error) {
      secureLogger.error('Unexpected error creating user profile', error);
    }
  };

  // Security-enhanced auth state handler
  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: any, session: Session | null) => {
      if (!mounted) return;

      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          secureLogger.authEvent(`User ${event}`, session.user.id, true);
          
          // Fetch user roles
          const roles = await fetchUserRoles(session.user.id);
          setUserRoles(roles);

          // Create profile if it's a new sign in
          if (event === 'SIGNED_IN') {
            await createUserProfile(session.user);
          }
        } else {
          secureLogger.authEvent('User signed out', null, true);
          setUserRoles([]);
        }
      } catch (error) {
        secureLogger.error('Error in auth state change handler', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        secureLogger.error('Error getting session', error);
      }
      
      if (mounted) {
        handleAuthStateChange('INITIAL_SESSION', session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRoles]);

  // Secure sign out with audit logging
  const signOut = async () => {
    try {
      setLoading(true);
      
      const userId = user?.id;
      secureLogger.authEvent('Sign out initiated', userId, true);

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        secureLogger.authEvent('Sign out failed', userId, false);
        throw error;
      }

      secureLogger.authEvent('Sign out completed', userId, true);
    } catch (error) {
      secureLogger.error('Error during sign out', error);
      setLoading(false);
      throw error;
    }
  };

  // Role checking functions
  const hasRole = useCallback((role: string): boolean => {
    return userRoles.some(userRole => userRole.role === role);
  }, [userRoles]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return userRoles.some(userRole => roles.includes(userRole.role));
  }, [userRoles]);

  return {
    user,
    session,
    userRoles,
    loading,
    signOut,
    isAuthenticated: !!user,
    hasRole,
    hasAnyRole,
    refreshUserRoles
  };
};