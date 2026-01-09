import { CheckIcon } from './icons/FileExplorerIcons'

/**
 * FileExplorer alt bilgi bileşeni
 * Dosya/klasör sayıları ve sürükle-bırak durumu gösterir
 */
function FileExplorerFooter({ fileCount, folderCount }) {
    return (
        <div className="px-4 py-3 border-t border-stone-800/50 bg-gradient-to-r from-stone-900 to-stone-900/80">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="text-xs text-stone-400 font-medium">{fileCount} dosya</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-xs text-stone-400 font-medium">{folderCount} klasör</span>
                    </div>
                </div>
                <div className="text-[10px] text-emerald-500/80 font-medium flex items-center gap-1">
                    <CheckIcon />
                    Sürükle-bırak aktif
                </div>
            </div>
        </div>
    )
}

export default FileExplorerFooter
