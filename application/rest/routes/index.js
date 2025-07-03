// application/rest/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const searchRoutes = require('./searchRoutes');
const llmService = require('../service/llmService');
const logger = require('../config/logger');

// '/auth' 경로로 들어오는 요청은 authRoutes에서 처리
router.use('/auth', authRoutes);

// '/search' 경로로 들어오는 요청은 searchRoutes에서 처리
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
router.use('/', jobApplicationRoutes); // '/job-postings/:id/apply' 같은 경로를 처리하기 위해 기본 경로에 연결

router.get('/test-llm', async (req, res, next) => {
    try {
      const testPrompt = req.query.prompt || "안녕, 제미나이! 간단한 자기소개 부탁해.";
      logger.info(`[테스트라우트-/test-llm] 테스트 프롬프트: "${testPrompt}"`);
      const llmResponse = await llmService.generateTextWithGemini(testPrompt);
      if (llmResponse) {
        logger.info(`[테스트라우트-/test-llm] LLM 응답: "${llmResponse}"`);
        res.json({
          prompt: testPrompt,
          response: llmResponse,
        });
      } else {
        logger.warn('[테스트라우트-/test-llm] LLM으로부터 응답을 받지 못했습니다.');
        res.status(500).json({
          error: 'LLM 서비스로부터 응답을 받지 못했습니다.',
          prompt: testPrompt,
        });
      }
    } catch (error) {
      logger.error(`[테스트라우트-/test-llm] 오류 발생: ${error.message}`, { stack: error.stack });
      next(error);
    }
  });

module.exports = router;