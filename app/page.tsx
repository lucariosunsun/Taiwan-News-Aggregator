'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import NewsTopicCard from '@/components/NewsTopicCard';
import { NewsTopic, NewsCategory } from '@/lib/types';
import { getAllTopics, getTopicsByCategory } from '@/lib/mockData';
import { fetchNewsTopics, fetchTopicsByCategory as fetchFirebaseByCategory } from '@/lib/firebaseService';

// Check if Firebase is configured
const isFirebaseConfigured = typeof window !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'replace_this_with_your_api_key';

function HomePageContent() {
  const searchParams = useSearchParams();
  const [topics, setTopics] = useState<NewsTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recency' | 'sources'>('recency');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('全部');
  const [usingRealData, setUsingRealData] = useState(false);

  const categories: NewsCategory[] = ['全部', '政治', '經濟', '社會', '國際', '科技', '其他'];

  // Get category from URL or use selected
  const categoryFromUrl = (searchParams.get('category') as NewsCategory) || '全部';
  const category = categoryFromUrl;

  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  useEffect(() => {
    // Data fetching logic
    setLoading(true);

    const loadData = async () => {
      try {
        if (isFirebaseConfigured) {
          // Try fetching from Firebase
          const realTopics = selectedCategory === '全部'
            ? await fetchNewsTopics()
            : await fetchFirebaseByCategory(selectedCategory);

          if (realTopics.length > 0) {
            setTopics(realTopics);
            setUsingRealData(true);
            setLoading(false);
            return;
          }
        }

        // Fallback to mock data if Firebase not set up or empty
        console.log('Using mock data (Firebase not configured or empty)');
        // Simulate delay for mock data
        await new Promise(resolve => setTimeout(resolve, 300));

        const mockTopics = selectedCategory === '全部'
          ? getAllTopics()
          : getTopicsByCategory(selectedCategory);

        setTopics(mockTopics);
        setUsingRealData(false);
        setLoading(false);

      } catch (error) {
        console.error("Failed to load data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCategory]);

  // Sort topics based on selection
  const sortedTopics = [...topics].sort((a, b) => {
    if (sortBy === 'recency') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else {
      return b.sourceCount - a.sourceCount;
    }
  });

  const handleCategoryChange = (cat: NewsCategory) => {
    setSelectedCategory(cat);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            多元觀點 · 全面理解
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            從泛綠、中立、泛藍三種角度，全方位了解台灣新聞事件。
            基於 Media Bias Fact Check 方法論，提供客觀的新聞來源分析。
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex items-center space-x-2 min-w-max pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`
                  px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filter and Sort Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCategory === '全部' ? '所有類別' : selectedCategory}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">·</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {topics.length} 個新聞主題
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">排序:</span>
            <button
              onClick={() => setSortBy('recency')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${sortBy === 'recency'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              最新
            </button>
            <button
              onClick={() => setSortBy('sources')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${sortBy === 'sources'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              最多來源
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80"></div>
              </div>
            ))}
          </div>
        )}

        {/* Topics Grid */}
        {!loading && sortedTopics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {sortedTopics.map((topic) => (
              <NewsTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedTopics.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              目前沒有新聞
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              此分類暫無新聞主題
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">
            本平台旨在提供多元新聞觀點，幫助讀者全面了解台灣時事
          </p>
          <p>
            來源評級基於 Media Bias Fact Check 方法論 ·
            分類依據：泛綠 (Pan-Green) · 中立 (Center) · 泛藍 (Pan-Blue)
          </p>
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
