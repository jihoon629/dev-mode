    // application/rest/config/logger.js
    const winston = require('winston');
    const path = require('path');

    // 로그 레벨 정의 (npm 레벨과 유사: error, warn, info, http, verbose, debug, silly)
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3, // morgan과 연동하거나 HTTP 요청 관련 로그에 사용 가능
      debug: 4,
    };

    // 로그 레벨은 환경 변수로 설정하는 것이 좋음 (기본값: 'info')
    const level = () => {
      const env = process.env.NODE_ENV || 'development';
      const isDevelopment = env === 'development';
      return isDevelopment ? 'debug' : 'warn'; // 개발 시 debug, 프로덕션 시 warn 레벨 이상만
    };

    // 로그 포맷 정의
    const { combine, timestamp, printf, colorize, errors } = winston.format;

    const logFormat = combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }), // 오류 발생 시 스택 트레이스 포함
      printf(info => {
        let log = `${info.timestamp} ${info.level}: `;
        // 객체나 배열인 경우 JSON 문자열로 변환
        if (typeof info.message === 'object' || Array.isArray(info.message)) {
          log += JSON.stringify(info.message, null, 2);
        } else {
          log += info.message;
        }
        // 스택 트레이스가 있다면 추가
        if (info.stack) {
          log += `\nStack: ${info.stack}`;
        }
        return log;
      })
    );
    
    // 개발 환경에서는 콘솔에 색상있는 로그 출력
    const consoleTransport = new winston.transports.Console({
        format: combine(
            colorize(), // 로그 레벨에 따라 색상 적용
            logFormat
        ),
        handleExceptions: true, // 처리되지 않은 예외 로깅
    });

    // 프로덕션 환경(또는 모든 환경)에서 파일로 로그 저장 (선택적)
    const fileTransports = [
        // 에러 레벨 로그 파일
        new winston.transports.File({
            level: 'error',
            filename: path.join(__dirname, '..', '..', 'logs', 'error.log'), // logs/error.log
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            handleExceptions: true,
        }),
        // 모든 레벨 로그 파일 (info 레벨 이상)
        new winston.transports.File({
            level: 'info', // 또는 level() 함수 결과 사용
            filename: path.join(__dirname, '..', '..', 'logs', 'all.log'), // logs/all.log
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ];

    const logger = winston.createLogger({
      level: level(), // 여기서 설정된 레벨 이하의 로그는 무시됨
      levels,
      transports: [
        consoleTransport,
        // 필요에 따라 파일 전송 추가 (프로덕션에서는 파일 로깅이 유용)
        ...(process.env.NODE_ENV === 'production' ? fileTransports : []),
        // 또는 항상 파일 로깅을 원한다면 조건 없이 fileTransports 추가
        // ...fileTransports
      ],
      exitOnError: false, // 로깅 오류 발생 시 애플리케이션 종료 안 함
    });

    // Morgan HTTP 로그를 Winston으로 스트리밍 (선택적)
    // morgan 로그도 파일로 남기고 싶을 때 유용
    logger.stream = {
        write: function(message, encoding) {
            logger.http(message.trim()); // morgan 로그를 http 레벨로 기록
        },
    };

    module.exports = logger;