const User = require('../models/user.model');
const emailService = require('../services/email.service');
const crypto = require('crypto');

// Create default admin, sub-admin, and sub_user users if they don't exist
const createDefaultUsers = async () => {
  try {
    const adminExists = await User.findOne({ email:process.env.DEFAULT_ADMIN_EMAIL });
    if (!adminExists) {
      const admin = new User({
        email: process.env.DEFAULT_ADMIN_EMAIL,
        password: process.env.DEFAULT_ADMIN_PASSWORD, // This will be hashed by the pre-save hook
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin user created');
    }

    const subAdminExists = await User.findOne({ email: process.env.DEFAULT_SUB_ADMIN_EMAIL });
    if (!subAdminExists) {
      const subAdmin = new User({
        email: process.env.DEFAULT_SUB_ADMIN_EMAIL,
        password: process.env.DEFAULT_SUB_ADMIN_PASSWORD, // This will be hashed by the pre-save hook
        role: 'sub-admin'
      });
      await subAdmin.save();
      console.log('Default sub-admin user created');
    }

    const subUserExists = await User.findOne({ email: process.env.DEFAULT_SUB_USER_EMAIL });
    if (!subUserExists) {
      const subUser = new User({
        email: process.env.DEFAULT_SUB_USER_EMAIL,
        password: process.env.DEFAULT_SUB_USER_PASSWORD, // This will be hashed by the pre-save hook
        role: 'sub-user'
      });
      await subUser.save();
      console.log('Default sub_user created');
    }
  } catch (error) {
    console.error('Error creating default users:', error);
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const newUser = new User({
      email,
      password,
      role: role || 'user'
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        createdAt: savedUser.createdAt
      }
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

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for duplicate email (excluding current user)
    if (email && email !== user.email) {
      const duplicateUser = await User.findOne({ email, _id: { $ne: userId } });
      if (duplicateUser) {
        return res.status(409).json({
          success: false,
          message: 'Another user with this email already exists'
        });
      }
      user.email = email;
    }

    if (password) {
      user.password = password; // Will be hashed by pre-save hook
    }

    if (role) {
      user.role = role;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login user (basic authentication)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  try {
    // In a stateless authentication system, logout is handled client-side
    // by clearing any stored tokens or session data
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist'
      });
    }

    // Create password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      res.json({
        success: true,
        message: 'Password reset email sent successfully. Please check your email.'
      });
    } catch (emailError) {
      // Reset the token if email fails
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      console.error('Error sending email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Error sending password reset email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && user.isPasswordResetTokenValid(token)) {
      const tokenIssuedAt = new Date(user.passwordResetExpires.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (user.passwordChangedAt > tokenIssuedAt) {
        return res.status(400).json({
          success: false,
          message: 'Password reset token has expired due to recent password change'
        });
      }
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordChangedAt = Date.now();

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  }  catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createDefaultUsers,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword
};
