
// application/rest/service/resumeService.js
const ResumeModel = require('../repo/models/resumeModel');
const similarityService = require('./similarityService');
const userService = require('./userService'); // userService 임포트

class ResumeService {
  async createResume(createDto) {
    return await ResumeModel.create(createDto);
  }

  async getResumesByUser(userId) {
    return await ResumeModel.findByUserId(userId);
  }

  async getResumeById(id) {
    const resume = await ResumeModel.findById(id);
    if (!resume) {
      throw new Error('이력서를 찾을 수 없습니다.');
    }

    // 블록체인에서 경력 정보 조회
    const experience = await userService.getUserExperience(resume.user_id);

    // 이력서 정보와 경력 정보를 합쳐서 반환
    return {
      ...resume,
      blockchainExperience: experience,
    };
  }

  async updateResume(id, updateDto) {
    return await ResumeModel.update(id, updateDto);
  }

  async deleteResume(id) {
    return await ResumeModel.delete(id);
  }

  async searchResumes(filters) {
    if (filters.keyword) {
      return await ResumeModel.searchByKeyword(filters.keyword, filters.limit);
    } else {
      return await ResumeModel.findActiveResumes(filters);
    }
  }

  async searchResumesBySimilarity(searchParams) {
    const { query, field, limit, minSimilarity, region, jobType } = searchParams;

    const filters = {};
    if (region) filters.region = region;
    if (jobType) filters.jobType = jobType;

    const resumes = await ResumeModel.findActiveResumes(filters);

    if (resumes.length === 0) {
      return [];
    }

    const similarityResults = await similarityService.findMostSimilar(
      query,
      resumes,
      field
    );

    const filteredResults = similarityResults.filter(
      result => result.similarity >= parseInt(minSimilarity)
    );

    return filteredResults.slice(0, parseInt(limit));
  }
}

module.exports = new ResumeService();
