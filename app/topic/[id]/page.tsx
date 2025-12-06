'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SourceCard from '@/components/SourceCard';
import { NewsTopic, NewsSource, PoliticalBias } from '@/lib/types';
import { getTopicById } from '@/lib/mockData';
import { formatTimestamp, deduplicateSources, calculateBiasDistribution } from '@/lib/utils';
import { fetchTopicById as fetchFirebaseTopic } from '@/lib/firebaseService';
// Check if Firebase is configured
const isFirebaseConfigured = typeof window !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'replace_this_with_your_api_key';
export default function TopicDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [topic, setTopic] = useState<NewsTopic | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | PoliticalBias>('all');
    useEffect(() => {
        const topicId = params.id as string;
        const fetchData = async () => {
            if (isFirebaseConfigured) {
                const firebaseTopic = await fetchFirebaseTopic(topicId);
                if (firebaseTopic) {
                    // Deduplicate sources
                    const uniqueSources = deduplicateSources(firebaseTopic.sources);
                    // Recalculate metadata based on unique sources
                    const biasDistribution = calculateBiasDistribution(uniqueSources);
                    setTopic({
                        ...firebaseTopic,
                        sources: uniqueSources,
                        sourceCount: uniqueSources.length,
                        biasDistribution
                    });
                    setLoading(false);
                    return;
                }
            }
            // Fallback to mock
            setTimeout(() => {
                const fetchedTopic = getTopicById(topicId);
                setTopic(fetchedTopic);
                setLoading(false);
            }, 300);
        };
        fetchData();
    }, [params.id]);
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </main>
            </div>
        );
    }
    if (!topic) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-16">
                        <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            找不到此新聞主題
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            此新聞主題可能已被移除或不存在
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="btn-primary"
                        >
                            返回首頁
                        </button>
                    </div>
                </main>
            </div>
        );
    }
    // Filter sources based on active tab
    const filteredSources = activeTab === 'all'
        ? topic.sources
        : topic.sources.filter(s => s.bias === activeTab);
    const total = topic.sourceCount;
    const { panGreen, center, panBlue } = topic.biasDistribution;
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm mb-6">
                    <button
                        onClick={() => router.push('/')}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        首頁
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600 dark:text-gray-400">{topic.category}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
                        {topic.title.substring(0, 30)}...
                    </span>
                </nav>
                {/* Topic Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-3">
                                {topic.category}
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                {topic.title}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                {topic.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>更新於 {formatTimestamp(topic.updatedAt)}</span>
                                <span>·</span>
                                <span>{topic.sourceCount} 個來源</span>
                            </div>
                        </div>
                    </div>
                    {/* Bias Distribution Visualization */}
                    <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            來源政治傾向分布
                        </h3>
                        {/* Horizontal Bar */}
                        <div className="w-full h-8 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex mb-4">
                            {panGreen > 0 && (
                                <div
                                    className="bg-pan-green-500 flex items-center justify-center text-white text-sm font-medium"
                                    style={{ width: `${(panGreen / total) * 100}%` }}
                                >
                                    {Math.round((panGreen / total) * 100)}%
                                </div>
                            )}
                            {center > 0 && (
                                <div
                                    className="bg-gray-500 flex items-center justify-center text-white text-sm font-medium"
                                    style={{ width: `${(center / total) * 100}%` }}
                                >
                                    {Math.round((center / total) * 100)}%
                                </div>
                            )}
                            {panBlue > 0 && (
                                <div
                                    className="bg-pan-blue-500 flex items-center justify-center text-white text-sm font-medium"
                                    style={{ width: `${(panBlue / total) * 100}%` }}
                                >
                                    {Math.round((panBlue / total) * 100)}%
                                </div>
                            )}
                        </div>
                        {/* Legend */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="flex items-center justify-center mb-1">
                                    <span className="w-4 h-4 bg-pan-green-500 rounded mr-2"></span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">泛綠</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{panGreen}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">來源</span>
                            </div>
                            <div>
                                <div className="flex items-center justify-center mb-1">
                                    <span className="w-4 h-4 bg-gray-500 rounded mr-2"></span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">中立</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{center}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">來源</span>
                            </div>
                            <div>
                                <div className="flex items-center justify-center mb-1">
                                    <span className="w-4 h-4 bg-pan-blue-500 rounded mr-2"></span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">泛藍</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{panBlue}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">來源</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Filter Tabs */}
                <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        全部 ({total})
                    </button>
                    <button
                        onClick={() => setActiveTab('pan-green')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'pan-green'
                            ? 'bg-pan-green-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        泛綠 ({panGreen})
                    </button>
                    <button
                        onClick={() => setActiveTab('center')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'center'
                            ? 'bg-gray-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        中立 ({center})
                    </button>
                    <button
                        onClick={() => setActiveTab('pan-blue')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'pan-blue'
                            ? 'bg-pan-blue-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        泛藍 ({panBlue})
                    </button>
                </div>
                {/* Sources Display - All sources in a grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredSources.map((source) => (
                        <SourceCard key={source.id} source={source} />
                    ))}
                </div>
                {/* Back Button */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        返回首頁
                    </button>
                </div>
            </main>
        </div>
    );
}
