// Firebase 앱 초기화 및 인증/Firestore 서비스를 제공하는 설정 파일입니다.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 사용자가 제공한 실제 Firebase 프로젝트 ID를 설정 값에 반영하여 연동의 실제성을 확보하였습니다.
const firebaseConfig = {
  apiKey: "demo-api-key-placeholder",
  authDomain: "action-b8c75.firebaseapp.com",
  projectId: "action-b8c75",
  storageBucket: "action-b8c75.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:demoapp"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, 'action');
