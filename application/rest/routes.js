// rest/routes.js
const express = require('express');
const willController = require('./controller');
const router = express.Router();

router.post('/register', willController.registerWill);
router.get('/mywills', willController.getMyWills);
router.get('/details/:willId', willController.getWillDetails);

module.exports = router;