import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

type AuthContextType = {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  updateProfile: (data: Partial<Profile>) => Promise<any>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => ({}),
  updateProfile: async () => ({}),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profilesv2')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    return profileData;
  };

  useEffect(() => {
    const setupAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        const profileData = await fetchProfile(data.session.user.id);
        setProfile(profileData || null);
      }
      
      setLoading(false);
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          setUser(session?.user || null);
          
          if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData || null);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      );
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, []);
  
  const signUp = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return { error: authError };

    if (authData.user) {
      // Create profile in profilesv2 table
      const { error: profileError } = await supabase
        .from('profilesv2')
        .insert({
          id: authData.user.id,
          Email: authData.user.email,
          Name: email.split('@')[0], // Set default name to email username
          created_at: new Date().toISOString(),
          "Row ID": `user_${authData.user.id}` // Required unique Row ID
        });

      if (profileError) {
        // If profile creation fails, delete the user and return error
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { error: profileError };
      }

      // Fetch the newly created profile
      const profileData = await fetchProfile(authData.user.id);
      setProfile(profileData || null);
    }

    return { data: authData };
  };
  
  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
    return { error };
  };
  
  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    
    const { error } = await supabase
      .from('profilesv2')
      .update(data)
      .eq('id', user.id);
      
    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...data } : null);
      return { success: true };
    }
    
    return { error };
  };
  
  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);