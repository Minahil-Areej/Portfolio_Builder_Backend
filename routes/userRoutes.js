const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const multer = require('multer');
const path = require('path');

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
  
      const { name, email, password, dob, postcode, qualification, phone, referenceNo, role } = req.body;
      
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
      const users = await User.find({}, 'name email role'); // Fetch users but only return name, email, and role
      res.status(200).json(users);
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
