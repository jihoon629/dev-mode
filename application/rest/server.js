//application/rest/server.js
const express = require('express');
const morgan = require('morgan'); // morgan 임포트
const path = require('path');
const cors = require('cors');
const logger = require('./config/logger'); // Winston 로거 임포트
const { port } = require('./config'); // port만 가져옵니다.
const passport = require('./config/passportConfig'); // Passport 설정
const sdk = require('./sdk'); // Fabric SDK 유틸리티
const mainRoutes = require('./routes'); // API 라우트
const nodeFetch = require('node-fetch');
const { AppDataSource } = require('./config/dbConfig'); // TypeORM DataSource

// fetch 및 관련 객체들을 전역으로 할당
global.fetch = nodeFetch;
global.Headers = nodeFetch.Headers; // Headers 객체 명시적 할당
global.Request = nodeFetch.Request; // 필요한 경우 Request 객체도 할당
global.Response = nodeFetch.Response; // 필요한 경우 Response 객체도 할당

const app = express(); // app 정의를 위로 올립니다. AppDataSource 초기화 후 사용됩니다.

// --- 애플리케이션 초기화 및 서버 시작 함수 ---
async function startApplication() {
  try {
    // 1. 데이터베이스 연결 확인 (TypeORM DataSource 초기화)
    // AppDataSource.initialize()는 이미 위에서 호출되었으므로, 여기서는 초기화 성공 여부만 확인하거나,
    // 필요하다면 isInitialized 프로퍼티를 사용할 수 있습니다.
    // 별도의 연결 확인 로직은 AppDataSource.initialize()가 성공하면 연결된 것으로 간주합니다.
    if (!AppDataSource.isInitialized) {
        // 이 경우는 거의 발생하지 않아야 합니다. initialize()가 실패하면 위에서 process.exit() 됩니다.
        console.error("Data Source is not initialized. Exiting.");
        process.exit(1);
    }
    console.log('TypeORM Data Source가 성공적으로 초기화되었습니다.');


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

// 데이터베이스 연결 초기화 및 애플리케이션 시작
AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized successfully.");

        // Express 앱 관련 설정 (미들웨어 등)은 DataSource 초기화 성공 후에 위치해야 합니다.
        if (process.env.NODE_ENV !== 'production') {
          app.use(morgan('dev'));
        } else {
          app.use(morgan('combined', { stream: logger.stream }));
        }
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(passport.initialize());
        app.use(cors({
          origin: 'http://localhost:3000',
          credentials: true
        }));
        app.use('/api', mainRoutes);
        app.use(express.static(path.join(__dirname, '../client')));
        app.use((req, res, next) => {
          if (req.method === 'GET' && !req.originalUrl.startsWith('/api/')) {
            const indexPath = path.join(__dirname, '../client', 'index.html');
            return res.sendFile(indexPath, (err) => {
              if (err && !res.headersSent) {
                res.status(404).send('Resource not found or error serving application.');
              }
            });
          }
          next();
        });
        app.use((err, req, res, next) => {
          logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
            stack: err.stack,
            requestBody: req.body,
            requestQuery: req.query,
          });
          res.status(err.statusCode || 500).json({
            status: 'error',
            statusCode: err.statusCode || 500,
            message: err.message || 'Internal Server Error',
          });
        });

        // 모든 설정이 완료된 후 애플리케이션 시작
        startApplication();
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
        process.exit(1);
    });