class AssetRepository {
  /**
   * @param {import('@supabase/supabase-js').SupabaseClient} supabaseAnon
   */
  constructor(supabaseAnon) {
    this.supabase = supabaseAnon;
    this.table = 'assets';
    this.versionsTable = 'asset_versions';
  }

  async findMany({ platform, category, userId } = {}) {
    let query = this.supabase
      .from(this.table)
      .select('*, asset_versions(*)')
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (platform) query = query.eq('platform_origin', platform);
    if (category) query = query.contains('metadata', { category });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*, asset_versions(*)')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      // not found
      return null;
    }
    if (error) throw error;
    return data;
  }

  async create(assetData) {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(assetData)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }

  async update(id, updates) {
    const { data, error } = await this.supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }

  async delete(id) {
    // delete versions first
    await this.supabase.from(this.versionsTable).delete().eq('asset_id', id);
    const { error } = await this.supabase.from(this.table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async search(q, limit = 20) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .ilike('name', `%${q}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getPlatformStats() {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('platform_origin, count(*)')
      .group('platform_origin');

    if (error) throw error;
    return data || [];
  }
}

module.exports = AssetRepository;
