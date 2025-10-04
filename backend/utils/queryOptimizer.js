// utils/queryOptimizer.js
class QueryOptimizer {
  static productList(filters = {}) {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        slug,
        images,
        category:categories(name)
      `) // Only select needed fields
      .eq('is_published', true)
      .limit(50); // Reasonable limit

    // Add filters efficiently
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    return query;
  }

  static async getProductWithCache(id) {
    const cacheKey = `product:${id}`;
    
    try {
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Database query with optimized select
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          artist:users(name, avatar)
        `)
        .eq('id', id)
        .single();

      if (data) {
        // Cache for 15 minutes
        await redisClient.setEx(cacheKey, 900, JSON.stringify(data));
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
}