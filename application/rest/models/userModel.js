// application/rest/models/userModel.js
const { dbPool } = require('../config'); // dbPool 가져오기
const bcrypt = require('bcryptjs');

const User = {
  // 사용자 생성 (회원가입)
  async create(username, email, password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    try {
      const [result] = await dbPool.query(sql, [username, email, hashedPassword]);
      return { id: result.insertId, username, email };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // username 또는 email로 사용자 찾기
  async findByUsernameOrEmail(usernameOrEmail) {
    const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
    try {
      const [rows] = await dbPool.query(sql, [usernameOrEmail, usernameOrEmail]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by username or email:', error);
      throw error;
    }
  },

  // ID로 사용자 찾기
  async findById(id) {
    const sql = 'SELECT id, username, email, created_at, google_id FROM users WHERE id = ?'; // google_id도 포함하여 반환 (선택적)
    try {
      const [rows] = await dbPool.query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  },

  // 비밀번호 비교
  async comparePassword(candidatePassword, hashedPasswordFromDb) {
    // hashedPasswordFromDb가 null (예: Google 사용자)인 경우 처리
    if (!hashedPasswordFromDb) return false;
    return bcrypt.compare(candidatePassword, hashedPasswordFromDb);
  },

  // Google ID로 사용자 찾기
  async findByGoogleId(googleId) {
    const sql = 'SELECT * FROM users WHERE google_id = ?';
    try {
      const [rows] = await dbPool.query(sql, [googleId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by googleId:', error);
      throw error;
    }
  },

  // Google 정보로 사용자 찾거나 생성/업데이트
  async findOrCreateByGoogle({ googleId, email, username }) {
    let user = await this.findByGoogleId(googleId);
    if (user) {
      // 선택적: 사용자 이름이 변경되었으면 업데이트 (예시)
      // if (user.username !== username) {
      //   const updateUsernameSql = 'UPDATE users SET username = ? WHERE google_id = ?';
      //   await dbPool.query(updateUsernameSql, [username, googleId]);
      //   user.username = username;
      // }
      return user;
    }

    user = await this.findByUsernameOrEmail(email);
    if (user) {
      if (!user.google_id) { // 기존 로컬 사용자이고, google_id가 아직 없을 때만 연결
        const updateGoogleIdSql = 'UPDATE users SET google_id = ? WHERE id = ?';
        await dbPool.query(updateGoogleIdSql, [googleId, user.id]);
        user.google_id = googleId;
        console.log(`기존 사용자 ${email} (ID: ${user.id})에게 Google ID ${googleId}를 연결했습니다.`);
      } else if (user.google_id !== googleId) {
        // 이메일은 같지만, 이미 다른 Google ID와 연결된 경우
        // 정책 결정 필요: 오류를 발생시키거나, 사용자에게 알림 등
        console.error(`Error: Email ${email} is already associated with a different Google ID.`);
        throw new Error(`이메일 ${email}은(는) 이미 다른 Google 계정과 연결되어 있습니다.`);
      }
      // 이미 google_id가 현재 googleId와 같다면, 위의 findByGoogleId에서 찾았을 것이므로 이 분기로 오지 않음.
      return user;
    }

    let finalUsername = username;
    let counter = 1;
    // username이 null이거나 빈 문자열일 경우, 이메일 기반으로 생성
    if (!finalUsername || finalUsername.trim() === "") {
        finalUsername = email.split('@')[0];
    }
    const baseUsername = finalUsername; // 중복 시 _숫자를 붙이기 위한 원본 이름
    while (await this.findByUsernameOrEmail(finalUsername)) {
      finalUsername = `${baseUsername}_${counter++}`;
    }

    const insertSql = 'INSERT INTO users (username, email, google_id, password) VALUES (?, ?, ?, NULL)';
    try {
      const [result] = await dbPool.query(insertSql, [finalUsername, email, googleId]);
      return { id: result.insertId, username: finalUsername, email, google_id: googleId };
    } catch (error) {
      console.error('Error creating user via Google:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('사용자 생성 중 예상치 못한 중복 오류가 발생했습니다. (DB)');
      }
      throw error;
    }
  }
};

module.exports = User;