
// application/rest/dto/request/jobPostingRequestDto.js

class CreateJobPostingRequestDto {
    constructor(userId, jobType, region, siteDescription, dailyWage, requiredSkills, workStartDate, workEndDate, workHours, contactInfo) {
        this.userId = userId;
        this.jobType = jobType;
        this.region = region;
        this.siteDescription = siteDescription;
        this.dailyWage = dailyWage;
        this.requiredSkills = requiredSkills;
        this.workStartDate = workStartDate;
        this.workEndDate = workEndDate;
        this.workHours = workHours;
        this.contactInfo = contactInfo;
    }
}

class UpdateJobPostingRequestDto {
    constructor(jobType, region, siteDescription, dailyWage, requiredSkills, workStartDate, workEndDate, workHours, contactInfo) {
        this.jobType = jobType;
        this.region = region;
        this.siteDescription = siteDescription;
        this.dailyWage = dailyWage;
        this.requiredSkills = requiredSkills;
        this.workStartDate = workStartDate;
        this.workEndDate = workEndDate;
        this.workHours = workHours;
        this.contactInfo = contactInfo;
    }
}

module.exports = {
    CreateJobPostingRequestDto,
    UpdateJobPostingRequestDto,
};
