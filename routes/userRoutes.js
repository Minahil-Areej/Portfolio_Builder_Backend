const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


// Configure Multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Register user with image upload
router.post('/register', upload.single('image'), async (req, res) => {
  try {
    console.log('File:', req.file);  // Log the uploaded file
    console.log('Body:', req.body);  // Log the form data

    const { name, email, password, dob, postcode, qualification, phone, referenceNo, role, isActive } = req.body;

    // Ensure the data is being captured properly
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const image = req.file ? req.file.path : null; // Check if the file is being processed

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      dob,
      postcode,
      qualification,
      phone,
      referenceNo,
      role,
      image, // Save the image path in the database
      isActive,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration:', err); // Log the full error
    res.status(500).json({ error: err.message });
  }
});


// Login user
// router.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//       const user = await User.findOne({ email });
//       if (!user) return res.status(400).json({ message: 'User not found' });

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//       // Generate JWT token
//       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

//       // Send token back to the frontend
//       res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated. Please contact admin.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send token and user object back to the frontend
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (Admin-only)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'name email role isActive'); // Fetch users but only return name, email, and role
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Deactivate or Reactivate a User
router.put('/deactivate/:id', async (req, res) => {
  try {

    // console.log(`Received request to toggle user ${req.params.id} status.`); // Log request
    //  console.log('Request body:', req.body); // Log received data
    const { isActive } = req.body;


    // Ensure user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user status
    user.isActive = isActive;
    await user.save(); // Ensure changes are saved to DB

    console.log(`User ${req.params.id} is now ${isActive ? 'Active' : 'Inactive'}`); // Log status change

    res.status(200).json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Always respond 200 to prevent email enumeration
      return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set on user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Create email link
    const resetURL = `https://www.eporto.co.uk/reset-password?token=${resetToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Cranbrook College" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <p>Hello ${user.name || ''},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Error sending reset email.' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ message: 'Error resetting password.' });
  }
});


module.exports = router;
