// config/mcp.mjs

export function defineMcpTools(dataSource, llmService) {
  const tools = new Map();

  // 문자열 유사도 계산 함수 (Levenshtein 거리 기반)
  const calculateStringSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    
    const a = str1.toLowerCase();
    const b = str2.toLowerCase();

    // 레벤슈타인 거리 계산 함수
    function levenshteinDistance(a, b) {
      const matrix = [];

      // 초기화
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      // 채우기
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // 대체
              matrix[i][j - 1] + 1,   // 삽입
              matrix[i - 1][j] + 1    // 삭제
            );
          }
        }
      }

      return matrix[b.length][a.length];
    }

    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1.0;

    // 유사도 점수 계산 (0-1 사이)
    return 1 - levenshteinDistance(a, b) / maxLength;
  };

  // 이메일 유사도 계산 함수
  const compareEmails = (email1, email2) => {
    if (!email1 || !email2) return 0;
    
    // 정확히 동일한 경우
    if (email1 === email2) return 1.0;
    
    // 이메일 분해 (로컬파트@도메인)
    const parts1 = email1.split('@');
    const parts2 = email2.split('@');
    
    if (parts1.length !== 2 || parts2.length !== 2) return 0;
    
    const [local1, domain1] = parts1;
    const [local2, domain2] = parts2;
    
    // 도메인이 다르면 유사도 낮춤
    if (domain1 !== domain2) return calculateStringSimilarity(email1, email2) * 0.3;
    
    // 로컬파트 유사도 계산
    return calculateStringSimilarity(local1, local2);
  };

  // 중복 사용자 분석 도구
  tools.set('analyze_duplicate_users_v2', {
    title: '중복 사용자 분석 (개선된 버전)',
    description: '데이터베이스에서 중복 계정을 체계적으로 분석합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['basic', 'advanced', 'custom'],
          description: '분석 유형'
        },
        name_match_threshold: {
          type: 'number',
          description: '이름 유사도 임계값 (0.0-1.0)',
          default: 0.8
        },
        email_match_threshold: {
          type: 'number',
          description: '이메일 유사도 임계값 (0.0-1.0)',
          default: 0.7
        }
      },
      required: ['analysis_type']
    },
    handler: async (params) => {
      try {
        console.log('🔍 중복 사용자 분석 시작:', params);

        // 1. 먼저 users 테이블 스키마 확인
        let schemaResult;
        try {
          schemaResult = await dataSource.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
          `);
          console.log('📋 Users 테이블 스키마:', schemaResult);
        } catch (schemaError) {
          console.log('⚠️ 스키마 조회 실패, 기본 컬럼명으로 진행');
        }

        // 2. 모든 사용자 데이터 조회
        const allUsers = await dataSource.query(`
          SELECT id, username, email, created_at 
          FROM users 
          ORDER BY id
        `);

        console.log(`📊 총 ${allUsers.length} 명의 사용자 조회됨`);

        if (allUsers.length === 0) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                message: "사용자가 없습니다.",
                duplicate_groups: []
              }, null, 2)
            }]
          };
        }

        // 3. 중복 그룹 분석
        const duplicateGroups = [];
        const processedUsers = new Set();

        // 정확한 이메일 중복 검사
        const emailGroups = {};
        allUsers.forEach(user => {
          if (user.email && user.email.trim()) {
            const email = user.email.toLowerCase().trim();
            if (!emailGroups[email]) {
              emailGroups[email] = [];
            }
            emailGroups[email].push(user);
          }
        });

        // 정확한 이메일 중복 추가
        Object.entries(emailGroups).forEach(([email, users]) => {
          if (users.length > 1) {
            duplicateGroups.push({
              type: "이메일 정확 중복",
              confidence: 1.0,
              accounts: users,
              reasoning: `동일한 이메일 주소: ${email}`
            });
            users.forEach(user => processedUsers.add(user.id));
          }
        });

        // 정확한 사용자명 중복 검사
        const usernameGroups = {};
        allUsers.forEach(user => {
          if (user.username && user.username.trim() && !processedUsers.has(user.id)) {
            const username = user.username.toLowerCase().trim();
            if (!usernameGroups[username]) {
              usernameGroups[username] = [];
            }
            usernameGroups[username].push(user);
          }
        });

        // 정확한 사용자명 중복 추가
        Object.entries(usernameGroups).forEach(([username, users]) => {
          if (users.length > 1) {
            duplicateGroups.push({
              type: "사용자명 정확 중복",
              confidence: 1.0,
              accounts: users,
              reasoning: `동일한 사용자명: ${username}`
            });
            users.forEach(user => processedUsers.add(user.id));
          }
        });

        // 고급 분석 (유사도 기반)
        if (params.analysis_type === 'advanced') {
          const unprocessedUsers = allUsers.filter(user => !processedUsers.has(user.id));
          
          // 이메일 유사도 검사
          for (let i = 0; i < unprocessedUsers.length; i++) {
            for (let j = i + 1; j < unprocessedUsers.length; j++) {
              const user1 = unprocessedUsers[i];
              const user2 = unprocessedUsers[j];
              
              if (user1.email && user2.email) {
                const emailSimilarity = compareEmails(user1.email, user2.email);
                
                if (emailSimilarity >= (params.email_match_threshold || 0.7)) {
                  duplicateGroups.push({
                    type: "이메일 유사",
                    confidence: emailSimilarity,
                    accounts: [user1, user2],
                    reasoning: `이메일 유사도: ${(emailSimilarity * 100).toFixed(1)}% (${user1.email} ↔ ${user2.email})`
                  });
                }
              }
              
              // 사용자명 유사도 검사 (한글-영문 번역관계 제외)
              if (user1.username && user2.username) {
                const hasKorean1 = /[가-힣]/.test(user1.username);
                const hasKorean2 = /[가-힣]/.test(user2.username);
                
                // 한글과 영문이 섞인 경우는 제외
                if (hasKorean1 !== hasKorean2) {
                  continue;
                }
                
                const nameSimilarity = calculateStringSimilarity(user1.username, user2.username);
                
                if (nameSimilarity >= (params.name_match_threshold || 0.8)) {
                  duplicateGroups.push({
                    type: "사용자명 유사",
                    confidence: nameSimilarity,
                    accounts: [user1, user2],
                    reasoning: `사용자명 유사도: ${(nameSimilarity * 100).toFixed(1)}% (${user1.username} ↔ ${user2.username})`
                  });
                }
              }
            }
          }
        }

        // 의심스러운 패턴 검사 (k@k, k@kk 등)
        const suspiciousPatterns = allUsers.filter(user => {
          if (!user.email) return false;
          const parts = user.email.split('@');
          if (parts.length !== 2) return false;
          
          const [local, domain] = parts;
          
          // 매우 짧고 반복적인 패턴
          return (local.length <= 2 && domain.length <= 3) || 
                 (local === domain) ||
                 /^(.)\1*$/.test(local); // 같은 문자 반복
        });

        if (suspiciousPatterns.length > 1) {
          duplicateGroups.push({
            type: "의심스러운 이메일 패턴",
            confidence: 0.8,
            accounts: suspiciousPatterns,
            reasoning: "매우 짧거나 반복적인 이메일 패턴"
          });
        }

        // 결과 정렬 (확신도 높은 순)
        duplicateGroups.sort((a, b) => b.confidence - a.confidence);

        const result = {
          analysis_summary: {
            total_users: allUsers.length,
            duplicate_groups_found: duplicateGroups.length,
            analysis_type: params.analysis_type,
            thresholds: {
              name_match: params.name_match_threshold || 0.8,
              email_match: params.email_match_threshold || 0.7
            }
          },
          duplicate_groups: duplicateGroups
        };

        console.log('✅ 분석 완료:', result);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };

      } catch (error) {
        console.error('❌ 분석 오류:', error);
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

  // 간단한 사용자 목록 조회 도구 추가
  tools.set('list_users', {
    title: '사용자 목록 조회',
    description: '데이터베이스의 모든 사용자를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '조회할 사용자 수 제한',
          default: 10
        }
      }
    },
    handler: async (params) => {
      try {
        const limit = params.limit || 10;
        const users = await dataSource.query(`
          SELECT id, username, email, created_at 
          FROM users 
          ORDER BY id 
          LIMIT ${limit}
        `);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total_shown: users.length,
              users: users
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: error.message
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