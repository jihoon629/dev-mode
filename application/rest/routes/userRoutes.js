// application/rest/routes/userRoutes.js
const express = require('express');
const userController = require('../controller/userController');

const router = express.Router();

/**
 * @route   GET /api/users/:id/experience
 * @desc    특정 사용자의 블록체인 경력 기록 조회
 * @access  Public
 */
router.get('/:id/experience', userController.getUserExperience);

/**
 * @route   PUT /api/users/:id
 * @desc    사용자 정보 업데이트
 * @access  Private
 */
router.put('/:id', userController.updateUser);

module.exports = router;
