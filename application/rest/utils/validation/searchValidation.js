// application/rest/utils/validation/searchValidation.js

/**
 * 검색 쿼리 유효성 검사
 */
function validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        throw new Error('검색 쿼리는 문자열이어야 합니다.');
    }
    
    if (query.trim().length === 0) {
        throw new Error('검색 쿼리는 비어있을 수 없습니다.');
    }
    
    if (query.length > 1000) {
        throw new Error('검색 쿼리는 1000자를 초과할 수 없습니다.');
    }
    
    // 특수 문자나 SQL 인젝션 방지를 위한 추가 검증
    const dangerousPatterns = [
        /(<script[^>]*>.*?<\/script>)/gi,
        /(javascript:)/gi,
        /(on\w+\s*=)/gi
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(query)) {
            throw new Error('유효하지 않은 검색 쿼리입니다.');
        }
    }
}

/**
 * 검색 필드명 유효성 검사
 */
function validateSearchField(field, allowedFields = ['username', 'email']) {
    if (!field || typeof field !== 'string') {
        throw new Error('검색 필드는 문자열이어야 합니다.');
    }
    
    if (!allowedFields.includes(field)) {
        throw new Error(`허용되지 않은 검색 필드입니다. 허용된 필드: ${allowedFields.join(', ')}`);
    }
}

/**
 * 검색 제한 수 유효성 검사
 */
function validateSearchLimit(limit) {
    const numLimit = parseInt(limit);
    
    if (isNaN(numLimit) || numLimit < 1) {
        throw new Error('검색 제한 수는 1 이상의 숫자여야 합니다.');
    }
    
    if (numLimit > 100) {
        throw new Error('검색 제한 수는 100을 초과할 수 없습니다.');
    }
    
    return numLimit;
}

/**
 * 유사성 점수 유효성 검사
 */
function validateSimilarityScore(score) {
    const numScore = parseInt(score);
    
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
        throw new Error('유사성 점수는 0-100 사이의 숫자여야 합니다.');
    }
    
    return numScore;
}

/**
 * 사용자 역할 유효성 검사
 */
function validateUserRole(role) {
    if (!role) return null;
    
    const allowedRoles = ['worker', 'employer', 'admin'];
    if (!allowedRoles.includes(role)) {
        throw new Error(`허용되지 않은 사용자 역할입니다. 허용된 역할: ${allowedRoles.join(', ')}`);
    }
    
    return role;
}

/**
 * 사용자 ID 유효성 검사
 */
function validateUserId(userId) {
    const numUserId = parseInt(userId);
    
    if (isNaN(numUserId) || numUserId < 1) {
        throw new Error('사용자 ID는 1 이상의 숫자여야 합니다.');
    }
    
    return numUserId;
}

module.exports = {
    validateSearchQuery,
    validateSearchField,
    validateSearchLimit,
    validateSimilarityScore,
    validateUserRole,
    validateUserId
};