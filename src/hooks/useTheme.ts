import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'saidan-theme';
const DEFAULT_VALUE: Theme = 'system';

/**
 * localStorageからテーマ設定を読み込む関数
 * 値が存在しない場合はデフォルト値（system）を返し、localStorageにも保存する
 */
function loadFromStorage(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    // 初回アクセス時はデフォルト値（system）をlocalStorageに保存
    localStorage.setItem(STORAGE_KEY, DEFAULT_VALUE);
    return DEFAULT_VALUE;
  } catch (error) {
    console.warn('localStorageからのテーマ設定読み込みに失敗しました:', error);
    return DEFAULT_VALUE;
  }
}

/**
 * システムのカラースキームを取得
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * 実際に適用すべきテーマを取得（systemの場合はシステム設定を返す）
 */
function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * DOMにテーマを適用
 */
function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * テーマ設定を管理するカスタムフック
 * localStorageに設定を保存し、ブラウザを閉じても設定が保持される
 * システム設定モードの場合は、システム設定の変更も監視する
 */
export function useTheme() {
  // lazy initializationを使用してlocalStorageから初期値を読み込む
  const [theme, setTheme] = useState<Theme>(() => loadFromStorage());

  // テーマが変更されたらlocalStorageに保存し、DOMに適用
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(theme);
    applyTheme(effectiveTheme);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.warn('localStorageへのテーマ設定保存に失敗しました:', error);
    }
  }, [theme]);

  // システム設定モードの場合、システム設定の変更を監視
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);
    };

    // 古いブラウザ対応のため、addEventListenerとaddListenerの両方を試す
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  // テーマを設定する関数
  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // テーマを切り替える関数（light → dark → system → light）
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // 現在の有効なテーマ（light/dark）を取得
  const effectiveTheme = getEffectiveTheme(theme);

  return {
    theme,
    setTheme: setThemeValue,
    toggleTheme,
    effectiveTheme,
  };
}
