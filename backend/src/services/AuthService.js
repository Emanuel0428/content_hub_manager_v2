class AuthService {
  /**
   * @param {import('@supabase/supabase-js').SupabaseClient} supabaseAnon
   * @param {import('@supabase/supabase-js').SupabaseClient} supabaseService
   */
  constructor(supabaseAnon, supabaseService) {
    this.supabase = supabaseAnon;
    this.supabaseService = supabaseService;
  }

  async signup(email, password, displayName) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`
      }
    });

    if (error) throw error;

    // Try to auto-confirm via service client if available
    if (data?.user && this.supabaseService) {
      try {
        await this.supabaseService.auth.admin.updateUserById(data.user.id, { email_confirm: true });
      } catch (e) {
        // non-fatal
      }
    }

    // Try to sign in to return session
    try {
      const { data: signinData } = await this.supabase.auth.signInWithPassword({ email, password });
      return { user: data.user, session: signinData?.session || null };
    } catch (e) {
      return { user: data.user, session: null };
    }
  }

  async login(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    return true;
  }

  async refreshSession(refreshToken) {
    const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) throw error;
    return data;
  }

  async getUserFromToken(token) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) throw error;
    return data?.user || null;
  }

  async resetPasswordForEmail(email) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  }

  async updatePassword(newPassword) {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  }
}

module.exports = AuthService;
