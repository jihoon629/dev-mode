  # REST API 명세서

  이 문서는 `sipjang` 프로젝트의 REST API 서버에서 제공하는 모든 엔드포트에 대한 명세를 정의합니다.

  **기본 URL**: `http://localhost:8001/api`

  ---

  ## 1. 인증 (Authentication)

  ### 1.1. 로컬 회원가입
  - **Endpoint**: `POST /auth/register`
  - **Description**: 새로운 사용자를 시스템에 등록합니다.
  - **Request Body**:
    ```json
    {
      "username": "testuser",
      "email": "test@example.com",
      "password": "password123",
      "role": "worker"
    }
    ```
  - **Success Response (201)**:
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

  ### 1.2. 로컬 로그인
  - **Endpoint**: `POST /auth/login`
  - **Description**: 이메일과 비밀번호로 사용자를 인증하고, 세션 쿠키를 발급합니다.
  - **Request Body**:
    ```json
    {
      "email": "test@example.com",
      "password": "password123"
    }
    ```
  - **Success Response (200)**:
    - **Headers**: `Set-Cookie: token=<jwt_token>; HttpOnly; ...`
    - **Body**:
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

  ### 1.3. 현재 사용자 정보 조회
  - **Endpoint**: `GET /auth/me`
  - **Description**: 현재 로그인된 사용자의 정보를 반환합니다. (인증 필요)
  - **Success Response (200)**:
    ```json
    {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
    ```

  ---

  ## 2. 구인공고 (Job Postings)

  ### 2.1. 전체 구인공고 조회
  - **Endpoint**: `GET /job-postings`
  - **Description**: 활성화된 모든 구인공고 목록을 조회합니다.
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": {
        "postings": [
          {
            "id": 1,
            "title": "서울 강남 현장 인력 급구",
            "jobType": "건설",
            "region": "서울 강남",
            "dailyWage": 180000,
            "user": { "id": 2, "username": "employer_kim" }
          }
        ],
        "count": 1
      }
    }
    ```

  ### 2.2. 구인공고 상세 조회
  - **Endpoint**: `GET /job-postings/:id`
  - **Description**: 특정 ID의 구인공고 정보를 조회합니다.
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": 1,
        "userId": 2,
        "title": "서울 강남 현장 인력 급구",
        "jobType": "건설",
        "region": "서울 강남",
        "siteDescription": "역세권 아파트 신축 현장입니다.",
        "dailyWage": 180000,
        "requiredSkills": "성실함",
        "workStartDate": "2025-07-01",
        "workEndDate": "2025-12-31",
        "workHours": "08:00-17:00",
        "contactInfo": "010-1234-5678",
        "viewCount": 10,
        "createdAt": "2025-06-28T00:00:00.000Z",
        "updatedAt": "2025-06-28T00:00:00.000Z",
        "user": { "id": 2, "username": "employer_kim", "email": "kim@employer.com" }
      }
    }
    ```

  ### 2.3. 사용자별 구인공고 조회
  - **Endpoint**: `GET /job-postings/user/:userId`
  - **Description**: 특정 사용자가 작성한 모든 구인공고 목록을 조회합니다.
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": {
        "postings": [
          {
            "id": 1,
            "title": "서울 강남 현장 인력 급구",
            "jobType": "건설",
            "region": "서울 강남"
          }
        ]
      }
    }
    ```

  ### 2.4. 구인공고 생성
  - **Endpoint**: `POST /job-postings`
  - **Description**: 새로운 구인공고를 생성합니다.
  - **Request Body**:
    ```json
    {
      "userId": 1,
      "title": "새로운 구인공고",뭐
      "jobType": "IT",
      "region": "서울",
      "siteDescription": "상세 설명",
      "dailyWage": 200000,
      "requiredSkills": ["React", "Node.js"],
      "workStartDate": "2025-08-01",
      "workEndDate": "2025-12-31",
      "workHours": "09:00-18:00",
      "contactInfo": "010-0000-0000"
    }
    ```
  - **Success Response (201)**:
    ```json
    {
      "message": "Job posting created successfully",
      "data": { ... }
    }
    ```

  ### 2.5. 구인공고 수정
  - **Endpoint**: `PUT /job-postings/:id`
  - **Description**: 기존 구인공고를 수정합니다.
  - **Request Body**: (수정할 필드만 포함)
  - **Success Response (200)**:
    ```json
    {
      "message": "Job posting updated successfully",
      "data": { ... }
    }
    ```

  ### 2.6. 구인공고 삭제
  - **Endpoint**: `DELETE /job-postings/:id`
  - **Description**: 구인공고를 삭제합니다.
  - **Success Response (200)**:
    ```json
    {
      "message": "Job posting deleted successfully"
    }
    ```

  ### 2.7. 구인공고 유사도 검색
  - **Endpoint**: `GET /job-postings/search/similarity`
  - **Description**: 유사도 검색으로 구인공고를 찾습니다.
  - **Query Parameters**: `query`, `field`
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": {
        "postings": [ ... ]
      }
    }
    ```

  ---

  ## 3. 이력서 (Resumes)

  ### 3.1. 이력서 상세 조회
  - **Endpoint**: `GET /resumes/:id`
  - **Description**: 특정 ID의 이력서 정보와 블록체인에 기록된 경력 정보를 함께 조회합니다.
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": { ... }
    }
    ```

  ### 3.2. 사용자별 이력서 조회
  - **Endpoint**: `GET /resumes/user/:userId`
  - **Description**: 특정 사용자의 모든 이력서 목록을 조회합니다.
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": {
        "resumes": [ ... ]
      }
    }
    ```

  ### 3.3. 이력서 생성
  - **Endpoint**: `POST /resumes`
  - **Description**: 새로운 이력서를 생성합니다.
  - **Request Body**:
    ```json
    {
      "userId": 1,
      "jobType": "건설",
      "region": "서울",
      "selfIntroduction": "성실하게 일합니다.",
      "desiredDailyWage": 170000,
      "skills": ["용접", "미장"]
    }
    ```
  - **Success Response (201)**:
    ```json
    {
      "message": "Resume created successfully",
      "data": { ... }
    }
    ```

  ### 3.4. 이력서 수정
  - **Endpoint**: `PUT /resumes/:id`
  - **Description**: 기존 이력서를 수정합니다.
  - **Request Body**: (수정할 필드만 포함)
  - **Success Response (200)**:
    ```json
    {
      "message": "Resume updated successfully",
      "data": { ... }
    }
    ```

  ### 3.5. 이력서 삭제
  - **Endpoint**: `DELETE /resumes/:id`
  - **Description**: 이력서를 삭제합니다.
  - **Success Response (200)**:
    ```json
    {
      "message": "Resume deleted successfully"
    }
    ```

  ### 3.6. 이력서 유사도 검색
  - **Endpoint**: `GET /resumes/search/similarity`
  - **Description**: 유사도 검색으로 이력서를 찾습니다.
  - **Query Parameters**: `query`, `field`
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": [ ... ]
    }
    ```

  ---

  ## 4. 지원 및 경력 관리 (Application & Experience)

  ### 4.1. 공고에 지원하기
  - **Endpoint**: `POST /job-postings/:id/apply`
  - **Description**: 특정 구인공고에 선택한 이력서로 지원합니다.
  - **Request Body**: `{ "resumeId": 1 }`
  - **Success Response (201)**:
    ```json
    {
      "status": "success",
      "message": "성공적으로 지원했습니다.",
      "data": { "id": 1, "jobPostingId": 1, "applicantId": 1, "resumeId": 1, "status": "pending" }
    }
    ```

  ### 4.2. 특정 공고의 지원자 목록 조회
  - **Endpoint**: `GET /job-postings/:id/applications`
  - **Description**: (구인자용) 특정 공고에 지원한 모든 지원자의 목록과 제출한 이력서 정보��� 조회합니다.
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": {
        "applications": [
          {
            "id": 1,
            "status": "pending",
            "applicant": { "id": 1, "username": "testuser", "email": "test@example.com" },
            "resume": { "id": 1, "jobType": "건설", "region": "서울" }
          }
        ],
        "count": 1
      }
    }
    ```

  ### 4.3. 지원 상태 변경 (승인/거절)
  - **Endpoint**: `PUT /applications/:id/status`
  - **Description**: (구인자용) 특정 지원의 상태를 `approved` 또는 `rejected`로 변경합니다.
  - **Request Body**: `{ "status": "approved" }`
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "message": "지원서 상태가 approved(으)로 변경되었습니다.",
      "data": { "id": 1, "status": "approved" }
    }
    ```

  ### 4.4. 평가 완료 및 경력 기록
  - **Endpoint**: `POST /applications/:id/complete`
  - **Description**: (구인자용) 승인된 지원 건에 대해 평가를 완료하고, 해당 경력을 블록체인에 기록합니다.
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "message": "평가가 완료되어 경력이 블록체인에 기록되었습니��.",
      "data": { "id": 1, "status": "completed" }
    }
    ```

  ### 4.5. 블록체인 경력 조회
  - **Endpoint**: `GET /users/:id/experience`
  - **Description**: 특정 사용자의 블록체인에 기록된 모든 경력 정보를 조회합니다.
  - **Success Response (200)**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "docType": "experience",
          "jobPostingId": "1",
          "jobTitle": "서울 강남 현장 인력 급구",
          "workerId": "1",
          "employerId": "2",
          "workPeriod": "2024-01-01 ~ 2024-06-30",
          "timestamp": "2024-07-01T10:00:00.000Z"
        }
      ]
    }
    ```
