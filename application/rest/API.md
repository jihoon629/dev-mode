# REST API 명세서

이 문서는 `sipjang` 프로젝트의 REST API 서버에서 제공하는 모든 엔드포트에 대한 명세를 정의합니다.

**기본 URL**: `http://localhost:8001/api`

---

## 1. 인증 (Authentication)

### 1.1. 로컬 회원가입
- **Endpoint**: `POST /auth/register`
- **Description**: 새로운 사용자를 시스템에 등록합니다.

### 1.2. 로컬 로그인
- **Endpoint**: `POST /auth/login`
- **Description**: 이메일과 비밀번호로 사용자를 인증하고, 세션 쿠키를 발급합니다.

### 1.3. Google OAuth 2.0 로그인 시작
- **Endpoint**: `GET /auth/google`
- **Description**: Google OAuth 2.0 인증 프로세스를 시작합니다.

### 1.4. 현재 사용자 정보 조회
- **Endpoint**: `GET /auth/me`
- **Description**: 현재 로그인된 사용자의 정보를 반환합니다. (인증 필요)

---

## 2. 구인공고 (Job Postings)

### 2.1. 전체 구인공고 조회
- **Endpoint**: `GET /job-postings`
- **Description**: 활성화된 모든 구인공고 목록을 조회합니다.

### 2.2. 구인공고 생성
- **Endpoint**: `POST /job-postings`
- **Description**: 새로운 구인공고를 등록합니다.

### 2.3. 구인공고 상세 조회
- **Endpoint**: `GET /job-postings/:id`
- **Description**: 특정 ID의 구인공고 정보를 조회합니다.

### 2.4. 구인공고 수정
- **Endpoint**: `PUT /job-postings/:id`
- **Description**: 특정 ID의 구인공고 정보를 수정합니다.

### 2.5. 구인공고 삭제
- **Endpoint**: `DELETE /job-postings/:id`
- **Description**: 특정 ID의 구인공고를 삭제합니다.

---

## 3. 이력서 (Resumes)

### 3.1. 이력서 생성
- **Endpoint**: `POST /resumes`
- **Description**: 새로운 이력서를 등록합니다.

### 3.2. 이력서 상세 조회
- **Endpoint**: `GET /resumes/:id`
- **Description**: 특정 ID의 이력서 정보와 블록체인에 기록된 경력 정보를 함께 조회합니다.

### 3.3. 이력서 수정
- **Endpoint**: `PUT /resumes/:id`
- **Description**: 특정 ID의 이력서 정보를 수정합니다.

### 3.4. 이력서 삭제
- **Endpoint**: `DELETE /resumes/:id`
- **Description**: 특정 ID의 이력서를 삭제합니다.

---

## 4. 지원 및 경력 관리 (Application & Experience)

### 4.1. 공고에 지원하기
- **Endpoint**: `POST /job-postings/:id/apply`
- **Description**: 특정 구인공고에 선택한 이력서로 지원합니다.
- **Request Body**: `{ "resumeId": number }`

### 4.2. 특�� 공고의 지원자 목록 조회
- **Endpoint**: `GET /job-postings/:id/applications`
- **Description**: (구인자용) 특정 공고에 지원한 모든 지원자의 목록과 제출한 이력서 정보를 조회합니다.

### 4.3. 내 지원 현황 조회
- **Endpoint**: `GET /applications/my`
- **Description**: (지원자용) 자신이 지원한 모든 공고의 목록과 현재 상태를 조회합니다.

### 4.4. 지원 상태 변경 (승인/거절)
- **Endpoint**: `PUT /applications/:id/status`
- **Description**: (구인자용) 특정 지원의 상태를 `approved` 또는 `rejected`로 변경합니다.
- **Request Body**: `{ "status": "approved" | "rejected" }`

### 4.5. 평가 완료 및 경력 기록
- **Endpoint**: `POST /applications/:id/complete`
- **Description**: (구인자용) 승인된 지원 건에 대해 평가를 완료하고, 해당 경력을 블록체인에 기록합니다.

### 4.6. 블록체인 경력 조회
- **Endpoint**: `GET /users/:id/experience`
- **Description**: 특정 사용자의 블록체인에 기록된 모든 경력 정보를 조회합니다.

---

## 5. AI 추천 (AI Recommendation)

### 5.1. 이력서 기반 공고 추천
- **Endpoint**: `GET /resumes/:id/recommendations`
- **Description**: 특정 이력서 ID를 기반으로, AI가 가장 적합하다고 판단한 채용 공고 목록을 추천 이유와 함께 반환합니다.

---

## 6. MCP (Model Context Protocol)

### 6.1. MCP 요청 처리
- **Endpoint**: `POST /mcp`
- **Description**: MCP 서버에 도구(tool) 실행을 요청합니다.
- **Example**: `tools/call` 메소드로 `recommend_job_postings_for_resume` 도구 호출