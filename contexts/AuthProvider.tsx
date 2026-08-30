// contexts/AuthProvider.tsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userName: string;
  userInitial: string;
  userEmail: string;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userName: 'Guardian',
  userInitial: 'G',
  userEmail: '',
  isLoading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('Guardian');
  const [userInitial, setUserInitial] = useState<string>('G');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileName = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setUser(null);
      setUserName('Guardian');
      setUserInitial('G');
      setUserEmail('');
      return;
    }

    const currentUser = currentSession.user;
    setUser(currentUser);
    setUserEmail(currentUser.email || '');

    // 1. Try metadata first for fast rendering
    const metadataName =
      currentUser.user_metadata?.display_name ||
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name;

    if (metadataName && typeof metadataName === 'string' && metadataName.trim()) {
      const cleanName = metadataName.trim();
      setUserName(cleanName);
      setUserInitial(cleanName.charAt(0).toUpperCase());
    } else if (currentUser.email) {
      const emailName = currentUser.email.split('@')[0];
      const capitalized = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      setUserName(capitalized);
      setUserInitial(capitalized.charAt(0));
    }

    // 2. Fetch from Supabase 'profiles' table for any updated profile row
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', currentUser.id)
        .single();

      if (data?.display_name && data.display_name.trim()) {
        const profileName = data.display_name.trim();
        setUserName(profileName);
        setUserInitial(profileName.charAt(0).toUpperCase());
      }
    } catch {
      /* ignore if profiles table fetch fails */
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await fetchProfileName(data.session);
  }, [fetchProfileName]);

  useEffect(() => {
    // 1. Initial Session Boot
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchProfileName(session).finally(() => setIsLoading(false));
    });

    // 2. Listen for Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchProfileName(session).finally(() => setIsLoading(false));
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileName]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userName,
        userInitial,
        userEmail,
        isLoading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};