
// application/rest/dto/request/resumeRequestDto.js

class CreateResumeRequestDto {
    constructor(userId, jobType, region, selfIntroduction, desiredDailyWage, skills, certificateImages, history, phone) {
        this.userId = userId;
        this.jobType = jobType;
        this.region = region;
        this.selfIntroduction = selfIntroduction;
        this.desiredDailyWage = desiredDailyWage;
        this.skills = skills;
        this.certificateImages = certificateImages;
        this.history = history;
        this.phone = phone;
    }
}

class UpdateResumeRequestDto {
    constructor(jobType, region, selfIntroduction, desiredDailyWage, skills, certificateImages, history, phone) {
        this.jobType = jobType;
        this.region = region;
        this.selfIntroduction = selfIntroduction;
        this.desiredDailyWage = desiredDailyWage;
        this.skills = skills;
        this.certificateImages = certificateImages;
        this.history = history;
        this.phone = phone;
    }
}

module.exports = {
    CreateResumeRequestDto,
    UpdateResumeRequestDto,
};
