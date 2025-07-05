// application/rest/routes/jobApplicationRoutes.js
const express = require('express');
const passport = require('passport');
const jobApplicationController = require('../controller/jobApplicationController');

const router = express.Router();

// 모든 지원 관련 API는 로그인이 필요합니다.
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @route   POST /api/job-postings/:id/apply
 * @desc    구인공고에 지원
 * @access  Private (Worker)
 */
router.post('/job-postings/:id/apply', jobApplicationController.applyToJob);

/**
 * @route   GET /api/job-postings/:id/applications
 * @desc    특정 구인공고의 지원자 목록 조회
 * @access  Private (Employer)
 */
router.get('/job-postings/:id/applications', jobApplicationController.getApplicationsForJob);

/**
 * @route   GET /api/applications/my
 * @desc    내가 지원한 모든 공고 목록 조회
 * @access  Private (Worker)
 */
router.get('/applications/my', jobApplicationController.getMyApplications);

/**
 * @route   PUT /api/applications/:id/status
 * @desc    지원서 상태 변경 (승인/거절)
 * @access  Private (Employer)
 */
router.put('/applications/:id/status', jobApplicationController.updateApplicationStatus);

/**
 * @route   POST /api/applications/:id/complete
 * @desc    평가 완료 및 경력 기록
 * @access  Private (Employer)
 */
router.post('/applications/:id/complete', jobApplicationController.completeApplication);



/**
 * @route   GET /api/salaries/my
 * @desc    나의 급여 내역 조회
 * @access  Private (Worker)
 */
router.get('/salaries/my', jobApplicationController.getMySalaries);

/**
 * @route   POST /api/job-postings/:id/record-payments-for-all
 * @desc    특정 공고의 모든 완료된 지원서에 급여 일괄 기록
 * @access  Private (Employer)
 */
router.post('/job-postings/:id/record-payments-for-all', jobApplicationController.recordPaymentsForAllWorkers);

module.exports = router;