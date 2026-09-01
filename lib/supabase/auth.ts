import { redirect } from 'next/navigation';
import { createClient } from './server';
import { Profile } from '@/types/database';

/**
 * Get current Supabase Auth User
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get current profile associated with authenticated user
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

/**
 * Guard: Requires user to be logged in
 */
export async function requireAuth(redirectTo = '/sign-in') {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Guard: Requires user to have a completed profile
 */
export async function requireProfile() {
  const user = await requireAuth();
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/onboarding');
  }

  return { user, profile };
}

/**
 * Guard: Requires user to have 'admin' role
 */
export async function requireAdmin() {
  const { user, profile } = await requireProfile();

  if (profile.role !== 'admin') {
    redirect('/jobs');
  }

  return { user, profile };
}
