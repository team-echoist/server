## 개발환경으로 서버 실행하기

`npm run start:dev` hot reload 적용해놓음

<br />

## Branch Conventions
깃플로우..\
feature 브렌치 네이밍 : feature/{이름}/{기능} 

<br />

## Commit Conventions

### 메시지 구조
```
type: subject

body

footer
```

### type
- feat : 새로운 기능
- fix : 버그 수정
- docs : 문서 관련
- style : 코드 포맷팅 등 코드변경이 없는 경우
- refactor : 리팩토링
- test : 테스트 코드, 리팩토링 테스트 코드 추가
- chore : 빌드 업무, 패키지 매니저 수정, 프로덕션과 무관한 부분
- comment : 주석
- remove : 파일 삭제
- rename : 파일 수정

### subject
- Add : 추가
- Remove : 삭제
- Simplify : 단순화
- Update : 보완
- Implement : 구현
- Prevent : 방지
- Move : 이동
- Rename : 이름 변경

### semantic-release
#### Major Release (주 버전 증가)
- BREAKING CHANGE: 커밋 메시지에 BREAKING CHANGE를 포함하는 경우 주 버전이 증가해. 이는 하위 호환성이 깨지는 변경 사항을 의미해.

#### Minor Release (부 버전 증가)
- feat: 새로운 기능을 추가하는 경우 부 버전이 증가. 예: feat: add new user login feature

#### Patch Release (수 버전 증가)
- fix: 버그를 수정하는 경우 수 버전이 증가. 예: fix: correct minor typos in code
- perf: 성능을 개선하는 경우 수 버전이 증가. 예: perf: improve query performance
- refactor: 코드 리팩토링을 하는 경우 수 버전이 증가. 예: refactor: simplify login logic

<br/>

#### 증가하지 않는 경우
- docs: 문서 업데이트. 예: docs: update README
- style: 코드 스타일 변경. 예: style: format code
- test: 테스트 추가 또는 수정. 예: test: add new test cases
- chore: 빌드 작업이나 도구 업데이트. 예: chore: update dependencies

<br />

## Naming Convention
- 상수, env : SCREAM_SNAKE_CASE
- 클래스 : PascalCase
- 변수, 함수 : camelCase
- data : snake_case
- 약어는 모두 대문자로, 혹은 모두 소문자로 표기

<br />

## ETC Convention
+ DTO : 작업명 + 목적지 + 요청 or 반환\
ex`CreateUserReq.dto`
+ deco : 라우트핸들러, 스웨거(operation, body, response), 인터셉터, 파이프, 가드 순

<br />

## Test code

'무조건 테스트 주도형 개발을 해야해' 는 익숙하지 않은 우리에게 지옥일 수 있음 \
그냥 적당히 하세요. (테스트 주도 보단 완성시킨 후 테스트 코드를 작성하셔도 무방)

e2e는 나중에 어느정도 완성되면 시나리오 만들어보는걸로

+ `npm run test` : 자동으로 .spec 을 찾아 테스트코드를 실행해줍니다.
+ `npm run test:cov:` : 테스트 커버리지 레포트를 생성하고(html) 터미널에도 출력해줌 \
	*커버리지의 지표가 높다고 무조건 좋은건 아님 (테스트의 질이 좋아야지..)*

아래는 테스트 커버리지 속성
+ Statements : 구문 비율. 원본 코드의 ';' 를 기준
+ Branches : 분기. 코드에 조건문이 있을 때 모든 조건을 테스트 하는지 라고 생각하시면 될듯
+ Functions : 함수를 기준으로
+ Lines : 줄을 기준으로(빈 줄 제외)

<br />