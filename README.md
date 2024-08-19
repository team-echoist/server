 # LinkedOut
이 문서는 팀원들에게 프로젝트를 설정하고 실행하는 방법을 안내합니다.

## 목차
1. [시작하기](#시작하기)
2. [환경 변수 설정](#환경-변수-설정)
3. [Docker를 사용한 RDB 및 Redis 설정](#docker를-사용한-RDB-및-redis-설정)
4. [서버 실행](#서버-실행)

***

## 시작하기

### 1. 프로젝트 클론
먼저, 프로젝트를 클론합니다.

```bash
git clone https://github.com/team-echoist/server.git
cd server
```

<br>

### 2. 의존성 설치

프로젝트를 클론한 후, 의존성을 설치합니다. 필요의 경우 관리자 권한으로 실행합니다.
```bash
npm install
```

<br>

## 환경 변수 설정
서버를 실행하기 전에 환경 변수를 설정해야 합니다. 환경변수는 루트 경로에 `.env`파일에 설정하거나 시스템 환경 변수로 설정할 수 있습니다.
민감한 데이터의 경우 팀 채널을 확인해주세요.
```bash

SERVER_PORT=3000
SWAGGER=true
ROOT_EMAIL=
ROOT_PASSWORD=
ROOT_NAME=
TZ=Asia/Seoul
ENV=dev
SEED=true
DEFAULT_PROFILE_IMG=https://cdn.linkedoutapp.com/service/profile_icon_01.png


#DB
DB_SSL=true
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=

#Redis
REDIS_HOST=
REDIS_PORT=

#JWT
JWT_SECRET=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CUSTOM_TOKEN=

#Redirect
WEB_REGISTER_REDIRECT=http://localhost:8888/web/login
AOS_REGISTER_REDIRECT=https://linkedout.com/SignUpComplete
IOS_REGISTER_REDIRECT=https://linkedoutapp.com

WEB_CHANGE_EMAIL_REDIRECT=https://linkedoutapp.com
AOS_CHANGE_EMAIL_REDIRECT=https://linkedout.com/AccountPage
IOS_CHANGE_EMAIL_REDIRECT=https://linkedoutapp.com

WEB_PASSWORD_RESET_REDIRECT=https://linkedoutapp.com
AOS_PASSWORD_RESET_REDIRECT=https://linkedout.com/ResetPwPage
IOS_PASSWORD_RESET_REDIRECT=https://linkedoutapp.com


#Email
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=flase
EMAIL_USER=linkedoutapp@gmail.com
EMAIL_PASSWORD=zqzhjgabzeesxihi

#Oauth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CLIENT_CALLBACK=https://linkedoutapp.com/api/auth/google/callback

KAKAO_CLIENT_ID=
KAKAO_CLIENT_CALLBACK=https://linkedoutapp.com/api/auth/kakao

NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CLIENT_CALLBACK=https://linkedoutapp.com/api/auth/naver/callback

APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_CALLBACK_URL=https://linkedoutapp.com/api/auth/apple/callback
APPLE_PRIVATE_KEY=

#AWS
AWS_REGION=
AWS_S3_ACCESS_KEY=
AWS_S3_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_CLOUD_FRONT=
AWS_S3_PRIVATE_BUCKET_NAME=
SERVICE_ACCOUNT_KEY_FILE=

```

***

## Docker를 사용한 RDB 및 Redis 설정
서버 초기화에 필요한 데이터베이스, 레디스를 `Docker`로 간편하게 설정할 수 있습니다.

### 1. Docker 설치
먼저, Docker가 설치되어 있는지 확인하세요. 설치되지 않았다면 [Docker 공식 사이트](https://www.docker.com/)를 참조하여 설치하세요.

### 2. PostgreSQL 컨테이너 실행
다음 명령어를 사용하여 PostgreSQL 컨테이너를 실행하세요. 각 항목의 설정을 환경변수에 등록해야하는걸 잊지 마세요 ㅇ_<
```bash
docker run --name  -e POSTGRES_USER=your_db_user -e POSTGRES_PASSWORD=your_db_password -e POSTGRES_DB=your_db_name -p 5432:5432 -d postgres:13
```

### 3. Redis 컨테이너 실행
Redis 컨테이너는 비교적 간단하게 실행할 수 있습니다 ^모^
```bash
docker run --name my-redis -p 6379:6379 -d redis:6
```

### 4. 서버와 데이터베이스 연결
서버를 실행시키기 전 데이터베이스 컨테이너들을 활성화시키고 환경변수가 모두 등록되어야 합니다.
디스코드 서버의 `서버자료`를 참조하세요.

***

## 서버 실행
고생은 ~~아마도~~ 끝났습니다. 다음 명령으를 실행하세요.
```bash
npm run start:dev
```