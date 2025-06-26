// application/rest/repo/entity/user.entity.js
const { EntitySchema } = require("typeorm");

const UserEntity = new EntitySchema({
    name: "User", // 엔티티 이름 (클래스 이름처럼 사용)
    tableName: "users", // 데이터베이스 테이블 이름
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment", // auto_increment
        },
        username: {
            type: "varchar",
            length: 50,
            nullable: false,
        },
        email: {
            type: "varchar",
            length: 100,
            unique: true, // UNI
            nullable: false,
        },
        password: {
            type: "varchar",
            length: 255,
            nullable: true, // YES
        },
        role: {
            type: "enum",
            enum: ['worker', 'employer', 'admin'],
            nullable: false,
        },
        provider: {
            type: "varchar",
            length: 20,
            default: "local",
            nullable: false,
        },
        google_id: { // google_id 추가
            type: "varchar",
            length: 255,
            unique: true, // UNI
            nullable: true, // YES
        },
        created_at: {
            type: "timestamp",
            createDate: true, // 자동으로 생성 시점의 값으로 채워짐 (current_timestamp())
            nullable: true, // 테이블 정의에 맞춤
            default: () => "CURRENT_TIMESTAMP", // 명시적으로 기본값 설정
        },
        updated_at: {
            type: "timestamp",
            updateDate: true, // 자동으로 업데이트 시점의 값으로 채워짐 (on update current_timestamp())
            nullable: true, // 테이블 정의에 맞춤
            default: () => "CURRENT_TIMESTAMP", // 명시적으로 기본값 설정
            onUpdate: "CURRENT_TIMESTAMP", // 업데이트 시 값 자동 변경
        },
    },
    // 필요하다면 관계(relations)도 여기에 정의할 수 있습니다.
    // relations: {
    //     posts: {
    //         type: "one-to-many",
    //         target: "Post", // 다른 엔티티 이름
    //         inverseSide: "user"
    //     }
    // }
});

module.exports = UserEntity ;