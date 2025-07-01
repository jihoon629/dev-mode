
// application/rest/dto/request/resumeRequestDto.js

class CreateResumeRequestDto {
    constructor(userId, jobType, region, selfIntroduction, desiredDailyWage, skills, certificateImages, experience, phone) {
        this.userId = userId;
        this.jobType = jobType;
        this.region = region;
        this.selfIntroduction = selfIntroduction;
        this.desiredDailyWage = desiredDailyWage;
        this.skills = skills;
        this.certificateImages = certificateImages;
        this.experience = experience;
        this.phone = phone;
    }
}

class UpdateResumeRequestDto {
    constructor(jobType, region, selfIntroduction, desiredDailyWage, skills, certificateImages, experience, phone) {
        this.jobType = jobType;
        this.region = region;
        this.selfIntroduction = selfIntroduction;
        this.desiredDailyWage = desiredDailyWage;
        this.skills = skills;
        this.certificateImages = certificateImages;
        this.experience = experience;
        this.phone = phone;
    }
}

module.exports = {
    CreateResumeRequestDto,
    UpdateResumeRequestDto,
};
