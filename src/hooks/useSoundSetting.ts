import { useState } from 'react'

const STORAGE_KEY = 'saidan-sound-enabled'
const DEFAULT_VALUE = true

/**
 * localStorageから設定を読み込む関数
 * 値が存在しない場合はデフォルト値（true）を返し、localStorageにも保存する
 */
function loadFromStorage(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
    // 初回アクセス時はデフォルト値（true）をlocalStorageに保存
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_VALUE))
    return DEFAULT_VALUE
  } catch (error) {
    console.warn('localStorageからの設定読み込みに失敗しました:', error)
    return DEFAULT_VALUE
  }
}

/**
 * 音声再生設定を管理するカスタムフック
 * localStorageに設定を保存し、ブラウザを閉じても設定が保持される
 */
export function useSoundSetting() {
  // lazy initializationを使用してlocalStorageから初期値を読み込む
  const [isEnabled, setIsEnabled] = useState<boolean>(() => loadFromStorage())

  // 設定が変更されたらlocalStorageに保存
  const setEnabled = (enabled: boolean) => {
    setIsEnabled(enabled)
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled))
    } catch (error) {
      console.warn('localStorageへの設定保存に失敗しました:', error)
    }
  }

  return { isEnabled, setEnabled }
}

