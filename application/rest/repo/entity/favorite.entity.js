// application/rest/repo/entity/favorite.entity.js
const { EntitySchema } = require("typeorm");

const FavoriteEntity = new EntitySchema({
    name: "Favorite",
    tableName: "favorites",
    columns: {
        user_id: {
            type: "int",
            primary: true,
        },
        job_posting_id: {
            type: "int",
            primary: true,
        },
        created_at: {
            type: "timestamp",
            createDate: true,
        },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "user_id" },
            onDelete: "CASCADE",
        },
        jobPosting: {
            type: "many-to-one",
            target: "JobPosting",
            joinColumn: { name: "job_posting_id" },
            onDelete: "CASCADE",
        },
    },
    indices: [
        {
            name: "IDX_FAVORITE_USER_ID",
            columns: ["user_id"],
        },
        {
            name: "IDX_FAVORITE_JOB_POSTING_ID",
            columns: ["job_posting_id"],
        },
    ],
});

module.exports = { FavoriteEntity };
