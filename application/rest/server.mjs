// application/rest/server.mjs

import express from 'express';
import morgan from 'morgan';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // cookie-parser 추가
import { fileURLToPath } from 'url';
import passport from './config/passportConfig.js';
import logger from './config/logger.js';
import { port } from './config/index.js';
import sdk from './sdk.js';
import { AppDataSource } from './config/dbConfig.js';
import mainRoutes from './routes/index.js';
import fetch, { Headers, Request, Response } from 'node-fetch';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { initializeMcpServer, defineMcpTools } from './config/mcp.mjs';
import userEntityPkg from './repo/entity/user.entity.js';
import llmService from './service/llmService.js'; // llmService 임포트
const { UserEntity } = userEntityPkg;

// 글로벌 fetch 설정 (LLM용)
global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// ESM 환경용 __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
let mcpTransport; // MCP transport 전역 변수
let mcpServer; // MCP 서버 전역 변수

// 미들웨어 설정 함수
function setupMiddlewares() {
  // 기본 미들웨어
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser()); // cookie-parser 미들웨어 사용
  app.use(passport.initialize());

  const whitelist = ['http://localhost:3000', 'http://172.30.112.48:3000'];
  const corsOptions = {
    origin: function (origin, callback) {
      logger.info(`[CORS] Request from origin: ${origin}`);
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        logger.error(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
  app.use(cors(corsOptions));

  // 요청 로깅 미들웨어 추가
  app.use((req, res, next) => {
    logger.info(`[Request Logger] Path: ${req.path}, Method: ${req.method}`);
    logger.debug('[Request Logger] Headers:', req.headers);
    logger.debug('[Request Logger] Cookies:', req.cookies); // req.cookies를 로그로 남김
    next();
  });

  // 로깅 미들웨어
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: logger.stream }));
  }
}

// MCP 라우터 설정
function setupMcpRoutes() {
  // MCP 요청 처리 라우터
  app.post('/mcp', async (req, res) => {
    logger.info(`[MCP Route] Request received: mcpServer=${!!mcpServer}, mcpTransport=${!!mcpTransport}`);
    try {
      console.log('MCP 요청 상세 로그:', {
        headers: req.headers,
        body: JSON.stringify(req.body),
        method: req.body.method,
        params: req.body.params
      });
      
      if (!mcpTransport || !mcpServer) {
        console.error('MCP 서버나 transport가 초기화되지 않음');
        return res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "서버가 아직 초기화되지 않았습니다"
          },
          id: req.body.id || null
        });
      }
      
      console.log('transport 존재, 요청 처리 시작');
      // mcpTransport의 handleRequest를 mcpTransport 컨텍스트로 호출
      await mcpTransport.handleRequest.call(mcpTransport, req, res._res || res, req.body);
      console.log('요청 처리 완료');
    } catch (error) {
      console.error('MCP 요청 처리 중 상세 오류:', error);
      handleError(error, req, res);
    }
  });
}



// 정적 파일 및 SPA 라우팅 설정
function setupStaticRoutes() {
  // 정적 파일 제공
  app.use(express.static(path.join(__dirname, '../client')));

  // SPA 라우팅 처리
  app.use((req, res, next) => {
    if (req.method === 'GET' && 
        !req.originalUrl.startsWith('/api/') && 
        !req.originalUrl.startsWith('/mcp')) {
      const indexPath = path.join(__dirname, '../client', 'index.html');
      return res.sendFile(indexPath, err => {
        if (err && !res.headersSent) {
          logger.error('SPA 라우팅 처리 중 오류:', err);
          res.status(404).send('Not found');
        }
      });
    }
    next();
  });
}

// 에러 핸들링 공통 함수
function handleError(error, req, res) {
  logger.error(`에러 발생: ${error.message}`, {
    stack: error.stack,
    requestBody: req.body,
    requestQuery: req.query,
  });
  
  if (!res.headersSent) {
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Internal Server Error',
    });
  }
}

// 에러 핸들링 미들웨어 설정
function setupErrorHandling() {
  app.use((err, req, res, next) => {
    handleError(err, req, res);
  });
}

// Fabric 관리자 등록
async function setupFabric() {
  try {
    logger.info("Fabric 관리자 등록 시작...");
    await sdk.enrollAdmin('admin', 'adminpw');
    logger.info("✅ Fabric 관리자 등록 완료");
  } catch (error) {
    logger.warn("⚠️ Fabric 관리자 등록 실패 (서버는 계속 실행):", error);
  }
}

// 애플리케이션 시작 함수
async function startApplication() {
  try {
    // 1. DB 연결
    await AppDataSource.initialize();
    logger.info("✅ TypeORM 데이터베이스 연결 성공");

    // 2. MCP 서버 초기화
    await new Promise(resolve => setTimeout(resolve, 1000));

    // MCP 서버 인스턴스 생성 (간단한 객체로 대체)
    mcpServer = {
      name: "MariaDB MCP Server",
      version: "1.0.0",
      tools: new Map()
    };
    
    // MCP 도구 등록
    const mcpTools = defineMcpTools(AppDataSource, llmService); // llmService 전달
    for (const [name, tool] of mcpTools.entries()) {
      mcpServer.tools.set(name, tool);
    }
    logger.info(`[Server] Registered MCP tools: ${Array.from(mcpTools.keys()).join(', ')}`);
    
    // MCP 서버와 트랜스포트 연결 (connect 호출 제거)
    const mcpResult = await initializeMcpServer(mcpServer, AppDataSource);
    mcpTransport = mcpResult.transport;
    logger.info(`[Server] MCP Server initialized: mcpServer=${!!mcpServer}, mcpTransport=${!!mcpTransport}`);
    
    // 3. 미들웨어 및 라우터 설정
    setupMiddlewares();
    setupMcpRoutes();
    
    
    // 4. API 라우터 설정
    app.use('/api', mainRoutes);
    
    // 5. 정적 파일 라우팅 설정
    setupStaticRoutes();
    
    // 6. 에러 핸들링 설정
    setupErrorHandling();
    
    // 7. Fabric 관리자 등록
    await setupFabric();

    // 8. 서버 시작
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(port, HOST, () => {
      logger.info(`🚀 서버가 http://${HOST}:${port} 에서 실행 중입니다`);
      logger.info(`[Server] App listening: mcpServer=${!!mcpServer}, mcpTransport=${!!mcpTransport}`);
    });

  } catch (err) {
    logger.error("❌ 서버 실행 중 오류 발생:", err);
    await cleanup();
    process.exit(1);
  }
}

// 정리 작업 함수
async function cleanup() {
  logger.info('서버 종료 중...');
  
  if (mcpTransport) {
    try {
      await mcpTransport.close();
      logger.info('✅ MCP Transport 종료 완료');
    } catch (error) {
      logger.error('❌ MCP Transport 종료 중 오류:', error);
    }
  }
  
  if (AppDataSource.isInitialized) {
    try {
      await AppDataSource.destroy();
      logger.info('✅ DB 연결 종료 완료');
    } catch (error) {
      logger.error('❌ DB 연결 종료 중 오류:', error);
    }
  }
}

// 프로세스 종료 이벤트 처리
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

// 앱 시작
startApplication();