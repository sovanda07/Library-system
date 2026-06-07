const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('./user.model');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

function sendResponse(req, res, successData, redirectPath) {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.redirect(redirectPath);
  }

  return res.json(successData);
}

function sendError(req, res, status, message, redirectPath) {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    const view = redirectPath === '/login' ? 'login' : redirectPath === '/register' ? 'register' : 'home';
    return res.status(status).render(view, { error: message });
  }

  return res.status(status).json({ message });
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const assignedRole = role === 'librarian' ? 'member' : (role || 'member');

    const existing = await User.findOne({ email });
    if (existing) return sendError(req, res, 409, 'Email already in use', '/register');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    const token = signToken(user);
    return sendResponse(req, res, {
      message: 'Registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, '/login');
  } catch (err) {
    return sendError(req, res, 500, err.message, '/register');
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendError(req, res, 401, 'Invalid credentials', '/login');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendError(req, res, 401, 'Invalid credentials', '/login');

    const token = signToken(user);
    return sendResponse(req, res, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, '/');
  } catch (err) {
    return sendError(req, res, 500, err.message, '/login');
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};