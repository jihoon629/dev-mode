// application/rest/service/favoriteService.js
const FavoriteModel = require('../repo/models/favoriteModel');

class FavoriteService {
    async addFavorite(userId, jobPostingId) {
        return await FavoriteModel.add(userId, jobPostingId);
    }

    async removeFavorite(userId, jobPostingId) {
        return await FavoriteModel.remove(userId, jobPostingId);
    }

    async getFavorites(userId) {
        return await FavoriteModel.findByUserId(userId);
    }
}

module.exports = new FavoriteService();
