import { useLanguage, useAppearance } from '../context'

// Icon boyutu (px)
const ICON_SIZE = 18

function FloatingButton({ onClick, position }) {
    const { t } = useLanguage()
    const { selectionColor } = useAppearance()

    // Position prop: { top, left } - seçili metnin üzerinde konumlandırmak için
    const style = position ? {
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
    } : {}

    const handleClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.()
    }

    const handleMouseDown = (e) => {
        // Seçimin iptal olmasını engelle
        e.preventDefault()
        e.stopPropagation()
    }

    return (
        <div
            className="fixed flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-white font-bold text-sm border border-white/20 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 z-[100] animate-fadeIn"
            style={{
                ...style,
                backgroundColor: selectionColor,
                boxShadow: `0 10px 40px -10px ${selectionColor}80`, // 80 is 50% opacity in hex
                // Ensure visibility if position is slightly off
                opacity: 1,
            }}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
        >
            <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="drop-shadow-sm">
                <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="drop-shadow-sm">{t('send_to_ai')}</span>
        </div>
    )
}

export default FloatingButton
