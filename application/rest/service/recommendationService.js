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
    const llmResponse = await llmService.generateTextWithGemini(prompt);

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
      - 자기소개: ${resume.self_introduction}
      - 보유 기술: ${resume.skills}
      - 희망 일급: ${resume.desired_daily_wage}
    `;

    const jobPostingsText = jobPostings.map(job => `
      - 공고 ID: ${job.id}
      - 직종: ${job.job_type}
      - 근무 지역: ${job.region}
      - 현장 소개: ${job.site_description}
      - 필요 기술: ${job.required_skills}
      - 일급: ${job.daily_wage}
    `).join('\n---\n');

    return `
      당신은 구직자의 이력서와 채용 공고를 분석하여 가장 적합한 일자리를 추천하는 전문 AI 매칭 전문가입니다.

      [구직자 이력서]
      ${resumeText}

      [전체 채용 공고 목록]
      ${jobPostingsText}

      [요청]
      이력서 내용을 바탕으로, 아래의 [채점 기준]에 따라 각 채용 공고의 적합도를 평가하고, 가장 높은 점수를 받은 공고를 최대 3개까지 추천해주세요.

      [채점 기준]
      1.  **직종 일치도 (최대 40점)**: 이력서의 '직종'과 공고의 '직종'이 얼마나 유사한지 평가합니다. (예: '건설'과 '건축'은 높은 점수, '건설'과 '서비스'는 낮은 점수)
      2.  **지역 근접성 (최대 30점)**: 이력서의 '희망 지역'과 공고의 '근무 지역'이 일치하거나 가까울수록 높은 점수를 부여합니다. (예: '서울'과 '서울'은 만점, '서울'과 '경기'는 감점, '서울'과 '부산'은 0점)
      3.  **기술 적합성 (최대 20점)**: 이력서의 '보유 기술'이 공고의 '필요 기술'과 얼마나 일치하는지 평가합니다.
      4.  **급여 적정성 (최대 10점)**: 공고의 '일급'이 이력서의 '희망 일급'과 비슷하거나 높을 경우 점수를 부여합니다. (단, 너무 차이가 나면 감점될 수 있습니다.)

      [출력 형식]
      반드시 다음 JSON 배열 형식으로만 응답해주세요. 다른 설명이나 서론, 결론은 절대 추가하지 마세요.
      [
        {
          "jobPostingId": <추천 공고 ID (숫자)>,
          "matchScore": <위 채점 기준에 따라 계산된 최종 점수 (1-100 사이의 숫자)>,
          "reason": "<채점 기준 각 항목에 대한 점수와 그 이유를 간결하게 설명>"
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
      const cleanedResponse = llmResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      if (!Array.isArray(parsed)) {
        throw new Error('LLM 응답이 배열 형식이 아닙니다.');
      }

      const recommendationsMap = new Map(parsed.map(p => [p.jobPostingId, { reason: p.reason, matchScore: p.matchScore }]));
      
      return allJobPostings
        .filter(job => recommendationsMap.has(job.id))
        .map(job => ({
          ...job, // 기존 공고 정보
          recommendation: recommendationsMap.get(job.id) // 추천 이유와 점수 추가
        }))
        .sort((a, b) => b.recommendation.matchScore - a.recommendation.matchScore); // 점수 순으로 정렬

    } catch (error) {
      logger.error(`[RecommendationService] LLM 응답 파싱 오류: ${error.message}`, { llmResponse });
      return []; // 파싱 실패 시 빈 배열 반고
    }
  }
}

module.exports = new RecommendationService();
