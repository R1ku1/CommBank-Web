import React from 'react'
import { BaseEmoji, Picker } from 'emoji-mart'
import 'emoji-mart/css/emoji-mart.css'
import { useAppSelector } from '../../store/hooks'
import { selectMode } from '../../store/themeSlice'

type Props = {
  onClick: (emoji: BaseEmoji, event: React.MouseEvent) => void
  // optional: className or style if you want
  className?: string
}

export default function EmojiPickerWrapper({ onClick, className }: Props) {
  const mode = useAppSelector(selectMode) // should return 'light' | 'dark' or similar

  // emoji-mart v3 expects theme prop like 'light'|'dark'
  const theme = mode === 'dark' ? 'dark' : 'light'

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <Picker
        theme={theme}
        showPreview={false}
        showSkinTones={false}
        onClick={onClick}
        // color can be a hex value or omitted; leave if you used custom styling
      />
    </div>
  )
}
