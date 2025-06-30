
// application/rest/dto/request/resumeRequestDto.js

class CreateResumeRequestDto {
    constructor(userId, jobType, region, selfIntroduction, desiredDailyWage, skills, certificateImages) {
        this.userId = userId;
        this.jobType = jobType;
        this.region = region;
        this.selfIntroduction = selfIntroduction;
        this.desiredDailyWage = desiredDailyWage;
        this.skills = skills;
        this.certificateImages = certificateImages;
    }
}

class UpdateResumeRequestDto {
    constructor(jobType, region, selfIntroduction, desiredDailyWage, skills, certificateImages) {
        this.jobType = jobType;
        this.region = region;
        this.selfIntroduction = selfIntroduction;
        this.desiredDailyWage = desiredDailyWage;
        this.skills = skills;
        this.certificateImages = certificateImages;
    }
}

module.exports = {
    CreateResumeRequestDto,
    UpdateResumeRequestDto,
};
