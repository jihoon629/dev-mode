

// application/rest/controller/jobPostingController.js
const jobPostingService = require('../service/jobPostingService');
const logger = require('../config/logger');
const {
    validateCreateJobPosting,
    validateIdParam,
    validateUserIdParam,
    validateSearchQuery,
} = require('../utils/validation/jobPostingValidation');
const { CreateJobPostingRequestDto, UpdateJobPostingRequestDto } = require('../dto/request/jobPostingRequestDto');
const { JobPostingResponseDto, JobPostingListResponseDto } = require('../dto/response/jobPostingResponseDto');

class JobPostingController {
    constructor() {
        this.createJobPosting = this.createJobPosting.bind(this);
        this.getAllJobPostings = this.getAllJobPostings.bind(this);
        this.getJobPostingsByUser = this.getJobPostingsByUser.bind(this);
        this.getJobPostingById = this.getJobPostingById.bind(this);
        this.updateJobPosting = this.updateJobPosting.bind(this);
        this.deleteJobPosting = this.deleteJobPosting.bind(this);
        this.searchJobPostings = this.searchJobPostings.bind(this);
        this.searchJobPostingsBySimilarity = this.searchJobPostingsBySimilarity.bind(this);
        this.searchJobPostingsByDistance = this.searchJobPostingsByDistance.bind(this);
    }

    async getAllJobPostings(req, res, next) {
        try {
            const currentUserId = req.user?.id; // Get user ID if authenticated
            const postings = await jobPostingService.getAllJobPostings(currentUserId);
            const responseDto = new JobPostingListResponseDto(postings);

            res.json({
                status: 'success',
                data: responseDto,
            });

        } catch (error) {
            logger.error(`[JobPostingController-getAllJobPostings] 오류: ${error.message}`, { stack: error.stack });
            next(error);
        }
    }

    async createJobPosting(req, res, next) {
        try {
            validateCreateJobPosting(req.body);
            const { userId, title, jobType, region, siteDescription, dailyWage, requiredSkills, workStartDate, workEndDate, workHours, contactInfo } = req.body;
            const createDto = new CreateJobPostingRequestDto(userId, title, jobType, region, siteDescription, dailyWage, requiredSkills, workStartDate, workEndDate, workHours, contactInfo);
            const newJobPosting = await jobPostingService.createJobPosting(createDto);
            const responseDto = new JobPostingResponseDto(newJobPosting);

            res.status(201).json({
                status: 'success',
                message: '공고가 성공적으로 생성되었습니다.',
                data: responseDto
            });

        } catch (error) {
            logger.error(`[JobPostingController-createJobPosting] 오류: ${error.message}`,
              { body: req.body, stack: error.stack });
            next(error);
        }
    }

    async getJobPostingsByUser(req, res, next) {
        try {
            validateUserIdParam(req.params);
            const postings = await jobPostingService.getJobPostingsByUser(parseInt(req.params.userId));
            const responseDto = new JobPostingListResponseDto(postings);

            res.json({
                status: 'success',
                data: responseDto,
            });

        } catch (error) {
            logger.error(`[JobPostingController-getJobPostingsByUser] 오류: ${error.message}`,
              { params: req.params, stack: error.stack });
            next(error);
        }
    }

    async getJobPostingById(req, res, next) {
        try {
            validateIdParam(req.params);
            const currentUserId = req.user?.id; // Get user ID if authenticated
            const posting = await jobPostingService.getJobPostingById(parseInt(req.params.id), currentUserId);

            if (!posting) {
                return res.status(404).json({
                    status: 'error',
                    message: '공고를 찾을 수 없습니다.'
                });
            }
            const responseDto = new JobPostingResponseDto(posting);

            res.json({
                status: 'success',
                data: responseDto
            });

        } catch (error) {
            logger.error(`[JobPostingController-getJobPostingById] 오류: ${error.message}`,
              { params: req.params, stack: error.stack });
            next(error);
        }
    }

    async updateJobPosting(req, res, next) {
        try {
            validateIdParam(req.params);
            const { title, jobType, region, siteDescription, dailyWage, requiredSkills, workStartDate, workEndDate, workHours, contactInfo } = req.body;
            const updateDto = new UpdateJobPostingRequestDto(title, jobType, region, siteDescription, dailyWage, requiredSkills, workStartDate, workEndDate, workHours, contactInfo);
            const updatedJobPosting = await jobPostingService.updateJobPosting(parseInt(req.params.id), updateDto);
            const responseDto = new JobPostingResponseDto(updatedJobPosting);

            res.json({
                status: 'success',
                message: '공고가 성공적으로 업데이트되었습니다.',
                data: responseDto
            });

        } catch (error) {
            logger.error(`[JobPostingController-updateJobPosting] 오류: ${error.message}`,
              { params: req.params, body: req.body, stack: error.stack });
            next(error);
        }
    }

    async deleteJobPosting(req, res, next) {
        try {
            validateIdParam(req.params);
            await jobPostingService.deleteJobPosting(parseInt(req.params.id));

            res.json({
                status: 'success',
                message: '공고가 성공적으로 삭제되었습니다.'
            });

        } catch (error) {
            logger.error(`[JobPostingController-deleteJobPosting] 오류: ${error.message}`,
              { params: req.params, stack: error.stack });
            next(error);
        }
    }

    async searchJobPostings(req, res, next) {
        try {
            const currentUserId = req.user?.id; // Get user ID if authenticated
            const postings = await jobPostingService.searchJobPostings(req.query, currentUserId);
            const responseDto = new JobPostingListResponseDto(postings);

            res.json({
                status: 'success',
                data: responseDto,
                meta: {
                    filters: req.query
                }
            });

        } catch (error) {
            logger.error(`[JobPostingController-searchJobPostings] 오류: ${error.message}`,
              { query: req.query, stack: error.stack });
            next(error);
        }
    }

    async searchJobPostingsBySimilarity(req, res, next) {
        try {
            validateSearchQuery(req.query);
            const currentUserId = req.user?.id; // Get user ID if authenticated
            const results = await jobPostingService.searchJobPostingsBySimilarity(req.query, currentUserId);
            const responseDto = new JobPostingListResponseDto(results);

            res.json({
                status: 'success',
                data: responseDto,
                meta: {
                    searchQuery: req.query.query,
                }
            });

        } catch (error) {
            logger.error(`[JobPostingController-searchJobPostingsBySimilarity] 오류: ${error.message}`,
              { query: req.query, stack: error.stack });
            next(error);
        }
    }

    async searchJobPostingsByDistance(req, res, next) {
        try {
            const { lat, lon, dist } = req.query;
            const currentUserId = req.user?.id;
            const results = await jobPostingService.searchJobPostingsByDistance(lat, lon, dist, currentUserId);
            const responseDto = new JobPostingListResponseDto(results);

            res.json({
                status: 'success',
                data: responseDto,
                meta: {
                    searchQuery: req.query,
                }
            });

        } catch (error) {
            logger.error(`[JobPostingController-searchJobPostingsByDistance] 오류: ${error.message}`,
              { query: req.query, stack: error.stack });
            next(error);
        }
    }
}

module.exports = new JobPostingController();

