const express = require('express');
const controller = require('./controller'); // will + user 컨트롤러 통합

const router = express.Router();

// --- 유언장 관련 API ---
router.post('/will/register', controller.registerWill);
router.get('/will/mywills', controller.getMyWills);
router.get('/will/details/:willId', controller.getWillDetails);

// --- 사용자 관련 API ---
router.post('/user/register', controller.registerUser);
router.post('/user/login', controller.loginUser);

module.exports = router;
