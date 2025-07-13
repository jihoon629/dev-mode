// application/rest/service/jobApplicationService.js
const JobApplicationModel = require('../repo/models/jobApplicationModel');
const JobPostingModel = require('../repo/models/jobPostingModel');
const ResumeModel = require('../repo/models/resumeModel');
const UserModel = require('../repo/models/userModel');
const { invokeChaincode } = require('../sdk');
const logger = require('../config/logger');

class JobApplicationService {
    async applyToJob(jobPostingId, applicantId, resumeId) {
        const resume = await ResumeModel.findById(resumeId);
        if (!resume) {
            throw new Error('이력서를 찾을 수 없습니다.');
        }
        if (resume.user_id !== applicantId) {
            throw new Error('자신의 이력서로만 지원할 수 있습니다.');
        }
        return await JobApplicationModel.create(jobPostingId, applicantId, resumeId);
    }

    async getApplicationsForJob(jobPostingId, currentUserId) {
        const jobPosting = await JobPostingModel.findById(jobPostingId);
        if (!jobPosting) {
            throw new Error('공고를 찾을 수 없습니다.');
        }
        if (jobPosting.user_id !== currentUserId) {
            throw new Error('자신이 등록한 공고의 지원자만 조회할 수 있습니다.');
        }
        return await JobApplicationModel.findByJobPostingId(jobPostingId);
    }

    async getMyApplications(applicantId) {
        return await JobApplicationModel.findByApplicantId(applicantId);
    }

    async getMySalaries(applicantId) {
        return await JobApplicationModel.findSalariesByApplicantId(applicantId);
    }

    async updateApplicationStatus(applicationId, status, currentUserId) {
        if (status === 'completed') {
            throw new Error("'completed' 상태는 '평가 완료' API를 통해서만 설정할 수 있습니다.");
        }
        const application = await JobApplicationModel.findById(applicationId);
        if (!application) {
            throw new Error('지원서를 찾을 수 없습니다.');
        }
        if (application.jobPosting.user_id !== currentUserId) {
            throw new Error('권한이 없습니다.');
        }
        return await JobApplicationModel.updateStatus(applicationId, status);
    }

    async completeApplication(applicationId, currentUserId) {
        const application = await JobApplicationModel.findById(applicationId);
        if (!application) {
            throw new Error('지원서를 찾을 수 없습니다.');
        }
        if (application.jobPosting.user_id !== currentUserId) {
            throw new Error('자신이 등록한 공고의 지원만 평가할 수 있습니다.');
        }
        if (application.status !== 'approved') {
            throw new Error('승인된 지원만 평가 완료할 수 있습니다.');
        }

        const employer = await UserModel.findById(currentUserId);
        if (!employer || !employer.email) {
            throw new Error('경력 기록을 위한 사용자 정보(identity)를 찾을 수 없습니다.');
        }

        const { jobPosting, applicant } = application;
        const workPeriod = `${jobPosting.work_start_date} ~ ${jobPosting.work_end_date}`;
        
        await invokeChaincode(false, employer.email, 'RecordWorkExperience', [
            jobPosting.id.toString(),
            jobPosting.title,
            applicant.id.toString(),
            jobPosting.user_id.toString(),
            workPeriod
        ]);

        return await JobApplicationModel.updateStatus(applicationId, 'completed');
    }

    
    async recordPaymentsForAllApplications(jobPostingId, paymentDate, currentUserId) {
        const jobPosting = await JobPostingModel.findById(jobPostingId);
        if (!jobPosting) {
            throw new Error('공고를 찾을 수 없습니다.');
        }
        if (jobPosting.user_id !== currentUserId) {
            throw new Error('자신이 등록한 공고의 지원 건에 대해서만 급여를 일괄 기록할 수 있습니다.');
        }

        const applications = await JobApplicationModel.findByJobPostingId(jobPostingId);
        const completedApplications = applications.filter(app => app.status === 'completed');

        let successCount = 0;
        let failCount = 0;
        const failedApplications = [];

        for (const application of completedApplications) {
            try {
                // recordPayment 로직 재사용
                if (!jobPosting.work_start_date || !jobPosting.work_end_date || !jobPosting.daily_wage) {
                    throw new Error('공고에 근무 기간 또는 일급 정보가 없습니다.');
                }

                const startDate = new Date(jobPosting.work_start_date);
                const endDate = new Date(jobPosting.work_end_date);
                const workDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1;

                if (workDays <= 0) {
                    throw new Error('근무 기간이 올바르지 않습니다.');
                }

                const dailyWage = parseFloat(jobPosting.daily_wage);
                const paymentAmount = dailyWage * workDays;

                const paymentData = { paymentDate, paymentAmount }; // paymentDate 사용

                await JobApplicationModel.updatePayment(application.id, paymentData);
                successCount++;
            } catch (error) {
                logger.error(`[JobApplicationService-recordPaymentsForAllApplications] 지원 ID ${application.id} 급여 기록 실패: ${error.message}`);
                failCount++;
                failedApplications.push({ applicationId: application.id, error: error.message });
            }
        }

        return { successCount, failCount, failedApplications };
    }

    async recordPaymentsForAllApplications(jobPostingId, paymentDate, currentUserId) {
        const jobPosting = await JobPostingModel.findById(jobPostingId);
        if (!jobPosting) {
            throw new Error('공고를 찾을 수 없습니다.');
        }
        if (jobPosting.user_id !== currentUserId) {
            throw new Error('자신이 등록한 공고의 지원 건에 대해서만 급여를 일괄 기록할 수 있습니다.');
        }

        const applications = await JobApplicationModel.findByJobPostingId(jobPostingId);
        const completedApplications = applications.filter(app => app.status === 'completed');

        let successCount = 0;
        let failCount = 0;
        const failedApplications = [];

        for (const application of completedApplications) {
            try {
                // recordPayment 로직 재사용
                if (!jobPosting.work_start_date || !jobPosting.work_end_date || !jobPosting.daily_wage) {
                    throw new Error('공고에 근무 기간 또는 일급 정보가 없습니다.');
                }

                const startDate = new Date(jobPosting.work_start_date);
                const endDate = new Date(jobPosting.work_end_date);
                const workDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1;

                if (workDays <= 0) {
                    throw new Error('근무 기간이 올바르지 않습니다.');
                }

                const dailyWage = parseFloat(jobPosting.daily_wage);
                const paymentAmount = dailyWage * workDays;

                const paymentData = { paymentDate, paymentAmount }; // paymentDate 사용

                await JobApplicationModel.updatePayment(application.id, paymentData);
                successCount++;
            } catch (error) {
                logger.error(`[JobApplicationService-recordPaymentsForAllApplications] 지원 ID ${application.id} 급여 기록 실패: ${error.message}`);
                failCount++;
                failedApplications.push({ applicationId: application.id, error: error.message });
            }
        }

        // 모든 급여 기록이 성공적으로 완료되면 공고의 is_payroll_completed 상태를 true로 업데이트
        if (successCount > 0 && failCount === 0) {
            await JobPostingModel.updatePayrollCompletedStatus(jobPostingId, true);
        }

        return { successCount, failCount, failedApplications };
    }
}


module.exports = JobApplicationService;