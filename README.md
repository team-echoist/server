 # LinkedOut
이 문서는 팀원들에게 프로젝트를 설정하고 실행하는 방법을 안내합니다.

## 목차
1. [환경구축](#환경구축)
2. [프로젝트 클론](#프로젝트-클론)
3. [환경 변수 설정](#환경-변수-설정)
4. [Docker를 사용한 RDB 및 Redis 설정](#docker를-사용한-RDB-및-redis-설정)
5. [서버 실행](#서버-실행)

***

## 환경구축
### 1. 필수 소프트웨어 설치
> Node.js 설치

- ### _Windows_
    - [Node.js 공식 웹사이트](https://nodejs.org/en) 에서 LTS 버전을 다룬로드하여 설치합니다.


- ### _Mac_
    - 터미널(혹은 iterm 등..)을 열고 아래 명령어를 입력해 Homebrew를 설치합니다.
  ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
    - Homebrew를 사용하여 Node.js를 설치합니다
  ```bash
  brew install node 
  ```
<br> 
<br> 

> Node.js 설치 확인

- ### 설치가 완료되면 아래 명령어로 설치를 확인합니다.
  ```bash
  node -v
  npm -v
  ```
   - 위 명령어가 정상적으로 버전을 출력하면 설치가 완료된 것입니다.

<br> 
<br> 

### 2. Docker 설치
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 을 다운로드하여 설치합니다.
- Docker 설치 후 Windows의 경우 설정에서 WSL2 기반 엔진 사용을 활성화 합니다.
- 설정해서 필요한 권한을 부여한 뒤 실행 상태를 확인합니다. 앱의 GUI로도 확인이 가능합니다.
```bash
docker --version 
```
<br>
<br>

## 프로젝트 클론
### 1. 프로젝트를 클론합니다.

```bash
git clone https://github.com/team-echoist/server.git
cd server
```

<br>

### 2. 의존성 설치

프로젝트를 클론한 후, 의존성을 설치합니다. 특정한 경우 관리자 권한이 필요할 수 있습니다.
```bash
npm install
```

<br>

## 환경 변수 설정
서버를 실행하기 전에 환경 변수를 설정해야 합니다. 환경변수는 루트 경로에 `.env`파일에 설정하거나 시스템 환경 변수로 설정할 수 있습니다.
팀 채널을 확인해주세요.

***
<br>

## Docker를 사용한 RDB 및 Redis 설정
서버 초기화에 필요한 데이터베이스, 레디스를 `Docker`로 간편하게 설정할 수 있습니다.

### 1. PostgreSQL 컨테이너 실행
- 다음 명령어를 사용하여 PostgreSQL 컨테이너를 실행하세요. 각 항목의 설정을 환경변수에 등록해야하는걸 잊지마세요.
```bash
docker run --name your_container_name -e POSTGRES_USER=your_db_user -e POSTGRES_PASSWORD=your_db_password -e POSTGRES_DB=your_db_name -p 5432:5432 -d postgres:13
```
- 혹은 Docker desktop 의 GUI를 사용해 컨테이너를 생성/실행 할 수 있습니다. 

### 3. Redis 컨테이너 실행
- Redis 컨테이너는 비교적 간단하게 실행할 수 있습니다.
```bash
docker run --name your_container_name -p 6379:6379 -d redis:6
```
- 혹은 Docker desktop 의 GUI를 사용해 컨테이너를 생성/실행 할 수 있습니다. 

### 4. 서버와 데이터베이스 연결
서버를 실행시키기 전 데이터베이스 컨테이너들을 활성화시키고 환경변수가 모두 등록되어야 합니다.
디스코드 서버의 `서버자료`를 참조하거나 담당자를 호출하세요(멱살)

***

## 서버 실행
- 다음 명령어로 서버를 실행합니다.
- 서버 초기화에 실패할 경우 백엔드 개발자에게 문의해주세요.
- 마이그레이션에서 특정 부분이 누락되는것을 확인했습니다. 다음 경로에서 옵션을 변경해 서버를 실행하세요.
<br>
`/src/config/typeorm.config.ts`
`synchronize: true`

```bash
npm run start:dev
```