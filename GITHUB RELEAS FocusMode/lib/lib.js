// lib/utils.js - Вспомогательные функции

/**
 * Утилиты для расширения DataMarker
 */

// Экранирование HTML для безопасного отображения
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Форматирование даты
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Генерация уникального ID
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Сохранение данных в chrome.storage
async function saveToStorage(key, data) {
    try {
        await chrome.storage.local.set({ [key]: data });
        return true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        return false;
    }
}

// Загрузка данных из chrome.storage
async function loadFromStorage(key) {
    try {
        const result = await chrome.storage.local.get(key);
        return result[key] || [];
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        return [];
    }
}

// Обрезка длинного текста
function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Проверка, является ли строка URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Экспорт в CSV
function convertToCSV(data) {
    if (!data || !data.length) return '';
    
    const headers = ['text', 'url', 'timestamp', 'label', 'type'];
    const rows = data.map(item => [
        `"${(item.text || '').replace(/"/g, '""')}"`,
        `"${(item.url || '').replace(/"/g, '""')}"`,
        item.timestamp || '',
        item.label || '',
        item.type || 'text'
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// Экспорт в JSON
function convertToJSON(data) {
    return JSON.stringify(data, null, 2);
}

// Получение цвета для метки
function getLabelColor(label) {
    const colors = {
        'positive': '#2ecc71',
        'negative': '#e74c3c',
        'neutral': '#f39c12',
        'custom': '#9b59b6'
    };
    return colors[label] || '#3498db';
}

// Дебаунс (для поиска/фильтрации)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Экспортируем все функции (для использования в других скриптах)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        formatDate,
        generateId,
        saveToStorage,
        loadFromStorage,
        truncateText,
        isValidUrl,
        convertToCSV,
        convertToJSON,
        getLabelColor,
        debounce
    };
}