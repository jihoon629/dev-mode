// application/rest/controller/jobApplicationController.js
const jobApplicationService = require('../service/jobApplicationService');
const { JobApplicationListResponseDto, JobApplicationResponseDto } = require('../dto/response/jobApplicationResponseDto');
const logger = require('../config/logger');

class JobApplicationController {
    constructor() {
        this.applyToJob = this.applyToJob.bind(this);
        this.getApplicationsForJob = this.getApplicationsForJob.bind(this);
        this.getMyApplications = this.getMyApplications.bind(this);
        this.updateApplicationStatus = this.updateApplicationStatus.bind(this);
        this.completeApplication = this.completeApplication.bind(this);
    }

    async applyToJob(req, res, next) {
        try {
            const jobPostingId = parseInt(req.params.id, 10);
            const { resumeId } = req.body;
            const applicantId = req.user.id;

            if (!applicantId) {
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            }
            if (!resumeId) {
                return res.status(400).json({ message: '지원할 이력서 ID가 필요합니다.' });
            }

            const application = await jobApplicationService.applyToJob(jobPostingId, applicantId, resumeId);
            const responseDto = new JobApplicationResponseDto(application);
            res.status(201).json({
                status: 'success',
                message: '성공적으로 지원했습니다.',
                data: responseDto,
            });
        } catch (error) {
            logger.error(`[JobApplicationController-applyToJob] 오류: ${error.message}`, { params: req.params, body: req.body, user: req.user, stack: error.stack });
            next(error);
        }
    }

    async getApplicationsForJob(req, res, next) {
        try {
            const jobPostingId = parseInt(req.params.id, 10);
            const currentUserId = req.user.id;

            if (!currentUserId) {
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            }

            const applications = await jobApplicationService.getApplicationsForJob(jobPostingId, currentUserId);
            const responseDto = new JobApplicationListResponseDto(applications);
            res.status(200).json({
                status: 'success',
                data: responseDto,
            });
        } catch (error) {
            logger.error(`[JobApplicationController-getApplicationsForJob] 오류: ${error.message}`, { params: req.params, user: req.user, stack: error.stack });
            next(error);
        }
    }

    async getMyApplications(req, res, next) {
        try {
            const applicantId = req.user.id;

            if (!applicantId) {
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            }

            const applications = await jobApplicationService.getMyApplications(applicantId);
            const responseDto = new JobApplicationListResponseDto(applications);
            res.status(200).json({
                status: 'success',
                data: responseDto,
            });
        } catch (error) {
            logger.error(`[JobApplicationController-getMyApplications] 오류: ${error.message}`, { user: req.user, stack: error.stack });
            next(error);
        }
    }

    async updateApplicationStatus(req, res, next) {
        try {
            const applicationId = parseInt(req.params.id, 10);
            const { status } = req.body;
            const currentUserId = req.user.id;

            if (!currentUserId) {
                return res.status(401).json({ message: '로그인이 필��합니다.' });
            }
            if (!status || !['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ message: '상태 값은 "approved" 또는 "rejected" 여야 합니다.' });
            }

            const updatedApplication = await jobApplicationService.updateApplicationStatus(applicationId, status, currentUserId);
            const responseDto = new JobApplicationResponseDto(updatedApplication);
            res.status(200).json({
                status: 'success',
                message: `지원서 상태가 ${status}(으)로 변경되었습니다.`,
                data: responseDto,
            });
        } catch (error) {
            logger.error(`[JobApplicationController-updateApplicationStatus] 오류: ${error.message}`, { params: req.params, body: req.body, user: req.user, stack: error.stack });
            next(error);
        }
    }

    async completeApplication(req, res, next) {
        try {
            const applicationId = parseInt(req.params.id, 10);
            const currentUserId = req.user.id;

            if (!currentUserId) {
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            }

            const completedApplication = await jobApplicationService.completeApplication(applicationId, currentUserId);
            const responseDto = new JobApplicationResponseDto(completedApplication);
            res.status(200).json({
                status: 'success',
                message: '평가가 완료되어 경력이 블록체인에 기록되었습니다.',
                data: responseDto,
            });
        } catch (error) {
            logger.error(`[JobApplicationController-completeApplication] 오류: ${error.message}`, { params: req.params, user: req.user, stack: error.stack });
            next(error);
        }
    }
}

module.exports = new JobApplicationController();