/**
 * UI ve Tasarım yardımcı fonksiyonları
 */

/**
 * Hex rengini RGBA formatına dönüştürür
 * @param {string} hex - Hex renk kodu (#RRGGBB veya #RGB)
 * @param {number} opacity - Opaklık (0-1)
 * @returns {string} rgba(r, g, b, a) formatında renk
 */
export const hexToRgba = (hex, opacity = 1) => {
    let r = 0, g = 0, b = 0;

    // Temizle ve normalize et
    const cleanHex = hex.replace('#', '');

    if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Benzersiz bir ID oluşturur
 * @returns {string} Benzersiz ID
 */
export const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};
