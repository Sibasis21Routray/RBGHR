const User = require('../models/user.model');
const emailService = require('../services/email.service');

// Create new user (sub-admin or sub-user)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!['sub-admin', 'sub-user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only sub-admin or sub-user allowed'
      });
    }

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create and save user
    const newUser = new User({ name, email, password, role });
    const savedUser = await newUser.save();

    // Remove password before sending response
    const safeUser = await User.findById(savedUser._id).select('-password');

    res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      data: safeUser
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Get all sub-admins
const getAllSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: 'sub-admin' })
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Sub-admins retrieved successfully',
      data: subAdmins
    });

  } catch (error) {
    console.error('Error fetching sub-admins:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all sub-users
const getAllSubUsers = async (req, res) => {
  try {
    const subUsers = await User.find({ role: 'sub-user' })
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Sub-users retrieved successfully',
      data: subUsers
    });

  } catch (error) {
    console.error('Error fetching sub-users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get sub-admin by ID
const getSubAdminById = async (req, res) => {
  try {
    const subAdmin = await User.findOne({
      _id: req.params.id,
      role: 'sub-admin'
    }).select('-password'); // Exclude password

    if (!subAdmin) {
      return res.status(404).json({ success: false, message: 'Sub-admin not found' });
    }

    res.json({ success: true, message: 'Sub-admin retrieved successfully', data: subAdmin });

  } catch (error) {
    console.error('Error fetching sub-admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get sub-user by ID
const getSubUserById = async (req, res) => {
  try {
    const subUser = await User.findOne({
      _id: req.params.id,
      role: 'sub-user'
    }).select('-password'); // Exclude password

    if (!subUser) {
      return res.status(404).json({ success: false, message: 'Sub-user not found' });
    }

    res.json({ success: true, message: 'Sub-user retrieved successfully', data: subUser });

  } catch (error) {
    console.error('Error fetching sub-user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create new sub-admin
const createSubAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    const newSubAdmin = new User({ email, password, role: 'sub-admin' });
    const savedSubAdmin = await newSubAdmin.save();

    const safeSubAdmin = await User.findById(savedSubAdmin._id).select('-password'); // Exclude password
    res.status(201).json({ success: true, message: 'Sub-admin created successfully', data: safeSubAdmin });

  } catch (error) {
    console.error('Error creating sub-admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Create new sub-user
const createSubUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    const newSubUser = new User({ email, password, role: 'sub-user' });
    const savedSubUser = await newSubUser.save();

    const safeSubUser = await User.findById(savedSubUser._id).select('-password'); // Exclude password
    res.status(201).json({ success: true, message: 'Sub-user created successfully', data: safeSubUser });

  } catch (error) {
    console.error('Error creating sub-user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Update sub-admin
const updateSubAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const subAdmin = await User.findOne({ _id: req.params.id, role: 'sub-admin' });
    if (!subAdmin) return res.status(404).json({ success: false, message: 'Sub-admin not found' });

    if (email && email !== subAdmin.email) {
      const duplicateUser = await User.findOne({ email, _id: { $ne: subAdmin._id } });
      if (duplicateUser) return res.status(409).json({ success: false, message: 'Another user with this email already exists' });
      subAdmin.email = email;
    }

    if (password) subAdmin.password = password; // Will be hashed

    const updatedSubAdmin = await subAdmin.save();
    const safeSubAdmin = await User.findById(updatedSubAdmin._id).select('-password'); // Exclude password
    res.json({ success: true, message: 'Sub-admin updated successfully', data: safeSubAdmin });

  } catch (error) {
    console.error('Error updating sub-admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update sub-user
const updateSubUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const subUser = await User.findOne({ _id: req.params.id, role: 'sub-user' });
    if (!subUser) return res.status(404).json({ success: false, message: 'Sub-user not found' });

    if (email && email !== subUser.email) {
      const duplicateUser = await User.findOne({ email, _id: { $ne: subUser._id } });
      if (duplicateUser) return res.status(409).json({ success: false, message: 'Another user with this email already exists' });
      subUser.email = email;
    }

    if (password) subUser.password = password; // Will be hashed

    const updatedSubUser = await subUser.save();
    const safeSubUser = await User.findById(updatedSubUser._id).select('-password'); // Exclude password
    res.json({ success: true, message: 'Sub-user updated successfully', data: safeSubUser });

  } catch (error) {
    console.error('Error updating sub-user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete sub-admin
const deleteSubAdmin = async (req, res) => {
  try {
    const subAdmin = await User.findOne({ _id: req.params.id, role: 'sub-admin' });
    if (!subAdmin) return res.status(404).json({ success: false, message: 'Sub-admin not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sub-admin deleted successfully' });

  } catch (error) {
    console.error('Error deleting sub-admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete sub-user
const deleteSubUser = async (req, res) => {
  try {
    const subUser = await User.findOne({ _id: req.params.id, role: 'sub-user' });
    if (!subUser) return res.status(404).json({ success: false, message: 'Sub-user not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sub-user deleted successfully' });

  } catch (error) {
    console.error('Error deleting sub-user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const totalSubAdmins = await User.countDocuments({ role: 'sub-admin' });
    const totalSubUsers = await User.countDocuments({ role: 'sub-user' });
    const totalUsers = await User.countDocuments({ role: 'user' });

    res.json({
      success: true,
      message: 'Admin statistics retrieved successfully',
      data: {
        totalSubAdmins,
        totalSubUsers,
        totalUsers,
        totalManagedUsers: totalSubAdmins + totalSubUsers + totalUsers
      }
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createUser,
  getAllSubAdmins,
  getAllSubUsers,
  getSubAdminById,
  getSubUserById,
  createSubAdmin,
  createSubUser,
  updateSubAdmin,
  updateSubUser,
  deleteSubAdmin,
  deleteSubUser,
  getAdminStats
};
