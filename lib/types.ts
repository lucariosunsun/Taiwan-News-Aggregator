// Political bias categories specific to Taiwan
export type PoliticalBias = 'pan-green' | 'center' | 'pan-blue';

// News source interface
export interface NewsSource {
    id: string;
    name: string; // Traditional Chinese name
    nameEn?: string; // Optional English name
    bias: PoliticalBias;
    credibility: number; // 1-5 rating based on Media Bias Fact Check
    url: string; // Link to the article
    publishedAt: string; // ISO timestamp
    headline: string; // Article headline in Traditional Chinese
    summary: string; // Brief excerpt in Traditional Chinese
    thumbnail?: string; // Optional image URL
    factualReporting?: 'very-high' | 'high' | 'mostly-factual' | 'mixed' | 'low' | 'very-low';
}

// News topic interface
export interface NewsTopic {
    id: string;
    title: string; // Topic title in Traditional Chinese
    description: string; // Brief description
    category: '政治' | '經濟' | '社會' | '國際' | '科技' | '其他';
    sourceCount: number; // Number of sources covering this
    updatedAt: string; // ISO timestamp
    sources: NewsSource[];
    biasDistribution: {
        panGreen: number;
        center: number;
        panBlue: number;
    };
}

// Category type for filtering
export type NewsCategory = '政治' | '經濟' | '社會' | '國際' | '科技' | '其他' | '全部';

// Bias distribution for visualization
export interface BiasDistribution {
    panGreen: number;
    center: number;
    panBlue: number;
}
