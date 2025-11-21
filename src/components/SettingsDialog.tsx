import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useSoundSetting } from '@/hooks/useSoundSetting'

export function SettingsDialog() {
  const { isEnabled: isSoundEnabled, setEnabled: setSoundEnabled } = useSoundSetting()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
          <span className="sr-only">設定</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>
            アプリケーションの動作をカスタマイズできます。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sound-enabled"
              checked={isSoundEnabled}
              onCheckedChange={(checked) => setSoundEnabled(checked === true)}
            />
            <label
              htmlFor="sound-enabled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              裁断時の音声を再生
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

