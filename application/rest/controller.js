// rest/controller.js
const willService = require('./service'); // 서비스 계층 모듈 임포트

// 유언장 등록 처리
async function registerWill(req, res, next) {
    const { title, originalContent, beneficiaries, testatorId } = req.body;

    // 기본적인 입력 값 검증 (더 상세한 검증은 service 계층에서도 가능)
    if (!title || !originalContent || !testatorId) {
        // 400 Bad Request 에러 객체 생성
        const error = new Error('Missing required fields: title, originalContent, and testatorId are required.');
        error.status = 400;
        return next(error); // 중앙 에러 핸들러로 전달
    }

    try {
        const result = await willService.registerWillService(title, originalContent, beneficiaries, testatorId);
        res.status(201).json({
            message: 'Will registered successfully.',
            blockchainWillId: result.blockchainWillId,
            dbRecordId: result.dbRecordId
        });
    } catch (error) {
        // service 계층에서 발생한 에러를 중앙 에러 핸들러로 전달
        // 에러 객체에 status 코드가 포함되어 있을 것으로 기대 (service에서 설정)
        console.error(`Controller Error in registerWill: ${error.message}`);
        next(error);
    }
}

// (로그인된 사용자의) 내 유언장 목록 조회 처리
async function getMyWills(req, res, next) {
    try {
        // 현재는 로그인 사용자 ID를 어떻게 가져올지 명시되지 않았으므로,
        // service.getMyWillsService가 이를 내부적으로 처리하거나,
        // 향후 인증 미들웨어 등을 통해 req.user.id 와 같이 전달받을 수 있습니다.
        // 여기서는 파라미터 없이 호출하는 것으로 가정합니다.
        console.log("Controller: Received request for getMyWills.");
        const myWills = await willService.getMyWillsService();
        res.status(200).json(myWills);
    } catch (error) {
        console.error(`Controller Error in getMyWills: ${error.message}`);
        next(error);
    }
}

// 특정 유언장 상세 정보 조회 처리
async function getWillDetails(req, res, next) {
    const { willId } = req.params; // URL 경로에서 willId (블록체인 ID) 추출

    if (!willId) {
        const error = new Error('Will ID (from blockchain) is required in the URL path.');
        error.status = 400;
        return next(error);
    }

    try {
        const willDetails = await willService.getWillDetailsService(willId);
        if (!willDetails) { // 서비스에서 null이나 undefined를 반환한 경우 (예: 404 처리 후)
            const error = new Error(`Will with ID ${willId} not found.`);
            error.status = 404;
            return next(error);
        }
        res.status(200).json(willDetails);
    } catch (error) {
        // service에서 404 에러를 throw한 경우 여기서 잡히고, status가 유지됨
        console.error(`Controller Error in getWillDetails for ID ${willId}: ${error.message}`);
        next(error);
    }
}

module.exports = {
    registerWill,
    getMyWills,
    getWillDetails
};