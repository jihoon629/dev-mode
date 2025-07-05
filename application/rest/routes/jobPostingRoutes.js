// application/rest/routes/jobPostingRoutes.js
const express = require('express');
const jobPostingController = require('../controller/jobPostingController');
const passport = require('passport');
const router = express.Router();

// --- 라우트 순서 중요 ---
// 일반 라우트가 동적 라우트보다 먼저 와야 합니다.

// 전체 공고 목록 조회
// GET /api/job-postings
router.get('/', jobPostingController.getAllJobPostings);

// 공고 검색 (일반)
// GET /api/job-postings/search/general
router.get('/search/general', jobPostingController.searchJobPostings);

// 공고 검색 (유사성)
// GET /api/job-postings/search/similarity
router.get('/search/similarity', jobPostingController.searchJobPostingsBySimilarity);

// 공고 검색 (거리)
// GET /api/job-postings/search/distance
router.get('/search/distance', jobPostingController.searchJobPostingsByDistance);

// 특정 사용자의 공고 목록 조회
// GET /api/job-postings/user/:userId
router.get('/user/:userId', jobPostingController.getJobPostingsByUser);

// 공고 상세 조회 (조회수 증가)
// GET /api/job-postings/:id
router.get('/:id', jobPostingController.getJobPostingById);

// 공고 생성
// POST /api/job-postings
router.post('/', jobPostingController.createJobPosting);

// 공고 수정
// PUT /api/job-postings/:id
router.put('/:id', jobPostingController.updateJobPosting);

// 공고 삭제
// DELETE /api/job-postings/:id
router.delete('/:id', jobPostingController.deleteJobPosting);

// 공고 상태 수정
// PUT /api/job-postings/:id/status
router.put('/:id/status', passport.authenticate('jwt', { session: false }), jobPostingController.updateJobPostingStatus);

module.exports = router;
