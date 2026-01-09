import { UploadCloudIcon } from './icons/FileExplorerIcons'

/**
 * Boş kütüphane durumu bileşeni
 * Henüz dosya yokken gösterilen placeholder
 */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-stone-500 p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-800/80 to-stone-800/40 flex items-center justify-center mb-4 shadow-lg">
                <UploadCloudIcon />
            </div>
            <p className="text-sm font-semibold text-stone-300">Kütüphaneniz boş</p>
            <p className="text-xs text-stone-500 mt-2 text-center max-w-[200px]">
                PDF dosyalarını buraya sürükleyip bırakın veya yukarıdaki butonları kullanın
            </p>
        </div>
    )
}

export default EmptyState
