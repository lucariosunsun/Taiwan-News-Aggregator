import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PoliticalBias, BiasDistribution } from './types';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Get color class for bias type
export function getBiasColor(bias: PoliticalBias): string {
    switch (bias) {
        case 'pan-green':
            return 'bg-green-500';
        case 'center':
            return 'bg-gray-500';
        case 'pan-blue':
            return 'bg-blue-500';
    }
}

// Get text color for bias type
export function getBiasTextColor(bias: PoliticalBias): string {
    switch (bias) {
        case 'pan-green':
            return 'text-green-600';
        case 'center':
            return 'text-gray-600';
        case 'pan-blue':
            return 'text-blue-600';
    }
}

// Get bias label in Traditional Chinese
export function getBiasLabel(bias: PoliticalBias): string {
    switch (bias) {
        case 'pan-green':
            return '泛綠';
        case 'center':
            return '中立';
        case 'pan-blue':
            return '泛藍';
    }
}

// Format timestamp to Traditional Chinese format
export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    // Check if timestamp is valid
    if (isNaN(date.getTime())) {
        return '近期'; 
    }
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    
    // Convert to hours
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    // Handle future dates or tiny diffs
    if (diffInHours < 1 || isNaN(diffInHours)) {
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        if (diffInMinutes < 1) return '剛剛';
        return `${diffInMinutes} 分鐘前`;
    } else if (diffInHours < 24) {
        return `${diffInHours} 小時前`;
    } else if (diffInHours < 48) {
        return '昨天';
    } else {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    }
}

// Calculate bias distribution from sources
export function calculateBiasDistribution(sources: { bias: PoliticalBias }[]): BiasDistribution {
    const distribution = {
        panGreen: 0,
        center: 0,
        panBlue: 0,
    };

    sources.forEach((source) => {
        if (source.bias === 'pan-green') distribution.panGreen++;
        else if (source.bias === 'center') distribution.center++;
        else if (source.bias === 'pan-blue') distribution.panBlue++;
    });

    return distribution;
}

// Get credibility stars
export function getCredibilityStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Sort topics by recency
export function sortByRecency<T extends { updatedAt: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// Sort topics by source count
export function sortBySourceCount<T extends { sourceCount: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => b.sourceCount - a.sourceCount);
}
