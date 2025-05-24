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
        // 클라이언트가 GET 요청 시 쿼리 파라미터로 username을 전달한다고 가정
        // 예: /api/wills/my-wills?username=testUser
        const username = req.query.username; 
console.log(username);
        if (!username) {
            // username이 제공되지 않은 경우 에러 응답
            return res.status(400).json({ message: "Username is required as a query parameter." });
        }

        console.log(`Controller: Received request for getMyWills for username: ${username}`);
        // 수정: service 함수 호출 시 username 전달
        const myWills = await willService.getMyWillsService(username); 
        
        res.status(200).json(myWills);
    } catch (error) {
        console.error(`Controller Error in getMyWills for username ${req.query.username || '(not provided)'}: ${error.message}`);
        next(error); // 에러 핸들링 미들웨어로 전달
    }
}

// 특정 유언장 상세 정보 조회 처리
async function getWillDetails(req, res, next) {
    const { willId } = req.params; // URL 경로에서 willId (블록체인 ID) 추출
    const { username } = req.query; // 수정: URL 쿼리 파라미터에서 username 추출 (예: /details/some-will-id?username=user1)

    if (!willId) {
        const error = new Error('Will ID (from blockchain) is required in the URL path.');
        error.status = 400;
        return next(error);
    }

    // 수정: username 유효성 검사 추가
    if (!username) {
        const error = new Error('Username is required as a query parameter to get will details.');
        error.status = 400;
        return next(error);
    }

    try {
        console.log(`Controller: Received request for getWillDetails. Will ID: ${willId}, Username: ${username}`);
        // 수정: service 함수 호출 시 username 전달
        const willDetails = await willService.getWillDetailsService(willId, username);
        
        // 서비스에서 에러를 throw하고 여기서 잡지 않는다면, 서비스에서 null을 반환했을 때의 처리는 불필요.
        // (위 서비스 코드는 에러를 throw하므로, 여기서 willDetails가 falsy한 경우는 정상적으로 발생하지 않음)
        // if (!willDetails) { 
        //     const error = new Error(`Will with ID ${willId} not found or access denied for user ${username}.`);
        //     error.status = 404; // 또는 403
        //     return next(error);
        // }
        res.status(200).json(willDetails);
    } catch (error) {
        console.error(`Controller Error in getWillDetails for ID ${willId}, User ${username}: ${error.message}`);
        // 서비스에서 status가 포함된 에러를 throw하므로, next(error)로 전달하면 express 에러 핸들러가 처리.
        next(error);
    }
}


module.exports = {
    registerWill,
    getMyWills,
    getWillDetails
};