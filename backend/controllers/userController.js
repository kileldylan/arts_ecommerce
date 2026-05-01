// backend/controllers/userController.js - COMPLETELY FIXED

// ======================= UPDATE PROFILE =======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📝 Updating profile for user:', userId);

    const {
      name,        // Will be split into first_name, last_name
      phone,
      bio,
      specialty,
      portfolio,
      website,
      instagram,
      facebook,
      twitter
    } = req.body;

    // Parse name into first_name and last_name
    let firstName = '';
    let lastName = '';
    if (name) {
      const nameParts = name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    let avatarUrl = null;
    if (req.file) {
      avatarUrl = `avatars/${req.file.filename}`;
    }

    // Build update data with CORRECT field names from your schema
    const updateData = { 
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      bio: bio || null,
      specialty: specialty || null,
      portfolio: portfolio || null,
      website: website || null,
      instagram: instagram || null,
      facebook: facebook || null,
      twitter: twitter || null,
      updated_at: new Date().toISOString()
    };
    
    if (avatarUrl) updateData.avatar_url = avatarUrl;

    console.log('📦 Update data:', updateData);

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('❌ Update error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    // Get updated user from profiles table
    const { data: updatedUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format response for frontend
    const formattedUser = {
      id: updatedUser.id,
      name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.email,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      avatar: updatedUser.avatar_url || null,
      bio: updatedUser.bio || '',
      specialty: updatedUser.specialty || '',
      portfolio: updatedUser.portfolio || '',
      website: updatedUser.website || '',
      instagram: updatedUser.instagram || '',
      facebook: updatedUser.facebook || '',
      twitter: updatedUser.twitter || '',
      user_type: updatedUser.user_type
    };

    return res.json({
      message: 'Profile updated successfully',
      user: formattedUser
    });
    
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ======================= GET PROFILE =======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    console.log('🔍 Fetching profile for user:', userId);

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();  // Use .single() since we expect one record

    if (error) {
      console.error('❌ Database error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format response for frontend
    const formattedUser = {
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar_url || null,
      bio: user.bio || '',
      specialty: user.specialty || '',
      portfolio: user.portfolio || '',
      website: user.website || '',
      instagram: user.instagram || '',
      facebook: user.facebook || '',
      twitter: user.twitter || '',
      user_type: user.user_type,
      created_at: user.created_at
    };

    console.log('✅ Profile found:', formattedUser.email);
    return res.json(formattedUser);
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ======================= GET ALL ARTISTS =======================
exports.getAllArtists = async (req, res) => {
  try {
    const { data: artists, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, bio, specialty, portfolio, website, instagram, facebook, twitter, avatar_url, created_at, user_type')
      .eq('user_type', 'artist')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    // Format artists for frontend
    const formattedArtists = artists.map(artist => ({
      id: artist.id,
      name: `${artist.first_name || ''} ${artist.last_name || ''}`.trim() || artist.email,
      email: artist.email,
      bio: artist.bio || '',
      specialty: artist.specialty || '',
      portfolio: artist.portfolio || '',
      avatar: artist.avatar_url || null,
      website: artist.website,
      instagram: artist.instagram,
      facebook: artist.facebook,
      twitter: artist.twitter,
      created_at: artist.created_at
    }));

    return res.json(formattedArtists);
  } catch (error) {
    console.error('❌ Get artists error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};