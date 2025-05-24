// rest/service.js
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const pool = require('./db'); // DB 연결 풀
const sdk = require('./sdk'); // 수정된 Fabric SDK

// --- 암호화 관련 설정 및 함수 ---
// 보안을 위해 실제 키는 환경 변수에서 읽어오는 것이 가장 좋습니다.
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY_HEX || '1eb81515f8a41062210838ed8bfa294ed58d67ffb8c902c2b281efc30c5451df'; // 실제 키로 교체!!!
let ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_HEX || ENCRYPTION_KEY_HEX.length !== 64 || ENCRYPTION_KEY_HEX === '여기에_생성한_64자리_16진수_키_문자열을_넣으세요') {
    console.error("CRITICAL ERROR: ENCRYPTION_KEY_HEX is not set correctly in service.js. It must be a 64-character hex string.");
    // 프로덕션 환경에서는 애플리케이션 시작을 중단시키는 것이 안전합니다.
    // throw new Error("Application cannot start: ENCRYPTION_KEY_HEX is misconfigured.");
    // 여기서는 일단 로그만 남기고, 키가 잘못되면 암복호화 실패로 이어질 것입니다.
} else {
    ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
    console.log("Encryption key loaded successfully in service.js.");
}

const IV_LENGTH = 12; // AES-GCM 권장 IV 길이

function encrypt(text) {
    if (!ENCRYPTION_KEY) {
        throw new Error("Encryption key is not configured. Cannot encrypt data.");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted, authTag: authTag };
}

function decrypt(encryptedPayload) {
    if (!ENCRYPTION_KEY) {
        throw new Error("Encryption key is not configured. Cannot decrypt data.");
    }
    try {
        const iv = Buffer.from(encryptedPayload.iv, 'hex');
        const authTag = Buffer.from(encryptedPayload.authTag, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedPayload.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Decryption failed in service.js:", error.message);
        // 복호화 실패는 중요한 문제이므로 null 반환 대신 에러 throw 고려
        const decryptError = new Error("Failed to decrypt data. It may be corrupted or the key is incorrect.");
        decryptError.status = 500; // 내부 서버 오류
        decryptError.cause = error;
        throw decryptError;
    }
}

function calculateHash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}
// --- 암호화 관련 설정 및 함수 끝 ---


// 유언장 등록 서비스
async function registerWillService(title, originalContent, beneficiaries, testatorId) {
    // 입력 값 유효성 검사는 컨트롤러에서 기본적인 것을 하고, 여기서 더 상세한 비즈니스 규칙 검증 가능
    if (!title || !originalContent || !testatorId) { // 이중 체크 (컨트롤러에서도 이미 함)
        const error = new Error('Service Error: Missing required parameters for will registration.'); // 메시지 명확화
        error.status = 400;
        throw error;
    }

    try {
        const contentHash = calculateHash(originalContent); // calculateHash 함수가 정의되어 있다고 가정
        const encryptedPayload = encrypt(originalContent); // encrypt 함수가 정의되어 있다고 가정

        if (!encryptedPayload || !encryptedPayload.iv || !encryptedPayload.encryptedData || !encryptedPayload.authTag) {
            console.error("Service Error: Encryption resulted in incomplete payload:", encryptedPayload);
            const error = new Error('Service Error: Failed to encrypt will content correctly.');
            error.status = 500;
            throw error;
        }

        const willDbId = uuidv4(); // DB 레코드 ID (offChainStorageRef로 사용)
        const insertQuery = `
            INSERT INTO Wills (id, testator_id, encrypted_content, encryption_iv, encryption_auth_tag)
            VALUES (?, ?, ?, ?, ?)
        `;
        await pool.execute(insertQuery, [
            willDbId,
            testatorId, // DB에는 프론트에서 받은 testatorId (username) 저장
            encryptedPayload.encryptedData,
            encryptedPayload.iv,
            encryptedPayload.authTag
        ]);
        console.log(`Service: Will content stored in MariaDB with ID (offChainStorageRef): ${willDbId} for testator: ${testatorId}`);

        // 블록체인에 전달할 인자 준비
        const beneficiariesJSON = JSON.stringify(beneficiaries || []);
        const offChainStorageRef = willDbId; // DB ID를 오프체인 참조로 사용

        // 체인코드의 RegisterWill 함수 시그니처: usernameAsTestatorID, title, contentHash, offChainStorageRef, beneficiariesJSON
        const chaincodeArgs = [
            String(testatorId),         // 1. usernameAsTestatorID (프론트의 sessionUsername, 즉 여기서 testatorId)
            String(title),              // 2. title
            String(contentHash),        // 3. contentHash
            String(offChainStorageRef), // 4. offChainStorageRef
            String(beneficiariesJSON)   // 5. beneficiariesJSON
        ];
        console.log(`Service: Invoking chaincode 'RegisterWill' with args: ${JSON.stringify(chaincodeArgs)}`);

        // Fabric SDK 호출 (트랜잭션 제출)
        const chaincodeResponseBuffer = await sdk.send(false, 'RegisterWill', chaincodeArgs); // isQuery = false

        let blockchainWillId = "";
        if (chaincodeResponseBuffer && chaincodeResponseBuffer.length > 0) {
            blockchainWillId = chaincodeResponseBuffer.toString();
            console.log(`Service: Transaction 'RegisterWill' submitted. Blockchain Will ID: ${blockchainWillId}`);
        } else {
            // 체인코드가 ID를 반환하지 않는 경우 (정상적인 시나리오일 수도, 아닐 수도 있음)
            console.warn(`Service: Transaction 'RegisterWill' submitted, but no specific ID (blockchainWillId) returned from chaincode. This might be normal if the chaincode doesn't return the ID explicitly.`);
            // 필요하다면 여기서 에러를 발생시킬 수도 있습니다.
            // 예: throw new Error('Chaincode did not return a Will ID after registration.');
        }

        return {
            blockchainWillId: blockchainWillId, // 체인코드가 반환한 willID
            dbRecordId: willDbId             // DB에 저장된 레코드의 ID
        };

    } catch (error) {
        console.error('Service Error during will registration:', error.stack || error);
        if (!error.status) {
            error.status = 500;
        }
        throw error;
    }
}

// 내 유언장 목록 조회 서비스
async function getMyWillsService(username) { // username 인자 받음
    try {
        console.log(`Service: Requesting GetMyWills from chaincode for username: ${username}`);
        
        if (!username) {
            // username은 체인코드 호출에 필수적이므로, 없으면 에러 처리
            throw Object.assign(new Error("Username is required to fetch user's wills."), { status: 400 });
        }

        // sdk.send 호출 시 username을 GetMyWills 체인코드 함수의 인자로 전달
        // isQuery는 true (상태를 변경하지 않는 조회 트랜잭션)
        const resultBuffer = await sdk.send(true, 'GetMyWills', [username]); 

        if (resultBuffer && resultBuffer.length > 0) {
            const userWills = JSON.parse(resultBuffer.toString());
            console.log(`Service: Found ${userWills.length} wills for username '${username}' from chaincode.`);
            return userWills;
        }
        
        console.log(`Service: No wills found for username '${username}' from chaincode.`);
        return []; // 결과가 없거나 버퍼가 비어있으면 빈 배열 반환
    } catch (error) {
        console.error('Service Error in getMyWillsService:', error.stack || error);
        if (!error.status) {
            error.status = 500;
        }
        throw error;
    }
}

// 특정 유언장 상세 정보 조회 서비스
async function getWillDetailsService(blockchainWillId, username) {
    if (!blockchainWillId) {
        const error = new Error('Service Error: Blockchain Will ID is required.');
        error.status = 400;
        throw error;
    }
    // 수정: username 유효성 검사 추가
    if (!username) {
        const error = new Error('Service Error: Username is required to fetch will details.');
        error.status = 400;
        throw error;
    }

    try {
        console.log(`Service: Fetching details from blockchain for will ID: ${blockchainWillId} by user: ${username}`);
        // 1. 블록체인에서 메타데이터 가져오기
        // 수정: sdk.send 호출 시 username을 추가 인자로 전달
        const blockchainDataBuffer = await sdk.send(true, 'GetWillDetails', [String(blockchainWillId), String(username)]);

        if (!blockchainDataBuffer || blockchainDataBuffer.length === 0) {
            const error = new Error(`Service Error: Will with ID ${blockchainWillId} not found on blockchain for user ${username}, or access denied.`);
            error.status = 404; // 404 Not Found 또는 403 Forbidden일 수 있음 (체인코드 에러 메시지에 따라)
            throw error;
        }

        let blockchainWill;
        try {
            blockchainWill = JSON.parse(blockchainDataBuffer.toString());
        } catch (parseError) {
            console.error("Service Error: Failed to parse blockchain response:", parseError, "Raw data:", blockchainDataBuffer.toString());
            const error = new Error('Service Error: Failed to parse will data from blockchain.');
            error.status = 500;
            error.cause = parseError;
            throw error;
        }

        // contentHash 와 offChainStorageRef 필드가 없을 경우의 처리는 그대로 유지
        if (!blockchainWill || !blockchainWill.contentHash || !blockchainWill.offChainStorageRef) {
            console.error("Service Error: Blockchain data missing crucial fields:", blockchainWill);
            const error = new Error('Service Error: Incomplete will data from blockchain (missing hash or DB ref).');
            error.status = 500;
            throw error;
        }

        const { contentHash: storedHash, offChainStorageRef: dbRecordId } = blockchainWill;

        // 2. MariaDB에서 암호화된 내용 가져오기 (이 부분은 변경 없음)
        console.log(`Service: Fetching encrypted content from MariaDB for record ID: ${dbRecordId}`);
        const selectQuery = `SELECT encrypted_content, encryption_iv, encryption_auth_tag FROM Wills WHERE id = ?`;
        const [rows] = await pool.execute(selectQuery, [dbRecordId]);

        if (rows.length === 0) {
            const error = new Error(`Service Error: Will content not found in database for reference ID ${dbRecordId}. Possible data inconsistency.`);
            error.status = 404;
            throw error;
        }
        const dbRow = rows[0];
        const encryptedPayloadFromDb = {
            iv: dbRow.encryption_iv,
            encryptedData: dbRow.encrypted_content,
            authTag: dbRow.encryption_auth_tag
        };

        // 3. 복호화 (변경 없음)
        const decryptedContent = decrypt(encryptedPayloadFromDb);

        // 4. 무결성 검증 (변경 없음)
        const currentHash = calculateHash(decryptedContent);
        if (currentHash !== storedHash) {
            console.warn(`Service Warning: Data integrity check FAILED for will ${blockchainWillId}. Stored hash: ${storedHash}, Current hash: ${currentHash}`);
            const error = new Error('Data integrity check failed. The will content may have been tampered with.');
            error.status = 409;
            throw error;
        }
        console.log(`Service: Data integrity check passed for will ${blockchainWillId}.`);

        // 5. 결과 조합하여 반환 (변경 없음)
        return {
            ...blockchainWill,
            originalContent: decryptedContent
        };

    } catch (error) {
        // 체인코드에서 발생한 "access denied"와 같은 구체적인 오류는 여기서 잡힐 수 있습니다.
        // error.message 또는 error.details (sdk.send 구현에 따라 다름)에 체인코드 오류가 포함될 수 있습니다.
        console.error(`Service Error in getWillDetailsService for ID ${blockchainWillId}, user ${username}:`, error.stack || error);
        if (!error.status) { // 이미 status가 설정된 에러(예: 직접 throw한 400, 404)가 아니라면 500으로 설정
            error.status = 500;
        }
        throw error; // 에러를 컨트롤러로 다시 throw
    }
}

module.exports = {
    registerWillService,
    getMyWillsService,
    getWillDetailsService,
    // 암호화 유틸리티 함수들을 외부에서 직접 사용할 필요가 없다면 export 안 함
    // encrypt, decrypt, calculateHash // 필요에 따라 export
};