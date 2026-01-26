/**
 * Görünüm (Appearance) Ayarları Sabitleri
 */

export const BOTTOM_BAR_LAYOUTS = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
}

export const DEFAULT_BOTTOM_BAR_LAYOUT = BOTTOM_BAR_LAYOUTS.HORIZONTAL

export const BOTTOM_BAR_POSITIONS = {
    BOTTOM: 'bottom',
    TOP: 'top',
    LEFT: 'left',
    RIGHT: 'right'
}

export const BOTTOM_BAR_ALIGNMENTS = {
    START: 'start',
    CENTER: 'center',
    END: 'end'
}

export const DEFAULT_BOTTOM_BAR_POSITION = BOTTOM_BAR_POSITIONS.BOTTOM
export const DEFAULT_BOTTOM_BAR_ALIGNMENT = BOTTOM_BAR_ALIGNMENTS.CENTER

export const VALID_BOTTOM_BAR_POSITIONS = Object.values(BOTTOM_BAR_POSITIONS)
export const VALID_BOTTOM_BAR_ALIGNMENTS = Object.values(BOTTOM_BAR_ALIGNMENTS)
export const VALID_BOTTOM_BAR_LAYOUTS = Object.values(BOTTOM_BAR_LAYOUTS)
