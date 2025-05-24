// application/rest/routes.js
const express = require('express');
const userinfoController = require('./userinfoController'); 
const willController = require('./controller');
const ocrController = require('./ocrController');
const router = express.Router();
const multer = require('multer'); // multer 임포트

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); // 'upload' 변수 정의

router.post('/register', willController.registerWill);
router.get('/mywills', willController.getMyWills);
router.get('/details/:willId', willController.getWillDetails);

// OCR 엔드포인트 추가
router.post('/ocr/extract-text', upload.single('file'), ocrController.extractText); // 여기서 upload 사용

router.post('/auth/register', userinfoController.registerUser);

router.post('/auth/login', userinfoController.loginUser);

module.exports = router;