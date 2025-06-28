
// application/rest/dto/request/resumeRequestDto.js

class CreateResumeRequestDto {
    constructor(userId, jobType, region, selfIntroduction, desiredDailyWage, skills) {
        this.userId = userId;
        this.jobType = jobType;
        this.region = region;
        this.selfIntroduction = selfIntroduction;
        this.desiredDailyWage = desiredDailyWage;
        this.skills = skills;
    }
}

class UpdateResumeRequestDto {
    constructor(jobType, region, selfIntroduction, desiredDailyWage, skills) {
        this.jobType = jobType;
        this.region = region;
        this.selfIntroduction = selfIntroduction;
        this.desiredDailyWage = desiredDailyWage;
        this.skills = skills;
    }
}

module.exports = {
    CreateResumeRequestDto,
    UpdateResumeRequestDto,
};
