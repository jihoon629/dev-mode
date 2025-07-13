
// application/rest/service/jobPostingService.js
const JobPostingModel = require('../repo/models/jobPostingModel');
const FavoriteModel = require('../repo/models/favoriteModel');
const similarityService = require('./similarityService');
const logger = require('../config/logger');

class JobPostingService {
  async createJobPosting(createDto) {
    return await JobPostingModel.create(createDto);
  }

  async getJobPostingsByUser(userId) {
    return await JobPostingModel.findByUserId(userId);
  }

  async getJobPostingById(id, currentUserId) {
    const posting = await JobPostingModel.findById(id);
    if (posting) {
      await JobPostingModel.incrementViewCount(id);
      if (currentUserId) {
        posting.isFavorited = await FavoriteModel.isFavorited(currentUserId, id);
      } else {
        posting.isFavorited = false;
      }
    }
    return posting;
  }

  async updateJobPosting(id, updateDto) {
    return await JobPostingModel.update(id, updateDto);
  }

  async deleteJobPosting(id) {
    return await JobPostingModel.delete(id);
  }

  async searchJobPostings(filters, currentUserId) {
    let postings;
    if (filters.keyword) {
      postings = await JobPostingModel.searchByKeyword(filters.keyword, filters.limit);
    } else {
      postings = await JobPostingModel.findActivePostings(filters);
    }

    if (currentUserId && postings.length > 0) {
        const favoritePostIds = (await FavoriteModel.findByUserId(currentUserId)).map(fav => fav.job_posting_id);
        postings.forEach(p => {
            p.isFavorited = favoritePostIds.includes(p.id);
        });
    } else {
        postings.forEach(p => {
            p.isFavorited = false;
        });
    }
    return postings;
  }

  async searchJobPostingsBySimilarity(searchParams, currentUserId) {
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

    let filteredResults = similarityResults.filter(
      result => result.similarity >= parseInt(minSimilarity)
    );

    if (currentUserId && filteredResults.length > 0) {
        const favoritePostIds = (await FavoriteModel.findByUserId(currentUserId)).map(fav => fav.job_posting_id);
        filteredResults.forEach(p => {
            p.isFavorited = favoritePostIds.includes(p.id);
        });
    } else {
        filteredResults.forEach(p => {
            p.isFavorited = false;
        });
    }

    return filteredResults.slice(0, parseInt(limit));
  }

  async getAllJobPostings(currentUserId) {
    const postings = await JobPostingModel.findAllActive();
    if (currentUserId && postings.length > 0) {
        const favoritePostIds = (await FavoriteModel.findByUserId(currentUserId)).map(fav => fav.job_posting_id);
        postings.forEach(p => {
            p.isFavorited = favoritePostIds.includes(p.id);
        });
    } else {
        postings.forEach(p => {
            p.isFavorited = false;
        });
    }
    return postings;
  }

  async searchJobPostingsByDistance(lat, lon, dist, currentUserId) {
    const postings = await JobPostingModel.findByDistance(lat, lon, dist);
    if (currentUserId && postings.length > 0) {
        const favoritePostIds = (await FavoriteModel.findByUserId(currentUserId)).map(fav => fav.job_posting_id);
        postings.forEach(p => {
            p.isFavorited = favoritePostIds.includes(p.id);
        });
    } else {
        postings.forEach(p => {
            p.isFavorited = false;
        });
    }
    return postings;
  }

  async updateJobPostingStatus(id, status, currentUserId) {
    const posting = await JobPostingModel.findById(id);
    if (!posting) {
      throw new Error('공고를 찾을 수 없습니다.');
    }
    if (posting.user_id !== currentUserId) {
      throw new Error('자신이 등록한 공고의 상태만 변경할 수 있습니다.');
    }
    return await JobPostingModel.updateStatus(id, status);
  }
}

module.exports = new JobPostingService();
