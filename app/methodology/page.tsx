'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function MethodologyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Page Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        評估方法論
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Our Methodology
                    </p>
                </div>

                {/* Intro */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        我們如何定義媒體偏見？
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        本平台的媒體偏見分類參考了國際知名的 <strong>Media Bias/Fact Check (MBFC)</strong> 方法論，並結合台灣獨特的政治光譜進行在地化調整。我們的目標不是標籤化媒體，而是提供讀者一個參考架構，幫助理解新聞報導背後的潛在觀點。
                    </p>
                </section>

                {/* The Spectrum */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                        <span className="w-1 h-8 bg-blue-600 rounded mr-3"></span>
                        台灣政治光譜分類
                    </h2>

                    <div className="space-y-6">
                        <div className="border-l-4 border-pan-green-500 pl-4 py-2 bg-pan-green-50 dark:bg-pan-green-900/10 rounded-r-lg">
                            <h3 className="text-xl font-bold text-pan-green-600 dark:text-pan-green-400 mb-2">
                                泛綠 (Pan-Green)
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                此類別的媒體在報導政治議題時，傾向支持台灣本土化意識、台灣主體性，立場通常與民主進步黨 (DPP) 或其他泛綠陣營政黨較為接近。在兩岸關係上，傾向強調台灣主權獨立與與區隔。
                            </p>
                        </div>

                        <div className="border-l-4 border-gray-500 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-r-lg">
                            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                                中立 (Center)
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                此類別的媒體致力於平衡報導，盡量減少立場鮮明的評論或特定政治傾向的用語。雖然完全的中立難以達成，但這些媒體通常會給予不同陣營較為均等的篇幅與話語權。公視與中央社通常歸於此類。
                            </p>
                        </div>

                        <div className="border-l-4 border-pan-blue-500 pl-4 py-2 bg-pan-blue-50 dark:bg-pan-blue-900/10 rounded-r-lg">
                            <h3 className="text-xl font-bold text-pan-blue-600 dark:text-pan-blue-400 mb-2">
                                泛藍 (Pan-Blue)
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                此類別的媒體在報導政治議題時，傾向支持中華民國憲法體制、維持現狀或兩岸交流，立場通常與中國國民黨 (KMT) 或其他泛藍陣營政黨較為接近。在兩岸議題上，較強調文化連結與和平發展。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Evaluation Criteria */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                        <span className="w-1 h-8 bg-blue-600 rounded mr-3"></span>
                        評估指標
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                                1. 用詞選擇 (Word Choice)
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                分析新聞標題與內文中是否使用帶有強烈情感或價值判斷的形容詞。例如稱呼特定政治人物時的敬稱或貶稱，以及對政策的描述方式。
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                                2. 消息來源 (Sourcing)
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                檢視報導是否過度依賴單一陣營的匿名消息來源，或是引用專家學者的比例是否平衡。
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                                3. 版面配置 (Framing)
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                觀察媒體將哪些新聞置於頭版或顯著位置，以及對特定議題的報導頻率與持續時間。
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                                4. 社論立場 (Editorial Stance)
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                參考該媒體長期以來的社論方向與專欄作家的整體政治光譜。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Disclaimer */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>
                        註：媒體偏見並非絕對的好壞標準，有立場的媒體也能產出高品質的報導。本方法的目的在於提升媒體識讀能力，而非審查媒體。
                    </p>
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
