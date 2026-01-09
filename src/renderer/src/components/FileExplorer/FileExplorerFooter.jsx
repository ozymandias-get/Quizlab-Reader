/**
 * FileExplorer alt bilgi bileşeni - Premium Design
 * Dosya/klasör istatistikleri ve durum göstergesi
 */
function FileExplorerFooter({ fileCount, folderCount }) {
    const totalItems = fileCount + folderCount

    return (
        <div className="relative overflow-hidden">
            {/* Arka Plan */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/95 to-stone-900/80" />

            {/* Üst Gradient Border */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-700/50 to-transparent" />

            {/* İçerik */}
            <div className="relative px-5 py-3">
                <div className="flex items-center justify-between">

                    {/* Sol: İstatistikler */}
                    <div className="flex items-center gap-5">

                        {/* Dosya Sayacı */}
                        <div className="flex items-center gap-2.5 group/stat">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 
                                                shadow-[0_0_8px_rgba(251,113,133,0.5)]
                                                group-hover/stat:shadow-[0_0_12px_rgba(251,113,133,0.7)]
                                                transition-shadow duration-300" />
                                <div className="absolute inset-0 rounded-full bg-rose-400/50 blur-sm animate-pulse" />
                            </div>
                            <span className="text-xs text-stone-300 font-medium tracking-wide">
                                <span className="text-rose-400 font-semibold">{fileCount}</span>
                                <span className="text-stone-500 ml-1">dosya</span>
                            </span>
                        </div>

                        {/* Klasör Sayacı */}
                        <div className="flex items-center gap-2.5 group/stat">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 
                                                shadow-[0_0_8px_rgba(251,191,36,0.5)]
                                                group-hover/stat:shadow-[0_0_12px_rgba(251,191,36,0.7)]
                                                transition-shadow duration-300" />
                                <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-sm animate-pulse" />
                            </div>
                            <span className="text-xs text-stone-300 font-medium tracking-wide">
                                <span className="text-amber-400 font-semibold">{folderCount}</span>
                                <span className="text-stone-500 ml-1">klasör</span>
                            </span>
                        </div>

                        {/* Ayırıcı - Sadece öğe varsa göster */}
                        {totalItems > 0 && (
                            <>
                                <div className="w-px h-4 bg-gradient-to-b from-transparent via-stone-700/50 to-transparent" />

                                {/* Toplam */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">
                                        Toplam
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-stone-800/80 border border-stone-700/50
                                                     text-[11px] font-semibold text-stone-300">
                                        {totalItems}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sağ: Durum Göstergesi */}
                    <div className="flex items-center gap-2">
                        {/* Sürükle-Bırak Aktif Badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                        bg-gradient-to-r from-emerald-500/10 to-emerald-600/5
                                        border border-emerald-500/20
                                        shadow-[0_0_16px_rgba(52,211,153,0.1)]">

                            {/* Animated Dot */}
                            <div className="relative">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                            </div>

                            <span className="text-[10px] font-semibold text-emerald-400/90 uppercase tracking-wider">
                                Sürükle-Bırak
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FileExplorerFooter
