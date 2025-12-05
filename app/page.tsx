'use client';
import { Suspense, useEffect, useState } from 'react';
import Header from '@/components/Header';
import NewsTopicCard from '@/components/NewsTopicCard';
import { NewsTopic, NewsCategory } from '@/lib/types';
import { getAllTopics, getTopicsByCategory } from '@/lib/mockData';
import { fetchNewsTopics, fetchTopicsByCategory as fetchFirebaseByCategory } from '@/lib/firebaseService';
import { useSearchParams } from 'next/navigation';
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
  // --- FILTERING LOGIC START ---
  // 1. Filter out topics with 1 source
  const validTopics = topics.filter(t => t.sourceCount > 1);
  // 2. Sort the filtered topics
  const sortedTopics = [...validTopics].sort((a, b) => {
    if (sortBy === 'recency') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else {
      return b.sourceCount - a.sourceCount;
    }
  });
  // --- FILTERING LOGIC END ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Category Tabs (Mobile Scrollable) */}
        <div className="flex overflow-x-auto pb-4 mb-6 hide-scrollbar space-x-2 border-b border-gray-200 dark:border-gray-700">
             {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                     // In a real app with searchParams, you'd push router
                     // For now, simpler state update for immediate feedback
                     if (typeof window !== 'undefined') {
                         const url = new URL(window.location.href);
                         if (cat === '全部') url.searchParams.delete('category');
                         else url.searchParams.set('category', cat);
                         window.history.pushState({}, '', url);
                         setSelectedCategory(cat);
                     }
                  }}
                  className={`
                    px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors
                    ${selectedCategory === cat 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                >
                  {cat}
                </button>
             ))}
        </div>
        {/* Hero / Welcome Section (Optional, only on All) */}
        {selectedCategory === '全部' && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              台灣新聞聚合
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              彙整多方觀點，打破同溫層
            </p>
          </div>
        )}
        {/* Filter & Sort Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
             顯示 {sortedTopics.length} 個主題
             {usingRealData && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Live Data</span>}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">排序：</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recency' | 'sources')}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            >
              <option value="recency">最新發布</option>
              <option value="sources">報導數量</option>
            </select>
          </div>
        </div>
        {/* Topics Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="bg-white dark:bg-gray-800 rounded-lg h-64 animate-pulse"></div>
             ))}
          </div>
        ) : sortedTopics.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedTopics.map((topic) => (
              <NewsTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
             目前沒有符合條件的新聞主題
          </div>
        )}
      </main>
    </div>
  );
}
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
      <HomePageContent />
    </Suspense>
  );
}
