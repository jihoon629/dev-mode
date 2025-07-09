// application/rest/service/recommendationService.js
const ResumeModel = require('../repo/models/resumeModel');
const JobPostingModel = require('../repo/models/jobPostingModel');
const llmService = require('./llmService');
const logger = require('../config/logger');

class RecommendationService {
  /**
   * 특정 이력서에 가장 적합한 채용 공고를 LLM을 통해 추천받습니다.
   * @param {number} resumeId - 추천의 기반이 될 이력서의 ID
   * @returns {Promise<Array>} 추천된 채용 공고 목록과 추천 이유
   */
  async recommendJobsForResume(resumeId) {
    logger.info(`[RecommendationService] 이력서 ID ${resumeId}에 대한 공고 추천 시작`);
    
    // 1. 이력서 정보 조회
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      logger.warn(`[RecommendationService] 이력서 ID ${resumeId}를 찾을 수 없습니다.`);
      throw new Error('이력서를 찾을 수 없습니다.');
    }
    
    // 2. 활성화된 모든 채용 공고 조회 (필터링은 LLM이 수행)
    const allJobPostings = await JobPostingModel.findActivePostings();
    if (allJobPostings.length === 0) {
      logger.info('[RecommendationService] 추천할 활성 채용 공고가 없습니다.');
      return [];
    }
    
    // 3. LLM에 전달할 프롬프트 생성
    const prompt = this.createRecommendationPrompt(resume, allJobPostings);
    
    // 4. LLM 서비스 호출
        const llmResponse = await llmService.generateTextWithClaude(prompt);
    
    // 5. LLM 응답 파싱 및 결과 반환
    const recommendations = this.parseLlmResponse(llmResponse, allJobPostings);
    
    logger.info(`[RecommendationService] 이력서 ID ${resumeId}에 대해 ${recommendations.length}개의 공고 추천 완료`);
    return recommendations;
  }

  /**
   * LLM에게 전달할 프롬프트를 생성합니다.
   * @param {object} resume - 사용자 이력서 객체
   * @param {Array} jobPostings - 전체 채용 공고 목록
   * @returns {string} 생성된 프롬프트 문자열
   */
  createRecommendationPrompt(resume, jobPostings) {
    const resumeText = `
      - 직종: ${resume.job_type}
      - 희망 지역: ${resume.region}
      - 경력: ${resume.history ? `${resume.history}년` : '신입/경력 미상'}
      - 자기소개: ${resume.self_introduction || '정보 없음'}
      - 보유 기술: ${resume.skills || '정보 없음'}
      - 희망 일급: ${resume.desired_daily_wage ? `${resume.desired_daily_wage}원` : '희망 일급 미설정'}
    `;

    const jobPostingsText = jobPostings.map(job => `
      - 공고 ID: ${job.id}
      - 제목: ${job.title}
      - 직종: ${job.job_type}
      - 근무 지역: ${job.region}
      - 현장 소개: ${job.site_description || '정보 없음'}
      - 필요 기술: ${job.required_skills || '정보 없음'}
      - 일급: ${job.daily_wage}원
      - 작업 기간: ${job.work_start_date || '미정'} ~ ${job.work_end_date || '미정'}
      - 근무 시간: ${job.work_hours || '정보 없음'}
      - 공고 상태: ${job.status}
    `).join('\n---\n');

    return `
      당신은 구직자의 이력서와 채용 공고를 분석하여 가장 적합한 일자리를 추천하는 전문 AI 매칭 전문가입니다.

      [구직자 이력서]
      ${resumeText}

      [전체 채용 공고 목록]
      ${jobPostingsText}

      [요청]
      이력서 내용을 바탕으로, 아래의 [채점 기준]에 따라 각 채용 공고의 적합도를 평가하고, 가장 높은 점수를 받은 공고를 최대 5개까지 추천해주세요.

      [채점 기준]
      1. **직종 일치도 (최대 35점)**: 이력서의 '직종'과 공고의 '직종'이 얼마나 유사한지 평가합니다.
         - 완전 일치: 35점
         - 유사 분야: 25-30점 (예: '건설'과 '건축', '제조'와 '생산')
         - 관련 분야: 15-20점 (예: '건설'과 '인테리어')
         - 무관한 분야: 0-10점

      2. **지역 근접성 (최대 25점)**: 이력서의 '희망 지역'과 공고의 '근무 지역'이 일치하거나 가까울수록 높은 점수를 부여합니다.
         - 완전 일치: 25점
         - 인근 지역: 15-20점 (예: '서울'과 '경기', '부산'과 '경남')
         - 같은 권역: 10-15점 (예: '서울'과 '인천', '대구'와 '경북')
         - 먼 지역: 0-5점

      3. **기술 적합성 (최대 20점)**: 이력서의 '보유 기술'이 공고의 '필요 기술'과 얼마나 일치하는지 평가합니다.
         - 필요 기술 대부분 보유: 20점
         - 필요 기술 일부 보유: 10-15점
         - 관련 기술 보유: 5-10점
         - 기술 정보 없음 또는 무관: 0-5점

      4. **경력 적합성 (최대 15점)**: 이력서의 '경력'이 해당 직종에 적합한지 평가합니다.
         - 5년 이상 경력: 15점
         - 3-5년 경력: 12점
         - 1-3년 경력: 8점
         - 1년 미만 또는 신입: 5점
         - 경력 정보 없음: 3점

      5. **급여 적정성 (최대 5점)**: 공고의 '일급'이 이력서의 '희망 일급'과 비교하여 평가합니다.
         - 희망 일급과 같거나 높음: 5점
         - 희망 일급의 90% 이상: 4점
         - 희망 일급의 80% 이상: 2-3점
         - 희망 일급의 80% 미만: 0-1점
         - 희망 일급 미설정: 3점 (기본점수)

      [추가 고려사항]
      - 공고 상태가 'recruiting'인 경우만 추천 대상으로 합니다.
      - 현장 소개가 자세할수록 가점을 부여합니다.
      - 전체 점수는 100점 만점으로 계산합니다.

      [출력 형식]
      반드시 다음 JSON 배열 형식으로만 응답해주세요. 다른 설명이나 서론, 결론은 절대 추가하지 마세요.

      [
        {
          "jobPostingId": <추천 공고 ID (숫자)>,
          "matchScore": <위 채점 기준에 따라 계산된 최종 점수 (1-100 사이의 숫자)>,
          "reasonDetails": {
            "jobTypeMatch": {
              "score": <직종 일치도 점수 (0-35)>,
              "description": "<매칭 이유 설명>"
            },
            "locationProximity": {
              "score": <지역 근접성 점수 (0-25)>,
              "description": "<매칭 이유 설명>"
            },
            "skillCompatibility": {
              "score": <기술 적합성 점수 (0-20)>,
              "description": "<매칭 이유 설명>"
            },
            "careerSuitability": {
              "score": <경력 적합성 점수 (0-15)>,
              "description": "<매칭 이유 설명>"
            },
            "salaryAdequacy": {
              "score": <급여 적정성 점수 (0-5)>,
              "description": "<매칭 이유 설명>"
            }
          }
        }
      ]
    `;
  }

  /**
   * LLM의 응답(JSON 문자열)을 파싱하고 원래 공고 데이터와 결합합니다.
   * @param {string} llmResponse - LLM이 생성한 JSON 형식의 문자열
   * @param {Array} allJobPostings - 전체 채용 공고 목록
   * @returns {Array} 추천 정보가 포함된 공고 객체 배열
   */
  parseLlmResponse(llmResponse, allJobPostings) {
    try {
      // JSON 코드 블록 마커 제거
      const cleanedResponse = llmResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(parsed)) {
        throw new Error('LLM 응답이 배열 형식이 아닙니다.');
      }

      const validRecommendations = parsed.filter(item => {
        return item.jobPostingId && 
               typeof item.matchScore === 'number' && 
               item.matchScore >= 1 && 
               item.matchScore <= 100 &&
               item.reasonDetails &&
               typeof item.reasonDetails === 'object';
      });

      if (validRecommendations.length === 0) {
        logger.warn('[RecommendationService] 유효한 추천 결과가 없습니다.');
        return [];
      }

      // 추천 정보 매핑
      const recommendationsMap = new Map(
        validRecommendations.map(p => [
          p.jobPostingId, 
          { 
            reasonDetails: p.reasonDetails, 
            matchScore: p.matchScore 
          }
        ])
      );
      
      // 공고 데이터와 추천 정보 결합
      return allJobPostings
        .filter(job => recommendationsMap.has(job.id))
        .map(job => ({
          ...job, // 기존 공고 정보
          recommendation: recommendationsMap.get(job.id) // 추천 이유와 점수 추가
        }))
        .sort((a, b) => b.recommendation.matchScore - a.recommendation.matchScore); // 점수 순으로 정렬
        
    } catch (error) {
      logger.error(`[RecommendationService] LLM 응답 파싱 오류: ${error.message}`, { 
        llmResponse: llmResponse.substring(0, 500) + '...' // 로그 크기 제한
      });
      return []; // 파싱 실패 시 빈 배열 반환
    }
  }
}

module.exports = new RecommendationService();