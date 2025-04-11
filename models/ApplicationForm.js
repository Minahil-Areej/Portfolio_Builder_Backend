const mongoose = require('mongoose');

const PreviousStudySchema = new mongoose.Schema({
  fromMonthYear: String,
  toMonthYear: String,
  qualification: String,
  majorSubject: String,
  institution: String,
  country: String,
  fullOrPartTime: String,
});

const EmergencyContactSchema = new mongoose.Schema({
  name: String,
  address: String,
  sameAsAbove: Boolean,
  contactNumber: String,
  relationship: String,
});

const ApplicationFormSchema = new mongoose.Schema({
  // 1. Personal Details
  familyName: String,
  firstName: String,
  permanentAddress: String,
  postcode: String,
  homePhone: String,
  mobile: String,
  email: String,
  passportNumber: String,
  gender: String,
  nationality: String,
  countryOfResidence: String,
  dateOfBirth: Date,
  hasDisability: String,
  hasCriminalConviction: String,
  courseToStudy: String,

  // 2. English Language Qualifications
  englishTestType: String,
  englishTestDate: Date,
  englishTestResult: String,

  // 3. Previous Studies
  previousStudies: [PreviousStudySchema],

  // 4. Personal Statement & Declaration
  personalStatement: String,
  agreedToDeclaration: Boolean,
  declarationSignature: String,
  declarationDate: Date,

  // 5. Equality & Diversity Monitoring
  genderIdentity: String,
  ageGroup: String,
  religion: String,
  sexualOrientation: String,
  ethnicOrigin: String,
  hasDisabilityDiversitySection: String,

  // 6. Emergency Contact (1 and 2)
  emergencyContacts: [EmergencyContactSchema],
  medicalInfo: String,

  // 7. Photo/Video Consent
  consentGiven: Boolean,
  photoConsentName: String,
  photoConsentAddress: String,
  photoConsentCity: String,
  photoConsentPostalCode: String,
  photoConsentPhone: String,
  photoConsentFax: String,
  photoConsentEmail: String,
  photoConsentSignature: String,
  photoConsentDate: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ApplicationForm', ApplicationFormSchema);
