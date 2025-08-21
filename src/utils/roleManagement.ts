/**
 * Role Management Utility
 * Provides secure role management and consolidation functions
 */

import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from './secureLogging';

// Match the database enum values exactly
export type AppRole = 'admin' | 'moderator' | 'user' | 'doctor' | 'patient';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

/**
 * Get current user's roles from the unified role system
 */
export async function getCurrentUserRoles(): Promise<UserRole[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      secureLogger.error('Failed to fetch user roles', error);
      return [];
    }

    secureLogger.info('User roles fetched successfully', { 
      userId: '[SANITIZED]', 
      roleCount: roles?.length || 0
    });

    return (roles || []) as UserRole[];
  } catch (error) {
    secureLogger.error('Error fetching current user roles', error);
    return [];
  }
}

/**
 * Check if current user has specific role
 */
export async function hasRole(role: AppRole): Promise<boolean> {
  try {
    const roles = await getCurrentUserRoles();
    const hasRequiredRole = roles.some(userRole => userRole.role === role);
    
    secureLogger.debug('Role check performed', { 
      role, 
      hasRole: hasRequiredRole 
    });
    
    return hasRequiredRole;
  } catch (error) {
    secureLogger.error('Error checking user role', error);
    return false;
  }
}

/**
 * Check if current user has any of the specified roles
 */
export async function hasAnyRole(roles: AppRole[]): Promise<boolean> {
  try {
    const userRoles = await getCurrentUserRoles();
    const hasAnyRequiredRole = roles.some(role => 
      userRoles.some(userRole => userRole.role === role)
    );
    
    secureLogger.debug('Multiple role check performed', { 
      requiredRoles: roles, 
      hasAnyRole: hasAnyRequiredRole 
    });
    
    return hasAnyRequiredRole;
  } catch (error) {
    secureLogger.error('Error checking user roles', error);
    return false;
  }
}

/**
 * Get highest priority role for current user
 */
export async function getPrimaryRole(): Promise<AppRole | null> {
  try {
    const roles = await getCurrentUserRoles();
    
    if (roles.length === 0) {
      return 'user'; // Default role
    }

    // Role priority: admin > moderator > doctor > patient > user
    const rolePriority: Record<AppRole, number> = {
      'admin': 1,
      'moderator': 2,
      'doctor': 3,
      'patient': 4,
      'user': 5
    };

    const primaryRole = roles.reduce((highest, current) => {
      const currentPriority = rolePriority[current.role] || 999;
      const highestPriority = rolePriority[highest.role] || 999;
      
      return currentPriority < highestPriority ? current : highest;
    });

    secureLogger.debug('Primary role determined', { 
      primaryRole: primaryRole.role 
    });

    return primaryRole.role;
  } catch (error) {
    secureLogger.error('Error getting primary role', error);
    return 'user'; // Safe default
  }
}

/**
 * Add role to user (admin only operation)
 * This function should only be called by authenticated admins
 */
export async function addUserRole(userId: string, role: AppRole): Promise<boolean> {
  try {
    // Verify current user is admin
    const isAdmin = await hasRole('admin');
    if (!isAdmin) {
      secureLogger.securityEvent('Unauthorized role assignment attempt', { 
        targetUserId: '[SANITIZED]', 
        role 
      });
      throw new Error('Unauthorized: Only admins can assign roles');
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role as any // Type assertion for database compatibility
      });

    if (error) {
      secureLogger.error('Failed to add user role', error);
      return false;
    }

    secureLogger.medicalEvent('Role added to user', '[SANITIZED]', { role });
    return true;
  } catch (error) {
    secureLogger.error('Error adding user role', error);
    return false;
  }
}

/**
 * Remove role from user (admin only operation)
 */
export async function removeUserRole(userId: string, role: AppRole): Promise<boolean> {
  try {
    // Verify current user is admin
    const isAdmin = await hasRole('admin');
    if (!isAdmin) {
      secureLogger.securityEvent('Unauthorized role removal attempt', { 
        targetUserId: '[SANITIZED]', 
        role 
      });
      throw new Error('Unauthorized: Only admins can remove roles');
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role as any);

    if (error) {
      secureLogger.error('Failed to remove user role', error);
      return false;
    }

    secureLogger.medicalEvent('Role removed from user', '[SANITIZED]', { role });
    return true;
  } catch (error) {
    secureLogger.error('Error removing user role', error);
    return false;
  }
}

/**
 * Migrate role from user_profiles to user_roles table
 * This is a one-time migration utility
 */
export async function migrateProfileRoleToRoleTable(): Promise<void> {
  try {
    const isAdmin = await hasRole('admin');
    if (!isAdmin) {
      throw new Error('Unauthorized: Only admins can perform role migration');
    }

    // Get all users with roles in user_profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .not('role', 'is', null);

    if (profileError) {
      throw profileError;
    }

    let migratedCount = 0;
    for (const profile of profiles || []) {
      if (profile.role && profile.role !== 'patient') {
        // Check if role already exists
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', profile.id)
          .eq('role', profile.role as any)
          .single();

        if (!existingRole) {
          // Insert into user_roles table
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: profile.id,
              role: profile.role as any
            });

          if (!insertError) {
            migratedCount++;
          }
        }
      }
    }

    secureLogger.info('Role migration completed', { 
      migratedCount,
      totalProfiles: profiles?.length || 0
    });
  } catch (error) {
    secureLogger.error('Role migration failed', error);
    throw error;
  }
}

/**
 * Validate role assignment request
 */
export function validateRoleAssignment(role: AppRole, targetUserId: string): boolean {
  // Basic validation
  const validRoles: AppRole[] = ['admin', 'moderator', 'user', 'doctor', 'patient'];
  if (!validRoles.includes(role)) {
    return false;
  }

  if (!targetUserId || targetUserId.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Get role display name for UI
 */
export function getRoleDisplayName(role: AppRole): string {
  const displayNames: Record<AppRole, string> = {
    'admin': 'Administrador',
    'moderator': 'Moderador',
    'doctor': 'Médico',
    'patient': 'Paciente',
    'user': 'Usuário'
  };

  return displayNames[role] || 'Usuário';
}