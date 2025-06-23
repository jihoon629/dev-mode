    // application/rest/routes/index.js
    const express = require('express');
    const authRoutes = require('./authRoutes');
    // const otherRoutes = require('./otherRoutes'); // 다른 라우트가 있다면

    const router = express.Router();

    // '/auth' 경로로 들어오는 요청은 authRoutes에서 처리
    router.use('/auth', authRoutes);

    // 예: router.use('/products', productRoutes);

    module.exports = router;