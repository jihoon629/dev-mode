# REST API 서버

이 문서는 `dev-mode/application/rest` 디렉토리에 위치한 REST API 서버의 구조와 기능에 대해 설명합니다.

## 개요

이 서버는 Node.js와 Express 프레임워크를 기반으로 구축된 지능형 구인구직 매칭 플랫폼의 백엔드입니다. 주요 기능으로 사용자 관리, 이력서 및 구인공고 CRUD, 그리고 Google Gemini LLM을 활용한 AI 기반의 채용 공고 추천 기능을 제공합니다.

데이터베이스는 TypeORM을 통해 MariaDB와 연동되며, 사용자 인증은 JWT(JSON Web Token)와 Passport.js를 사용하여 로컬 및 Google 소셜 로그인을 지원합니다. 또한, MCP(Model Context Protocol)를 통해 AI 모델이 데이터베이스와 상호작용할 수 있는 확장 가능한 인터페이스를 제공합니다.

## 주요 기능

-   **사용자 인증**: 로컬 이메일/비밀번호 및 Google OAuth2.0을 통한 회원가입 및 로그인을 지원합니다.
-   **구인공고 및 이력서 관리**: 구인공고와 이력서를 생성, 조회, 수정, 삭제하는 전체적인 CRUD 기능을 제공합니다.
-   **AI 기반 공고 추천**: 사용자의 이력서 내용을 분석하여, 등록된 전체 공고 중 가장 적합한 일자리를 AI가 추천해주는 핵심 기능을 제공합니다. (`GET /api/resumes/:id/recommendations`)
-   **유사성 검색**: 자연어 쿼리를 기반으로 구인공고 및 이력서를 검색하는 기능을 제공합니다.
-   **MCP(Model Context Protocol) 서버**: 현재 AI 기반 공고 추천 기능을 도구(`tool`)로 노출하여, 외부 AI 에이전트나 다른 시스템이 이 기능을 쉽게 호출하고 사용할 수 있도록 지원합니다.
-   **Hyperledger Fabric 연동**: 사용자 생성 시 Fabric 지갑에 ID를 등록하여, 향후 블록체인 기반의 기능을 확장할 수 있는 기반을 마련합니다.

## 디렉토리 구조

```
rest/
├── config/         # 서버 설정 (DB, JWT, OAuth, 로거, MCP 등)
├── controller/     # HTTP 요청 처리 및 응답 반환
├── dto/            # 데이터 전송 객체 (Request/Response DTOs)
├── repo/           # 데이터베이스와 직접 상호작용 (TypeORM Entities, Models)
├── routes/         # API 엔드포인트 및 라우팅 정의
├── service/        # 핵심 비즈니스 로직 (인증, 추천, 검색 등)
├── utils/          # 유틸리티 (에러 핸들러, 유효성 검사, Fabric 연동)
├── sdk.js          # Hyperledger Fabric SDK 관련 함수
└── server.mjs      # Express 서버 시작 및 설정
```

## API 엔드포인트

주요 API 엔드포인트는 다음과 같습니다.

-   `POST /api/auth/register`: 로컬 회원가입
-   `POST /api/auth/login`: 로컬 로그인
-   `GET /api/auth/google`: Google OAuth 로그인 시작
-   `GET /api/auth/me`: 현재 로그인된 사용자 정보 조회

-   `POST /api/job-postings`: 구인공고 생성
-   `GET /api/job-postings/:id`: 구인공고 상세 조회
-   `PUT /api/job-postings/:id`: 구인공고 수정
-   `DELETE /api/job-postings/:id`: 구인공고 삭제

-   `POST /api/resumes`: 이력서 생성
-   `GET /api/resumes/:id`: 이력서 상세 조회
-   `PUT /api/resumes/:id`: 이력서 수정
-   `DELETE /api/resumes/:id`: 이력서 삭제

-   **`GET /api/resumes/:id/recommendations`**: **(핵심 기능)** 특정 이력서에 대한 AI 추천 공고 목록 조회

-   `POST /mcp`: MCP 요청 처리 (`recommend_job_postings_for_resume` 도구 호출 가능)

## 설정 및 실행

### 환경변수

서버를 실행하기 전에 `.env` 파일을 생성하고 다음 환경변수를 설정해야 합니다.

-   `DB_HOST`: 데이터베이스 호스트
-   `DB_PORT`: 데이터베이스 포트
-   `DB_USER`: 데이터베이스 사용자 이름
-   `DB_PASSWORD`: 데이터베이스 비밀번호
-   `DB_NAME`: 데이터베이스 이름
-   `GEMINI_API_KEY`: Google Gemini API 키
-   `GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
-   `GOOGLE_CLIENT_SECRET`: Google OAuth 클라이언트 시크릿
-   `GOOGLE_CALLBACK_URL`: Google OAuth 콜백 URL
-   `FRONTEND_URL`: 프론트엔드 애플리케이션 URL
-   `PORT`: 서버 포트 (기본값: 8001)

### 실행

다음 명령어를 사용하여 서버를 시작할 수 있습니다.

```bash
node server.mjs
```
