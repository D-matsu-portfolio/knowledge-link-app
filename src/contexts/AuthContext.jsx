import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupUserSession = async () => {
      // 1. 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setLoading(false);
        return;
      }

      const sessionUser = session?.user;
      setUser(sessionUser ?? null);

      // 2. ログインしている場合はプロフィールを取得
      if (sessionUser) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', sessionUser.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        setProfile(userProfile ?? null);
      } else {
        setProfile(null);
      }
      
      // 3. どのような場合でもローディングを終了
      setLoading(false);
    };

    setupUserSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      setUser(sessionUser ?? null);

      if (sessionUser) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', sessionUser.id)
          .single()
          .then(({ data, error }) => {
            if (error) console.error('Error fetching profile on auth change:', error);
            setProfile(data ?? null);
          });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    updatePassword: (data) => supabase.auth.updateUser(data),
    user,
    profile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};