// application/rest/controller/userController.js
const userService = require('../service/userService');
const logger = require('../config/logger');

class UserController {
    constructor() {
        this.getUserExperience = this.getUserExperience.bind(this);
    }

    async getUserExperience(req, res, next) {
        try {
            const userId = parseInt(req.params.id, 10);
            if (isNaN(userId)) {
                return res.status(400).json({ message: '유효한 사용자 ID가 필요합니다.' });
            }

            const experience = await userService.getUserExperience(userId);
            res.status(200).json({
                status: 'success',
                data: experience,
            });
        } catch (error) {
            logger.error(`[UserController-getUserExperience] 오류: ${error.message}`, { params: req.params, stack: error.stack });
            next(error);
        }
    }
}

module.exports = new UserController();
