import { FolderPlusIcon, DocumentPlusIcon, TrashIcon } from './icons/FileExplorerIcons'

/**
 * FileExplorer başlık bileşeni - Premium Glassmorphism Design
 * Modern, minimalist ve şık tasarım
 */
function FileExplorerHeader({ onAddFolder, onAddPdf, onClearAll }) {
    return (
        <div className="relative overflow-hidden">
            {/* Ana Gradient Arka Plan */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900/90 via-stone-900 to-stone-950" />

            {/* Dekoratif Gradient Blob - Sol Üst */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl" />

            {/* Dekoratif Gradient Blob - Sağ */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-rose-500/15 to-transparent rounded-full blur-2xl" />

            {/* İnce üst çizgi - Premium touch */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            {/* Ana İçerik */}
            <div className="relative px-5 py-4">
                <div className="flex items-center justify-between gap-4">

                    {/* Sol Kısım: İkon + Başlık */}
                    <div className="flex items-center gap-4 min-w-0">

                        {/* Premium İkon Container */}
                        <div className="relative flex-shrink-0">
                            {/* Dış Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/40 to-orange-500/30 rounded-2xl blur-xl scale-150 opacity-60" />

                            {/* İkon Wrapper */}
                            <div className="relative w-12 h-12 rounded-2xl 
                                            bg-gradient-to-br from-amber-500/90 via-amber-600 to-orange-600
                                            shadow-[0_8px_32px_rgba(251,191,36,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]
                                            flex items-center justify-center
                                            border border-amber-400/30
                                            group/icon
                                            hover:scale-105 hover:shadow-[0_8px_40px_rgba(251,191,36,0.5)]
                                            transition-all duration-300">

                                {/* Inner Shine */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 via-transparent to-transparent" />

                                {/* Klasör İkonu */}
                                <svg className="relative w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.586a1 1 0 01-.707-.293L10.293 4.293A1 1 0 009.586 4H4z" />
                                </svg>
                            </div>

                            {/* Status Dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full 
                                            bg-gradient-to-br from-emerald-400 to-emerald-500
                                            border-[2.5px] border-stone-900
                                            shadow-[0_0_12px_rgba(52,211,153,0.6)]
                                            flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            </div>
                        </div>

                        {/* Başlık Bölümü */}
                        <div className="flex flex-col min-w-0">
                            <h2 className="text-base font-bold text-white tracking-tight truncate">
                                Dosya Gezgini
                            </h2>
                            <p className="text-[11px] text-stone-400 font-medium tracking-wide flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-amber-500/60" />
                                Kütüphanenizi yönetin
                            </p>
                        </div>
                    </div>

                    {/* Sağ Kısım: Aksiyon Butonları */}
                    <div className="flex items-center gap-2">

                        {/* Yeni Klasör Butonu */}
                        <button
                            className="group/btn relative p-2.5 rounded-xl
                                       bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                                       hover:from-amber-500/20 hover:to-amber-600/10
                                       border border-white/[0.06] hover:border-amber-500/30
                                       shadow-[0_2px_12px_rgba(0,0,0,0.15)]
                                       hover:shadow-[0_4px_20px_rgba(251,191,36,0.2)]
                                       backdrop-blur-sm
                                       transition-all duration-300 ease-out
                                       hover:scale-110 active:scale-95"
                            onClick={onAddFolder}
                            title="Yeni Klasör"
                        >
                            <FolderPlusIcon className="w-[18px] h-[18px] text-stone-400 group-hover/btn:text-amber-400 
                                                        transition-colors duration-200 drop-shadow-sm" />

                            {/* Hover Glow */}
                            <div className="absolute inset-0 rounded-xl bg-amber-400/0 group-hover/btn:bg-amber-400/10 
                                            transition-colors duration-300" />
                        </button>

                        {/* PDF Ekle Butonu */}
                        <button
                            className="group/btn relative p-2.5 rounded-xl
                                       bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                                       hover:from-rose-500/20 hover:to-rose-600/10
                                       border border-white/[0.06] hover:border-rose-500/30
                                       shadow-[0_2px_12px_rgba(0,0,0,0.15)]
                                       hover:shadow-[0_4px_20px_rgba(251,113,133,0.2)]
                                       backdrop-blur-sm
                                       transition-all duration-300 ease-out
                                       hover:scale-110 active:scale-95"
                            onClick={onAddPdf}
                            title="PDF Ekle"
                        >
                            <DocumentPlusIcon className="w-[18px] h-[18px] text-stone-400 group-hover/btn:text-rose-400 
                                                          transition-colors duration-200 drop-shadow-sm" />

                            {/* Hover Glow */}
                            <div className="absolute inset-0 rounded-xl bg-rose-400/0 group-hover/btn:bg-rose-400/10 
                                            transition-colors duration-300" />
                        </button>

                        {/* Ayırıcı Çizgi */}
                        <div className="w-px h-6 bg-gradient-to-b from-transparent via-stone-700/50 to-transparent mx-1" />

                        {/* Tümünü Temizle Butonu */}
                        <button
                            className="group/btn relative p-2.5 rounded-xl
                                       bg-gradient-to-br from-white/[0.05] to-transparent
                                       hover:from-red-500/15 hover:to-red-600/5
                                       border border-white/[0.04] hover:border-red-500/20
                                       shadow-[0_2px_12px_rgba(0,0,0,0.1)]
                                       hover:shadow-[0_4px_20px_rgba(239,68,68,0.15)]
                                       backdrop-blur-sm
                                       transition-all duration-300 ease-out
                                       hover:scale-110 active:scale-95"
                            onClick={onClearAll}
                            title="Tümünü Temizle"
                        >
                            <TrashIcon className="w-4 h-4 text-stone-500 group-hover/btn:text-red-400 
                                                   transition-colors duration-200" />

                            {/* Hover Glow */}
                            <div className="absolute inset-0 rounded-xl bg-red-400/0 group-hover/btn:bg-red-400/5 
                                            transition-colors duration-300" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Alt Gradient Border */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    )
}

export default FileExplorerHeader
