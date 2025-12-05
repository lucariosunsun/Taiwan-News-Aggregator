'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SourceCard from '@/components/SourceCard';
import { NewsTopic, NewsSource, PoliticalBias } from '@/lib/types';
import { getTopicById } from '@/lib/mockData';
import { formatTimestamp } from '@/lib/utils';
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
                    setTopic(firebaseTopic);
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
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">找不到該主題</h1>
                    <button 
                        onClick={() => router.push('/')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        返回首頁
                    </button>
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
                <nav className="flex mb-8 text-sm text-gray-500 dark:text-gray-400">
                    <button onClick={() => router.push('/')} className="hover:text-blue-600">首頁</button>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-gray-300 font-medium">{topic.category}</span>
                </nav>
                {/* Topic Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {topic.title}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                        {topic.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span>最後更新：{formatTimestamp(topic.updatedAt)}</span>
                        <span className="mx-2">•</span>
                        <span>{total} 則報導</span>
                    </div>
                </div>
                {/* Bias Distribution Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">媒體觀點分布</h2>
                    
                    {/* Progress Bar */}
                    <div className="h-4 flex rounded-full overflow-hidden mb-2">
                        <div style={{ width: `${(panGreen / total) * 100}%` }} className="bg-pan-green-500 transition-all duration-500" />
                        <div style={{ width: `${(center / total) * 100}%` }} className="bg-gray-400 transition-all duration-500" />
                        <div style={{ width: `${(panBlue / total) * 100}%` }} className="bg-pan-blue-500 transition-all duration-500" />
                    </div>
                    
                    {/* Legend */}
                    <div className="flex justify-between text-sm mt-2">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-pan-green-500 rounded-full mr-2" />
                            <span className="text-gray-700 dark:text-gray-300">泛綠 ({panGreen})</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2" />
                            <span className="text-gray-700 dark:text-gray-300">中立 ({center})</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-pan-blue-500 rounded-full mr-2" />
                            <span className="text-gray-700 dark:text-gray-300">泛藍 ({panBlue})</span>
                        </div>
                    </div>
                </div>
                {/* Filter Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {(['all', 'pan-green', 'center', 'pan-blue'] as const).map((bias) => (
                            <button
                                key={bias}
                                onClick={() => setActiveTab(bias)}
                                className={`
                                    whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === bias
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                                `}
                            >
                                {bias === 'all' ? '全部報導' : 
                                 bias === 'pan-green' ? '泛綠觀點' :
                                 bias === 'center' ? '中立觀點' : '泛藍觀點'}
                                <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {bias === 'all' ? total : 
                                     bias === 'pan-green' ? panGreen :
                                     bias === 'center' ? center : panBlue}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
                {/* Sources List */}
                <div className="grid gap-6 md:grid-cols-2">
                    {filteredSources.map((source) => (
                        <SourceCard key={source.id} source={source} />
                    ))}
                    {filteredSources.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
                            此觀點尚無相關報導
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
