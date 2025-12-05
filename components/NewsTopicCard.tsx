import Link from 'next/link';
import { NewsTopic } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

interface NewsTopicCardProps {
    topic: NewsTopic;
}

export default function NewsTopicCard({ topic }: NewsTopicCardProps) {
    const total = topic.sourceCount;
    const { panGreen, center, panBlue } = topic.biasDistribution;

    // Calculate percentages for the bias distribution bar
    const panGreenPercent = total > 0 ? (panGreen / total) * 100 : 0;
    const centerPercent = total > 0 ? (center / total) * 100 : 0;
    const panBluePercent = total > 0 ? (panBlue / total) * 100 : 0;

    return (
        <Link href={`/topic/${topic.id}`}>
            <div className="card card-hover cursor-pointer h-full p-6 border border-gray-200 dark:border-gray-700">
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {topic.category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimestamp(topic.updatedAt)}
                    </span>
                </div>

                {/* Topic Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                    {topic.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {topic.description}
                </p>

                {/* Source Count */}
                <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{topic.sourceCount}</span> 個來源報導
                    </span>
                </div>

                {/* Bias Distribution Visualization */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>來源政治傾向分布</span>
                        <span className="font-medium">泛綠 · 中立 · 泛藍</span>
                    </div>

                    {/* Horizontal Bar Chart */}
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                        {panGreen > 0 && (
                            <div
                                className="bg-pan-green-500 transition-all duration-300"
                                style={{ width: `${panGreenPercent}%` }}
                                title={`泛綠: ${panGreen} (${Math.round(panGreenPercent)}%)`}
                            />
                        )}
                        {center > 0 && (
                            <div
                                className="bg-gray-500 transition-all duration-300"
                                style={{ width: `${centerPercent}%` }}
                                title={`中立: ${center} (${Math.round(centerPercent)}%)`}
                            />
                        )}
                        {panBlue > 0 && (
                            <div
                                className="bg-pan-blue-500 transition-all duration-300"
                                style={{ width: `${panBluePercent}%` }}
                                title={`泛藍: ${panBlue} (${Math.round(panBluePercent)}%)`}
                            />
                        )}
                    </div>

                    {/* Legend with counts */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-pan-green-500 rounded-full mr-1"></span>
                            <span className="text-gray-600 dark:text-gray-400">{panGreen}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-gray-500 rounded-full mr-1"></span>
                            <span className="text-gray-600 dark:text-gray-400">{center}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-pan-blue-500 rounded-full mr-1"></span>
                            <span className="text-gray-600 dark:text-gray-400">{panBlue}</span>
                        </div>
                    </div>
                </div>

                {/* Read More Indicator */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center">
                        查看所有來源
                        <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}
