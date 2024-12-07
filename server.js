const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // Import the 'path' module
const userRoutes = require('./routes/userRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // To serve image files

// JWT Middleware to verify token
const auth = (req, res, next) => {
  console.log('Authorization middleware triggered');
  
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user:', decoded);  // Log the decoded user info
    req.user = decoded; // Attach user data to req.user
    next(); // Continue to the next middleware or route
  } catch (err) {
    console.log('Invalid token');
    return res.status(403).json({ message: 'Invalid token' });
  }
};
// Middleware to ensure only assessors can access certain routes
const isAssessor = (req, res, next) => {
    if (req.user.role !== 'assessor') {
      return res.status(403).json({ message: 'Access forbidden: Assessors only' });
    }
    next();
  };
  
// Routes
app.use('/api/users', userRoutes);

// Apply the auth middleware only to protected portfolio routes
app.use('/api/portfolios', auth, portfolioRoutes);
app.use('/api/portfolios/assessor', auth, isAssessor, portfolioRoutes); // Routes meant for assessors
//app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
//app.use('/uploads', express.static('uploads'));
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Root route
app.get('/', (req, res) => {
  res.send('Welcome to Portfolio Builder Backend!');
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
