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
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    }

    async generateTextWithGemini(prompt) {
        try {
            logger.info(`[LLMService] Gemini 텍스트 생성 요청: ${prompt.substring(0, 100)}...`);
            
            // 일관된 결과를 위해 temperature를 0으로 설정
            const generationConfig = {
                temperature: 0,
            };

            const result = await this.model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig,
            });

            const response = await result.response;
            const text = response.text();
            
            logger.info(`[LLMService] Gemini 응답 성공 (길이: ${text.length})`);
            return text;
            
        } catch (error) {
            logger.error(`[LLMService] Gemini 요청 실패: ${error.message}`, { stack: error.stack });
            throw error;
        }
    }

    async generateWithFunctionCalling(prompt, availableFunctions = {}) {
        try {
            logger.info(`[LLMService] Function Calling 요청 시작`);
            logger.info(`[LLMService] 사용 가능한 함수: ${Object.keys(availableFunctions).join(', ')}`);
            
            // 함수 선언을 Gemini 형식으로 변환
            const functionDeclarations = Object.keys(availableFunctions).map(funcName => {
                const func = availableFunctions[funcName];
                
                // 기본 함수 스키마 정의
                let schema = {
                    name: funcName,
                    description: this.getFunctionDescription(funcName),
                    parameters: {
                        type: "object",
                        properties: this.getFunctionParameters(funcName),
                        required: this.getRequiredParameters(funcName)
                    }
                };

                return schema;
            });

            // Gemini에 function calling 요청
            const modelWithTools = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                tools: [{
                    functionDeclarations: functionDeclarations
                }]
            });

            let conversationHistory = [];
            let result = await modelWithTools.generateContent(prompt);
            let response = await result.response;
            
            let finalResult = '';
            let maxIterations = 10; // 무한 루프 방지
            let iteration = 0;

            while (iteration < maxIterations) {
                iteration++;
                logger.info(`[LLMService] Function Calling 반복 ${iteration}`);

                const functionCalls = response.functionCalls();
                
                if (!functionCalls || functionCalls.length === 0) {
                    // Function call이 없으면 최종 응답 반환
                    finalResult = response.text();
                    logger.info(`[LLMService] 최종 응답 생성 완료`);
                    break;
                }

                // Function call 실행
                const functionResponses = [];
                for (const functionCall of functionCalls) {
                    const { name, args } = functionCall;
                    logger.info(`[LLMService] 함수 실행: ${name}`, args);
                    
                    if (availableFunctions[name]) {
                        try {
                            const functionResult = await availableFunctions[name](...Object.values(args));
                            const responseData = {
                                name: name,
                                response: {
                                    result: functionResult,
                                    success: true
                                }
                            };
                            functionResponses.push(responseData);
                            logger.info(`[LLMService] 함수 ${name} 실행 성공`);
                        } catch (funcError) {
                            const errorResponse = {
                                name: name,
                                response: {
                                    error: funcError.message,
                                    success: false
                                }
                            };
                            functionResponses.push(errorResponse);
                            logger.error(`[LLMService] 함수 ${name} 실행 실패: ${funcError.message}`);
                        }
                    } else {
                        logger.error(`[LLMService] 함수 ${name}을 찾을 수 없습니다`);
                        functionResponses.push({
                            name: name,
                            response: {
                                error: `Function ${name} not found`,
                                success: false
                            }
                        });
                    }
                }

                // 다음 턴을 위해 function 결과를 포함하여 요청
                conversationHistory.push({
                    role: 'user',
                    parts: [{ text: prompt }]
                });
                
                conversationHistory.push({
                    role: 'model',
                    parts: functionCalls.map(fc => ({
                        functionCall: {
                            name: fc.name,
                            args: fc.args
                        }
                    }))
                });

                conversationHistory.push({
                    role: 'user',
                    parts: functionResponses.map(fr => ({
                        functionResponse: fr
                    }))
                });

                // 대화 히스토리와 함께 다음 응답 생성
                result = await modelWithTools.generateContent({
                    contents: conversationHistory
                });
                response = await result.response;
            }

            if (iteration >= maxIterations) {
                logger.warn(`[LLMService] 최대 반복 횟수 도달`);
                finalResult = response.text() || '분석이 완료되었지만 최대 반복 횟수에 도달했습니다.';
            }

            logger.info(`[LLMService] Function Calling 완료 (${iteration}회 반복)`);
            return finalResult;

        } catch (error) {
            logger.error(`[LLMService] Function Calling 실패: ${error.message}`, { stack: error.stack });
            throw error;
        }
    }

    // 함수별 설명 반환
    getFunctionDescription(funcName) {
        const descriptions = {
            'executeQuery': 'SQL 쿼리를 실행하고 결과를 반환합니다',
            'getTableSchema': '테이블의 스키마 정보를 조회합니다'
        };
        return descriptions[funcName] || `${funcName} 함수를 실행합니다`;
    }

    // 함수별 매개변수 스키마 반환
    getFunctionParameters(funcName) {
        const parameters = {
            'executeQuery': {
                query: {
                    type: "string",
                    description: "실행할 SQL 쿼리"
                },
                description: {
                    type: "string", 
                    description: "쿼리 설명"
                }
            },
            'getTableSchema': {
                tableName: {
                    type: "string",
                    description: "스키마를 조회할 테이블명"
                }
            }
        };
        return parameters[funcName] || {};
    }

    // 함수별 필수 매개변수 반환
    getRequiredParameters(funcName) {
        const required = {
            'executeQuery': ['query', 'description'],
            'getTableSchema': ['tableName']
        };
        return required[funcName] || [];
    }
}

module.exports = new LLMService();