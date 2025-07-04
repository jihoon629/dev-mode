const { EntitySchema } = require("typeorm");

const JobPostingEntity = new EntitySchema({
    name: "JobPosting", 
    tableName: "job_postings", 
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        user_id: {
            type: "int",
            nullable: false,
        },
        title: {
            type: "varchar",
            length: 255,
            nullable: false,
            comment: "공고 제목"
        },
        job_type: {
            type: "varchar",
            length: 100,
            nullable: false,
            comment: "직종 (예: 건설, 제조, 서비스 등)"
        },
        region: {
            type: "varchar",
            length: 100,
            nullable: false,
            comment: "근무 지역"
        },
        location: {
            type: "point",
            nullable: true,
            spatial: true,
            comment: "위치 (위도, 경도)"
        },
        site_description: {
            type: "text",
            nullable: true,
            comment: "현장 소개 및 업무 내용"
        },
        daily_wage: {
            type: "decimal",
            precision: 10,
            scale: 0,
            nullable: false,
            comment: "일급 (원)"
        },
        required_skills: {
            type: "text",
            nullable: true,
            comment: "필요 기술 및 경험 (JSON 형태 또는 콤마 구분)"
        },
        work_start_date: {
            type: "date",
            nullable: true,
            comment: "작업 시작 예정일"
        },
        work_end_date: {
            type: "date",
            nullable: true,
            comment: "작업 종료 예정일"
        },
        work_hours: {
            type: "varchar",
            length: 50,
            nullable: true,
            comment: "근무 시간 (예: 08:00-18:00)"
        },
        contact_info: {
            type: "varchar",
            length: 100,
            nullable: true,
            comment: "연락처 정보"
        },
        is_active: {
            type: "boolean",
            default: true,
            nullable: false,
            comment: "공고 활성화 상태"
        },
        view_count: {
            type: "int",
            default: 0,
            nullable: false,
            comment: "조회 수"
        },
        created_at: {
            type: "timestamp",
            createDate: true,
            nullable: true,
            default: () => "CURRENT_TIMESTAMP",
        },
        updated_at: {
            type: "timestamp",
            updateDate: true,
            nullable: true,
            default: () => "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
        },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: {
                name: "user_id",
                referencedColumnName: "id"
            },
            onDelete: "CASCADE",
        }
    },
    indices: [
        {
            name: "IDX_JOB_POSTING_USER_ID",
            columns: ["user_id"]
        },
        {
            name: "IDX_JOB_POSTING_JOB_TYPE",
            columns: ["job_type"]
        },
        {
            name: "IDX_JOB_POSTING_REGION",
            columns: ["region"]
        },
        {
            name: "IDX_JOB_POSTING_ACTIVE",
            columns: ["is_active"]
        },
        {
            name: "IDX_JOB_POSTING_WAGE",
            columns: ["daily_wage"]
        },
        {
            name: "IDX_JOB_POSTING_START_DATE",
            columns: ["work_start_date"]
        }
    ]
});

module.exports = { JobPostingEntity };