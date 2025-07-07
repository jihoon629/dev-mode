
// application/rest/dto/response/jobPostingResponseDto.js

class JobPostingResponseDto {
    constructor(posting) {
        this.id = posting.id;
        this.userId = posting.user_id;
        this.title = posting.title;
        this.jobType = posting.job_type;
        this.region = posting.region;
        this.siteDescription = posting.site_description;
        this.dailyWage = posting.daily_wage;
        this.requiredSkills = posting.required_skills;
        this.workStartDate = posting.work_start_date;
        this.workEndDate = posting.work_end_date;
        this.workHours = posting.work_hours;
        this.contactInfo = posting.contact_info;
        this.viewCount = posting.view_count;
        this.status = posting.status; // status 필드 추가
        this.createdAt = posting.created_at;
        this.updatedAt = posting.updated_at;
        this.distance = posting.distance; // 거리 필드 추가
        this.location = posting.location; // location 필드 추가
        this.applicantCount = posting.applicantCount; // 지원자 수 필드 추가
        this.completedApplicantCount = posting.completedApplicantCount; // 완료된 지원자 수 필드 추가
        this.isPayrollCompleted = posting.is_payroll_completed; // 급여 지급 완료 여부 필드 추가
        
        if (posting.user) {
            this.user = {
                id: posting.user.id,
                username: posting.user.username,
                email: posting.user.email
            };
        }

        // 추천 정보가 있는 경우 DTO에 포함
        if (posting.recommendation) {
            this.recommendation = {
                matchScore: posting.recommendation.matchScore,
                reasonDetails: posting.recommendation.reasonDetails // reasonDetails 추가
            };
        }
    }
}

class JobPostingListResponseDto {
    constructor(postings) {
        this.postings = postings.map(p => new JobPostingResponseDto(p));
        this.count = postings.length;
    }
}

module.exports = {
    JobPostingResponseDto,
    JobPostingListResponseDto,
};
