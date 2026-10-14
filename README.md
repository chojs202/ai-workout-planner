# AI Workout Planner & Tracker

React와 Express를 사용해 AI 운동 루틴을 생성하고 실제 운동 기록을 관리하는 프로젝트입니다.

## 프로젝트 구조

- `client`: React + TypeScript
- `server`: Node.js + Express + TypeScript + MongoDB

## 시작 방법

1. 패키지를 설치합니다.

   ```bash
   npm install
   ```

2. `server/.env.example`을 참고하여 `server/.env`를 생성합니다.

3. 클라이언트와 서버를 각각 실행합니다.

   ```bash
   npm run dev:client
   npm run dev:server
   ```

## 기본 주소

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
- Health check: `GET http://localhost:5000/api/health`

