// application/rest/service/jobApplicationService.js
const JobApplicationModel = require('../repo/models/jobApplicationModel');
const JobPostingModel = require('../repo/models/jobPostingModel');
const ResumeModel = require('../repo/models/resumeModel');
const UserModel = require('../repo/models/userModel'); // UserModel 임포트
const { invokeChaincode } = require('../sdk'); // 리팩토링된 함수 임포트
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
            throw new Error('자신이 등록한 공고의 지��만 평가할 수 있습니다.');
        }
        if (application.status !== 'approved') {
            throw new Error('승인된 지원만 평가 완료할 수 있습니다.');
        }

        // 체인코드 호출을 위한 identity(사용자 이메일) 조회
        const employer = await UserModel.findById(currentUserId);
        if (!employer || !employer.email) {
            throw new Error('경력 기록을 위한 사용자 정보(identity)를 찾을 수 없습니다.');
        }

        const { jobPosting, applicant } = application;
        const workPeriod = `${jobPosting.work_start_date} ~ ${jobPosting.work_end_date}`;
        
        // 리팩토링된 체인코드 함수 호출
        await invokeChaincode(false, employer.email, 'RecordWorkExperience', [
            jobPosting.id.toString(),
            jobPosting.title,
            applicant.id.toString(),
            jobPosting.user_id.toString(),
            workPeriod
        ]);

        // DB 상태를 'completed'로 변경
        return await JobApplicationModel.updateStatus(applicationId, 'completed');
    }
}

module.exports = new JobApplicationService();

