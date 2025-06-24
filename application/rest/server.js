// application/rest/server.js
const express = require('express');
const morgan = require('morgan'); // morgan 임포트
const path = require('path');
const cors = require('cors');
const logger = require('./config/logger'); // Winston 로거 임포트
const { port, dbPool } = require('./config'); // 기본 설정 (포트, DB 풀)
const passport = require('./config/passportConfig'); // Passport 설정
const sdk = require('./sdk'); // Fabric SDK 유틸리티
const mainRoutes = require('./routes'); // API 라우트

const app = express();
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // 개발 환경에서는 'dev' 포맷 사용
} else {
  app.use(morgan('combined', { stream: logger.stream }));
  // 또는 파일로 로그를 남기려면 추가 설정이 필요 (winston과 연동 가능)
}
// --- 1. 기본 미들웨어 설정 ---
app.use(express.json()); // JSON 요청 본문 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 요청 본문 파싱

// --- 2. Passport 미들웨어 초기화 ---
app.use(passport.initialize()); // Passport 초기화

// --- 3. CORS 설정 ---
// 프론트엔드 개발 서버 주소에 맞게 origin 설정
app.use(cors({
  origin: 'http://localhost:3000', // React 개발 서버 주소 (또는 실제 서비스 주소)
  credentials: true // 자격 증명(쿠키 등) 허용
}));

// --- 4. API 라우트 등록 ---
// 모든 API 경로는 '/api' 접두사로 시작
app.use('/api', mainRoutes);

// --- 5. React 클라이언트 정적 파일 제공 ---
// API 라우트 뒤, SPA catch-all 미들웨어 앞에 위치
app.use(express.static(path.join(__dirname, '../client')));

// --- 6. SPA (Single Page Application)를 위한 Catch-all 미들웨어 ---
// GET 요청이고 API 요청이 아니며, 정적 파일로 처리되지 않은 경우 index.html을 제공
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.originalUrl.startsWith('/api/')) {
    const indexPath = path.join(__dirname, '../client', 'index.html');
    // console.log(`Catch-all for ${req.originalUrl}, sending: ${indexPath}`);
    return res.sendFile(indexPath, (err) => {
      if (err) {
        // console.error('Error sending index.html via catch-all:', err);
        // 에러 발생 시, 이미 응답이 시작되지 않았다면 404 처리
        if (!res.headersSent) {
          res.status(404).send('Resource not found or error serving application.');
        }
      }
    });
  }
  next(); // 그 외의 경우 다음 미들웨어로
});


// --- 7. 중앙 에러 처리 미들웨어 ---
// 모든 라우트 및 미들웨어 가장 마지막에 위치
app.use((err, req, res, next) => {
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack,
    requestBody: req.body, // 민감 정보는 제외하거나 마스킹 필요
    requestQuery: req.query,
  });

  res.status(err.statusCode || 500).json({
    status: 'error',
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // 개발 시에만 스택 정보 노출
  });
});

// --- 애플리케이션 초기화 및 서버 시작 함수 ---
async function startApplication() {
  try {
    // 1. 데이터베이스 연결 확인
    const connection = await dbPool.getConnection();
    console.log('MariaDB에 성공적으로 연결되었습니다.');
    connection.release();

    // 2. Fabric 관리자 인롤 (지갑에 관리자 ID 준비)
    //    관리자 ID와 비밀번호는 환경변수나 보안된 설정에서 가져오는 것이 이상적입니다.
    console.log("Fabric 관리자 인롤을 시도합니다...");
    await sdk.enrollAdmin('admin', 'adminpw'); // 실제 관리자 ID와 비밀번호로 변경
    console.log("Fabric 관리자 인롤 확인 완료 (이미 존재하거나 성공적으로 인롤됨).");

    // 3. 서버 리스닝 시작
    const HOST = process.env.HOST || '0.0.0.0'; // 모든 네트워크 인터페이스에서 수신
    app.listen(port, HOST, () => {
      console.log(`서버가 http://${HOST}:${port} 에서 실행 중입니다.`);
      console.log('애플리케이션 초기화 성공.');
    });

  } catch (error) {
    console.error('애플리케이션 초기화 또는 서버 시작 중 심각한 오류 발생:', error);
    process.exit(1); // 초기화 실패 시 프로세스 종료
  }
}

// 애플리케이션 시작
startApplication();