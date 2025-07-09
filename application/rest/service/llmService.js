// application/rest/service/llmService.js
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../config/logger');
class LLMService {
    constructor() {

const apiKey =process.env.API;

        if (!apiKey) {
            logger.error('[LLMService] ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.');
            throw new Error('ANTHROPIC_API_KEY is required');
        }
        
        this.anthropic = new Anthropic({ apiKey });
        this.model = 'claude-3-5-haiku-20241022'; // 올바른 모델명
    }

    async generateTextWithClaude(prompt) {
        try {
            logger.info(`[LLMService] Claude 텍스트 생성 요청: ${prompt.substring(0, 100)}...`);
            
            const msg = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0, // 일관된 결과를 위해 temperature를 0으로 설정
            });

            const text = msg.content[0].text;
            logger.info(`[LLMService] Claude 응답 성공 (길이: ${text.length})`);
            return text;
            
        } catch (error) {
            logger.error(`[LLMService] Claude 요청 실패: ${error.message}`, { stack: error.stack });
            throw error;
        }
    }

    async generateWithFunctionCalling(prompt, availableFunctions = {}) {
        try {
            logger.info(`[LLMService] Function Calling 요청 시작`);
            logger.info(`[LLMService] 사용 가능한 함수: ${Object.keys(availableFunctions).join(', ')}`);

            const tools = Object.keys(availableFunctions).map(funcName => {
                return {
                    name: funcName,
                    description: this.getFunctionDescription(funcName),
                    input_schema: {
                        type: "object",
                        properties: this.getFunctionParameters(funcName),
                        required: this.getRequiredParameters(funcName)
                    }
                };
            });

            let messages = [{ role: 'user', content: prompt }];
            
            let finalResult = '';
            let maxIterations = 10; // 무한 루프 방지
            let iteration = 0;

            while (iteration < maxIterations) {
                iteration++;
                logger.info(`[LLMService] Function Calling 반복 ${iteration}`);

                const response = await this.anthropic.messages.create({
                    model: this.model,
                    max_tokens: 1024,
                    messages: messages,
                    tools: tools,
                });

                // assistant 메시지 추가 (response 자체가 아닌 적절한 형태로)
                messages.push({
                    role: 'assistant',
                    content: response.content
                });

                const toolUses = response.content.filter(c => c.type === 'tool_use');

                if (toolUses.length === 0) {
                    finalResult = response.content.find(c => c.type === 'text')?.text || '';
                    logger.info(`[LLMService] 최종 응답 생성 완료`);
                    break;
                }

                const toolResults = [];
                for (const toolUse of toolUses) {
                    const { name, id, input } = toolUse;
                    logger.info(`[LLMService] 함수 실행: ${name}`, input);

                    if (availableFunctions[name]) {
                        try {
                            const functionResult = await availableFunctions[name](...Object.values(input));
                            toolResults.push({
                                tool_use_id: id,
                                content: JSON.stringify(functionResult), // 배열 형태가 아닌 문자열로
                                is_error: false
                            });
                            logger.info(`[LLMService] 함수 ${name} 실행 성공`);
                        } catch (funcError) {
                            toolResults.push({
                                tool_use_id: id,
                                content: funcError.message,
                                is_error: true
                            });
                            logger.error(`[LLMService] 함수 ${name} 실행 실패: ${funcError.message}`);
                        }
                    } else {
                        logger.error(`[LLMService] 함수 ${name}을 찾을 수 없습니다`);
                        toolResults.push({
                            tool_use_id: id,
                            content: `Function ${name} not found`,
                            is_error: true
                        });
                    }
                }
                
                // 모든 tool results를 한번에 처리
                const toolResultContent = toolResults.map(result => ({
                    type: 'tool_result',
                    tool_use_id: result.tool_use_id,
                    content: result.content,
                    is_error: result.is_error
                }));

                messages.push({
                    role: 'user',
                    content: toolResultContent
                });
            }

            if (iteration >= maxIterations) {
                logger.warn(`[LLMService] 최대 반복 횟수 도달`);
                finalResult = '분석이 완료되었지만 최대 반복 횟수에 도달했습니다.';
            }
            
            // Get the final text response from the last assistant message if it exists
            if (!finalResult) {
                for (let i = messages.length - 1; i >= 0; i--) {
                    const message = messages[i];
                    if (message.role === 'assistant') {
                        const textContent = message.content.find(c => c.type === 'text');
                        if (textContent) {
                            finalResult = textContent.text;
                            break;
                        }
                    }
                }
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