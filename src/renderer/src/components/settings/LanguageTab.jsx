import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

/**
 * Dil seçimi sekmesi bileşeni - Premium Glass Design
 */
function LanguageTab() {
    const { t, language, setLanguage, languages } = useLanguage()

    return (
        <div className="space-y-5">
            <p
                className="text-sm font-medium"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
                {t('select_language')}
            </p>

            <div className="grid grid-cols-2 gap-3">
                {Object.values(languages).map((lang) => {
                    const isSelected = language === lang.code

                    return (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className="group relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300"
                            style={{
                                background: isSelected
                                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)'
                                    : 'rgba(255, 255, 255, 0.02)',
                                border: isSelected
                                    ? '1px solid rgba(99, 102, 241, 0.4)'
                                    : '1px solid rgba(255, 255, 255, 0.06)',
                                boxShadow: isSelected
                                    ? '0 4px 20px -5px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                    : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 8px 25px -10px rgba(0, 0, 0, 0.5)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }
                            }}
                        >
                            {/* Flag with glow effect */}
                            <div
                                className="text-2xl transition-transform duration-200 group-hover:scale-110"
                                style={{
                                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' : 'none'
                                }}
                            >
                                {lang.flag}
                            </div>

                            {/* Language info */}
                            <div className="text-left flex-1">
                                <div
                                    className="font-medium text-sm"
                                    style={{
                                        color: isSelected ? 'rgba(199, 210, 254, 1)' : 'rgba(255, 255, 255, 0.85)'
                                    }}
                                >
                                    {lang.nativeName}
                                </div>
                                <div
                                    className="text-xs"
                                    style={{
                                        color: isSelected ? 'rgba(165, 180, 252, 0.7)' : 'rgba(255, 255, 255, 0.4)'
                                    }}
                                >
                                    {lang.name}
                                </div>
                            </div>

                            {/* Check icon */}
                            {isSelected && (
                                <div
                                    className="flex items-center justify-center w-6 h-6 rounded-full"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.25) 100%)',
                                        border: '1px solid rgba(99, 102, 241, 0.4)'
                                    }}
                                >
                                    <svg
                                        className="w-3.5 h-3.5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        style={{ color: 'rgba(165, 180, 252, 1)' }}
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default LanguageTab
