// application/rest/models/userModel.js
const { dbPool } = require('../config');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger'); // 로거 추가 (권장)

const User = {
  async create(username, email, password, role) { // role 인자 추가
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // role 컬럼 추가
    const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    try {
      // role 값 추가
      const [result] = await dbPool.query(sql, [username, email, hashedPassword, role]);
      logger.info(`[모델-사용자생성] 사용자 생성 완료. ID: ${result.insertId}, 역할: ${role}`);
      return { id: result.insertId, username, email, role }; // role 반환
    } catch (error) {
      logger.error(`[모델-사용자생성] 오류: ${error.message}`, { username, email, role, stack: error.stack });
      throw error;
    }
  },

  async findByUsername(username) {
    // role 컬럼 선택 추가
    const sql = 'SELECT id, username, email, password, role, created_at, google_id FROM users WHERE username = ? LIMIT 1';
    try {
      const [rows] = await dbPool.query(sql, [username]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error(`[모델-FindByUsername] 오류: ${error.message}`, { username, stack: error.stack });
      throw error;
    }
  },

  async findByEmail(email) {
    // role 컬럼 선택 추가
    const sql = 'SELECT id, username, email, password, role, created_at, google_id FROM users WHERE email = ?';
    try {
      const [rows] = await dbPool.query(sql, [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error(`[모델-FindByEmail] 오류: ${error.message}`, { email, stack: error.stack });
      throw error;
    }
  },

  async findById(id) {
    // role 컬럼 선택 추가
    const sql = 'SELECT id, username, email, role, created_at, google_id FROM users WHERE id = ?';
    try {
      const [rows] = await dbPool.query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error(`[모델-FindById] 오류: ${error.message}`, { id, stack: error.stack });
      throw error;
    }
  },

  async comparePassword(candidatePassword, hashedPasswordFromDb) {
    if (!hashedPasswordFromDb) return false;
    return bcrypt.compare(candidatePassword, hashedPasswordFromDb);
  },

  async findByGoogleId(googleId) {
    // role 컬럼 선택 추가
    const sql = 'SELECT id, username, email, password, role, created_at, google_id FROM users WHERE google_id = ?';
    try {
      const [rows] = await dbPool.query(sql, [googleId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error(`[모델-FindByGoogleId] 오류: ${error.message}`, { googleId, stack: error.stack });
      throw error;
    }
  },

  async findOrCreateByGoogle({ googleId, email, username }) {
    let user = await this.findByGoogleId(googleId);
    if (user) {
      logger.info(`[모델-Google사용자] 기존 Google ID 사용자 찾음. Email: ${user.email}, 역할: ${user.role}`);
      return user; // user 객체에 이미 role이 포함되어 있음
    }

    user = await this.findByEmail(email);
    if (user) {
      if (!user.google_id) {
        const updateGoogleIdSql = 'UPDATE users SET google_id = ? WHERE id = ?';
        await dbPool.query(updateGoogleIdSql, [googleId, user.id]);
        user.google_id = googleId; // 기존 user 객체에 google_id 업데이트
        logger.info(`[모델-Google사용자] 기존 사용자 ${email} (ID: ${user.id}, 역할: ${user.role})에게 Google ID ${googleId}를 연결했습니다.`);
      } else if (user.google_id !== googleId) {
        logger.error(`[모델-Google사용자] 이메일 ${email}은(는) 이미 다른 Google ID(${user.google_id})와 연결되어 있습니다. 요청된 Google ID: ${googleId}`);
        throw new Error(`이메일 ${email}은(는) 이미 다른 Google 계정과 연결되어 있습니다.`);
      }
      return user; // user 객체에 이미 role이 포함되어 있음
    }

    let finalUsername = username;
    if (!finalUsername || finalUsername.trim() === "") {
        finalUsername = email.split('@')[0];
    }
    const baseUsername = finalUsername;
    let counter = 1;
    let tempUser = await this.findByUsername(finalUsername); // findByUsername은 role 포함하여 반환
    while (tempUser && tempUser.google_id !== googleId) {
      finalUsername = `${baseUsername}_${counter++}`;
      tempUser = await this.findByUsername(finalUsername);
    }

    // 새로운 Google 사용자를 위한 기본 역할 설정 (예: 'worker')
    const defaultRoleForNewGoogleUser = 'worker';
    logger.info(`[모델-Google사용자] 신규 Google 사용자 생성 시도. Email: ${email}, Username: ${finalUsername}, 기본 역할: ${defaultRoleForNewGoogleUser}`);

    // role 컬럼 추가하여 INSERT
    const insertSql = 'INSERT INTO users (username, email, google_id, password, role) VALUES (?, ?, ?, NULL, ?)';
    try {
      // role 값 (defaultRoleForNewGoogleUser) 추가
      const [result] = await dbPool.query(insertSql, [finalUsername, email, googleId, defaultRoleForNewGoogleUser]);
      logger.info(`[모델-Google사용자] 신규 Google 사용자 생성 완료. ID: ${result.insertId}, 역할: ${defaultRoleForNewGoogleUser}`);
      return { id: result.insertId, username: finalUsername, email, google_id: googleId, role: defaultRoleForNewGoogleUser }; // role 반환
    } catch (error) {
      logger.error(`[모델-Google사용자] 생성 오류: ${error.message}`, { finalUsername, email, googleId, role: defaultRoleForNewGoogleUser, stack: error.stack });
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 사용 중인 이메일입니다.');
      }
      throw error;
    }
  }
};

module.exports = User;