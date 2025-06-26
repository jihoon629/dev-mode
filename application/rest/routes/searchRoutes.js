// application/rest/routes/searchRoutes.js
const express = require('express');
const searchController = require('../controller/searchController');
const router = express.Router();

// 일반적인 유사성 검색
// GET /api/search/similarity?query=검색어&field=필드명&limit=10
router.get('/similarity', searchController.similaritySearch);

// 사용자 특화 검색
// GET /api/search/users?query=검색어&searchField=username&role=worker&limit=10&minSimilarity=30
router.get('/users', searchController.searchUsers);

// 사용자 간 유사성 비교
// POST /api/search/compare
// Body: { "userId1": 1, "userId2": 2, "field": "username" }
router.post('/compare', searchController.compareUsers);

module.exports = router;