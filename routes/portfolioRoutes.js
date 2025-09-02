const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Portfolio = require('../models/Portfolio');
const mongoose = require('mongoose'); // Add this line
const puppeteer = require('puppeteer'); // Import puppeteer
const User = require('../models/User'); // Add this import at the top
const { PDFDocument, rgb } = require('pdf-lib');
const sharp = require('sharp'); // Import Sharp for image processing
const fs = require('fs');

// Configure Multer for image uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname)); // Add unique filename
//   },
// });
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//       const uploadPath = path.join(__dirname, '../uploads'); // Ensure correct path to 'uploads'
//       cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//       cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
//   },
// });

// const upload = multer({ storage: storage });


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/opt/uploads'); // Mount path of the persistent disk
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage: storage });


// Create a new portfolio (Protected Route)
router.post('/save', upload.array('images', 10), async (req, res) => {
  try {
    console.log('User ID:', req.user.id);  // User ID should now be available
    console.log('Request Body:', req.body); // Log all incoming data

    const { title, unit, criteria, learningOutcome, postcode, comments, dateTime, status, taskDescription,
      jobType,
      reasonForTask,
      objectiveOfJob,
      Method } = req.body;

    if (!title || !unit || !criteria) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedUnit = JSON.parse(unit);
    const parsedLearningOutcome = JSON.parse(learningOutcome);
    const parsedCriteria = JSON.parse(criteria);

    // Log to check if the data is being correctly received
    console.log('Unit:', parsedUnit);
    console.log('Learning Outcome:', parsedLearningOutcome);
    console.log('Criteria:', parsedCriteria);

   // const images = req.files.map((file) => file.path); // Get file paths for images
   const images = req.files.map((file) => `uploads/${file.filename}`); // Save relative path

   console.log('New Fields:');
   console.log('Task Description:', taskDescription);
   console.log('Job Type:', jobType);
   console.log('Reason for Task:', reasonForTask);
   console.log('Objective of Job:', objectiveOfJob);
   console.log('Method:', Method);

    console.log('Received Images:', req.files);
    const portfolio = new Portfolio({
      userId: req.user.id, // Use authenticated user's ID
      title,
      unit: parsedUnit,  // Save unit as an object (number and title)
      learningOutcome: parsedLearningOutcome,  // Save learning outcome as an object (number and description)
      criteria: parsedCriteria,
      postcode,
      comments,
      dateTime: new Date(dateTime), // Save date and time from request body 
      status: status || 'Draft', // Added: Save status as provided or default to 'Draft'
      images,
      taskDescription,
      jobType,
      reasonForTask,
      objectiveOfJob,
      Method,
    });

    await portfolio.save();
    res.status(201).json({ message: 'Portfolio saved successfully', portfolio });
  } catch (error) {
    console.error('Error saving portfolio:', error);
    res.status(500).json({ message: 'Server error while saving portfolio' });
  }
});



// Fetch portfolios for the logged-in user
router.get('/user-portfolios', async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user.id }); // Fetch portfolios created by the logged-in user
    res.status(200).json(portfolios);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching portfolios' });
  }
});

// Update an existing portfolio
// router.put('/:id', upload.array('images', 10), async (req, res) => {
//   try {
//     const { title, unit, learningOutcome, criteria, postcode, statement, comments, existingImages, status } = req.body;

//     // Parse the existing images from the request body
//     let previousImages = existingImages ? JSON.parse(existingImages) : [];

//     // Add new images if any
//     let newImages = [];
//     if (req.files && req.files.length > 0) {
//       newImages = req.files.map((file) => file.path);
//     }

//     // Merge existing and new images
//     const updatedImages = [...previousImages, ...newImages];

//     const parsedUnit = unit ? JSON.parse(unit) : {};
//     const parsedLearningOutcome = learningOutcome ? JSON.parse(learningOutcome) : {};
//     const parsedCriteria = criteria ? JSON.parse(criteria) : {};


//     // Update the portfolio with all fields and merged images
//     const updatedPortfolio = await Portfolio.findByIdAndUpdate(
//       req.params.id,
//       {
//         title, 
//         unit: parsedUnit,
//         learningOutcome: parsedLearningOutcome,
//         criteria: parsedCriteria,
//         postcode, 
//         statement, 
//         comments, 
//         images: updatedImages,
//         status,  // Include status to update it
//       },
//       { new: true } // Return the updated document
//     );

//     res.status(200).json({ message: 'Portfolio updated successfully', portfolio: updatedPortfolio });
//   } catch (error) {
//     console.error('Error updating portfolio:', error);
//     res.status(500).json({ message: 'Error updating portfolio' });
//   }
// });
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { title, unit, learningOutcome, criteria, postcode, comments, existingImages, status, taskDescription,
      jobType,
      reasonForTask,
      objectiveOfJob,
      Method } = req.body;

    // Parse the existing images from the request body
    let previousImages = existingImages ? JSON.parse(existingImages) : [];

    // Add new images if any
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => `uploads/${file.filename}`); // Save relative path

    }

    // Merge existing and new images
    const updatedImages = [...previousImages, ...newImages];

    // Fetch the current portfolio
    const currentPortfolio = await Portfolio.findById(req.params.id);
    if (!currentPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Build the update object
    const updateFields = {
      title: title || currentPortfolio.title, // Retain existing title if not provided
      unit: unit ? JSON.parse(unit) : currentPortfolio.unit,
      learningOutcome: learningOutcome ? JSON.parse(learningOutcome) : currentPortfolio.learningOutcome,
      criteria: criteria ? JSON.parse(criteria) : currentPortfolio.criteria,
      postcode: postcode || currentPortfolio.postcode,
      // statement: statement || currentPortfolio.statement,
      comments: comments || currentPortfolio.comments,
      images: newImages.length > 0 ? updatedImages : currentPortfolio.images, // Update images only if new ones are provided
      status: status || currentPortfolio.status, // Update status if provided
      taskDescription: taskDescription || currentPortfolio.taskDescription,
      jobType: jobType || currentPortfolio.jobType,
      reasonForTask: reasonForTask || currentPortfolio.reasonForTask,
      objectiveOfJob: objectiveOfJob || currentPortfolio.objectiveOfJob,
      Method: Method || currentPortfolio.Method,
    };

    // Increment submission count if transitioning from Reviewed to Draft
    if (currentPortfolio.status === 'Reviewed' && status === 'Draft') {
      updateFields.submissionCount = (currentPortfolio.submissionCount || 0) + 1;
    }

    const updatedPortfolio = await Portfolio.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    res.status(200).json({ message: 'Portfolio updated successfully', portfolio: updatedPortfolio });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ message: 'Error updating portfolio' });
  }
});


// Delete a portfolio
router.delete('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findByIdAndDelete(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.status(200).json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting portfolio' });
  }
});

// Fetch a portfolio by ID for the logged-in user
router.get('/:id', async (req, res) => {
  try {
    console.log('GET request received for portfolio');
    console.log('Portfolio ID from params:', req.params.id);
    console.log('User ID from token:', req.user.id);  // Ensure user ID is extracted from JWT

    // Use 'new' keyword when casting to ObjectId
    const portfolioId = new mongoose.Types.ObjectId(req.params.id);

    const portfolio = await Portfolio.findOne({ _id: portfolioId, userId: req.user.id });

    if (!portfolio) {
      console.log('Portfolio not found or access denied');
      return res.status(404).json({ message: 'Portfolio not found or access denied' });
    }

    console.log('Portfolio found:', portfolio);
    res.status(200).json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ message: 'Error fetching portfolio' });
  }
});

//working fine locally
// router.get('/:id/export-pdf', async (req, res) => {
//   try {
//     const portfolio = await Portfolio.findById(req.params.id);

//     if (!portfolio) {
//       return res.status(404).json({ message: 'Portfolio not found' });
//     }

//     // Create a new PDF Document
//     const pdfDoc = await PDFDocument.create();
//     let page = pdfDoc.addPage([600, 800]);

//     // Define initial Y position and margin
//     let imageY = 750;
//     const margin = 50;
//     const contentSpacing = 20;

//     // Add portfolio title and details
//     page.drawText(portfolio.title, { x: margin, y: imageY, size: 18 });
//     imageY -= 30;
//     page.drawText(`Unit: ${portfolio.unit?.number} - ${portfolio.unit?.title || ''}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 20;
//     page.drawText(`Criteria: ${portfolio.criteria?.number} - ${portfolio.criteria?.description || ''}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 20;
//     page.drawText(`Statement: ${portfolio.statement}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 20;
//     page.drawText(`Postcode: ${portfolio.postcode}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 20;
//     page.drawText(`Comments: ${portfolio.comments || 'N/A'}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 40; // Add some extra space before the images

//     // Function to add a new page if no space is left
//     const checkPageSpace = () => {
//       if (imageY < 100) {
//         page = pdfDoc.addPage([600, 800]);
//         imageY = 750;
//       }
//     };

//     // Loop through and embed images
// for (const image of portfolio.images) {
//   const imagePath = path.join(__dirname, '..', image);
//   const imageBuffer = fs.readFileSync(imagePath);

//   // Use Sharp to handle rotation based on EXIF metadata
//   const { data: correctedImageBuffer, info } = await sharp(imageBuffer).rotate().toBuffer({ resolveWithObject: true });

//   // Handle JPG and PNG files based on output format after correction
//   let pdfImage;
//   if (info.format === 'png') {
//       pdfImage = await pdfDoc.embedPng(correctedImageBuffer);
//   } else if (info.format === 'jpeg') {
//       pdfImage = await pdfDoc.embedJpg(correctedImageBuffer);
//   } else {
//       console.error('Unsupported image format');
//       continue; // Skip unsupported images
//   }

//   // Define a fixed width for all images
//   const fixedWidth = 200;
//   const imageDims = pdfImage.scale(fixedWidth / pdfImage.width); // Scale image to fixed width

//   // Check if there's enough space on the current page
//   if (imageY - imageDims.height < 100) { // Adjust to provide space for logo
//       // Draw the logo on the current page before adding a new page
//       const logoImage = await embedLogoImage(pdfDoc);
//       page.drawImage(logoImage, {
//           x: page.getWidth() - 150,
//           y: 30,
//           width: 100,
//           height: 50,
//       });

//       // Add a new page if there's not enough space
//       page = pdfDoc.addPage([600, 800]);
//       imageY = 750;
//   }

//   // Center the image horizontally
//   page.drawImage(pdfImage, {
//       x: (600 - imageDims.width) / 2, // Center the image horizontally
//       y: imageY - imageDims.height,
//       width: imageDims.width,
//       height: imageDims.height,
//   });

//   // Update the Y position for the next image
//   imageY -= imageDims.height + contentSpacing;
// }

// // Draw the Cranbrook College logo at the bottom right of the last page
// const logoImage = await embedLogoImage(pdfDoc);
// page.drawImage(logoImage, {
//   x: page.getWidth() - 150,
//   y: 30,
//   width: 100,
//   height: 50,
// });

// // Function to embed the logo image
// async function embedLogoImage(pdfDoc) {
//   const logoPath = path.join(__dirname, '..', 'uploads', 'cranbrook-college-logo.png');
//   const logoBuffer = fs.readFileSync(logoPath);
//   return await pdfDoc.embedPng(logoBuffer);
// }




//     // Serialize the PDFDocument to bytes
//     const pdfBytes = await pdfDoc.save();

//     // Send the PDF to the client
//     res.set({
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': `attachment; filename="${portfolio.title}.pdf"`,
//     });
//     res.send(Buffer.from(pdfBytes));
//   } catch (error) {
//     console.error('Error exporting PDF:', error);
//     res.status(500).json({ message: 'Error exporting PDF' });
//   }
// });

///// working in deployment too before adding new filds
// router.get('/:id/export-pdf', async (req, res) => {
//   try {
//     const portfolio = await Portfolio.findById(req.params.id);

//     if (!portfolio) {
//       return res.status(404).json({ message: 'Portfolio not found' });
//     }

//     // Create a new PDF Document
//     const pdfDoc = await PDFDocument.create();
//     let page = pdfDoc.addPage([600, 800]);

//     // Define initial Y position and margin
//     let imageY = 750;
//     const margin = 50;
//     const contentSpacing = 20;

//     // Add portfolio title and details
//     page.drawText(portfolio.title, { x: margin, y: imageY, size: 18 });
//     imageY -= 30;
//     page.drawText(`Unit: ${portfolio.unit?.number} - ${portfolio.unit?.title || ''}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 20;
//     page.drawText(`Criteria: ${portfolio.criteria?.number} - ${portfolio.criteria?.description || ''}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 20;
//     page.drawText(`Statement: ${portfolio.statement}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 20;
//     page.drawText(`Postcode: ${portfolio.postcode}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 20;
//     page.drawText(`Comments: ${portfolio.comments || 'N/A'}`, { x: margin, y: imageY, size: 12 });
//     imageY -= 40; // Add some extra space before the images

//     // Function to add a new page if no space is left
//     const checkPageSpace = () => {
//       if (imageY < 100) {
//         page = pdfDoc.addPage([600, 800]);
//         imageY = 750;
//       }
//     };

//     // Loop through and embed images
// for (const image of portfolio.images) {
//   const imagePath = path.resolve('/opt/uploads', path.basename(image)); // Use absolute path

//       if (!fs.existsSync(imagePath)) {
//         console.error('Image not found:', imagePath);
//         continue; // Skip if the image doesn't exist
//       }
      
//   const imageBuffer = fs.readFileSync(imagePath);

//   // Use Sharp to handle rotation based on EXIF metadata
//   const { data: correctedImageBuffer, info } = await sharp(imageBuffer).rotate().toBuffer({ resolveWithObject: true });

//   // Handle JPG and PNG files based on output format after correction
//   let pdfImage;
//   if (info.format === 'png') {
//       pdfImage = await pdfDoc.embedPng(correctedImageBuffer);
//   } else if (info.format === 'jpeg') {
//       pdfImage = await pdfDoc.embedJpg(correctedImageBuffer);
//   } else {
//       console.error('Unsupported image format');
//       continue; // Skip unsupported images
//   }

//   // Define a fixed width for all images
//   const fixedWidth = 200;
//   const imageDims = pdfImage.scale(fixedWidth / pdfImage.width); // Scale image to fixed width

//   // Check if there's enough space on the current page
//   if (imageY - imageDims.height < 100) { // Adjust to provide space for logo
//       // Draw the logo on the current page before adding a new page
//       const logoImage = await embedLogoImage(pdfDoc);
//       page.drawImage(logoImage, {
//           x: page.getWidth() - 150,
//           y: 30,
//           width: 100,
//           height: 50,
//       });

//       // Add a new page if there's not enough space
//       page = pdfDoc.addPage([600, 800]);
//       imageY = 750;
//   }

//   // Center the image horizontally
//   page.drawImage(pdfImage, {
//       x: (600 - imageDims.width) / 2, // Center the image horizontally
//       y: imageY - imageDims.height,
//       width: imageDims.width,
//       height: imageDims.height,
//   });

//   // Update the Y position for the next image
//   imageY -= imageDims.height + contentSpacing;
// }

// // Draw the Cranbrook College logo at the bottom right of the last page
// const logoImage = await embedLogoImage(pdfDoc);
// page.drawImage(logoImage, {
//   x: page.getWidth() - 150,
//   y: 30,
//   width: 100,
//   height: 50,
// });

// // Function to embed the logo image
// async function embedLogoImage(pdfDoc) {
//   const logoPath = path.join(__dirname, '../public/assets/cranbrook-college-logo.png');
//   if (!fs.existsSync(logoPath)) {
//       console.error('Logo file does not exist at:', logoPath);
//       throw new Error('Logo file not found');
//   }
//   const logoBuffer = fs.readFileSync(logoPath);
//   return await pdfDoc.embedPng(logoBuffer);
// }





//     // Serialize the PDFDocument to bytes
//     const pdfBytes = await pdfDoc.save();

//     // Send the PDF to the client
//     res.set({
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': `attachment; filename="${portfolio.title}.pdf"`,
//     });
//     res.send(Buffer.from(pdfBytes));
//   } catch (error) {
//     console.error('Error exporting PDF:', error);
//     res.status(500).json({ message: 'Error exporting PDF' });
//   }
// });
router.get('/:id/export-pdf', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id).populate('userId', 'name'); // Populate userId to fetch the student's name

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Create a new PDF Document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);

    // Define initial Y position and margin
    let imageY = 750;
    const margin = 50;
    const contentSpacing = 20;

    // Add student's name
    page.drawText(`Student Name: ${portfolio.userId?.name || 'N/A'}`, { x: 200, y: imageY, size: 18 });
    imageY -= 30;
    // Add portfolio title and details
    page.drawText(portfolio.title, { x: margin, y: imageY, size: 14 });
    imageY -= 30;
    page.drawText(`Unit: ${portfolio.unit?.number} - ${portfolio.unit?.title || ''}`, { x: margin, y: imageY, size: 12 });
    imageY -= 20;
    page.drawText(`Criteria: ${portfolio.criteria?.number} - ${portfolio.criteria?.description || ''}`, { x: margin, y: imageY, size: 12 });
    imageY -= 20;
    page.drawText(`Method: ${portfolio.Method || 'N/A'}`, { x: margin, y: imageY, size: 12 });
    imageY -= 20;
    page.drawText(`Location: ${portfolio.postcode}`, { x: margin, y: imageY, size: 12 });
    imageY -= 20;
    page.drawText(`Task Description: ${portfolio.taskDescription || 'N/A'}`, { x: margin, y: imageY, size: 12 });
    imageY -= 20;
    page.drawText(`Job Type: ${portfolio.jobType || 'N/A'}`, { x: margin, y: imageY, size: 12 });
    imageY -= 20;
    page.drawText(`Reason For Task: ${portfolio.reasonForTask || 'N/A'}`, { x: margin, y: imageY, size: 12 });
    imageY -= 20;
    page.drawText(`objective Of Job: ${portfolio.objectiveOfJob || 'N/A'}`, { x: margin, y: imageY, size: 12 });
    imageY -= 20;
    page.drawText(`Comments: ${portfolio.comments || 'N/A'}`, { x: margin, y: imageY, size: 12 });
    imageY -= 40; // Add some extra space before the images

    // Function to add a new page if no space is left
    const checkPageSpace = () => {
      if (imageY < 100) {
        page = pdfDoc.addPage([600, 800]);
        imageY = 750;
      }
    };

    // Loop through and embed images
for (const image of portfolio.images) {
  const imagePath = path.resolve('/opt/uploads', path.basename(image)); // Use absolute path

      if (!fs.existsSync(imagePath)) {
        console.error('Image not found:', imagePath);
        continue; // Skip if the image doesn't exist
      }
      
  const imageBuffer = fs.readFileSync(imagePath);

  // Use Sharp to handle rotation based on EXIF metadata
  //const { data: correctedImageBuffer, info } = await sharp(imageBuffer).rotate().toBuffer({ resolveWithObject: true });
  let correctedImageBuffer, info;
  try {
    ({ data: correctedImageBuffer, info } = await sharp(imageBuffer).rotate().toBuffer({ resolveWithObject: true }));
  } catch (err) {
    console.error('Skipping corrupted image:', imagePath, err.message);
    continue; // Skip this image
  }
  
  // Handle JPG and PNG files based on output format after correction
  let pdfImage;
  if (info.format === 'png') {
      pdfImage = await pdfDoc.embedPng(correctedImageBuffer);
  } else if (info.format === 'jpeg') {
      pdfImage = await pdfDoc.embedJpg(correctedImageBuffer);
  } else {
      console.error('Unsupported image format');
      continue; // Skip unsupported images
  }

  // Define a fixed width for all images
  const fixedWidth = 200;
  const imageDims = pdfImage.scale(fixedWidth / pdfImage.width); // Scale image to fixed width

  // Check if there's enough space on the current page
  if (imageY - imageDims.height < 100) { // Adjust to provide space for logo
      // Draw the logo on the current page before adding a new page
      const logoImage = await embedLogoImage(pdfDoc);
      page.drawImage(logoImage, {
          x: page.getWidth() - 150,
          y: 30,
          width: 100,
          height: 50,
      });

      // Add a new page if there's not enough space
      page = pdfDoc.addPage([600, 800]);
      imageY = 750;
  }

  // Center the image horizontally
  page.drawImage(pdfImage, {
      x: (600 - imageDims.width) / 2, // Center the image horizontally
      y: imageY - imageDims.height,
      width: imageDims.width,
      height: imageDims.height,
  });

  // Update the Y position for the next image
  imageY -= imageDims.height + contentSpacing;
}

// Draw the Cranbrook College logo at the bottom right of the last page
const logoImage = await embedLogoImage(pdfDoc);
page.drawImage(logoImage, {
  x: page.getWidth() - 150,
  y: 30,
  width: 100,
  height: 50,
});

// Function to embed the logo image
async function embedLogoImage(pdfDoc) {
  const logoPath = path.join(__dirname, '../public/assets/cranbrook-college-logo.png');
  if (!fs.existsSync(logoPath)) {
      console.error('Logo file does not exist at:', logoPath);
      throw new Error('Logo file not found');
  }
  const logoBuffer = fs.readFileSync(logoPath);
  return await pdfDoc.embedPng(logoBuffer);
}





    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    // Send the PDF to the client
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${portfolio.title}.pdf"`,
    });
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ message: 'Error exporting PDF' });
  }
});

// router.get('/assessor/portfolios', async (req, res) => {
//   try {
//     const portfolios = await Portfolio.find().populate('userId');  // Fetch portfolios, with user details if needed
//     res.status(200).json(portfolios);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching portfolios' });
//   }
// });


// Replace your existing `/assessor/portfolios` route with this:
router.get('/assessor-portfolios/:assessorId', async (req, res) => {
  try {
    const { assessorId } = req.params;
    
    // Get students assigned to this assessor
    
    const assignedStudents = await User.find({ 
      assignedAssessor: assessorId,
      role: 'student',
      isActive: true 
    }).select('_id');
    
    const studentIds = assignedStudents.map(student => student._id);
    
    // Get portfolios of assigned students only
    const portfolios = await Portfolio.find({ userId: { $in: studentIds } })
      .populate('userId', 'name email');
    
    res.status(200).json(portfolios);
  } catch (error) {
    console.error('Error fetching assessor portfolios:', error);
    res.status(500).json({ message: 'Error fetching portfolios' });
  }
});

router.post('/:id/feedback', async (req, res) => {
  const { assessorComments, status } = req.body;

  try {
    const portfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { assessorComments, status }, // Update status and feedback
      { new: true }
    );

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    res.status(200).json({ message: 'Feedback submitted and status updated', portfolio });
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback or status', error });
  }
});

// Create a new route for assessors to fetch any student's portfolio by ID
router.get('/assessor/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Allow assessors to access the portfolio without userId restrictions
    res.status(200).json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching portfolio for assessor' });
  }
});

router.get('/admin/all', async (req, res) => {
  try {
    console.log('Admin fetching all portfolios');
    const portfolios = await Portfolio.find().populate('userId', 'name email'); // Populate name & email

    res.status(200).json(portfolios);
  } catch (error) {
    console.error('Error fetching all portfolios:', error);
    res.status(500).json({ message: 'Error fetching portfolios' });
  }
});


module.exports = router;
