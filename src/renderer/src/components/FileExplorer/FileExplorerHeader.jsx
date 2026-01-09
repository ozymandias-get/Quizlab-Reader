import { FolderPlusIcon, DocumentPlusIcon, TrashIcon } from './icons/FileExplorerIcons'

/**
 * FileExplorer başlık bileşeni
 * Başlık, açıklama ve aksiyon butonlarını içerir
 */
function FileExplorerHeader({ onAddFolder, onAddPdf, onClearAll }) {
    return (
        <div className="relative px-4 py-5 border-b border-white/[0.06]">
            {/* Premium Glassmorphism Arka Plan */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-amber-500/[0.02]" />
            <div className="absolute inset-0 backdrop-blur-xl" />

            {/* Subtle top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative flex items-center justify-between">
                {/* Sol: İkon ve Başlık */}
                <div className="flex items-center gap-3.5">
                    {/* Premium Glass İkon */}
                    <div className="relative group">
                        {/* Glow efekti */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-rose-500/10 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                        {/* Ana ikon container - Glassmorphism */}
                        <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center
                                        bg-gradient-to-br from-white/[0.12] to-white/[0.04]
                                        border border-white/[0.08]
                                        shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
                                        backdrop-blur-md
                                        group-hover:border-amber-500/30 group-hover:shadow-[0_8px_32px_rgba(251,191,36,0.15)]
                                        transition-all duration-500">
                            {/* İç gradient overlay */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent opacity-80" />

                            {/* İkon */}
                            <svg className="relative w-5 h-5 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.586a1 1 0 01-.707-.293L10.293 4.293A1 1 0 009.586 4H4z" />
                            </svg>
                        </div>

                        {/* Status indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full 
                                        bg-gradient-to-br from-emerald-400 to-emerald-600
                                        border-2 border-stone-900/80
                                        shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    </div>

                    {/* Başlık Metni */}
                    <div className="flex flex-col">
                        <h2 className="text-[15px] font-semibold text-stone-100 tracking-tight
                                       bg-gradient-to-r from-stone-100 to-stone-300 bg-clip-text">
                            Dosya Gezgini
                        </h2>
                        <p className="text-[11px] text-stone-500/80 font-medium tracking-wide">
                            Kütüphanenizi yönetin
                        </p>
                    </div>
                </div>

                {/* Sağ: Aksiyon Butonları */}
                <div className="flex items-center gap-1.5">
                    {/* Yeni Klasör */}
                    <button
                        className="group relative p-2.5 rounded-xl
                                   bg-white/[0.04] hover:bg-amber-500/15
                                   border border-transparent hover:border-amber-500/20
                                   text-stone-400 hover:text-amber-400
                                   shadow-[0_2px_8px_rgba(0,0,0,0.1)]
                                   hover:shadow-[0_4px_16px_rgba(251,191,36,0.15)]
                                   backdrop-blur-sm
                                   transition-all duration-300 hover:scale-105"
                        onClick={onAddFolder}
                        title="Yeni Klasör"
                    >
                        <FolderPlusIcon />
                    </button>

                    {/* PDF Ekle */}
                    <button
                        className="group relative p-2.5 rounded-xl
                                   bg-white/[0.04] hover:bg-rose-500/15
                                   border border-transparent hover:border-rose-500/20
                                   text-stone-400 hover:text-rose-400
                                   shadow-[0_2px_8px_rgba(0,0,0,0.1)]
                                   hover:shadow-[0_4px_16px_rgba(251,113,133,0.15)]
                                   backdrop-blur-sm
                                   transition-all duration-300 hover:scale-105"
                        onClick={onAddPdf}
                        title="PDF Ekle"
                    >
                        <DocumentPlusIcon />
                    </button>

                    {/* Tümünü Temizle */}
                    <button
                        className="group relative p-2.5 rounded-xl
                                   bg-white/[0.04] hover:bg-orange-500/15
                                   border border-transparent hover:border-orange-500/20
                                   text-stone-400 hover:text-orange-400
                                   shadow-[0_2px_8px_rgba(0,0,0,0.1)]
                                   hover:shadow-[0_4px_16px_rgba(251,146,60,0.15)]
                                   backdrop-blur-sm
                                   transition-all duration-300 hover:scale-105"
                        onClick={onClearAll}
                        title="Tümünü Temizle"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default FileExplorerHeader
