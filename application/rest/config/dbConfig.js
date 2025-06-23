// rest/db.js
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'svc.sel4.cloudtype.app',
    port: parseInt(process.env.DB_PORT || '30987', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1', 
    database: process.env.DB_NAME || 'nogada',
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT, 10) : 10,
    queueLimit: 0
};

let pool;

try {
    pool = mysql.createPool(dbConfig);
    console.log(`Successfully created MariaDB connection pool for ${dbConfig.database}@${dbConfig.host}.`);
} catch (error) {
    console.error("FATAL ERROR: Failed to create MariaDB connection pool. Application will not be able to connect to the database.", error);
   
    throw error;
}

module.exports = pool;