'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Page Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        關於我們
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        About Taiwan News Aggregator
                    </p>
                </div>

                {/* Mission Section */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="w-1 h-8 bg-blue-600 rounded mr-3"></span>
                        我們的使命
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        台灣新聞聚合致力於提供多元化的新聞視角，幫助讀者全面理解台灣時事。我們相信，在資訊爆炸的時代，了解不同媒體對同一事件的報導角度，是培養獨立思考能力的重要基礎。
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        透過整合來自泛綠、中立、泛藍三種不同政治傾向的新聞來源，我們希望讓讀者能夠跳脫單一觀點的限制，從多個角度審視新聞事件，培養更全面、更客觀的判斷力。
                    </p>
                </section>

                {/* What We Do */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="w-1 h-8 bg-blue-600 rounded mr-3"></span>
                        我們做什麼
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    整合多元新聞來源
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    我們彙整來自各大主流媒體的新聞報導，涵蓋泛綠、中立、泛藍三種政治光譜，確保資訊的多樣性與完整性。
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    視覺化政治傾向分布
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    透過直觀的圖表呈現各新聞主題的來源分布，讓讀者一眼就能看出報導的多元程度與傾向差異。
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    促進媒體識讀教育
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    幫助讀者理解媒體偏見的概念，培養批判性思考能力，成為更有洞察力的新聞消費者。
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Values */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="w-1 h-8 bg-blue-600 rounded mr-3"></span>
                        核心價值
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-pan-green-100 dark:bg-pan-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-pan-green-600 dark:text-pan-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                透明度
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                清楚標示新聞來源及其政治傾向，讓讀者充分了解資訊背景
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                中立性
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                不偏袒任何政治立場，公正呈現各方觀點
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-pan-blue-100 dark:bg-pan-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-pan-blue-600 dark:text-pan-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                啟發性
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                激發讀者思考，培養獨立判斷與批判性思維
                            </p>
                        </div>
                    </div>
                </section>

                {/* Methodology Link */}
                <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-md p-8 mb-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            想了解我們如何評估新聞偏見？
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            我們採用參考 Media Bias Fact Check 的方法論，結合台灣政治光譜特性進行分類
                        </p>
                        <button
                            onClick={() => router.push('/methodology')}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-md"
                        >
                            查看評估方法論
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </section>

                {/* Disclaimer */}
                <section className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                    <div className="flex items-start space-x-3">
                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                                重要聲明
                            </h3>
                            <p className="text-yellow-800 dark:text-yellow-300 text-sm leading-relaxed">
                                本平台僅提供新聞聚合服務，所有新聞內容版權歸原媒體所有。政治傾向分類僅供參考，不代表本平台立場。我們鼓勵讀者閱讀多元來源，培養獨立思考能力。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Back Button */}
                <div className="text-center">
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
