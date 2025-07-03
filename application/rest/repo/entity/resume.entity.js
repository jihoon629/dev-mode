// application/rest/repo/entity/resume.entity.js
const { EntitySchema } = require("typeorm");

const ResumeEntity = new EntitySchema({
    name: "Resume", 
    tableName: "resumes", 
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
        name: {
            type: "varchar",
            length: 50,
            nullable: false,
            comment: "이름"
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
            comment: "희망 근무 지역"
        },
        self_introduction: {
            type: "text",
            nullable: true,
            comment: "자기소개"
        },
        desired_daily_wage: {
            type: "decimal",
            precision: 10,
            scale: 0,
            nullable: true,
            comment: "희망 일급 (원)"
        },
        skills: {
            type: "text",
            nullable: true,
            comment: "보유 기술 및 경험 (JSON 형태 또는 콤마 구분)"
        },
        history: {
            type: "int",
            nullable: true,
            comment: "경력 (년수)"
        },
        phone: {
            type: "varchar",
            length: 20,
            nullable: true,
            comment: "전화번호"
        },
        certificate_images: {
            type: "json",
            nullable: true,
            comment: "자격증 사진 URL 배열 (JSON 형태로 저장)"
        },
        is_active: {
            type: "boolean",
            default: true,
            nullable: false,
            comment: "이력서 활성화 상태"
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
            name: "IDX_RESUME_USER_ID",
            columns: ["user_id"]
        },
        {
            name: "IDX_RESUME_JOB_TYPE",
            columns: ["job_type"]
        },
        {
            name: "IDX_RESUME_REGION",
            columns: ["region"]
        },
        {
            name: "IDX_RESUME_ACTIVE",
            columns: ["is_active"]
        }
    ]
});

module.exports = { ResumeEntity };