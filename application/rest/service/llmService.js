// application/rest/service/llmService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

class LLMService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            logger.error('[LLMService] GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
            throw new Error('GEMINI_API_KEY is required');
        }
        
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async generateTextWithGemini(prompt) {
        try {
            logger.info(`[LLMService] Gemini 텍스트 생성 요청: ${prompt.substring(0, 100)}...`);
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            logger.info(`[LLMService] Gemini 응답 성공 (길이: ${text.length})`);
            return text;
            
        } catch (error) {
            logger.error(`[LLMService] Gemini 요청 실패: ${error.message}`, { stack: error.stack });
            throw error;
        }
    }
}

module.exports = new LLMService();