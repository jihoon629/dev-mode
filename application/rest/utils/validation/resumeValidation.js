
// application/rest/utils/validation/resumeValidation.js

function validateCreateResume(body) {
    const { userId, jobType, region } = body;
    if (!userId || !jobType || !region) {
        const error = new Error('사용자ID, 직종, 지역은 필수 입력 항목입니다.');
        error.statusCode = 400;
        throw error;
    }
}

function validateIdParam(params) {
    if (!params.id) {
        const error = new Error('이력서ID가 필요합니다.');
        error.statusCode = 400;
        throw error;
    }
}

function validateUserIdParam(params) {
    if (!params.userId) {
        const error = new Error('사용자ID가 필요합니다.');
        error.statusCode = 400;
        throw error;
    }
}

function validateSearchQuery(query) {
    if (!query.query) {
        const error = new Error('검색 쿼리가 필요합니다.');
        error.statusCode = 400;
        throw error;
    }
}

module.exports = {
    validateCreateResume,
    validateIdParam,
    validateUserIdParam,
    validateSearchQuery,
};
