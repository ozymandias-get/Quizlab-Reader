import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'

/**
 * Kullanım Asistanı - Karartmasız
 * Sadece ok ve kare işaretleri ile hedefleri gösterir
 */

// ================== STEP CONFIG ==================
const STEP_CONFIG = [
    {
        targetId: 'bottom-bar-hub-btn',
        titleKey: 'ua_step1_title',
        textKey: 'ua_step1_text',
        openMenu: true
    },
    {
        targetIds: ['bottom-bar-tools-panel', 'bottom-bar-models-list'],
        titleKey: 'ua_step2_title',
        textKey: 'ua_step2_text'
    },
    {
        targetId: 'tool-btn-picker',
        titleKey: 'ua_step3_title',
        textKey: 'ua_step3_text'
    },
    {
        targetId: 'tool-btn-swap',
        titleKey: 'ua_step4_title',
        textKey: 'ua_step4_text'
    },
    {
        targetId: 'tool-btn-settings',
        titleKey: 'ua_step5_title',
        textKey: 'ua_step5_text'
    }
]

// ================== POINTER (OK İŞARETİ) ==================
function Pointer({ rect, color = '#10b981' }) {
    if (!rect) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed z-[10001] pointer-events-none"
            style={{
                left: rect.left + rect.width / 2 - 12,
                top: rect.top - 50
            }}
        >
            <motion.svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
            >
                <path
                    d="M12 4L12 20M12 20L6 14M12 20L18 14"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </motion.svg>
        </motion.div>
    )
}

// ================== HIGHLIGHT BOX ==================
function HighlightBox({ rect, color = '#3b82f6' }) {
    if (!rect) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed z-[10000] pointer-events-none rounded-xl"
            style={{
                left: rect.left - 6,
                top: rect.top - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                border: `3px solid ${color}`,
                boxShadow: `0 0 20px ${color}40`
            }}
        />
    )
}

// ================== TOOLTIP ==================
function Tooltip({ step, totalSteps, title, text, onNext, onSkip, finishText, nextText, skipText }) {
    return (
        <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[10002] left-1/2 top-[20%] -translate-x-1/2 w-[420px] p-6 rounded-2xl bg-white shadow-2xl border border-slate-200"
        >
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-bold">
                    {step + 1}
                </span>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-base text-slate-600 leading-relaxed">{text}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {/* Progress */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400">
                        {step + 1} / {totalSteps}
                    </span>
                    <div className="flex gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-slate-900 w-4' : 'bg-slate-200 w-4'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={onSkip}
                        className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        {skipText}
                    </button>
                    <button
                        onClick={onNext}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
                    >
                        {step === totalSteps - 1 ? finishText : nextText}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// ================== MAIN ==================
function UsageAssistant({ isActive, onClose }) {
    const { t } = useLanguage()
    const [step, setStep] = useState(0)
    const [rects, setRects] = useState([])
    const timerRef = useRef(null)

    // Reset
    useEffect(() => {
        if (isActive) {
            setStep(0)
            setRects([])
        }
    }, [isActive])

    // Update rects
    useEffect(() => {
        if (!isActive) return

        const updateRects = () => {
            const config = STEP_CONFIG[step]
            if (!config) return

            const newRects = []

            if (config.targetId) {
                const el = document.getElementById(config.targetId)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.width > 0 && rect.height > 0) {
                        newRects.push({ ...rect.toJSON(), id: config.targetId })
                    }
                }
            }

            if (config.targetIds) {
                config.targetIds.forEach((id, index) => {
                    const el = document.getElementById(id)
                    if (el) {
                        const rect = el.getBoundingClientRect()
                        if (rect.width > 0 && rect.height > 0) {
                            newRects.push({ ...rect.toJSON(), id, index })
                        }
                    }
                })
            }

            setRects(newRects)
        }

        updateRects()
        timerRef.current = setInterval(updateRects, 200)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isActive, step])

    // Next handler
    const handleNext = () => {
        // Bar zaten isTourActive ile açık tutuluyor
        if (step < STEP_CONFIG.length - 1) {
            setStep(s => s + 1)
        } else {
            onClose()
        }
    }

    if (!isActive) return null

    const config = STEP_CONFIG[step]
    const title = t(config?.titleKey) || `Step ${step + 1}`
    const text = t(config?.textKey) || ''

    // Renkler
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] pointer-events-none">
                {/* Tooltip - Ortada */}
                <div style={{ pointerEvents: 'auto' }}>
                    <Tooltip
                        step={step}
                        totalSteps={STEP_CONFIG.length}
                        title={title}
                        text={text}
                        onNext={handleNext}
                        onSkip={onClose}
                        finishText={t('ua_finish')}
                        nextText={t('ua_next')}
                        skipText={t('ua_skip')}
                    />
                </div>

                {/* Highlight boxes ve oklar */}
                {rects.map((rect, index) => (
                    <React.Fragment key={`${step}-${rect.id}-${index}`}>
                        <HighlightBox rect={rect} color={colors[index % colors.length]} />
                        {step === 0 && <Pointer rect={rect} color={colors[0]} />}
                    </React.Fragment>
                ))}
            </div>
        </AnimatePresence>
    )
}

export default UsageAssistant
