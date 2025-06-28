// config/mcp.mjs
import recommendationService from '../service/recommendationService.js';

export function defineMcpTools(dataSource, llmService) {
  const tools = new Map();

  // 이력서 기반 공고 추천 도구
  tools.set('recommend_job_postings_for_resume', {
    title: '이력서 기반 채용 공고 추천',
    description: '특정 이력서 ID를 기반으로 가장 적합한 채용 공고를 LLM을 사용하여 추천합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        resumeId: {
          type: 'number',
          description: '추천의 기반이 될 이력서의 ID'
        }
      },
      required: ['resumeId']
    },
    handler: async (params) => {
      try {
        console.log(`🔍 이력서 기반 공고 추천 시작: resumeId=${params.resumeId}`);

        const recommendations = await recommendationService.recommendJobsForResume(params.resumeId);

        if (recommendations.length === 0) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                message: "추천할 만한 공고를 찾지 못했습니다.",
                recommendations: []
              }, null, 2)
            }]
          };
        }

        const result = {
          message: `${recommendations.length}개의 맞춤 공고를 추천합니다.`,
          recommendations: recommendations.map(rec => ({
            jobPostingId: rec.id,
            jobType: rec.job_type,
            region: rec.region,
            dailyWage: rec.daily_wage,
            matchScore: rec.recommendation.matchScore,
            reason: rec.recommendation.reason
          }))
        };
        
        console.log('✅ 추천 완료:', result);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };

      } catch (error) {
        console.error('❌ 추천 생성 오류:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: error.message,
              stack: error.stack
            }, null, 2)
          }]
        };
      }
    }
  });

  return tools;
}

// HTTP 요청 처리를 위한 MCP 서버 초기화 (개선된 오류 처리)
export async function initializeMcpServer(mcpServer, dataSource) {
  const transport = {
    handleRequest: async function(req, res, body) {
      try {
        console.log('📥 MCP 요청:', body);
        
        const { method, params, id } = body;
        let result;
        
        switch (method) {
          case 'tools/list':
            const toolsList = [];
            mcpServer.tools.forEach((tool, name) => {
              toolsList.push({
                name: name,
                description: tool.description,
                inputSchema: tool.inputSchema
              });
            });
            result = { tools: toolsList };
            break;
            
          case 'tools/call':
            const toolName = params.name;
            const toolArgs = params.arguments || {};
            
            console.log(`🔧 도구 실행: ${toolName}`, toolArgs);
            
            if (!mcpServer.tools.has(toolName)) {
              throw new Error(`Tool '${toolName}' not found`);
            }
            
            const tool = mcpServer.tools.get(toolName);
            result = await tool.handler(toolArgs);
            break;
            
          default:
            throw new Error(`Unknown method: ${method}`);
        }
        
        console.log('📤 MCP 응답:', result);
        
        res.json({
          jsonrpc: "2.0",
          id: id,
          result: result
        });
        
      } catch (error) {
        console.error('❌ MCP 오류:', error);
        
        res.status(500).json({
          jsonrpc: "2.0",
          id: body.id || null,
          error: {
            code: -32000,
            message: error.message,
            data: {
              stack: error.stack
            }
          }
        });
      }
    },
    
    close: async function() {
      console.log('🔌 MCP Transport closed');
    }
  };
  
  console.log('✅ MCP 서버 초기화 완료');
  return { transport };
}
