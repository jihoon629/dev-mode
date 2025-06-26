// application/rest/controller/searchController.js
const similarityService = require('../service/similarityService');
const { AppDataSource } = require('../config/dbConfig');
const { UserEntity } = require('../repo/entity/user.entity');
const logger = require('../config/logger');

class SearchController {
    constructor() {
        this.userRepository = AppDataSource.getRepository(UserEntity);
        this.similaritySearch = this.similaritySearch.bind(this);
        this.searchUsers = this.searchUsers.bind(this);
        this.compareUsers = this.compareUsers.bind(this);
    }

    /**
     * 일반적인 유사성 검색 엔드포인트
     */
    async similaritySearch(req, res, next) {
        try {
            const { query, field = 'username', limit = 10 } = req.query;
            
            if (!query) {
                return res.status(400).json({
                    status: 'error',
                    message: '검색 쿼리가 필요합니다.'
                });
            }

            logger.info(`[SearchController] 유사성 검색 요청 - 쿼리: "${query}", 필드: ${field}`);

            // 모든 사용자 데이터 가져오기 (실제 운영환경에서는 페이징 처리 필요)
            const allUsers = await this.userRepository.find();
            
            if (allUsers.length === 0) {
                return res.json({
                    status: 'success',
                    data: [],
                    message: '검색 대상 데이터가 없습니다.'
                });
            }

            // 유사성 분석 수행
            const similarityResults = await similarityService.findMostSimilar(query, allUsers, field);
            
            // 상위 결과만 반환
            const topResults = similarityResults.slice(0, parseInt(limit));

            res.json({
                status: 'success',
                data: topResults,
                meta: {
                    searchQuery: query,
                    searchField: field,
                    totalFound: similarityResults.length,
                    returned: topResults.length
                }
            });

        } catch (error) {
            logger.error(`[SearchController] 유사성 검색 오류: ${error.message}`, { 
                query: req.query,
                stack: error.stack 
            });
            next(error);
        }
    }

    /**
     * 사용자 검색 특화 엔드포인트
     */
    async searchUsers(req, res, next) {
        try {
            const { 
                query, 
                searchField = 'username', 
                limit = 10,
                minSimilarity = 30,
                role 
            } = req.query;
            
            if (!query) {
                return res.status(400).json({
                    status: 'error',
                    message: '검색 쿼리가 필요합니다.'
                });
            }

            logger.info(`[SearchController] 사용자 검색 요청 - 쿼리: "${query}"`);

            // 필터링 조건 구성
            const whereConditions = {};
            if (role && ['worker', 'employer', 'admin'].includes(role)) {
                whereConditions.role = role;
            }

            // 조건에 맞는 사용자들 조회
            const filteredUsers = await this.userRepository.find({
                where: whereConditions
            });

            if (filteredUsers.length === 0) {
                return res.json({
                    status: 'success',
                    data: [],
                    message: '검색 조건에 맞는 사용자가 없습니다.'
                });
            }

            // 유사성 분석
            const similarityResults = await similarityService.findMostSimilar(
                query, 
                filteredUsers, 
                searchField
            );

            // 최소 유사성 점수 필터링
            const filteredResults = similarityResults.filter(
                result => result.similarity >= parseInt(minSimilarity)
            );

            // 상위 결과 반환
            const topResults = filteredResults.slice(0, parseInt(limit));

            // 민감한 정보 제거 (password 등)
            const safeResults = topResults.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                provider: user.provider,
                created_at: user.created_at,
                similarity: user.similarity,
                explanation: user.explanation
            }));

            res.json({
                status: 'success',
                data: safeResults,
                meta: {
                    searchQuery: query,
                    searchField: searchField,
                    roleFilter: role || 'all',
                    minSimilarity: parseInt(minSimilarity),
                    totalProcessed: filteredUsers.length,
                    totalMatched: filteredResults.length,
                    returned: safeResults.length
                }
            });

        } catch (error) {
            logger.error(`[SearchController] 사용자 검색 오류: ${error.message}`, { 
                query: req.query,
                stack: error.stack 
            });
            next(error);
        }
    }

    /**
     * 두 사용자 간 유사성 비교
     */
    async compareUsers(req, res, next) {
        try {
            const { userId1, userId2, field = 'username' } = req.body;

            if (!userId1 || !userId2) {
                return res.status(400).json({
                    status: 'error',
                    message: '두 사용자 ID가 모두 필요합니다.'
                });
            }

            const [user1, user2] = await Promise.all([
                this.userRepository.findOneBy({ id: userId1 }),
                this.userRepository.findOneBy({ id: userId2 })
            ]);

            if (!user1 || !user2) {
                return res.status(404).json({
                    status: 'error',
                    message: '사용자를 찾을 수 없습니다.'
                });
            }

            const text1 = user1[field] || '';
            const text2 = user2[field] || '';

            const similarity = await similarityService.calculateSimilarity(text1, text2);

            res.json({
                status: 'success',
                data: {
                    user1: {
                        id: user1.id,
                        username: user1.username,
                        [field]: text1
                    },
                    user2: {
                        id: user2.id,
                        username: user2.username,
                        [field]: text2
                    },
                    similarity: similarity.similarity,
                    explanation: similarity.explanation,
                    comparedField: field
                }
            });

        } catch (error) {
            logger.error(`[SearchController] 사용자 비교 오류: ${error.message}`, { 
                body: req.body,
                stack: error.stack 
            });
            next(error);
        }
    }
}

module.exports = new SearchController();