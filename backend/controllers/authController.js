// backend/controllers/authController.js
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

// OAuth success handler
exports.oauthSuccess = (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
  
  const token = generateToken(req.user.id);
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
};

// OAuth failure handler
exports.oauthFailure = (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, userType, phone, bio, specialty, portfolio, socialMedia } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Check if admin registration requires invite code
    if (userType === 'admin') {
      const { inviteCode } = req.body;
      if (inviteCode !== process.env.ADMIN_INVITE_CODE) {
        return res.status(400).json({ message: 'Invalid admin invite code' });
      }
    }

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (checkError) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const userData = {
      name,
      email,
      password: hashedPassword,
      user_type: userType || 'customer',
      phone: phone || null,
      bio: bio || null,
      specialty: specialty || null,
      portfolio: portfolio || null,
      social_media: socialMedia ? JSON.stringify(socialMedia) : null,
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (createError) {
      return res.status(500).json({ message: 'Error creating user' });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (findError) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .limit(1);

    if (error) {
      return res.status(500).json({ message: "Server error" });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Ensure avatar has a full URL
    if (user.avatar) {
      if (!user.avatar.startsWith("http")) {
        user.avatar = `${process.env.SERVER_URL || "http://localhost:5000"}/uploads/${user.avatar}`;
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: "Server error" });
  }
};