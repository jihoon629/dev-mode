// application/rest/controller/jobPostingController.js
const JobPostingModel = require('../repo/models/jobPostingModel');
const similarityService = require('../service/similarityService');
const logger = require('../config/logger');

class JobPostingController {
    constructor() {
        this.createJobPosting = this.createJobPosting.bind(this);
        this.getJobPostingsByUser = this.getJobPostingsByUser.bind(this);
        this.getJobPostingById = this.getJobPostingById.bind(this);
        this.updateJobPosting = this.updateJobPosting.bind(this);
        this.deleteJobPosting = this.deleteJobPosting.bind(this);
        this.searchJobPostings = this.searchJobPostings.bind(this);
        this.searchJobPostingsBySimilarity = this.searchJobPostingsBySimilarity.bind(this);
    }

    async createJobPosting(req, res, next) {
        try {
            const { 
                userId, jobType, region, siteDescription, dailyWage, 
                requiredSkills, workStartDate, workEndDate, workHours, contactInfo 
            } = req.body;

            if (!userId || !jobType || !region || !dailyWage) {
                return res.status(400).json({
                    status: 'error',
                    message: '사용자ID, 직종, 지역, 일급은 필수 입력 항목입니다.'
                });
            }

            const postingData = {
                userId,
                jobType,
                region,
                siteDescription,
                dailyWage,
                requiredSkills,
                workStartDate,
                workEndDate,
                workHours,
                contactInfo
            };

            const newJobPosting = await JobPostingModel.create(postingData);

            res.status(201).json({
                status: 'success',
                message: '공고가 성공적으로 생성되었습니다.',
                data: newJobPosting
            });

        } catch (error) {
            logger.error(`[JobPostingController-createJobPosting] 오류: ${error.message}`, {
                body: req.body,
                stack: error.stack
            });
            next(error);
        }
    }

    async getJobPostingsByUser(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    status: 'error',
                    message: '사용자ID가 필요합니다.'
                });
            }

            const postings = await JobPostingModel.findByUserId(parseInt(userId));

            res.json({
                status: 'success',
                data: postings,
                meta: {
                    count: postings.length
                }
            });

        } catch (error) {
            logger.error(`[JobPostingController-getJobPostingsByUser] 오류: ${error.message}`, {
                params: req.params,
                stack: error.stack
            });
            next(error);
        }
    }

    async getJobPostingById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'error',
                    message: '공고ID가 필요합니다.'
                });
            }

            const posting = await JobPostingModel.findById(parseInt(id));

            if (!posting) {
                return res.status(404).json({
                    status: 'error',
                    message: '공고를 찾을 수 없습니다.'
                });
            }

            // 조회수 증가
            await JobPostingModel.incrementViewCount(parseInt(id));

            res.json({
                status: 'success',
                data: posting
            });

        } catch (error) {
            logger.error(`[JobPostingController-getJobPostingById] 오류: ${error.message}`, {
                params: req.params,
                stack: error.stack
            });
            next(error);
        }
    }

    async updateJobPosting(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'error',
                    message: '공고ID가 필요합니다.'
                });
            }

            const updatedJobPosting = await JobPostingModel.update(parseInt(id), updateData);

            res.json({
                status: 'success',
                message: '공고가 성공적으로 업데이트되었습니다.',
                data: updatedJobPosting
            });

        } catch (error) {
            logger.error(`[JobPostingController-updateJobPosting] 오류: ${error.message}`, {
                params: req.params,
                body: req.body,
                stack: error.stack
            });
            next(error);
        }
    }

    async deleteJobPosting(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'error',
                    message: '공고ID가 필요합니다.'
                });
            }

            await JobPostingModel.delete(parseInt(id));

            res.json({
                status: 'success',
                message: '공고가 성공적으로 삭제되었습니다.'
            });

        } catch (error) {
            logger.error(`[JobPostingController-deleteJobPosting] 오류: ${error.message}`, {
                params: req.params,
                stack: error.stack
            });
            next(error);
        }
    }

    async searchJobPostings(req, res, next) {
        try {
            const { 
                jobType, region, minWage, maxWage, startDate, endDate,
                limit = 20, offset = 0, keyword 
            } = req.query;

            let postings;

            if (keyword) {
                postings = await JobPostingModel.searchByKeyword(keyword, parseInt(limit));
            } else {
                const filters = {
                    jobType,
                    region,
                    minWage: minWage ? parseInt(minWage) : undefined,
                    maxWage: maxWage ? parseInt(maxWage) : undefined,
                    startDate,
                    endDate,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                };

                postings = await JobPostingModel.findActivePostings(filters);
            }

            res.json({
                status: 'success',
                data: postings,
                meta: {
                    count: postings.length,
                    filters: { jobType, region, minWage, maxWage, startDate, endDate, keyword },
                    pagination: { limit: parseInt(limit), offset: parseInt(offset) }
                }
            });

        } catch (error) {
            logger.error(`[JobPostingController-searchJobPostings] 오류: ${error.message}`, {
                query: req.query,
                stack: error.stack
            });
            next(error);
        }
    }

    async searchJobPostingsBySimilarity(req, res, next) {
        try {
            const { 
                query, 
                field = 'job_type', 
                limit = 10, 
                minSimilarity = 30,
                region,
                jobType,
                minWage,
                maxWage
            } = req.query;

            if (!query) {
                return res.status(400).json({
                    status: 'error',
                    message: '검색 쿼리가 필요합니다.'
                });
            }

            logger.info(`[JobPostingController] 공고 유사성 검색 요청 - 쿼리: "${query}"`);

            // 필터링 조건으로 공고 조회
            const filters = {};
            if (region) filters.region = region;
            if (jobType) filters.jobType = jobType;
            if (minWage) filters.minWage = parseInt(minWage);
            if (maxWage) filters.maxWage = parseInt(maxWage);

            const postings = await JobPostingModel.findActivePostings(filters);

            if (postings.length === 0) {
                return res.json({
                    status: 'success',
                    data: [],
                    message: '검색 조건에 맞는 공고가 없습니다.'
                });
            }

            // 유사성 분석
            const similarityResults = await similarityService.findMostSimilar(
                query, 
                postings, 
                field
            );

            // 최소 유사성 점수 필터링
            const filteredResults = similarityResults.filter(
                result => result.similarity >= parseInt(minSimilarity)
            );

            const topResults = filteredResults.slice(0, parseInt(limit));

            // 민감한 정보 제거 및 응답 형식 정리
            const safeResults = topResults.map(posting => ({
                id: posting.id,
                user_id: posting.user_id,
                job_type: posting.job_type,
                region: posting.region,
                site_description: posting.site_description,
                daily_wage: posting.daily_wage,
                required_skills: posting.required_skills,
                work_start_date: posting.work_start_date,
                work_end_date: posting.work_end_date,
                work_hours: posting.work_hours,
                contact_info: posting.contact_info,
                view_count: posting.view_count,
                created_at: posting.created_at,
                updated_at: posting.updated_at,
                similarity: posting.similarity,
                explanation: posting.explanation,
                user: posting.user ? {
                    id: posting.user.id,
                    username: posting.user.username,
                    email: posting.user.email
                } : null
            }));

            res.json({
                status: 'success',
                data: safeResults,
                meta: {
                    searchQuery: query,
                    searchField: field,
                    filters: { region, jobType, minWage, maxWage },
                    minSimilarity: parseInt(minSimilarity),
                    totalProcessed: postings.length,
                    totalMatched: filteredResults.length,
                    returned: safeResults.length
                }
            });

        } catch (error) {
            logger.error(`[JobPostingController-searchJobPostingsBySimilarity] 오류: ${error.message}`, {
                query: req.query,
                stack: error.stack
            });
            next(error);
        }
    }
}

module.exports = new JobPostingController();