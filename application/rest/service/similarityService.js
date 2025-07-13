// application/rest/service/similarityService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

class SimilarityService {
    constructor() {
        // Gemini AI 클라이언트 초기화
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            logger.error('[SimilarityService] GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
            throw new Error('GEMINI_API_KEY is required');
        }
        
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    /**
     * 검색 쿼리와 데이터베이스 레코드들 간의 유사성을 계산
     * @param {string} searchQuery - 검색할 키워드/문장
     * @param {Array} dbRecords - 비교할 데이터베이스 레코드들
     * @param {string} fieldName - 비교할 필드명 (예: 'title', 'description', 'content')
     * @returns {Array} 유사성 점수로 정렬된 레코드 배열
     */
    async findMostSimilar(searchQuery, dbRecords, fieldName) {
        try {
            if (!searchQuery || !dbRecords || dbRecords.length === 0) {
                logger.warn('[SimilarityService] 검색 쿼리나 데이터베이스 레코드가 비어있습니다.');
                return [];
            }

            logger.info(`[SimilarityService] 유사성 검색 시작 - 쿼리: "${searchQuery}", 레코드 수: ${dbRecords.length}`);

            // 배치 처리를 위해 여러 레코드를 한 번에 비교
            const batchSize = 10; // Gemini API 호출 최적화를 위한 배치 크기
            const results = [];

            for (let i = 0; i < dbRecords.length; i += batchSize) {
                const batch = dbRecords.slice(i, i + batchSize);
                const batchResults = await this.processBatch(searchQuery, batch, fieldName);
                results.push(...batchResults);
            }

            // 유사성 점수로 정렬 (높은 점수 순)
            const sortedResults = results.sort((a, b) => b.similarity - a.similarity);
            
            logger.info(`[SimilarityService] 유사성 검색 완료 - 최고 점수: ${sortedResults[0]?.similarity || 0}`);
            
            return sortedResults;

        } catch (error) {
            logger.error(`[SimilarityService] 유사성 검색 중 오류: ${error.message}`, { 
                searchQuery, 
                recordCount: dbRecords.length,
                stack: error.stack 
            });
            throw error;
        }
    }

    /**
     * 배치 단위로 유사성 점수 계산
     */
    async processBatch(searchQuery, batch, fieldName) {
        const prompt = this.buildSimilarityPrompt(searchQuery, batch, fieldName);
        
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return this.parseSimilarityResponse(text, batch);
            
        } catch (error) {
            logger.error(`[SimilarityService] Gemini API 호출 오류: ${error.message}`);
            // API 오류 시 기본 점수 0으로 반환
            return batch.map(record => ({
                ...record,
                similarity: 0,
                explanation: 'API 오류로 인한 기본값'
            }));
        }
    }

    /**
     * Gemini에게 보낼 유사성 분석 프롬프트 생성
     */
    buildSimilarityPrompt(searchQuery, records, fieldName) {
        const recordsText = records.map((record, index) => 
            `${index + 1}. ${record[fieldName] || '내용 없음'}`
        ).join('\n');

        return `
다음 검색 쿼리와 각 텍스트 간의 의미적 유사성을 0-100 점수로 평가해주세요.

검색 쿼리: "${searchQuery}"

비교 대상 텍스트들:
${recordsText}

각 텍스트에 대해 다음 JSON 형식으로 응답해주세요:
[
  {
    "index": 1,
    "similarity": 85,
    "explanation": "유사성 판단 근거"
  },
  {
    "index": 2,
    "similarity": 92,
    "explanation": "유사성 판단 근거"
  }
]

평가 기준:
- 키워드 일치도
- 의미적 유사성
- 문맥적 관련성
- 주제 일치도

점수 기준:
- 90-100: 매우 높은 유사성
- 70-89: 높은 유사성
- 50-69: 보통 유사성
- 30-49: 낮은 유사성
- 0-29: 매우 낮은 유사성

JSON 형식만 응답해주세요.`;
    }

    /**
     * Gemini 응답 파싱
     */
    parseSimilarityResponse(responseText, originalRecords) {
        try {
            // JSON 파싱을 위해 코드 블록 제거
            const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
            const similarities = JSON.parse(cleanedText);
            
            return similarities.map(item => {
                const recordIndex = item.index - 1; // 1-based to 0-based
                const originalRecord = originalRecords[recordIndex];
                
                if (!originalRecord) {
                    logger.warn(`[SimilarityService] 인덱스 ${item.index}에 해당하는 레코드를 찾을 수 없습니다.`);
                    return null;
                }
                
                return {
                    ...originalRecord,
                    similarity: Math.max(0, Math.min(100, item.similarity)), // 0-100 범위 보장
                    explanation: item.explanation || '설명 없음'
                };
            }).filter(Boolean); // null 값 제거
            
        } catch (error) {
            logger.error(`[SimilarityService] 응답 파싱 오류: ${error.message}`, { responseText });
            
            // 파싱 실패 시 기본값으로 반환
            return originalRecords.map(record => ({
                ...record,
                similarity: 0,
                explanation: '응답 파싱 실패'
            }));
        }
    }

    /**
     * 단일 텍스트 간 유사성 점수 계산 (간단한 버전)
     */
    async calculateSimilarity(text1, text2) {
        try {
            const prompt = `
다음 두 텍스트의 의미적 유사성을 0-100 점수로 평가해주세요.

텍스트 1: "${text1}"
텍스트 2: "${text2}"

다음 JSON 형식으로만 응답해주세요:
{
    "similarity": 85,
    "explanation": "유사성 판단 근거"
}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanedText);
            
            return {
                similarity: Math.max(0, Math.min(100, parsed.similarity)),
                explanation: parsed.explanation
            };
            
        } catch (error) {
            logger.error(`[SimilarityService] 단일 유사성 계산 오류: ${error.message}`);
            return { similarity: 0, explanation: '계산 오류' };
        }
    }
}

module.exports = new SimilarityService();