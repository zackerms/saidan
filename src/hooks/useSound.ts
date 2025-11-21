import { useCallback } from 'react'

/**
 * 音声を再生するカスタムフック
 */
export function useSound() {
  const playSound = useCallback((soundPath: string) => {
    try {
      const audio = new Audio(soundPath)
      audio.currentTime = 0 // 連続再生に対応するため、再生位置をリセット
      audio.play().catch((error) => {
        // ユーザー操作なしでの自動再生がブロックされた場合など
        console.warn('音声の再生に失敗しました:', error)
      })
    } catch (error) {
      console.warn('音声オブジェクトの作成に失敗しました:', error)
    }
  }, [])

  return { playSound }
}

