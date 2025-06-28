# REST API 명세서

이 문서는 `sipjang` 프로젝트의 REST API 서버에서 제공하는 모든 엔드포트에 대한 명세를 정의합니다.

**기본 URL**: `http://localhost:8001/api`

---

## 1. 인증 (Authentication)

### 1.1. 로컬 회원가입

-   **Endpoint**: `POST /auth/register`
-   **Description**: 새로운 사용자를 시스템에 등록합니다.
-   **Request Body**:
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string",
      "role": "string"
    }
    ```
    -   `role`은 `'worker'`(구직자) 또는 `'employer'`(구인자) 중 하나여야 합니다.
-   **Success Response (201)**:
    ```json
    {
      "message": "회원가입이 성공적으로 완료되었습니다.",
      "user": {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com"
      }
    }
    ```
-   **Error Response (400)**: 입력값이 유효하지 않거나, 이메일이 중복될 경우 발생합니다.

### 1.2. 로컬 로그인

-   **Endpoint**: `POST /auth/login`
-   **Description**: 이메일��� 비밀번호로 사용자를 인증하고, 세션 쿠키를 발급합니다.
-   **Request Body**:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
-   **Success Response (200)**:
    -   **Headers**: `Set-Cookie: token=<jwt_token>; HttpOnly; ...`
    -   **Body**:
        ```json
        {
          "message": "로그인 성공",
          "user": {
            "id": 1,
            "username": "testuser",
            "email": "test@example.com"
          }
        }
        ```
-   **Error Response (401)**: 인증 정보가 잘못된 경우 발생합니다.

### 1.3. Google OAuth 2.0 로그인 시작

-   **Endpoint**: `GET /auth/google`
-   **Description**: Google OAuth 2.0 인증 프로세스를 시작합니다. 사용자는 Google 로그인 페이지로 리디렉션됩니다.

### 1.4. 현재 사용자 정보 조회

-   **Endpoint**: `GET /auth/me`
-   **Description**: 현재 로그인된 사용자의 정보를 반환합니다. 인증이 필요한 요청입니다.
-   **Request Headers**:
    -   `Cookie`: `token=<jwt_token>`
-   **Success Response (200)**:
    ```json
    {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
    ```
-   **Error Response (401)**: 인증되지 않은 경우 발생합니다.

---

## 2. 구인공고 (Job Postings)

### 2.1. 구인공고 생성

-   **Endpoint**: `POST /job-postings`
-   **Description**: 새로운 구인공고를 등록합니다.
-   **Request Body**:
    ```json
    {
      "userId": "number",
      "jobType": "string",
      "region": "string",
      "siteDescription": "string",
      "dailyWage": "number",
      "requiredSkills": "string",
      "workStartDate": "string (YYYY-MM-DD)",
      "workEndDate": "string (YYYY-MM-DD)",
      "workHours": "string",
      "contactInfo": "string"
    }
    ```
-   **Success Response (201)**: 생성된 구인공고 객체를 반환합니다.

### 2.2. 구인공고 상세 조회

-   **Endpoint**: `GET /job-postings/:id`
-   **Description**: 특정 ID의 구인공고 정보를 조회합니다.
-   **Success Response (200)**: 해당 구인공고 객체를 반환합니다.

### 2.3. 구인공고 수정

-   **Endpoint**: `PUT /job-postings/:id`
-   **Description**: 특정 ID의 구인공고 정보를 수정합니다.
-   **Request Body**: 수정할 필드를 포함한 JSON 객체.
-   **Success Response (200)**: 수정된 구인공고 객체를 반환합니다.

### 2.4. 구인공고 삭제

-   **Endpoint**: `DELETE /job-postings/:id`
-   **Description**: 특정 ID의 구인공고를 삭제합니다.
-   **Success Response (200)**: 성공 메시지를 반환합니다.

---

## 3. 이력서 (Resumes)

### 3.1. 이력서 생성

-   **Endpoint**: `POST /resumes`
-   **Description**: 새로운 이력서를 등록합니다.
-   **Request Body**:
    ```json
    {
      "userId": "number",
      "jobType": "string",
      "region": "string",
      "selfIntroduction": "string",
      "desiredDailyWage": "number",
      "skills": "string"
    }
    ```
-   **Success Response (201)**: 생성된 이력서 객체를 반환합니다.

### 3.2. 이력서 상세 조회

-   **Endpoint**: `GET /resumes/:id`
-   **Description**: 특정 ID의 이력서 정보를 조회합니다.
-   **Success Response (200)**: 해당 이력서 객체를 반환합니다.

### 3.3. 이력서 수정

-   **Endpoint**: `PUT /resumes/:id`
-   **Description**: 특정 ID의 이력서 정보를 수정합니다.
-   **Request Body**: 수정할 필드를 포함한 JSON 객체.
-   **Success Response (200)**: 수정된 이력서 객체를 반환합니다.

### 3.4. 이력서 삭제

-   **Endpoint**: `DELETE /resumes/:id`
-   **Description**: 특정 ID의 이력서를 삭제합니다.
-   **Success Response (200)**: 성공 메시지를 반환합니다.

---

## 4. AI 추천 (AI Recommendation)

### 4.1. 이력서 기반 공고 추천 (핵심 기능)

-   **Endpoint**: `GET /resumes/:id/recommendations`
-   **Description**: 특정 이력서 ID를 기반으로, AI가 가장 적합하다고 판단한 채용 공고 목록을 추천 이유와 함께 반환합니다.
-   **Success Response (200)**:
    ```json
    {
      "status": "success",
      "message": "N개의 맞춤 공고를 추천합니다.",
      "data": {
        "postings": [
          {
            "id": 10,
            "jobType": "건설 현장직",
            "region": "서울",
            "dailyWage": 180000,
            // ... other job posting fields
            "recommendation": {
              "matchScore": 92,
              "reason": "직종 일치도(40/40): '건설' 키워드가 일치합니다. 지역 근접성(30/30): 희망 지역과 근무지가 '서울'로 동일합니다. ..."
            }
          }
        ],
        "count": 1
      }
    }
    ```

---

## 5. MCP (Model Context Protocol)

### 5.1. MCP 요청 처리

-   **Endpoint**: `POST /mcp`
-   **Description**: MCP 서버에 도구(tool) 실행을 요청합니다. JSON-RPC 2.0 형식을 따릅니다.
-   **Request Body (Example)**:
    ```json
    {
      "jsonrpc": "2.0",
      "method": "tools/call",
      "params": {
        "name": "recommend_job_postings_for_resume",
        "arguments": {
          "resumeId": 1
        }
      },
      "id": "123"
    }
    ```
-   **Success Response (200)**: 도구 실행 결과를 포함한 JSON-RPC 2.0 응답을 반환합니다.
