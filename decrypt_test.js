const crypto = require('crypto');

// --- 아래 ENCRYPTION_KEY_HEX 값을 실제 server.js의 값으로 반드시 교체! ---
const ENCRYPTION_KEY_HEX = '1eb81515f8a41062210838ed8bfa294ed58d67ffb8c902c2b281efc30c5451df'; // <<<< 매우 중요!!!

// --- MariaDB에서 가져온 값들 ---
const IV_HEX_FROM_DB = 'f062c8baceba818cb6cd6455';
const AUTH_TAG_HEX_FROM_DB = 'b6d82f098f4674fb6422cc0b1815c312';
const ENCRYPTED_DATA_HEX_FROM_DB = 'e75914dfbef0a7da5c';

// --- 서버 코드와 동일한 설정 ---
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
// const IV_LENGTH = 12; // 암호화 시 사용된 IV 길이 (f062...는 12바이트 IV에 해당)

function decryptManual(encryptedPayload) {
    try {
        if (!encryptedPayload.iv || !encryptedPayload.encryptedData || !encryptedPayload.authTag) {
            console.error("오류: 복호화에 필요한 모든 정보(iv, encryptedData, authTag)가 제공되지 않았습니다.");
            return null;
        }
        if (ENCRYPTION_KEY.length !== 32) {
            console.error(`오류: 암호화 키의 길이가 잘못되었습니다. (현재 길이: ${ENCRYPTION_KEY.length} 바이트, 필요 길이: 32 바이트)`);
            return null;
        }

        const iv = Buffer.from(encryptedPayload.iv, 'hex');
        const authTag = Buffer.from(encryptedPayload.authTag, 'hex');
        const encryptedData = encryptedPayload.encryptedData;

        // IV 및 인증 태그 길이 로깅 (디버깅용)
        // console.log(`IV (hex): ${encryptedPayload.iv}, Length (bytes): ${iv.length}`);
        // console.log(`AuthTag (hex): ${encryptedPayload.authTag}, Length (bytes): ${authTag.length}`);
        // console.log(`EncryptedData (hex): ${encryptedPayload.encryptedData}`);

        if (iv.length !== 12) { // AES-GCM 권장 IV 길이 (96비트)
             console.warn(`경고: IV 길이가 12바이트가 아닙니다 (현재: ${iv.length} 바이트). 암호화 시 사용된 IV 길이를 확인하세요.`);
        }
        if (authTag.length !== 16) { // AES-GCM 일반적인 인증 태그 길이 (128비트)
             console.warn(`경고: 인증 태그 길이가 16바이트가 아닙니다 (현재: ${authTag.length} 바이트).`);
        }


        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("복호화 실패:", error.message);
        if (error.message.toLowerCase().includes('unsupported state or unable to authenticate data')) {
            console.error(" >> 가능성: 인증 태그 불일치 (데이터 변조 또는 키/IV/인증태그 불일치)");
        } else if (error.message.toLowerCase().includes('invalid key length')) {
            console.error(" >> 가능성: 암호화 키 길이 오류");
        } else if (error.message.toLowerCase().includes('invalid iv length')) {
            console.error(" >> 가능성: IV 길이 오류 또는 createCipheriv/createDecipheriv 호출 시 알고리즘과 맞지 않는 IV 길이");
        }  else if (error.message.toLowerCase().includes('invalid auth tag')) {
            console.error(" >> 가능성: 인증 태그(authTag) 문제");
        }
        return null;
    }
}

// 복호화 시도
const decryptedText = decryptManual({
    iv: IV_HEX_FROM_DB,
    encryptedData: ENCRYPTED_DATA_HEX_FROM_DB,
    authTag: AUTH_TAG_HEX_FROM_DB
});

if (decryptedText !== null) {
    console.log("복호화된 텍스트:", decryptedText);
} else {
    console.log("복호화에 실패했습니다. 위의 오류 메시지와 경고를 확인하세요.");
    console.log("가장 먼저 ENCRYPTION_KEY_HEX 값이 server.js의 값과 정확히 일치하는지 확인해주세요.");
}