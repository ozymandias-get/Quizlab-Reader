/**
 * Boş kütüphane durumu bileşeni - Premium Design
 * Henüz dosya yokken gösterilen modern placeholder
 */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full py-12 px-6">
            {/* Dekoratif Arka Plan */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-tl from-rose-500/15 to-transparent rounded-full blur-2xl" />
            </div>

            {/* Ana İkon Container */}
            <div className="relative mb-6 group">
                {/* Dış Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-500/20 
                                rounded-3xl blur-2xl scale-150 opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

                {/* İkon Wrapper */}
                <div className="relative w-24 h-24 rounded-3xl 
                                bg-gradient-to-br from-stone-800/80 via-stone-800/60 to-stone-900/80
                                border border-white/[0.08]
                                shadow-[0_8px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]
                                backdrop-blur-xl
                                flex items-center justify-center
                                group-hover:border-amber-500/20 group-hover:shadow-[0_8px_48px_rgba(251,191,36,0.15)]
                                transition-all duration-500">

                    {/* Inner Gradient */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />

                    {/* Animated Upload İkonu */}
                    <div className="relative">
                        <svg className="w-10 h-10 text-stone-500 group-hover:text-amber-400/80 
                                        transition-colors duration-500 drop-shadow-lg"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>

                        {/* Floating Animation Hint */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-gradient-to-t from-amber-500/50 to-transparent 
                                        rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300" />
                    </div>
                </div>

                {/* Decorative Dots */}
                <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-amber-500/30 blur-sm" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-rose-500/20 blur-sm" />
            </div>

            {/* Metin İçeriği */}
            <div className="relative text-center space-y-3">
                <h3 className="text-base font-bold text-stone-200 tracking-tight">
                    Kütüphaneniz Boş
                </h3>

                <p className="text-sm text-stone-500 max-w-[220px] leading-relaxed">
                    PDF dosyalarını buraya <span className="text-amber-500/80 font-medium">sürükleyip bırakın</span> veya yukarıdaki butonları kullanın
                </p>

                {/* İpuçları */}
                <div className="flex items-center justify-center gap-3 pt-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                                    bg-stone-800/50 border border-stone-700/30">
                        <svg className="w-3 h-3 text-amber-500/60" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.586a1 1 0 01-.707-.293L10.293 4.293A1 1 0 009.586 4H4z" />
                        </svg>
                        <span className="text-[10px] text-stone-500 font-medium">Klasörler</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                                    bg-stone-800/50 border border-stone-700/30">
                        <svg className="w-3 h-3 text-rose-500/60" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 2a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-6-6H7z" />
                        </svg>
                        <span className="text-[10px] text-stone-500 font-medium">PDF Dosyaları</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EmptyState
