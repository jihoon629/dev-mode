// application/rest/config/geminiConfig.js
module.exports = {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 1000,
    
    // 유사성 검색 관련 설정
    similarity: {
        batchSize: parseInt(process.env.GEMINI_BATCH_SIZE) || 10,
        maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES) || 3,
        retryDelay: parseInt(process.env.GEMINI_RETRY_DELAY) || 1000,
        requestTimeout: parseInt(process.env.GEMINI_REQUEST_TIMEOUT) || 30000
    }
};