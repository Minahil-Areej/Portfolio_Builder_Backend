// const express = require('express');
// const router = express.Router();
// const ApplicationForm = require('../models/ApplicationForm');

// // @route   POST /api/application-form
// // @desc    Submit a new application form
// router.post('/', async (req, res) => {
//   try {
//     const form = new ApplicationForm(req.body);
//     await form.save();
//     res.status(201).json({ message: 'Application form submitted successfully', form });
//   } catch (error) {
//     console.error('Error submitting form:', error);
//     res.status(500).json({ message: 'Failed to submit application form' });
//   }
// });

// // @route   GET /api/application-form
// // @desc    Fetch all submitted application forms
// router.get('/', async (req, res) => {
//   try {
//     const forms = await ApplicationForm.find().sort({ createdAt: -1 });
//     res.json(forms);
//   } catch (error) {
//     console.error('Error fetching forms:', error);
//     res.status(500).json({ message: 'Failed to fetch application forms' });
//   }
// });

// module.exports = router;



// routes/applicationFormRoutes.js

const express = require('express');
const router = express.Router();
const ApplicationForm = require('../models/ApplicationForm');

// Submit a new application
router.post('/', async (req, res) => {
  try {
    const newApplication = new ApplicationForm(req.body);
    await newApplication.save();
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Server error while submitting application' });
  }
});

// Fetch all submitted applications (for admin)
router.get('/', async (req, res) => {
  try {
    const applications = await ApplicationForm.find().sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Fetch single application by ID
router.get('/:id', async (req, res) => {
  try {
    const application = await ApplicationForm.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching single application:', error);
    res.status(500).json({ message: 'Server error while fetching application' });
  }
});

module.exports = router;
