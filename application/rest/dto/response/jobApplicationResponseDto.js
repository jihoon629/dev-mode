// application/rest/dto/response/jobApplicationResponseDto.js

class JobApplicationResponseDto {
    constructor(application = {}) {
        this.id = application.id;
        this.jobPostingId = application.job_posting_id;
        this.applicantId = application.applicant_id;
        this.resumeId = application.resume_id;
        this.status = application.status;
        this.paymentDate = application.payment_date; // 추가
        this.paymentAmount = application.payment_amount; // 추가
        this.createdAt = application.created_at;
        this.updatedAt = application.updated_at;

        if (application.applicant) {
            this.applicant = {
                id: application.applicant.id,
                username: application.applicant.username,
                email: application.applicant.email,
            };
        }
        if (application.resume) {
            this.resume = {
                id: application.resume.id,
                jobType: application.resume.job_type,
                region: application.resume.region,
                name: application.resume.name, // name 필드 추가
            };
        }
        if (application.jobPosting) {
            this.jobPosting = {
                id: application.jobPosting.id,
                title: application.jobPosting.title,
                user: application.jobPosting.user ? {
                    id: application.jobPosting.user.id,
                    username: application.jobPosting.user.username,
                } : null,
            };
        }
    }
}

class JobApplicationListResponseDto {
    constructor(applications) {
        this.applications = (applications || []).map(app => new JobApplicationResponseDto(app));
        this.count = this.applications.length;
    }
}

module.exports = {
    JobApplicationResponseDto,
    JobApplicationListResponseDto,
};
