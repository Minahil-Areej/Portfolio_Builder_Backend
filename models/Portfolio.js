// models/Portfolio.js
const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to student
  title: { type: String, required: true },
  unit: {
    number: { type: String },      // Unit number
    title: { type: String },       // Unit title
  },

  // Store both the learning outcome number and description
  learningOutcome: {
    number: { type: String },      // LO number
    description: { type: String }, // LO description
  },

  // Store both the criteria number and description
  criteria: {
    number: { type: String },      // Criteria number
    description: { type: String }, // Criteria description
  },

  statement: { type: String }, // Student's statement for the portfolio
  dateTime: { type: Date, default: Date.now }, // Date and time of portfolio creation or update
  postcode: { type: String }, // Postcode for the location of the portfolio
  images: [{ type: String }], // URLs for multiple images
  comments: { type: String }, // Student's comments for the portfolio
  sections: [
    {
      heading: String,
      content: String,
    },
  ],
  assessorComments: { type: String },  // New field for Assessor feedback
  status: { 
    type: String, 
    enum: ['Draft', 'To Be Reviewed', 'Reviewed', 'Rejected', 'Approved'],
    default: 'Draft' 
  },
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    comments: String
  }],
  linkedCriteria: [{
    unitNumber: String,
    learningOutcome: String,
    criteriaNumber: String
  }],
  submissionCount: { type: Number, default: 0 }, // New field to track submission count
  // New fields
  taskDescription: { type: String }, // Description of the task
  jobType: { type: String },         // Type of job
  reasonForTask: { type: String },   // Reason for the task
  objectiveOfJob: { type: String },  // Objective of the job
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
