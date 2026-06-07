// Supabase Auth 서비스를 통해 사용자 회원가입 및 로그인을 처리하는 인증 화면 컴포넌트입니다.

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';
import { COLORS } from '../components/Theme';

interface AuthScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AuthScreen({ onSuccess, onCancel }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // 이메일 정규식으로 기본적인 형식을 클라이언트 사이드에서 일차 검증합니다.
  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  // 로그인 또는 회원가입을 처리하는 주요 비즈니스 로직 핸들러입니다.
  const handleAuthSubmit = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해 주십시오.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해 주십시오.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // 회원가입을 시도합니다.
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('성공', '회원가입이 완료되었습니다.');
      } else {
        // 로그인을 시도합니다.
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onSuccess();
    } catch (error: any) {
      console.error('인증 처리 중 오류 발생', error);
      let errorMessage = error.message || '인증 처리 과정에서 오류가 발생했습니다.';
      
      // Supabase 에러 메시지에 따라 유저 친화적인 메시지를 매핑하여 제공합니다.
      if (error.message.includes('already registered') || error.message.includes('Email already exists')) {
        errorMessage = '이미 사용 중인 이메일 주소입니다.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 일치하지 않습니다.';
      } else if (error.message.includes('Email address is invalid')) {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isSignUp ? '프리미엄 회원가입' : '프리미엄 로그인'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp 
            ? '계정을 생성하여 관심 매물을 클라우드에 연동해 보십시오.' 
            : '로그인하여 맞춤형 경공매 정보 서비스를 이용해 보십시오.'}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>이메일 주소</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor={COLORS.slate400}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="6자 이상의 비밀번호"
            placeholderTextColor={COLORS.slate400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleAuthSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isSignUp ? '가입 완료' : '로그인'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={loading}
        >
          <Text style={styles.switchButtonText}>
            {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '처음이신가요? 회원가입하기'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pearlWhiteBg,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    // 그림자 효과를 모바일에 맞게 정교하게 설정했습니다.
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.slate900,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate600,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate700,
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.slate900,
    backgroundColor: COLORS.pearlWhiteBg,
  },
  primaryButton: {
    height: 52,
    backgroundColor: COLORS.royalBlue,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    paddingVertical: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  switchButtonText: {
    color: COLORS.royalBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    marginTop: 12,
  },
  cancelButtonText: {
    color: COLORS.slate600,
    fontSize: 14,
  },
});
