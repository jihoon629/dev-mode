    // application/rest/routes/index.js
    const express = require('express');
    const authRoutes = require('./authRoutes');

    const router = express.Router();

    // '/auth' 경로로 들어오는 요청은 authRoutes에서 처리
    router.use('/auth', authRoutes);


    module.exports = router;