// application/rest/routes/jobPostingRoutes.js
const express = require('express');
const jobPostingController = require('../controller/jobPostingController');
const router = express.Router();

// 공고 생성
// POST /api/job-postings
router.post('/', jobPostingController.createJobPosting);

// 특정 사용자의 공고 목록 조회
// GET /api/job-postings/user/:userId
router.get('/user/:userId', jobPostingController.getJobPostingsByUser);

// 공고 상세 조회 (조회수 증가)
// GET /api/job-postings/:id
router.get('/:id', jobPostingController.getJobPostingById);

// 공고 수정
// PUT /api/job-postings/:id
router.put('/:id', jobPostingController.updateJobPosting);

// 공고 삭제
// DELETE /api/job-postings/:id
router.delete('/:id', jobPostingController.deleteJobPosting);

// 공고 검색 (일반 검색)
// GET /api/job-postings/search?jobType=건설&region=서울&minWage=100000&maxWage=200000&keyword=검색어
router.get('/search/general', jobPostingController.searchJobPostings);

// 공고 유사성 검색
// GET /api/job-postings/search/similarity?query=건설현장&field=job_type&minSimilarity=50
router.get('/search/similarity', jobPostingController.searchJobPostingsBySimilarity);

module.exports = router;