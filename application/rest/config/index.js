        // application/rest/config/index.js
        const jwtConfig = require('./jwtConfig');
        const { AppDataSource } = require('./dbConfig'); // AppDataSource 직접 가져오기

        module.exports = {
          jwt: jwtConfig,
          AppDataSource, // AppDataSource 직접 export
          port: parseInt(process.env.PORT, 10) || 8001
        };