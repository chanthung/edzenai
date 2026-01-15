import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, schoolName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, schoolName: string) => {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password 
    });
    
    if (authError || !authData.user) {
      return { error: authError as Error | null };
    }

    // CRITICAL: Wait for the session to be properly set before database operations
    // With auto-confirm enabled, signUp returns a session immediately
    if (authData.session) {
      await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });
    } else {
      return { error: new Error('Session not created. Please try logging in.') };
    }

    // Create the school
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .insert({ name: schoolName })
      .select()
      .single();

    if (schoolError || !schoolData) {
      return { error: schoolError as Error | null };
    }

    // Link user as admin of the school
    const { error: adminError } = await supabase
      .from('school_admins')
      .insert({ 
        user_id: authData.user.id, 
        school_id: schoolData.id,
        is_primary: true 
      });

    if (adminError) {
      return { error: adminError as Error | null };
    }

    // Create default fee categories
    const defaultCategories = [
      { name: 'Tuition Fee', description: 'Annual tuition fees', is_mandatory: true, display_order: 1 },
      { name: 'Transport Fee', description: 'School bus/transport charges', is_mandatory: false, display_order: 2 },
      { name: 'Activities Fee', description: 'Sports, arts, and extracurricular activities', is_mandatory: false, display_order: 3 },
    ];

    await supabase
      .from('fee_categories')
      .insert(defaultCategories.map(cat => ({ ...cat, school_id: schoolData.id })));

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
