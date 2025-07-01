
// application/rest/controller/resumeController.js
const resumeService = require('../service/resumeService');
const recommendationService = require('../service/recommendationService'); // recommendationService 추가
const logger = require('../config/logger');
const {
    validateCreateResume,
    validateIdParam,
    validateUserIdParam,
    validateSearchQuery,
} = require('../utils/validation/resumeValidation');
const { CreateResumeRequestDto, UpdateResumeRequestDto } = require('../dto/request/resumeRequestDto');
const { ResumeResponseDto, ResumeListResponseDto } = require('../dto/response/resumeResponseDto');
const { JobPostingListResponseDto } = require('../dto/response/jobPostingResponseDto'); // 추천 결과용 DTO

class ResumeController {
    constructor() {
        this.createResume = this.createResume.bind(this);
        this.getResumesByUser = this.getResumesByUser.bind(this);
        this.getResumeById = this.getResumeById.bind(this);
        this.updateResume = this.updateResume.bind(this);
        this.deleteResume = this.deleteResume.bind(this);
        this.searchResumes = this.searchResumes.bind(this);
        this.searchResumesBySimilarity = this.searchResumesBySimilarity.bind(this);
        this.getJobRecommendations = this.getJobRecommendations.bind(this); // 추천 메소드 바인딩
    }

    // 이력서 기반 공고 추천
    async getJobRecommendations(req, res, next) {
        try {
            validateIdParam(req.params);
            const resumeId = parseInt(req.params.id, 10);
            
            logger.info(`[ResumeController] 이력서 ID ${resumeId}에 대한 공고 추천 요청`);

            const recommendations = await recommendationService.recommendJobsForResume(resumeId);
            
            // 추천 결과��� JobPostingListResponseDto를 재사용하여 응답 형식 통일
            const responseDto = new JobPostingListResponseDto(recommendations);

            res.json({
                status: 'success',
                message: `${recommendations.length}개의 맞춤 공고를 추천합니다.`,
                data: responseDto,
            });

        } catch (error) {
            logger.error(`[ResumeController-getJobRecommendations] 오류: ${error.message}`,
              { params: req.params, stack: error.stack });
            next(error);
        }
    }

    async createResume(req, res, next) {
        try {
            validateCreateResume(req.body);
            const createDto = new CreateResumeRequestDto(req.body.userId, req.body.jobType, req.body.region, req.body.selfIntroduction, req.body.desiredDailyWage, req.body.skills, req.body.certificateImages, req.body.experience, req.body.phone);
            const newResume = await resumeService.createResume(createDto);
            const responseDto = new ResumeResponseDto(newResume);

            res.status(201).json({
                status: 'success',
                message: '이력서가 성공적으로 생성되었습니다.',
                data: responseDto
            });

        } catch (error) {
            logger.error(`[ResumeController-createResume] 오류: ${error.message}`,
              { body: req.body, stack: error.stack });
            next(error);
        }
    }

    async getResumesByUser(req, res, next) {
        try {
            validateUserIdParam(req.params);
            const resumes = await resumeService.getResumesByUser(parseInt(req.params.userId));
            const responseDto = new ResumeListResponseDto(resumes);

            res.json({
                status: 'success',
                data: responseDto,
            });

        } catch (error) {
            logger.error(`[ResumeController-getResumesByUser] 오류: ${error.message}`,
              { params: req.params, stack: error.stack });
            next(error);
        }
    }

    async getResumeById(req, res, next) {
        try {
            validateIdParam(req.params);
            const resume = await resumeService.getResumeById(parseInt(req.params.id));

            if (!resume) {
                return res.status(404).json({
                    status: 'error',
                    message: '이력서를 찾을 수 없습니다.'
                });
            }
            const responseDto = new ResumeResponseDto(resume);

            res.json({
                status: 'success',
                data: responseDto
            });

        } catch (error) {
            logger.error(`[ResumeController-getResumeById] 오류: ${error.message}`,
              { params: req.params, stack: error.stack });
            next(error);
        }
    }

    async updateResume(req, res, next) {
        try {
            validateIdParam(req.params);
            const updateDto = new UpdateResumeRequestDto(req.body.jobType, req.body.region, req.body.selfIntroduction, req.body.desiredDailyWage, req.body.skills, req.body.certificateImages, req.body.experience, req.body.phone);
            const updatedResume = await resumeService.updateResume(parseInt(req.params.id), updateDto);
            const responseDto = new ResumeResponseDto(updatedResume);

            res.json({
                status: 'success',
                message: '이력서가 성공적으로 업데이트되었습니다.',
                data: responseDto
            });

        } catch (error) {
            logger.error(`[ResumeController-updateResume] 오류: ${error.message}`,
              { params: req.params, body: req.body, stack: error.stack });
            next(error);
        }
    }

    async deleteResume(req, res, next) {
        try {
            validateIdParam(req.params);
            await resumeService.deleteResume(parseInt(req.params.id));

            res.json({
                status: 'success',
                message: '이력서가 성공적으로 삭제되었습니다.'
            });

        } catch (error) {
            logger.error(`[ResumeController-deleteResume] 오류: ${error.message}`,
              { params: req.params, stack: error.stack });
            next(error);
        }
    }

    async searchResumes(req, res, next) {
        try {
            const resumes = await resumeService.searchResumes(req.query);
            const responseDto = new ResumeListResponseDto(resumes);

            res.json({
                status: 'success',
                data: responseDto,
                meta: {
                    filters: req.query
                }
            });

        } catch (error) {
            logger.error(`[ResumeController-searchResumes] 오류: ${error.message}`,
              { query: req.query, stack: error.stack });
            next(error);
        }
    }

    async searchResumesBySimilarity(req, res, next) {
        try {
            validateSearchQuery(req.query);
            const results = await resumeService.searchResumesBySimilarity(req.query);
            const responseDto = new ResumeListResponseDto(results);

            res.json({
                status: 'success',
                data: responseDto,
                meta: {
                    searchQuery: req.query.query,
                }
            });

        } catch (error) {
            logger.error(`[ResumeController-searchResumesBySimilarity] 오류: ${error.message}`,
              { query: req.query, stack: error.stack });
            next(error);
        }
    }
}

module.exports = new ResumeController();
