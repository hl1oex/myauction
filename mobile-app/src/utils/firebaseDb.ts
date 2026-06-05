// Firestore를 기반으로 관심 매물 데이터를 추가, 조회 및 삭제하는 데이터베이스 유틸리티 파일입니다.

import { doc, setDoc, deleteDoc, getDocs, collection, query } from 'firebase/firestore';
import { db } from './firebase';
import { Property } from '../types';

/**
 * 사용자가 선택한 특정 경매 물건을 Firestore의 관심 목록에 추가합니다.
 * 오프라인 상태에서도 Firestore SDK가 데이터를 캐시할 수 있도록 비동기로 문서를 업로드합니다.
 */
export async function addFavorite(userId: string, property: Property): Promise<void> {
  try {
    const favoriteDocRef = doc(db, 'users', userId, 'favorites', property.id.toString());
    // 병합 옵션을 부여해 기존 필드가 유실되는 현상을 방지하였습니다.
    await setDoc(favoriteDocRef, property, { merge: true });
  } catch (error) {
    console.error('관심 물건 등록 오류 발생', error);
    throw error;
  }
}

/**
 * 사용자가 등록해 둔 관심 물건을 Firestore 관심 목록에서 제거합니다.
 */
export async function removeFavorite(userId: string, propertyId: number): Promise<void> {
  try {
    const favoriteDocRef = doc(db, 'users', userId, 'favorites', propertyId.toString());
    await deleteDoc(favoriteDocRef);
  } catch (error) {
    console.error('관심 물건 해제 오류 발생', error);
    throw error;
  }
}

/**
 * 해당 사용자가 등록한 모든 관심 물건 데이터를 Firestore로부터 실시간 조회합니다.
 */
export async function fetchFavorites(userId: string): Promise<Property[]> {
  try {
    const favoritesCollectionRef = collection(db, 'users', userId, 'favorites');
    const q = query(favoritesCollectionRef);
    const querySnapshot = await getDocs(q);
    
    const favorites: Property[] = [];
    querySnapshot.forEach((docSnapshot) => {
      favorites.push(docSnapshot.data() as Property);
    });
    return favorites;
  } catch (error) {
    console.error('관심 물건 목록 가져오기 오류 발생', error);
    throw error;
  }
}
