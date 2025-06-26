// application/rest/repo/entity/test.entity.js
const { EntitySchema } = require("typeorm");

const TestEntity = new EntitySchema({
    name: "Test", // 엔티티 이름 (코드 내에서 사용)
    tableName: "tests", // 데이터베이스에 생성될 테이블 이름
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: "increment",
            comment: "고유 아이디",
        },
        name: {
            type: "varchar",
            length: 255,
            nullable: false,
            comment: "테스트 항목 이름",
        },
        description: {
            type: "text",
            nullable: true, // 설명은 없을 수도 있음
            comment: "테스트 항목 상세 설명",
        },
        is_active: { // 예시용 boolean 필드
            type: "boolean",
            default: true,
            comment: "활성화 여부",
        },
        created_at: {
            type: "timestamp",
            createDate: true, // 엔티티 생성 시 자동으로 현재 시간 저장
            comment: "생성 일시",
        },
        updated_at: {
            type: "timestamp",
            updateDate: true, // 엔티티 업데이트 시 자동으로 현재 시간 저장
            comment: "수정 일시",
        },
    },
    // 필요하다면 인덱스나 관계(relations)도 여기에 정의할 수 있습니다.
    // indices: [
    //     {
    //         name: "IDX_TEST_NAME",
    //         columns: ["name"],
    //     },
    // ],
    // relations: {
    //     user: { // 예를 들어 User 엔티티와의 관계
    //         type: "many-to-one",
    //         target: "User", // UserEntity의 name 옵션 값
    //         joinColumn: { name: "user_id" }, // 외래키 컬럼명
    //         inverseSide: "tests" // UserEntity에 정의될 관계 필드명 (선택)
    //     }
    // }
});

module.exports = { TestEntity };