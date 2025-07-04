// application/rest/routes/favoriteRoutes.js
const express = require('express');
const passport = require('passport');
const favoriteController = require('../controller/favoriteController');

const router = express.Router();

router.use(passport.authenticate('jwt', { session: false }));

router.post('/:jobPostingId', favoriteController.addFavorite);
router.delete('/:jobPostingId', favoriteController.removeFavorite);
router.get('/', favoriteController.getFavorites);

module.exports = router;
