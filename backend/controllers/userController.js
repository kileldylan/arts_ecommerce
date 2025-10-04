// backend/controllers/userController.js
const supabase = require('../config/supabase');

// ======================= GET PROFILE =======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Normalize avatar to full URL
    if (user.avatar && !user.avatar.startsWith('http')) {
      user.avatar = `${req.protocol}://${req.get('host')}/uploads/${user.avatar}`;
    }

    // Normalize social_media
    if (user.social_media) {
      try {
        user.social_media = JSON.parse(user.social_media);
      } catch {
        user.social_media = {};
      }
    } else {
      user.social_media = {};
    }

    return res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ======================= UPDATE PROFILE =======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      phone,
      bio,
      specialty,
      portfolio,
      website,
      instagram,
      facebook,
      twitter
    } = req.body;

    let avatarPath = null;
    if (req.file) {
      avatarPath = `avatars/${req.file.filename}`;
    }

    const social_media = JSON.stringify({
      website: website || null,
      instagram: instagram || null,
      facebook: facebook || null,
      twitter: twitter || null,
    });

    const updateData = { 
      name, 
      phone, 
      bio, 
      specialty, 
      portfolio, 
      social_media,
      updated_at: new Date().toISOString()
    };
    
    if (avatarPath) updateData.avatar = avatarPath;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }

    // Get updated user
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (fetchError) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = users[0];

    if (updatedUser.avatar && !updatedUser.avatar.startsWith('http')) {
      updatedUser.avatar = `${req.protocol}://${req.get('host')}/uploads/${updatedUser.avatar}`;
    }

    if (updatedUser.social_media) {
      try {
        updatedUser.social_media = JSON.parse(updatedUser.social_media);
      } catch {
        updatedUser.social_media = {};
      }
    } else {
      updatedUser.social_media = {};
    }

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ======================= GET ALL ARTISTS =======================
exports.getAllArtists = async (req, res) => {
  try {
    const { data: artists, error } = await supabase
      .from('users')
      .select('id, name, email, bio, specialty, portfolio, social_media, avatar, created_at')
      .eq('user_type', 'artist')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }

    return res.json(artists || []);
  } catch (error) {
    console.error('Get artists error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};