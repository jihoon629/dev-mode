
// application/rest/utils/validation/jobPostingValidation.js

function validateCreateJobPosting(body) {
    const { userId, jobType, region, dailyWage } = body;
    if (!userId || !jobType || !region || !dailyWage) {
        const error = new Error('사용자ID, 직종, 지역, 일급은 필수 입력 항목입니다.');
        error.statusCode = 400;
        throw error;
    }
}

function validateIdParam(params) {
    if (!params.id) {
        const error = new Error('공고ID가 필요합니다.');
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
    validateCreateJobPosting,
    validateIdParam,
    validateUserIdParam,
    validateSearchQuery,
};
