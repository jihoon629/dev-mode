// application/rest/routes/index.js
const express = require('express');
const router = express.Router();
const llmService = require('../service/llmService');
const logger = require('../config/logger');

// '/auth' 경로로 들어오는 요청은 authRoutes에서 처리
const authRoutes = require('./authRoutes');
router.use('/auth', authRoutes);

// '/search' 경로로 들어오는 요청은 searchRoutes에서 처리
const searchRoutes = require('./searchRoutes');
router.use('/search', searchRoutes);

// '/resumes' 경로로 들어오는 요청은 resumeRoutes에서 처리
const resumeRoutes = require('./resumeRoutes');
router.use('/resumes', resumeRoutes);

// '/job-postings' 경로로 들어오는 요청은 jobPostingRoutes에서 처리
const jobPostingRoutes = require('./jobPostingRoutes');
router.use('/job-postings', jobPostingRoutes);

// '/users' 경로로 들어오는 요청은 userRoutes에서 처리
const userRoutes = require('./userRoutes');
router.use('/users', userRoutes);

// '/upload' 경로로 들어오는 요청은 uploadRoutes에서 처리
const uploadRoutes = require('./uploadRoutes');
router.use('/upload', uploadRoutes);

// '/applications' 등 지원 관련 경로로 들어오는 요청은 jobApplicationRoutes에서 처리
const jobApplicationRoutes = require('./jobApplicationRoutes');
router.use('/', jobApplicationRoutes); // 최상위 경로에 등록하여 /job-postings, /applications, /salaries 경로 모두 처리

const favoriteRoutes = require('./favoriteRoutes');
router.use('/favorites', favoriteRoutes);



module.exports = router;