import { NewsSource } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import BiasIndicator from './BiasIndicator';

interface SourceCardProps {
    source: NewsSource;
}

export default function SourceCard({ source }: SourceCardProps) {
    return (
        <div className="card p-5 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            {/* Source Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {source.name}
                        </h4>
                        {source.nameEn && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({source.nameEn})
                            </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                        <BiasIndicator bias={source.bias} size="sm" />
                    </div>
                </div>

                {/* Published Time */}
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-3">
                    {formatTimestamp(source.publishedAt)}
                </span>
            </div>

            {/* Headline */}
            <h5 className="text-base font-semibold text-gray-900 dark:text-white mb-3 leading-snug">
                {source.headline}
            </h5>

            {/* Summary */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {source.summary}
            </p>

            {/* Thumbnail if available */}
            {source.thumbnail && (
                <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                        src={source.thumbnail}
                        alt={source.headline}
                        className="w-full h-48 object-cover"
                    />
                </div>
            )}

            {/* Read Full Article Button */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                    閱讀全文
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>

                <span className="text-xs text-gray-400 dark:text-gray-500">
                    開啟新視窗
                </span>
            </div>
        </div>
    );
}
