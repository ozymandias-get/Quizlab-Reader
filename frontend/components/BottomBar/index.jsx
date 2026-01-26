import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { Reorder, motion, AnimatePresence } from 'framer-motion'
import { useAi, useAppearance, useNavigation, useAppTools, useLanguage } from '../../context'
import { SettingsIcon, ExplorerIcon, MagicWandIcon, SwapIcon } from '../Icons'
import { APP_CONSTANTS } from '../../constants/appConstants'
import { AIItem } from './AIItem'

const { LEFT_PANEL_TABS } = APP_CONSTANTS

// Memoized Tool Button
const ToolButton = memo(({ isActive, activeColor, onClick, title, children, delay = 0 }) => (
    <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 8 }}
        transition={{ duration: 0.25, delay, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{
            scale: 1.1,
            y: -4,
            transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        title={title}
        className="relative p-2.5 rounded-xl transition-colors duration-150"
        style={{
            background: isActive
                ? `linear-gradient(135deg, ${activeColor || 'rgba(99,102,241,0.4)'}, ${activeColor?.replace('0.3', '0.5') || 'rgba(139,92,246,0.5)'})`
                : 'rgba(255, 255, 255, 0.03)',
            border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
            boxShadow: isActive
                ? '0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                : '0 2px 6px rgba(0,0,0,0.15)',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
        }}
    >
        {children}
    </motion.button>
))

ToolButton.displayName = 'ToolButton'

// Animation variants (defined outside component to prevent recreation)
const panelVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: { width: 'auto', opacity: 1 },
    exit: { width: 0, opacity: 0 }
}

const panelTransition = {
    duration: 0.35,
    ease: [0.16, 1, 0.3, 1]
}

function BottomBar({ onHoverChange }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const { t } = useLanguage()
    const barRef = useRef(null)
    const constraintsRef = useRef(null)
    const dragStartPosition = useRef({ x: 0, y: 0 })
    const isDragging = useRef(false)
    const lastDragTime = useRef(0)

    const { currentAI, setCurrentAI, enabledModels, setEnabledModels, aiSites } = useAi()
    const {
        bottomBarOpacity,
        bottomBarScale,
        floatingBarPos,
        setFloatingBarPos,
        showOnlyIcons,
        selectionColor,
        toggleLayoutSwap,
        isTourActive
    } = useAppearance()
    const { leftPanelTab, setLeftPanelTab } = useNavigation()
    const { isPickerActive, togglePicker } = useAppTools()

    const [activeDragItem, setActiveDragItem] = useState(null)
    const [SettingsModal, setSettingsModal] = useState(null)

    // Tur aktifken menüyü AÇIK tut
    useEffect(() => {
        if (isTourActive) {
            setIsOpen(true)
        }
    }, [isTourActive])

    // Preload settings modal after mount to prevent lag on first open
    useEffect(() => {
        const timer = setTimeout(() => {
            import('../SettingsModal').then(m => setSettingsModal(() => m.default))
        }, 1500) // Wait 1.5s to not block initial render
        return () => clearTimeout(timer)
    }, [])

    // Click outside handler - Tur sırasında devre dışı
    useEffect(() => {
        if (!isOpen || isTourActive) return
        const handler = (e) => {
            if (barRef.current && !barRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isOpen, isTourActive])

    // Memoized handlers
    const handleDragEnd = useCallback((_, info) => {
        const proposedX = floatingBarPos.x + info.offset.x
        const proposedY = floatingBarPos.y + info.offset.y

        // Calculate boundaries based on window size and bar size
        // Bar uses translateX(-50%) and left-1/2, so the coord 0 is center screen
        // Bottom: 6 (1.5rem = 24px)

        // Default safe values if ref is missing
        const barRect = barRef.current?.getBoundingClientRect()
        const barWidth = barRect?.width || 400
        const barHeight = barRect?.height || 60
        const margin = 12

        // X Axis Boundaries (Center origin)
        // Left limit: -(ScreenW - BarW)/2
        // Right limit: (ScreenW - BarW)/2
        const xLimit = (window.innerWidth - barWidth) / 2 - margin
        const clampedX = Math.min(Math.max(proposedX, -xLimit), xLimit)

        // Y Axis Boundaries (Bottom origin essentially)
        // Top limit: Must stop before hitting top of screen
        // Bottom limit: Can go down slightly but not below margin
        // Current Y=0 is 24px from bottom
        // Top of screen relative to Y=0: -(window.innerHeight - 24 - barHeight)
        const minY = -(window.innerHeight - 24 - barHeight) + margin
        const maxY = 24 - margin
        const clampedY = Math.min(Math.max(proposedY, minY), maxY)

        setFloatingBarPos({
            x: clampedX,
            y: clampedY
        })

        if (isDragging.current) {
            lastDragTime.current = Date.now()
        }
        isDragging.current = false
    }, [floatingBarPos, setFloatingBarPos])

    const handlePointerDown = useCallback((e) => {
        // Sadece sol tık için
        if (e.button !== 0) return
        dragStartPosition.current = { x: e.clientX, y: e.clientY }
        isDragging.current = false
    }, [])



    const handleToggle = useCallback((e) => {
        // Eğer drag yeni bittiyse (150ms) veya şu an drag yapılıyorsa togglamayı engelle
        const timeSinceDrag = Date.now() - lastDragTime.current
        if (isDragging.current || isAnimating || timeSinceDrag < 150) {
            // Event bubbling engelle
            e?.stopPropagation()
            return
        }

        setIsAnimating(true)
        setIsOpen(prev => !prev)

        if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = setTimeout(() => setIsAnimating(false), 400)
    }, [isAnimating])

    // Hub Interaction Handler (Replaces onClick to fix drag conflicts)
    const handleHubPointerUp = useCallback((e) => {
        const dx = Math.abs(e.clientX - dragStartPosition.current.x)
        const dy = Math.abs(e.clientY - dragStartPosition.current.y)

        // If movement is very small (< 5px), treat as CLICK
        // Increased threshold slightly to make clicking easier even if hand shakes
        if (dx < 5 && dy < 5) {
            handleToggle(e)
        }

        // If movement is significant (> 3px), treat as DRAG (for internal state)
        if (dx > 3 || dy > 3) {
            isDragging.current = true
        }
    }, [handleToggle])

    // Timeout cleanup ref
    const animationTimeoutRef = useRef(null)

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
        }
    }, [])



    const handleSettingsClick = useCallback(() => setIsSettingsOpen(true), [])
    const handleSettingsClose = useCallback(() => setIsSettingsOpen(false), [])

    // Memoized values
    const aiModels = useMemo(() => enabledModels, [enabledModels])

    const handleReorder = useCallback((newOrder) => {
        setEnabledModels(newOrder)
    }, [setEnabledModels])

    // Memoized panel style
    const panelStyle = useMemo(() => ({
        background: `linear-gradient(145deg, rgba(30, 30, 35, ${bottomBarOpacity}) 0%, rgba(18, 18, 22, ${bottomBarOpacity}) 100%)`,
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        borderRadius: 20,
        willChange: 'width, opacity' // GPU hint for panel expansion
    }), [bottomBarOpacity])

    const hubStyle = useMemo(() => ({
        ...panelStyle,
        boxShadow: isOpen
            ? `0 0 40px ${selectionColor}66, ${panelStyle.boxShadow}`
            : panelStyle.boxShadow,
        border: isOpen ? `1px solid ${selectionColor}4D` : panelStyle.border,
        willChange: 'transform, box-shadow', // GPU hint for hub interactions
        width: 'auto', // Override width from panelStyle
        opacity: 1     // Override opacity from panelStyle
    }), [panelStyle, isOpen, selectionColor])

    return (
        <>
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50">
                <motion.div
                    drag
                    dragConstraints={constraintsRef}
                    dragElastic={0.05}
                    dragMomentum={false}
                    onDragEnd={handleDragEnd}
                    onPointerDown={handlePointerDown}
                    initial={floatingBarPos}
                    animate={floatingBarPos}
                    className="absolute pointer-events-auto left-1/2 bottom-6"
                    style={{ transform: 'translateX(-50%)' }}
                >
                    <div
                        ref={barRef}
                        className="relative"
                        style={{ transform: `scale(${bottomBarScale})`, transformOrigin: 'center' }}
                        onMouseEnter={() => onHoverChange?.(true)}
                        onMouseLeave={() => onHoverChange?.(false)}
                    >
                        {/* CENTER HUB */}
                        <motion.div
                            role="button"
                            id="bottom-bar-hub-btn"
                            onPointerUp={handleHubPointerUp}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative z-30 h-[52px] px-4 rounded-[20px] flex items-center justify-center cursor-pointer"
                            style={hubStyle}
                        >
                            <motion.div
                                animate={{ rotate: isOpen ? 45 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <MagicWandIcon
                                    className="w-5 h-5 transition-colors"
                                    style={{ color: isOpen ? selectionColor : 'rgba(255,255,255,0.7)' }}
                                />
                            </motion.div>

                            {!isOpen && (
                                <motion.div
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                                    style={{ boxShadow: `0 0 15px ${selectionColor}4D` }}
                                />
                            )}
                        </motion.div>

                        {/* LEFT PANEL - TOOLS */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    variants={panelVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={panelTransition}
                                    className="absolute right-full mr-3 top-0 overflow-hidden h-[52px]"
                                    style={panelStyle}
                                    id="bottom-bar-tools-panel"
                                >
                                    <div className="flex items-center gap-1.5 px-3 h-full">
                                        <div id="tool-btn-settings">
                                            <ToolButton delay={0.03} onClick={handleSettingsClick} title={t('settings')}>
                                                <SettingsIcon className="w-5 h-5" />
                                            </ToolButton>
                                        </div>
                                        <div id="tool-btn-swap">
                                            <ToolButton
                                                delay={0.05}
                                                onClick={toggleLayoutSwap}
                                                title={t('swap_window')}
                                            >
                                                <SwapIcon className="w-5 h-5" />
                                            </ToolButton>
                                        </div>
                                        <div id="tool-btn-picker">
                                            <ToolButton
                                                delay={0.06}
                                                isActive={isPickerActive}
                                                activeColor={`${selectionColor}66`}
                                                onClick={togglePicker}
                                                title={t('element_picker')}
                                            >
                                                <MagicWandIcon className="w-5 h-5" />
                                            </ToolButton>
                                        </div>
                                        <ToolButton
                                            delay={0.09}
                                            isActive={leftPanelTab === LEFT_PANEL_TABS.EXPLORER}
                                            activeColor="rgba(245,158,11,0.4)"
                                            onClick={() => setLeftPanelTab(leftPanelTab === LEFT_PANEL_TABS.EXPLORER ? LEFT_PANEL_TABS.VIEWER : LEFT_PANEL_TABS.EXPLORER)}
                                            title={t('explorer')}
                                        >
                                            <ExplorerIcon className="w-5 h-5" />
                                        </ToolButton>

                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* RIGHT PANEL - AI MODELS */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    variants={panelVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={panelTransition}
                                    className="absolute left-full ml-3 top-0 overflow-hidden h-[52px]"
                                    style={panelStyle}
                                    id="bottom-bar-models-list"
                                >
                                    <div className="flex items-center gap-1 px-3 h-full">
                                        <Reorder.Group
                                            axis="x"
                                            values={aiModels}
                                            onReorder={handleReorder}
                                            className="flex items-center gap-1"
                                        >
                                            {aiModels.map((modelKey, index) => {
                                                const site = aiSites[modelKey]
                                                if (!site) return null
                                                return (
                                                    <AIItem
                                                        key={modelKey}
                                                        modelKey={modelKey}
                                                        site={site}
                                                        isSelected={currentAI === modelKey}
                                                        setCurrentAI={setCurrentAI}
                                                        setActiveDragItem={setActiveDragItem}
                                                        activeDragItem={activeDragItem}
                                                        showOnlyIcons={showOnlyIcons}
                                                        animationDelay={0.03 + (index * 0.02)}
                                                    />
                                                )
                                            })}
                                        </Reorder.Group>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {SettingsModal && (
                <SettingsModal isOpen={isSettingsOpen} onClose={handleSettingsClose} />
            )}
        </>
    )
}

export default memo(BottomBar)
