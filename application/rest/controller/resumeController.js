// application/rest/controller/resumeController.js
const ResumeModel = require('../repo/models/resumeModel');
const similarityService = require('../service/similarityService');
const logger = require('../config/logger');

class ResumeController {
    constructor() {
        this.createResume = this.createResume.bind(this);
        this.getResumesByUser = this.getResumesByUser.bind(this);
        this.getResumeById = this.getResumeById.bind(this);
        this.updateResume = this.updateResume.bind(this);
        this.deleteResume = this.deleteResume.bind(this);
        this.searchResumes = this.searchResumes.bind(this);
        this.searchResumesBySimilarity = this.searchResumesBySimilarity.bind(this);
    }

    async createResume(req, res, next) {
        try {
            const { 
                userId, jobType, region, selfIntroduction, 
                desiredDailyWage, skills 
            } = req.body;

            if (!userId || !jobType || !region) {
                return res.status(400).json({
                    status: 'error',
                    message: '사용자ID, 직종, 지역은 필수 입력 항목입니다.'
                });
            }

            const resumeData = {
                userId,
                jobType,
                region,
                selfIntroduction,
                desiredDailyWage,
                skills
            };

            const newResume = await ResumeModel.create(resumeData);

            res.status(201).json({
                status: 'success',
                message: '이력서가 성공적으로 생성되었습니다.',
                data: newResume
            });

        } catch (error) {
            logger.error(`[ResumeController-createResume] 오류: ${error.message}`, {
                body: req.body,
                stack: error.stack
            });
            next(error);
        }
    }

    async getResumesByUser(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    status: 'error',
                    message: '사용자ID가 필요합니다.'
                });
            }

            const resumes = await ResumeModel.findByUserId(parseInt(userId));

            res.json({
                status: 'success',
                data: resumes,
                meta: {
                    count: resumes.length
                }
            });

        } catch (error) {
            logger.error(`[ResumeController-getResumesByUser] 오류: ${error.message}`, {
                params: req.params,
                stack: error.stack
            });
            next(error);
        }
    }

    async getResumeById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'error',
                    message: '이력서ID가 필요합니다.'
                });
            }

            const resume = await ResumeModel.findById(parseInt(id));

            if (!resume) {
                return res.status(404).json({
                    status: 'error',
                    message: '이력서를 찾을 수 없습니다.'
                });
            }

            res.json({
                status: 'success',
                data: resume
            });

        } catch (error) {
            logger.error(`[ResumeController-getResumeById] 오류: ${error.message}`, {
                params: req.params,
                stack: error.stack
            });
            next(error);
        }
    }

    async updateResume(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'error',
                    message: '이력서ID가 필요합니다.'
                });
            }

            const updatedResume = await ResumeModel.update(parseInt(id), updateData);

            res.json({
                status: 'success',
                message: '이력서가 성공적으로 업데이트되었습니다.',
                data: updatedResume
            });

        } catch (error) {
            logger.error(`[ResumeController-updateResume] 오류: ${error.message}`, {
                params: req.params,
                body: req.body,
                stack: error.stack
            });
            next(error);
        }
    }

    async deleteResume(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'error',
                    message: '이력서ID가 필요합니다.'
                });
            }

            await ResumeModel.delete(parseInt(id));

            res.json({
                status: 'success',
                message: '이력서가 성공적으로 삭제되었습니다.'
            });

        } catch (error) {
            logger.error(`[ResumeController-deleteResume] 오류: ${error.message}`, {
                params: req.params,
                stack: error.stack
            });
            next(error);
        }
    }

    async searchResumes(req, res, next) {
        try {
            const { 
                jobType, region, minWage, maxWage, 
                limit = 20, offset = 0, keyword 
            } = req.query;

            let resumes;

            if (keyword) {
                resumes = await ResumeModel.searchByKeyword(keyword, parseInt(limit));
            } else {
                const filters = {
                    jobType,
                    region,
                    minWage: minWage ? parseInt(minWage) : undefined,
                    maxWage: maxWage ? parseInt(maxWage) : undefined,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                };

                resumes = await ResumeModel.findActiveResumes(filters);
            }

            res.json({
                status: 'success',
                data: resumes,
                meta: {
                    count: resumes.length,
                    filters: { jobType, region, minWage, maxWage, keyword },
                    pagination: { limit: parseInt(limit), offset: parseInt(offset) }
                }
            });

        } catch (error) {
            logger.error(`[ResumeController-searchResumes] 오류: ${error.message}`, {
                query: req.query,
                stack: error.stack
            });
            next(error);
        }
    }

    async searchResumesBySimilarity(req, res, next) {
        try {
            const { 
                query, 
                field = 'job_type', 
                limit = 10, 
                minSimilarity = 30,
                region,
                jobType
            } = req.query;

            if (!query) {
                return res.status(400).json({
                    status: 'error',
                    message: '검색 쿼리가 필요합니다.'
                });
            }

            logger.info(`[ResumeController] 이력서 유사성 검색 요청 - 쿼리: "${query}"`);

            // 필터링 조건으로 이력서 조회
            const filters = {};
            if (region) filters.region = region;
            if (jobType) filters.jobType = jobType;

            const resumes = await ResumeModel.findActiveResumes(filters);

            if (resumes.length === 0) {
                return res.json({
                    status: 'success',
                    data: [],
                    message: '검색 조건에 맞는 이력서가 없습니다.'
                });
            }

            // 유사성 분석
            const similarityResults = await similarityService.findMostSimilar(
                query, 
                resumes, 
                field
            );

            // 최소 유사성 점수 필터링
            const filteredResults = similarityResults.filter(
                result => result.similarity >= parseInt(minSimilarity)
            );

            const topResults = filteredResults.slice(0, parseInt(limit));

            // 민감한 정보 제거 및 응답 형식 정리
            const safeResults = topResults.map(resume => ({
                id: resume.id,
                user_id: resume.user_id,
                job_type: resume.job_type,
                region: resume.region,
                self_introduction: resume.self_introduction,
                desired_daily_wage: resume.desired_daily_wage,
                skills: resume.skills,
                created_at: resume.created_at,
                updated_at: resume.updated_at,
                similarity: resume.similarity,
                explanation: resume.explanation,
                user: resume.user ? {
                    id: resume.user.id,
                    username: resume.user.username,
                    email: resume.user.email
                } : null
            }));

            res.json({
                status: 'success',
                data: safeResults,
                meta: {
                    searchQuery: query,
                    searchField: field,
                    filters: { region, jobType },
                    minSimilarity: parseInt(minSimilarity),
                    totalProcessed: resumes.length,
                    totalMatched: filteredResults.length,
                    returned: safeResults.length
                }
            });

        } catch (error) {
            logger.error(`[ResumeController-searchResumesBySimilarity] 오류: ${error.message}`, {
                query: req.query,
                stack: error.stack
            });
            next(error);
        }
    }
}

module.exports = new ResumeController();