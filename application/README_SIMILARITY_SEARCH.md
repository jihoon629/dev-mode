# Gemini 기반 유사성 검색 시스템

## 개요
이 시스템은 Google Gemini AI를 활용하여 데이터베이스의 데이터와 검색 키워드 간의 의미적 유사성을 분석하고, 가장 유사한 데이터를 찾아 반환하는 기능을 제공합니다.

## 주요 기능

### 1. 키워드 기반 유사성 검색
- 사용자가 입력한 키워드와 데이터베이스 레코드들 간의 의미적 유사성을 0-100 점수로 평가
- Gemini AI의 자연어 처리 능력을 활용한 정확한 의미 분석

### 2. 배치 처리
- 대량의 데이터를 효율적으로 처리하기 위한 배치 처리 시스템
- API 호출 최적화를 통한 성능 향상

### 3. 다양한 검색 옵션
- 검색 필드 선택 (username, email 등)
- 최소 유사성 점수 필터링
- 결과 개수 제한
- 사용자 역할별 필터링

## API 엔드포인트

### 1. 일반 유사성 검색
```
GET /api/search/similarity?query=검색어&field=필드명&limit=10
```

**파라미터:**
- `query` (필수): 검색할 키워드
- `field` (선택): 검색 대상 필드 (기본값: username)
- `limit` (선택): 반환할 결과 개수 (기본값: 10)

**응답 예시:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "similarity": 95,
      "explanation": "사용자명이 검색 키워드와 매우 유사함"
    }
  ],
  "meta": {
    "searchQuery": "john",
    "searchField": "username",
    "totalFound": 15,
    "returned": 1
  }
}
```

### 2. 사용자 특화 검색
```
GET /api/search/users?query=검색어&role=worker&minSimilarity=30
```

**파라미터:**
- `query` (필수): 검색할 키워드
- `searchField` (선택): 검색 대상 필드 (기본값: username)
- `role` (선택): 사용자 역할 필터 (worker, employer, admin)
- `minSimilarity` (선택): 최소 유사성 점수 (기본값: 30)
- `limit` (선택): 결과 개수 제한 (기본값: 10)

### 3. 사용자 간 유사성 비교
```
POST /api/search/compare
Content-Type: application/json

{
  "userId1": 1,
  "userId2": 2,
  "field": "username"
}
```

## 설정

### 환경 변수
```bash
# Gemini AI 설정
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=1000
GEMINI_BATCH_SIZE=10
GEMINI_MAX_RETRIES=3
GEMINI_RETRY_DELAY=1000
GEMINI_REQUEST_TIMEOUT=30000
```

### Gemini API 키 발급
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. API 키 생성
3. `.env` 파일에 `GEMINI_API_KEY` 설정

## 사용 예시

### JavaScript/Node.js
```javascript
// 유사성 검색
const response = await fetch('/api/search/similarity?query=개발자&field=username&limit=5');
const data = await response.json();

// 사용자 검색
const userSearch = await fetch('/api/search/users?query=프론트엔드&role=worker&minSimilarity=50');
const users = await userSearch.json();

// 사용자 비교
const comparison = await fetch('/api/search/compare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId1: 1,
    userId2: 2,
    field: 'username'
  })
});
```

### cURL
```bash
# 유사성 검색
curl "http://localhost:8001/api/search/similarity?query=개발자&field=username&limit=5"

# 사용자 검색
curl "http://localhost:8001/api/search/users?query=프론트엔드&role=worker&minSimilarity=50"

# 사용자 비교
curl -X POST http://localhost:8001/api/search/compare \
  -H "Content-Type: application/json" \
  -d '{"userId1": 1, "userId2": 2, "field": "username"}'
```

## 아키텍처

### 파일 구조
```
application/rest/
├── service/
│   └── similarityService.js    # Gemini AI 통합 및 유사성 분석 로직
├── controller/
│   └── searchController.js     # 검색 API 엔드포인트 처리
├── routes/
│   └── searchRoutes.js         # 라우팅 설정
├── config/
│   └── geminiConfig.js         # Gemini AI 설정
└── utils/validation/
    └── searchValidation.js     # 입력값 유효성 검사
```

### 처리 흐름
1. **요청 수신**: 클라이언트에서 검색 요청
2. **유효성 검사**: 입력 파라미터 검증
3. **데이터 조회**: 데이터베이스에서 대상 레코드 조회
4. **배치 처리**: 레코드들을 배치 단위로 분할
5. **AI 분석**: Gemini API를 통한 유사성 점수 계산
6. **결과 정렬**: 유사성 점수 기준으로 정렬
7. **응답 반환**: 클라이언트에게 결과 전송

## 성능 최적화

### 배치 처리
- 기본 배치 크기: 10개 레코드
- API 호출 횟수 최소화
- 병렬 처리 지원

### 캐싱 (향후 개선사항)
- Redis를 활용한 결과 캐싱
- 동일한 검색어에 대한 반복 요청 최적화

### 페이징 (향후 개선사항)
- 대용량 데이터 처리를 위한 페이징 구현
- 점진적 로딩 지원

## 에러 처리

### 일반적인 에러
- 400: 잘못된 요청 파라미터
- 404: 사용자를 찾을 수 없음
- 500: 서버 내부 오류

### Gemini API 에러
- API 키 누락 또는 잘못된 키
- 할당량 초과
- 네트워크 연결 오류

### 에러 응답 예시
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "검색 쿼리가 필요합니다."
}
```

## 보안 고려사항

### 입력값 검증
- XSS 방지를 위한 특수문자 필터링
- SQL 인젝션 방지
- 쿼리 길이 제한 (최대 1000자)

### API 키 보호
- 환경 변수를 통한 API 키 관리
- 로그에 민감정보 노출 방지

### 데이터 보호
- 사용자 비밀번호 등 민감정보 응답에서 제외
- 적절한 권한 검사 (향후 구현)

## 모니터링 및 로깅

### 로그 수준
- INFO: 정상적인 검색 요청 및 응답
- WARN: 잘못된 요청이나 예상 가능한 오류
- ERROR: 시스템 오류 및 예외 상황

### 로그 예시
```
[2024-01-15 10:30:45] INFO [SimilarityService] 유사성 검색 시작 - 쿼리: "개발자", 레코드 수: 25
[2024-01-15 10:30:47] INFO [SimilarityService] 유사성 검색 완료 - 최고 점수: 92
[2024-01-15 10:30:47] INFO [SearchController] 사용자 검색 요청 - 쿼리: "개발자"
```

## 향후 개선사항

### 기능 확장
- 다국어 검색 지원
- 이미지 기반 유사성 검색
- 음성 검색 지원

### 성능 개선
- 벡터 데이터베이스 연동 (Pinecone, Weaviate 등)
- 실시간 인덱싱
- 분산 처리 지원

### UI/UX 개선
- 검색 결과 하이라이팅
- 자동완성 기능
- 검색 히스토리 관리