// application/rest/routes/resumeRoutes.js
const express = require('express');
const resumeController = require('../controller/resumeController');
const router = express.Router();

// 이력서 생성
// POST /api/resumes
router.post('/', resumeController.createResume);

// 특정 사용자의 이력서 목록 조회
// GET /api/resumes/user/:userId
router.get('/user/:userId', resumeController.getResumesByUser);

// 이력서 상세 조회
// GET /api/resumes/:id
router.get('/:id', resumeController.getResumeById);

// 이력서 수정
// PUT /api/resumes/:id
router.put('/:id', resumeController.updateResume);

// 이력서 삭제
// DELETE /api/resumes/:id
router.delete('/:id', resumeController.deleteResume);

// 이력서 검색 (일반 검색)
// GET /api/resumes/search?jobType=건설&region=서울&minWage=100000&maxWage=200000&keyword=검색어
router.get('/search/general', resumeController.searchResumes);

// 이력서 유사성 검색
// GET /api/resumes/search/similarity?query=건설기술자&field=job_type&minSimilarity=50
router.get('/search/similarity', resumeController.searchResumesBySimilarity);

module.exports = router;