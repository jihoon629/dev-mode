// application/rest/userinfoController.js
const pool = require('./db'); // 데이터베이스 연결 풀 가져오기 (db.js)
const { v4: uuidv4 } = require('uuid'); // 고유 ID 생성을 위한 uuid 라이브러리



// 회원가입
async function registerUser(req, res) {
    const { username, password, phone, name, birth } = req.body;

    if (!username || !password || !phone || !name || !birth) {
        return res.status(400).json({ error: '모든 필수 항목을 입력하세요.' });
    }

    try {
        const [existing] = await pool.execute('SELECT * FROM Users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ error: '이미 존재하는 사용자입니다.' });
        }

        const insertQuery = 'INSERT INTO Users (id, username, password, phone, name, birth) VALUES (?, ?, ?, ?, ?, ?)';
        await pool.execute(insertQuery, [uuidv4(), username, password, phone, name, birth]);

        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        console.error('회원가입 에러:', error);
        res.status(500).json({ error: '서버 오류' });
    }
}


// ---------- 로그인 ----------
async function loginUser(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요.' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM Users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: '로그인 정보가 일치하지 않습니다.' });
        }

        res.json({ message: '로그인 성공', user: rows[0] });
    } catch (error) {
        console.error('로그인 에러:', error);
        res.status(500).json({ error: '서버 오류' });
    }
}


// 각 함수를 개별적으로 export
module.exports = {
    registerUser,
    loginUser
};