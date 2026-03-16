/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  theme: 'light' | 'dark';
  birthday?: string;
  wellness_enabled?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches the custom data from your public.profiles table
   */
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Fallback for first-time login: create minimal object from metadata
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        setUser({
          id: userId,
          email: sbUser?.email,
          theme: 'dark',
          full_name: sbUser?.user_metadata?.full_name || 'Student'
        });
      } else if (data) {
        setUser(data as UserProfile);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    // 1. Check active sessions on load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
        
        // REBAR: If session is severed, force hard purge and redirect
        if (event === 'SIGNED_OUT') {
          console.log("System Purge: SIGNED_OUT event detected.");
          // Clear local storage to wipe broken Google tokens
          localStorage.clear();
          sessionStorage.clear();
          // Hard reload to login to reset all React state
          window.location.href = '/login';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * RECALIBRATED: signOut
   * Performs a total system purge to prevent "sticky" browser sessions.
   */
  const signOut = async () => {
    try {
      // 1. Terminate Supabase session
      await supabase.auth.signOut();
      
      // 2. Clear local rebar
      setUser(null);
      setSession(null);
      
      // 3. Purge storage
      localStorage.clear();
      sessionStorage.clear();

      // 4. Force hard redirect
      window.location.href = '/login';
    } catch (err) {
      console.error("Logout Failure:", err);
      // Fail-safe: force redirect regardless of API response
      window.location.href = '/login';
    }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (user) setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, session, signOut, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}