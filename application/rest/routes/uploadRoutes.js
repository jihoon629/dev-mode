// application/rest/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controller/uploadController');
const passport = require('passport');

// 자격증 이미지 업로드 (인증 필요)
router.post('/certificate-images', 
  passport.authenticate('jwt', { session: false }), 
  uploadController.uploadCertificateImages
);

module.exports = router;