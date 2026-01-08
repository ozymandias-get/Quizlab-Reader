import React from 'react'

function FloatingButton({ onClick, position }) {
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
            className="fixed flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold text-sm shadow-xl shadow-black/30 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:from-amber-400 hover:to-amber-500 z-[100] animate-fadeIn"
            style={style}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <span>AI'ya Gönder</span>
        </div>
    )
}

export default FloatingButton

