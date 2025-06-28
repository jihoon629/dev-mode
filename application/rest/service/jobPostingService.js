
// application/rest/service/jobPostingService.js
const JobPostingModel = require('../repo/models/jobPostingModel');
const similarityService = require('./similarityService');
const logger = require('../config/logger');

class JobPostingService {
  async createJobPosting(createDto) {
    return await JobPostingModel.create(createDto);
  }

  async getJobPostingsByUser(userId) {
    return await JobPostingModel.findByUserId(userId);
  }

  async getJobPostingById(id) {
    const posting = await JobPostingModel.findById(id);
    if (posting) {
      await JobPostingModel.incrementViewCount(id);
    }
    return posting;
  }

  async updateJobPosting(id, updateDto) {
    return await JobPostingModel.update(id, updateDto);
  }

  async deleteJobPosting(id) {
    return await JobPostingModel.delete(id);
  }

  async searchJobPostings(filters) {
    if (filters.keyword) {
      return await JobPostingModel.searchByKeyword(filters.keyword, filters.limit);
    } else {
      return await JobPostingModel.findActivePostings(filters);
    }
  }

  async searchJobPostingsBySimilarity(searchParams) {
    const { query, field, limit, minSimilarity, region, jobType, minWage, maxWage } = searchParams;

    const filters = {};
    if (region) filters.region = region;
    if (jobType) filters.jobType = jobType;
    if (minWage) filters.minWage = parseInt(minWage);
    if (maxWage) filters.maxWage = parseInt(maxWage);

    const postings = await JobPostingModel.findActivePostings(filters);

    if (postings.length === 0) {
      return [];
    }

    const similarityResults = await similarityService.findMostSimilar(
      query,
      postings,
      field
    );

    const filteredResults = similarityResults.filter(
      result => result.similarity >= parseInt(minSimilarity)
    );

    return filteredResults.slice(0, parseInt(limit));
  }

  async getAllJobPostings() {
    return await JobPostingModel.findAllActive();
  }
}

module.exports = new JobPostingService();
