// backend/middleware/auth.js - Updated for Supabase
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Supabase auth error:', error?.message);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Get user profile from your profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Still attach the user, just without profile data
      req.user = {
        id: user.id,
        email: user.email,
        user_type: user.user_metadata?.user_type || 'customer'
      };
    } else {
      req.user = {
        id: user.id,
        email: user.email,
        user_type: profile.user_type,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone
      };
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        req.user = {
          id: user.id,
          email: user.email,
          user_type: profile?.user_type || user.user_metadata?.user_type || 'customer',
          ...profile
        };
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { auth, optionalAuth };