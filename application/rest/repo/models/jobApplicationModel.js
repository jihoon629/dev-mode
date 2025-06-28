// application/rest/repo/models/jobApplicationModel.js
const { AppDataSource } = require('../../config/dbConfig');
const { JobApplicationEntity } = require('../entity/jobApplication.entity');
const logger = require('../../config/logger');

const jobApplicationRepository = AppDataSource.getRepository(JobApplicationEntity);

const JobApplicationModel = {
    async create(jobPostingId, applicantId, resumeId) {
        try {
            const newApplication = jobApplicationRepository.create({
                job_posting_id: jobPostingId,
                applicant_id: applicantId,
                resume_id: resumeId,
                status: 'pending',
            });
            await jobApplicationRepository.save(newApplication);
            return newApplication;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('이미 해당 공고에 지원했습니다.');
            }
            logger.error(`[JobApplicationModel-create] 오류: ${error.message}`, { jobPostingId, applicantId, resumeId, stack: error.stack });
            throw error;
        }
    },

    async findByJobPostingId(jobPostingId) {
        try {
            return await jobApplicationRepository.find({
                where: { job_posting_id: jobPostingId },
                relations: ['applicant', 'resume'], // 지원자 및 이력서 정보 포함
            });
        } catch (error) {
            logger.error(`[JobApplicationModel-findByJobPostingId] 오류: ${error.message}`, { jobPostingId, stack: error.stack });
            throw error;
        }
    },

    async findByApplicantId(applicantId) {
        try {
            return await jobApplicationRepository.createQueryBuilder("application")
                .leftJoinAndSelect("application.jobPosting", "jobPosting")
                .leftJoinAndSelect("jobPosting.user", "employer") // 공고 등록자(employer) 정보
                .where("application.applicant_id = :applicantId", { applicantId })
                .orderBy("application.created_at", "DESC")
                .getMany();
        } catch (error) {
            logger.error(`[JobApplicationModel-findByApplicantId] 오류: ${error.message}`, { applicantId, stack: error.stack });
            throw error;
        }
    },

    async findById(id) {
        try {
            return await jobApplicationRepository.findOne({
                where: { id },
                relations: ['jobPosting', 'jobPosting.user', 'applicant'],
            });
        } catch (error) {
            logger.error(`[JobApplicationModel-findById] 오류: ${error.message}`, { id, stack: error.stack });
            throw error;
        }
    },

    async updateStatus(id, status) {
        try {
            const result = await jobApplicationRepository.update(id, { status });
            if (result.affected === 0) {
                throw new Error('지원서를 찾을 수 없습니다.');
            }
            return await this.findById(id);
        } catch (error) {
            logger.error(`[JobApplicationModel-updateStatus] 오류: ${error.message}`, { id, status, stack: error.stack });
            throw error;
        }
    },
};

module.exports = JobApplicationModel;
