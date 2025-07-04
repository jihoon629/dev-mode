// application/rest/controller/favoriteController.js
const favoriteService = require('../service/favoriteService');
const logger = require('../config/logger');

class FavoriteController {
    constructor() {
        this.addFavorite = this.addFavorite.bind(this);
        this.removeFavorite = this.removeFavorite.bind(this);
        this.getFavorites = this.getFavorites.bind(this);
    }

    async addFavorite(req, res, next) {
        try {
            const userId = req.user.id;
            const jobPostingId = parseInt(req.params.jobPostingId, 10);
            await favoriteService.addFavorite(userId, jobPostingId);
            res.status(201).json({ status: 'success', message: '즐겨찾기에 추가되었습니다.' });
        } catch (error) {
            logger.error(`[FavoriteController-addFavorite] 오류: ${error.message}`, { stack: error.stack });
            next(error);
        }
    }

    async removeFavorite(req, res, next) {
        try {
            const userId = req.user.id;
            const jobPostingId = parseInt(req.params.jobPostingId, 10);
            await favoriteService.removeFavorite(userId, jobPostingId);
            res.status(200).json({ status: 'success', message: '즐겨찾기에서 삭제되었습니다.' });
        } catch (error) {
            logger.error(`[FavoriteController-removeFavorite] 오류: ${error.message}`, { stack: error.stack });
            next(error);
        }
    }

    async getFavorites(req, res, next) {
        try {
            const userId = req.user.id;
            const favorites = await favoriteService.getFavorites(userId);
            res.status(200).json({ status: 'success', data: favorites });
        } catch (error) {
            logger.error(`[FavoriteController-getFavorites] 오류: ${error.message}`, { stack: error.stack });
            next(error);
        }
    }
}

module.exports = new FavoriteController();
