    // application/rest/routes/index.js
    const express = require('express');
    const router = express.Router();
    const authRoutes = require('./authRoutes');
    const searchRoutes = require('./searchRoutes'); // 검색 라우트 추가
    const llmService = require('../service/llmService'); // llmService 임포트
    const logger = require('../config/logger'); // 로거 임포트

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

    router.get('/test-llm', async (req, res, next) => {
        try {
          const testPrompt = req.query.prompt || "안녕, 제미나이! 간단한 자기소개 부탁해."; // 쿼리 파라미터로 프롬프트 받거나 기본값 사용
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
          next(error); // 중앙 에러 핸들러로 전달
        }
      });
    module.exports = router;