   // application/rest/server.js
   const express = require('express');
   const path = require('path');
   const { port, dbPool } = require('./config');
   const passport = require('./config/passportConfig'); // Passport 설정 불러오기

   const cors = require('cors');
   const mainRoutes = require('./routes');

   const app = express();

   // --- 기본 미들웨어 설정 ---
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
// --- Passport 미들웨어 초기화 ---
app.use(passport.initialize());
   // --- CORS 설정 ---
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true
   }));

   // --- 데이터베이스 연결 확인 ---
   dbPool.getConnection()
     .then(connection => {
       console.log('MariaDB에 성공적으로 연결되었습니다.');
       connection.release();
     })
     .catch(err => {
       console.error('MariaDB 연결 실패:', err);
     });

   // --- API 라우트 등록 ---
   app.use('/api', mainRoutes);

   // --- React 클라이언트 정적 파일 제공 ---
   app.use(express.static(path.join(__dirname, '../client')));

   // --- SPA를 위한 Catch-all 미들웨어 (app.get('*') 대신 사용) ---
   // 모든 API 라우트와 정적 파일 제공 미들웨어 뒤에 위치해야 합니다.
   app.use((req, res, next) => {
     if (req.method === 'GET' && !req.originalUrl.startsWith('/api/')) {
       // GET 요청이고 API 요청이 아니면 index.html 제공
       const indexPath = path.join(__dirname, '../client', 'index.html');
       console.log(`Catch-all middleware invoked for: ${req.originalUrl}, sending: ${indexPath}`);
       return res.sendFile(indexPath, (err) => { // return을 추가하여 이후 next() 호출 방지
         if (err) {
           console.error('Error sending index.html via catch-all middleware:', err);
           // next(err); // 에러를 중앙 에러 핸들러로 넘길 수 있음
           // 또는 여기서 직접 404나 500 응답
           if (!res.headersSent) { // 이미 응답이 보내지지 않았을 경우에만
             res.status(404).send('Resource not found or error serving application.');
           }
         }
       });
     }
     // 그 외의 경우 (POST 요청, API GET 요청 등)는 다음 미들웨어로
     next();
   });


   // --- 중앙 에러 처리 미들웨어 ---
   app.use((err, req, res, next) => {
     console.error('--- 중앙 에러 처리 ---');
     console.error('에러 메시지:', err.message);
     const statusCode = err.statusCode || 500;
     const message = err.message || '서버 내부 오류';
     if (!res.headersSent) {
        res.status(statusCode).json({ status: 'error', statusCode, message });
     } else {
        next(err); // 이미 응답이 시작된 경우 기본 Express 에러 핸들러에 맡김
     }
   });

   // --- 서버 시작 ---
   const HOST = process.env.HOST || '0.0.0.0';
   app.listen(port, HOST, () => {
     console.log(`서버가 http://${HOST}:${port} 에서 실행 중입니다.`);
     console.log(`React 앱은 아마도 http://${HOST}:${port} 에서 제공될 것입니다.`);
     console.log(`회원가입 API: POST http://${HOST}:${port}/api/auth/register`);
     console.log(`로그인 API: POST http://${HOST}:${port}/api/auth/login`);
   });