// application/rest/repo/models/favoriteModel.js
const { AppDataSource } = require('../../config/dbConfig');
const { FavoriteEntity } = require('../entity/favorite.entity');
const logger = require('../../config/logger');

const favoriteRepository = AppDataSource.getRepository(FavoriteEntity);

const FavoriteModel = {
    async add(userId, jobPostingId) {
        try {
            const newFavorite = favoriteRepository.create({
                user_id: userId,
                job_posting_id: jobPostingId,
            });
            await favoriteRepository.save(newFavorite);
            return newFavorite;
        } catch (error) {
            logger.error(`[FavoriteModel-add] 오류: ${error.message}`, { userId, jobPostingId, stack: error.stack });
            throw error;
        }
    },

    async remove(userId, jobPostingId) {
        try {
            const result = await favoriteRepository.delete({ user_id: userId, job_posting_id: jobPostingId });
            return result.affected > 0;
        } catch (error) {
            logger.error(`[FavoriteModel-remove] 오류: ${error.message}`, { userId, jobPostingId, stack: error.stack });
            throw error;
        }
    },

    async findByUserId(userId) {
        try {
            return await favoriteRepository.find({
                where: { user_id: userId },
                relations: ['jobPosting', 'jobPosting.user'],
            });
        } catch (error) {
            logger.error(`[FavoriteModel-findByUserId] 오류: ${error.message}`, { userId, stack: error.stack });
            throw error;
        }
    },

    async isFavorited(userId, jobPostingId) {
        try {
            const count = await favoriteRepository.count({ where: { user_id: userId, job_posting_id: jobPostingId } });
            return count > 0;
        } catch (error) {
            logger.error(`[FavoriteModel-isFavorited] 오류: ${error.message}`, { userId, jobPostingId, stack: error.stack });
            throw error;
        }
    },
};

module.exports = FavoriteModel;
