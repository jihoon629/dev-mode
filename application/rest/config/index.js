// application/rest/config/index.js
const jwtConfig = require('./jwtConfig');
const dbPool = require('./dbConfig'); // dbConfig.js 에서 pool 가져오기

module.exports = {
  jwt: jwtConfig,
  dbPool: dbPool, // 데이터베이스 풀을 dbPool 이라는 이름으로 export
  port: parseInt(process.env.PORT, 10) || 8001 // PORT 환경 변수가 문자열일 수 있으므로 parseInt 사용
};