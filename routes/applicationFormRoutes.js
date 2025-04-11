const express = require('express');
const router = express.Router();
const ApplicationForm = require('../models/ApplicationForm');

// @route   POST /api/application-form
// @desc    Submit a new application form
router.post('/', async (req, res) => {
  try {
    const form = new ApplicationForm(req.body);
    await form.save();
    res.status(201).json({ message: 'Application form submitted successfully', form });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Failed to submit application form' });
  }
});

// @route   GET /api/application-form
// @desc    Fetch all submitted application forms
router.get('/', async (req, res) => {
  try {
    const forms = await ApplicationForm.find().sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ message: 'Failed to fetch application forms' });
  }
});

module.exports = router;
