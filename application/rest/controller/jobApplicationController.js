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
        this.recordPayment = this.recordPayment.bind(this);
        this.getMySalaries = this.getMySalaries.bind(this);
    }

    async getMySalaries(req, res, next) {
        try {
            // req.user 객체 전체를 로그로 출력
            logger.info('[JobApplicationController-getMySalaries] START: req.user=', req.user);

            const applicantId = req.user?.id; // Optional chaining for safety

            if (!applicantId) {
                logger.warn('[JobApplicationController-getMySalaries] 경고: applicantId를 찾을 수 없습니다. 로그인이 필요합니다.');
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            }

            logger.info(`[JobApplicationController-getMySalaries] Service 호출: applicantId=${applicantId}`);
            const salaries = await jobApplicationService.getMySalaries(applicantId);
            const responseDto = new JobApplicationListResponseDto(salaries);

            logger.info(`[JobApplicationController-getMySalaries] END: 급여 내역 ${salaries.length}건 조회 완료`);
            res.status(200).json({
                status: 'success',
                data: responseDto,
            });
        } catch (error) {
            logger.error(`[JobApplicationController-getMySalaries] 오류: ${error.message}`, { user: req.user, stack: error.stack });
            next(error);
        }
    }

    async recordPayment(req, res, next) {
        try {
            const applicationId = parseInt(req.params.id, 10);
            const { paymentDate } = req.body; // paymentAmount 제거
            const currentUserId = req.user.id;

            if (!currentUserId) {
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            }
            // paymentAmount 유효성 검사 제거
            if (!paymentDate) {
                return res.status(400).json({ message: '급여 지급일을 입력해야 합니다.' });
            }

            // 서비스 호출 시 paymentDate만 전달
            const updatedApplication = await jobApplicationService.recordPayment(applicationId, paymentDate, currentUserId);
            const responseDto = new JobApplicationResponseDto(updatedApplication);
            res.status(200).json({
                status: 'success',
                message: '급여 정보가 성공적으로 기록되었습니다.',
                data: responseDto,
            });
        } catch (error) {
            logger.error(`[JobApplicationController-recordPayment] 오류: ${error.message}`, { params: req.params, body: req.body, user: req.user, stack: error.stack });
            next(error);
        }
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

    async updatePaymentInfo(req, res, next) {
        try {
            const applicationId = parseInt(req.params.id, 10);
            const { paymentDate, paymentAmount } = req.body;
            const currentUserId = req.user.id;

            if (!currentUserId) {
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            }
            if (!paymentDate || !paymentAmount) {
                return res.status(400).json({ message: '급여 지급일과 급여액을 모두 입력해야 합니다.' });
            }

            const updatedApplication = await jobApplicationService.updatePaymentInfo(applicationId, paymentDate, paymentAmount, currentUserId);
            const responseDto = new JobApplicationResponseDto(updatedApplication);
            res.status(200).json({
                status: 'success',
                message: '급여 정보가 성공적으로 업데이트되었습니다.',
                data: responseDto,
            });
        } catch (error) {
            logger.error(`[JobApplicationController-updatePaymentInfo] 오류: ${error.message}`, { params: req.params, body: req.body, user: req.user, stack: error.stack });
            next(error);
        }
    }
}

module.exports = new JobApplicationController();