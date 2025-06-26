    // application/rest/config/dbConfig.js (TypeORM DataSource 설정 예시)
    require('reflect-metadata');
    const { DataSource } = require("typeorm");
    const { UserEntity } = require('../repo/entity/user.entity'); // UserEntity 경로 확인 필요

    const AppDataSource = new DataSource({
        type: "mariadb", 
        host: process.env.DB_HOST || 'svc.sel4.cloudtype.app',
        port: parseInt(process.env.DB_PORT || '30987', 10),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1',
        database: process.env.DB_NAME || 'nogada',
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
        entities: [ UserEntity ], // UserEntity 등록
        extra: {
            waitForConnections: true,
            connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT, 10) : 10,
            queueLimit: 0
        }
    });

    // AppDataSource를 export 해야 다른 파일에서 사용할 수 있습니다.
    // module.exports = AppDataSource; // 또는 module.exports = { AppDataSource };
    module.exports = { AppDataSource }; // server.js에서 { AppDataSource }로 받고 있으므로 이렇게 export