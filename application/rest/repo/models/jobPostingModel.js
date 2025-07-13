const geocodingService = require('../../service/geocodingService');
const logger = require('../../config/logger');
const { AppDataSource } = require('../../config/dbConfig');
const { JobPostingEntity } = require('../entity/jobPosting.entity');

const jobPostingRepository = AppDataSource.getRepository(JobPostingEntity);

const JobPostingModel = {
  async create(postingData) {
    const { 
      userId, title, jobType, region, siteDescription, dailyWage, requiredSkills,
      workStartDate, workEndDate, workHours, contactInfo 
    } = postingData;
    
    try {
      const coords = await geocodingService.getCoordinates(region);

      const newJobPosting = jobPostingRepository.create({
        user_id: userId,
        title: title,
        job_type: jobType,
        region: region,
        location: coords ? `POINT(${coords.longitude} ${coords.latitude})` : null,
        site_description: siteDescription,
        daily_wage: dailyWage,
        required_skills: Array.isArray(requiredSkills) ? JSON.stringify(requiredSkills) : requiredSkills,
        work_start_date: workStartDate,
        work_end_date: workEndDate,
        work_hours: workHours,
        contact_info: contactInfo,
        is_active: true,
        view_count: 0
      });

      await jobPostingRepository.save(newJobPosting);
      logger.info(`[JobPostingModel-create] 공고 생성 완료. ID: ${newJobPosting.id}, 사용자ID: ${userId}`);
      return newJobPosting;
      
    } catch (error) {
      logger.error(`[JobPostingModel-create] 공고 생성 오류: ${error.message}`, { postingData, stack: error.stack });
      throw error;
    }
  },

  async findByUserId(userId) {
    try {
      const queryBuilder = jobPostingRepository.createQueryBuilder('posting')
        .leftJoinAndSelect('posting.user', 'user')
        .where('posting.user_id = :userId', { userId })
        .addSelect(subQuery => {
          return subQuery
            .select('COUNT(*)', 'applicantCount')
            .from('job_applications', 'application')
            .where('application.job_posting_id = posting.id');
        }, 'applicantCount')
        .addSelect(subQuery => {
          return subQuery
            .select('COUNT(*)', 'approvedApplicantCount')
            .from('job_applications', 'application')
            .where('application.job_posting_id = posting.id')
            .andWhere("application.status = 'completed'");
        }, 'completedApplicantCount')
        .orderBy('posting.created_at', 'DESC');

      const postings = await queryBuilder.getRawAndEntities();

      return postings.entities.map((entity, index) => ({
        ...entity,
        applicantCount: parseInt(postings.raw[index].applicantCount, 10),
        completedApplicantCount: parseInt(postings.raw[index].completedApplicantCount, 10),
        is_payroll_completed: postings.raw[index].posting_is_payroll_completed, // is_payroll_completed 추가
      }));

    } catch (error) {
      logger.error(`[JobPostingModel-findByUserId] 오류: ${error.message}`, { userId, stack: error.stack });
      throw error;
    }
  },

  async findById(id) {
    try {
      const posting = await jobPostingRepository.findOne({
        where: { id: id },
        relations: ['user']
      });
      return posting;
    } catch (error) {
      logger.error(`[JobPostingModel-findById] 오류: ${error.message}`, { id, stack: error.stack });
      throw error;
    }
  },

  async findActivePostings(filters = {}) {
    try {
      const { jobType, region, minWage, maxWage, startDate, endDate, status = 'recruiting', limit = 20, offset = 0 } = filters;
      
      let queryBuilder = jobPostingRepository.createQueryBuilder('posting')
        .leftJoinAndSelect('posting.user', 'user')
        .where('posting.is_active = :isActive', { isActive: true })
        .andWhere('posting.status = :status', { status })
        .andWhere('user.role = :role', { role: 'employer' });

      if (jobType) {
        queryBuilder.andWhere('posting.job_type LIKE :jobType', { jobType: `%${jobType}%` });
      }

      if (region) {
        queryBuilder.andWhere('posting.region LIKE :region', { region: `%${region}%` });
      }

      if (minWage) {
        queryBuilder.andWhere('posting.daily_wage >= :minWage', { minWage });
      }

      if (maxWage) {
        queryBuilder.andWhere('posting.daily_wage <= :maxWage', { maxWage });
      }

      if (startDate) {
        queryBuilder.andWhere('posting.work_start_date >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('posting.work_end_date <= :endDate', { endDate });
      }

      const postings = await queryBuilder
        .orderBy('posting.created_at', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany();

      return postings;
    } catch (error) {
      logger.error(`[JobPostingModel-findActivePostings] 오류: ${error.message}`, { filters, stack: error.stack });
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      const { 
        title, jobType, region, siteDescription, dailyWage, requiredSkills,
        workStartDate, workEndDate, workHours, contactInfo, isActive 
      } = updateData;
      
      const updateFields = {};
      if (title !== undefined) updateFields.title = title;
      if (jobType !== undefined) updateFields.job_type = jobType;
      if (region !== undefined) {
        updateFields.region = region;
        const coords = await geocodingService.getCoordinates(region);
        if (coords) {
          updateFields.location = `POINT(${coords.longitude} ${coords.latitude})`;
        }
      }
      if (siteDescription !== undefined) updateFields.site_description = siteDescription;
      if (dailyWage !== undefined) updateFields.daily_wage = dailyWage;
      if (requiredSkills !== undefined) updateFields.required_skills = Array.isArray(requiredSkills) ? JSON.stringify(requiredSkills) : requiredSkills;
      if (workStartDate !== undefined) updateFields.work_start_date = workStartDate;
      if (workEndDate !== undefined) updateFields.work_end_date = workEndDate;
      if (workHours !== undefined) updateFields.work_hours = workHours;
      if (contactInfo !== undefined) updateFields.contact_info = contactInfo;
      if (isActive !== undefined) updateFields.is_active = isActive;

      const result = await jobPostingRepository.update(id, updateFields);
      
      if (result.affected === 0) {
        throw new Error('공고를 찾을 수 없습니다.');
      }

      logger.info(`[JobPostingModel-update] 공고 업데이트 완료. ID: ${id}`);
      return await this.findById(id);
      
    } catch (error) {
      logger.error(`[JobPostingModel-update] 오류: ${error.message}`, { id, updateData, stack: error.stack });
      throw error;
    }
  },

  async delete(id) {
    try {
      const result = await jobPostingRepository.delete(id);
      
      if (result.affected === 0) {
        throw new Error('공고를 찾을 수 없습니다.');
      }

      logger.info(`[JobPostingModel-delete] 공고 삭제 완료. ID: ${id}`);
      return true;
      
    } catch (error) {
      logger.error(`[JobPostingModel-delete] 오류: ${error.message}`, { id, stack: error.stack });
      throw error;
    }
  },

  async incrementViewCount(id) {
    try {
      await jobPostingRepository.increment({ id }, 'view_count', 1);
      logger.info(`[JobPostingModel-incrementViewCount] 조회수 증가. ID: ${id}`);
    } catch (error) {
      logger.error(`[JobPostingModel-incrementViewCount] 오류: ${error.message}`, { id, stack: error.stack });
      throw error;
    }
  },

  async updateStatus(id, status) {
    try {
      const result = await jobPostingRepository.update(id, { status });
      if (result.affected === 0) {
        throw new Error('공고를 찾을 수 없습니다.');
      }
      logger.info(`[JobPostingModel-updateStatus] 공고 상태 업데이트 완료. ID: ${id}, 상태: ${status}`);
      return await this.findById(id);
    } catch (error) {
      logger.error(`[JobPostingModel-updateStatus] 오류: ${error.message}`, { id, status, stack: error.stack });
      throw error;
    }
  },

  async searchByKeyword(keyword, limit = 10) {
    try {
      const postings = await jobPostingRepository.createQueryBuilder('posting')
        .leftJoinAndSelect('posting.user', 'user')
        .where('posting.is_active = :isActive', { isActive: true })
        .andWhere('user.role = :role', { role: 'employer' })
        .andWhere(`(
          posting.job_type LIKE :keyword OR 
          posting.region LIKE :keyword OR 
          posting.site_description LIKE :keyword OR 
          posting.required_skills LIKE :keyword
        )`, { keyword: `%${keyword}%` })
        .orderBy('posting.created_at', 'DESC')
        .limit(limit)
        .getMany();

      return postings;
    } catch (error) {
      logger.error(`[JobPostingModel-searchByKeyword] 오류: ${error.message}`, { keyword, stack: error.stack });
      throw error;
    }
  },

  async findAllActive() {
    try {
      const postings = await jobPostingRepository.find({
        where: { is_active: true, status: 'recruiting' },
        relations: ['user'],
        order: { created_at: 'DESC' }
      });
      return postings;
    } catch (error) {
      logger.error(`[JobPostingModel-findAllActive] 오류: ${error.message}`, { stack: error.stack });
      throw error;
    }
  },

  async findByDistance(latitude, longitude, distance, limit = 20, offset = 0) {
    try {
      const origin = { type: 'Point', coordinates: [longitude, latitude] };
      const query = jobPostingRepository.createQueryBuilder("posting")
        .leftJoinAndSelect('posting.user', 'user')
        .addSelect(`ST_Distance_Sphere(posting.location, ST_GeomFromText(:origin, 4326)) / 1000`, "distance")
        .addSelect(`ST_AsText(posting.location)`, "locationText") // location을 텍스트 형태로 가져옴
        .where('posting.is_active = :isActive', { isActive: true })
        .andWhere('user.role = :role', { role: 'employer' })
        .andWhere(`ST_Distance_Sphere(posting.location, ST_GeomFromText(:origin, 4326)) < :dist`)
        .setParameters({
          origin: `POINT(${longitude} ${latitude})`,
          dist: distance * 1000 // km to meters
        })
        .orderBy("distance", "ASC")
        .limit(limit)
        .offset(offset)
        .getRawAndEntities();

      const results = await query;
      return results.entities.map((entity, index) => {
        const locationText = results.raw[index].locationText; // 텍스트 형태의 location
        let parsedLocation = null;

        if (locationText) {
          // POINT(경도 위도) 형태의 문자열을 파싱
          const match = locationText.match(/POINT\((\S+) (\S+)\)/);
          if (match && match.length === 3) {
            const lon = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            parsedLocation = { type: 'Point', coordinates: [lon, lat] };
          }
        }

        return {
          ...entity,
          distance: results.raw[index].distance,
          location: parsedLocation
        };
      });

    } catch (error) {
      logger.error(`[JobPostingModel-findByDistance] 오류: ${error.message}`, { latitude, longitude, distance, stack: error.stack });
      throw error;
    }
  },

  async updatePayrollCompletedStatus(jobPostingId, status) {
    try {
        const result = await jobPostingRepository.update(jobPostingId, { is_payroll_completed: status });
        if (result.affected === 0) {
            throw new Error('공고를 찾을 수 없습니다.');
        }
        logger.info(`[JobPostingModel-updatePayrollCompletedStatus] 공고 ${jobPostingId} 급여 지급 완료 상태 업데이트: ${status}`);
        return true;
    } catch (error) {
        logger.error(`[JobPostingModel-updatePayrollCompletedStatus] 오류: ${error.message}`, { jobPostingId, status, stack: error.stack });
        throw error;
    }
  }
};

module.exports = JobPostingModel;