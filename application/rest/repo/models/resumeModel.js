// application/rest/repo/models/resumeModel.js
const logger = require('../../config/logger');
const { AppDataSource } = require('../../config/dbConfig');
const { ResumeEntity } = require('../entity/resume.entity');

const resumeRepository = AppDataSource.getRepository(ResumeEntity);

const ResumeModel = {
  async create(userData) {
    const { userId, jobType, region, selfIntroduction, desiredDailyWage, skills, certificateImages } = userData;
    
    try {
      const newResume = resumeRepository.create({
        user_id: userId,
        job_type: jobType,
        region: region,
        self_introduction: selfIntroduction,
        desired_daily_wage: desiredDailyWage,
        skills: Array.isArray(skills) ? JSON.stringify(skills) : skills,
        certificate_images: Array.isArray(certificateImages) ? certificateImages : null,
        is_active: true
      });

      await resumeRepository.save(newResume);
      logger.info(`[ResumeModel-create] 이력서 생성 완료. ID: ${newResume.id}, 사용자ID: ${userId}`);
      return newResume;
      
    } catch (error) {
      logger.error(`[ResumeModel-create] 이력서 생성 오류: ${error.message}`, { userData, stack: error.stack });
      throw error;
    }
  },

  async findByUserId(userId) {
    try {
      const resumes = await resumeRepository.find({
        where: { user_id: userId },
        relations: ['user'],
        order: { created_at: 'DESC' }
      });
      return resumes;
    } catch (error) {
      logger.error(`[ResumeModel-findByUserId] 오류: ${error.message}`, { userId, stack: error.stack });
      throw error;
    }
  },

  async findById(id) {
    try {
      const resume = await resumeRepository.findOne({
        where: { id: id },
        relations: ['user']
      });
      return resume;
    } catch (error) {
      logger.error(`[ResumeModel-findById] 오류: ${error.message}`, { id, stack: error.stack });
      throw error;
    }
  },

  async findActiveResumes(filters = {}) {
    try {
      const { jobType, region, minWage, maxWage, limit = 20, offset = 0 } = filters;
      
      let queryBuilder = resumeRepository.createQueryBuilder('resume')
        .leftJoinAndSelect('resume.user', 'user')
        .where('resume.is_active = :isActive', { isActive: true })
        .andWhere('user.role = :role', { role: 'worker' });

      if (jobType) {
        queryBuilder.andWhere('resume.job_type LIKE :jobType', { jobType: `%${jobType}%` });
      }

      if (region) {
        queryBuilder.andWhere('resume.region LIKE :region', { region: `%${region}%` });
      }

      if (minWage) {
        queryBuilder.andWhere('resume.desired_daily_wage >= :minWage', { minWage });
      }

      if (maxWage) {
        queryBuilder.andWhere('resume.desired_daily_wage <= :maxWage', { maxWage });
      }

      const resumes = await queryBuilder
        .orderBy('resume.updated_at', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany();

      return resumes;
    } catch (error) {
      logger.error(`[ResumeModel-findActiveResumes] 오류: ${error.message}`, { filters, stack: error.stack });
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      const { jobType, region, selfIntroduction, desiredDailyWage, skills, certificateImages, isActive } = updateData;
      
      const updateFields = {};
      if (jobType !== undefined) updateFields.job_type = jobType;
      if (region !== undefined) updateFields.region = region;
      if (selfIntroduction !== undefined) updateFields.self_introduction = selfIntroduction;
      if (desiredDailyWage !== undefined) updateFields.desired_daily_wage = desiredDailyWage;
      if (skills !== undefined) updateFields.skills = Array.isArray(skills) ? JSON.stringify(skills) : skills;
      if (certificateImages !== undefined) updateFields.certificate_images = Array.isArray(certificateImages) ? certificateImages : null;
      if (isActive !== undefined) updateFields.is_active = isActive;

      const result = await resumeRepository.update(id, updateFields);
      
      if (result.affected === 0) {
        throw new Error('이력서를 찾을 수 없습니다.');
      }

      logger.info(`[ResumeModel-update] 이력서 업데이트 완료. ID: ${id}`);
      return await this.findById(id);
      
    } catch (error) {
      logger.error(`[ResumeModel-update] 오류: ${error.message}`, { id, updateData, stack: error.stack });
      throw error;
    }
  },

  async delete(id) {
    try {
      const result = await resumeRepository.delete(id);
      
      if (result.affected === 0) {
        throw new Error('이력서를 찾을 수 없습니다.');
      }

      logger.info(`[ResumeModel-delete] 이력서 삭제 완료. ID: ${id}`);
      return true;
      
    } catch (error) {
      logger.error(`[ResumeModel-delete] 오류: ${error.message}`, { id, stack: error.stack });
      throw error;
    }
  },

  async searchByKeyword(keyword, limit = 10) {
    try {
      const resumes = await resumeRepository.createQueryBuilder('resume')
        .leftJoinAndSelect('resume.user', 'user')
        .where('resume.is_active = :isActive', { isActive: true })
        .andWhere('user.role = :role', { role: 'worker' })
        .andWhere(`(
          resume.job_type LIKE :keyword OR 
          resume.region LIKE :keyword OR 
          resume.self_introduction LIKE :keyword OR 
          resume.skills LIKE :keyword
        )`, { keyword: `%${keyword}%` })
        .orderBy('resume.updated_at', 'DESC')
        .limit(limit)
        .getMany();

      return resumes;
    } catch (error) {
      logger.error(`[ResumeModel-searchByKeyword] 오류: ${error.message}`, { keyword, stack: error.stack });
      throw error;
    }
  }
};

module.exports = ResumeModel;