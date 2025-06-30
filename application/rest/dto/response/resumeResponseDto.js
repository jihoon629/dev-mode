
// application/rest/dto/response/resumeResponseDto.js

class ResumeResponseDto {
    constructor(resume) {
        this.id = resume.id;
        this.userId = resume.user_id;
        this.jobType = resume.job_type;
        this.region = resume.region;
        this.selfIntroduction = resume.self_introduction;
        this.desiredDailyWage = resume.desired_daily_wage;
        this.skills = resume.skills;
        this.certificateImages = resume.certificate_images;
        this.createdAt = resume.created_at;
        this.updatedAt = resume.updated_at;
        if (resume.user) {
            this.user = {
                id: resume.user.id,
                username: resume.user.username,
                email: resume.user.email
            };
        }
    }
}

class ResumeListResponseDto {
    constructor(resumes) {
        this.resumes = resumes.map(r => new ResumeResponseDto(r));
        this.count = resumes.length;
    }
}

module.exports = {
    ResumeResponseDto,
    ResumeListResponseDto,
};
