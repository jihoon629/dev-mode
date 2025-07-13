// application/rest/repo/entity/jobApplication.entity.js
const { EntitySchema } = require("typeorm");

const JobApplicationEntity = new EntitySchema({
    name: "JobApplication",
    tableName: "job_applications",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
        },
        job_posting_id: {
            type: "int",
            nullable: false,
        },
        applicant_id: {
            type: "int",
            nullable: false,
        },
        resume_id: {
            type: "int",
            nullable: false,
        },
        status: {
            type: "enum",
            enum: ['pending', 'approved', 'rejected', 'completed'],
            default: 'pending',
            nullable: false,
            comment: "지원 상태 (pending: 대기중, approved: 승인, rejected: 거절, completed: 평가완료)",
        },
        payment_date: {
            type: "date",
            nullable: true,
            comment: "급여 지급일",
        },
        payment_amount: {
            type: "int",
            nullable: true,
            comment: "급여액",
        },
        created_at: {
            type: "timestamp",
            createDate: true,
        },
        updated_at: {
            type: "timestamp",
            updateDate: true,
        },
    },
    relations: {
        jobPosting: {
            type: "many-to-one",
            target: "JobPosting",
            joinColumn: { name: "job_posting_id" },
            onDelete: "CASCADE",
        },
        applicant: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "applicant_id" },
            onDelete: "CASCADE",
        },
        resume: {
            type: "many-to-one",
            target: "Resume",
            joinColumn: { name: "resume_id" },
            onDelete: "CASCADE",
        },
    },
    indices: [
        {
            name: "IDX_JOB_APPLICATION_POSTING_ID",
            columns: ["job_posting_id"],
        },
        {
            name: "IDX_JOB_APPLICATION_APPLICANT_ID",
            columns: ["applicant_id"],
        },
        {
            name: "IDX_JOB_APPLICATION_RESUME_ID",
            columns: ["resume_id"],
        },
        {
            name: "UQ_JOB_APPLICANT",
            columns: ["job_posting_id", "applicant_id"],
            unique: true,
        },
    ],
});

module.exports = { JobApplicationEntity };
