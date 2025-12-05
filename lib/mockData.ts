import { NewsTopic, NewsSource } from './types';
import { calculateBiasDistribution } from './utils';

// Taiwan news sources - 3 for each bias category
// Based on Media Bias Fact Check methodology

// Pan-Green sources (traditionally support Taiwan independence, DPP-aligned)
const panGreenSources = [
    { id: 'liberty-times', name: '自由時報', nameEn: 'Liberty Times', credibility: 4 },
    { id: 'formosa-tv', name: '民視新聞', nameEn: 'Formosa TV', credibility: 3 },
    { id: 'newtalk', name: '新頭殼', nameEn: 'Newtalk', credibility: 3 },
];

// Center sources (relatively neutral)
const centerSources = [
    { id: 'cna', name: '中央社', nameEn: 'Central News Agency', credibility: 5 },
    { id: 'pts', name: '公視新聞', nameEn: 'PTS News', credibility: 5 },
    { id: 'storm-media', name: '風傳媒', nameEn: 'Storm Media', credibility: 4 },
];

// Pan-Blue sources (traditionally support unification, KMT-aligned)
const panBlueSources = [
    { id: 'china-times', name: '中國時報', nameEn: 'China Times', credibility: 3 },
    { id: 'united-daily', name: '聯合報', nameEn: 'United Daily News', credibility: 4 },
    { id: 'ctitv', name: '中天新聞', nameEn: 'CTiTV', credibility: 2 },
];

// Mock news topics with realistic Taiwan news
export const mockTopics: NewsTopic[] = [
    {
        id: 'legislative-budget-dispute',
        title: '立法院預算審議引發朝野衝突',
        description: '執政黨與在野黨就2025年度中央政府總預算案產生重大分歧，雙方在議場發生激烈爭執。',
        category: '政治',
        sourceCount: 9,
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        sources: [
            {
                id: 'lb-1',
                name: panGreenSources[0].name,
                nameEn: panGreenSources[0].nameEn,
                bias: 'pan-green',
                credibility: panGreenSources[0].credibility,
                url: 'https://example.com/liberty-1',
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                headline: '在野黨強推預算案修正 學者批破壞民主機制',
                summary: '多位政治學者表示，在野黨此舉恐影響政府正常運作，呼籲朝野應理性溝通...',
                factualReporting: 'mostly-factual',
            },
            {
                id: 'lb-2',
                name: panGreenSources[1].name,
                bias: 'pan-green',
                credibility: panGreenSources[1].credibility,
                url: 'https://example.com/formosa-1',
                publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                headline: '執政黨譴責在野黨杯葛預算 籲回歸理性協商',
                summary: '民進黨立委召開記者會，指出國民黨與民眾黨聯手杯葛預算審查...',
                factualReporting: 'mostly-factual',
            },
            {
                id: 'lb-3',
                name: panGreenSources[2].name,
                bias: 'pan-green',
                credibility: panGreenSources[2].credibility,
                url: 'https://example.com/newtalk-1',
                publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                headline: '預算爭議持續延燒 民眾黨角色引關注',
                summary: '分析指出民眾黨在預算審議中扮演關鍵角色，其立場將影響最終結果...',
                factualReporting: 'mostly-factual',
            },
            {
                id: 'ct-1',
                name: centerSources[0].name,
                bias: 'center',
                credibility: centerSources[0].credibility,
                url: 'https://example.com/cna-1',
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                headline: '立法院預算審查陷僵局 朝野協商未果',
                summary: '立法院會今日就總預算案進行表決，但因朝野歧見過大，協商破局...',
                factualReporting: 'very-high',
            },
            {
                id: 'ct-2',
                name: centerSources[1].name,
                bias: 'center',
                credibility: centerSources[1].credibility,
                url: 'https://example.com/pts-1',
                publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                headline: '總預算審查爭議 專家解析憲政機制',
                summary: '憲法學者說明立法院預算審查權限與行政部門預算編列權之平衡...',
                factualReporting: 'very-high',
            },
            {
                id: 'ct-3',
                name: centerSources[2].name,
                bias: 'center',
                credibility: centerSources[2].credibility,
                url: 'https://example.com/storm-1',
                publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                headline: '預算僵局背後：台灣政治生態的結構性問題',
                summary: '深入分析顯示，朝小野大格局下，預算審查已成為政黨攻防主戰場...',
                factualReporting: 'high',
            },
            {
                id: 'cu-1',
                name: panBlueSources[0].name,
                bias: 'pan-blue',
                credibility: panBlueSources[0].credibility,
                url: 'https://example.com/china-times-1',
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                headline: '在野黨堅守監督職責 要求政府預算透明化',
                summary: '國民黨團表示，對預算案提出修正是善盡立法監督職責，要求政府提供詳細說明...',
                factualReporting: 'mostly-factual',
            },
            {
                id: 'cu-2',
                name: panBlueSources[1].name,
                bias: 'pan-blue',
                credibility: panBlueSources[1].credibility,
                url: 'https://example.com/udn-1',
                publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                headline: '立院三黨攻防預算案 民意盼見理性溝通',
                summary: '面對2025年總預算審查，三黨立場分歧，民調顯示民眾期待理性協商...',
                factualReporting: 'high',
            },
            {
                id: 'cu-3',
                name: panBlueSources[2].name,
                bias: 'pan-blue',
                credibility: panBlueSources[2].credibility,
                url: 'https://example.com/ctitv-1',
                publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                headline: '執政黨獨斷預算 在野黨捍衛人民荷包',
                summary: '民眾黨、國民黨聯手要求刪減不當預算，保護納稅人權益...',
                factualReporting: 'mixed',
            },
        ],
        biasDistribution: { panGreen: 3, center: 3, panBlue: 3 },
    },
    {
        id: 'tsmc-us-expansion',
        title: '台積電美國廠進度更新 第三座工廠擬2030年投產',
        description: '台積電宣布美國亞利桑那州第三座晶圓廠建設計畫，預計2030年開始量產2奈米先進製程。',
        category: '經濟',
        sourceCount: 6,
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        sources: [
            {
                id: 'tsmc-1',
                name: panGreenSources[0].name,
                bias: 'pan-green',
                credibility: panGreenSources[0].credibility,
                url: 'https://example.com/liberty-2',
                publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                headline: '台積電擴大美國投資 展現台灣半導體領導地位',
                summary: '台積電赴美設廠象徵台灣在全球半導體產業的關鍵角色，有助強化台美經貿連結...',
                factualReporting: 'mostly-factual',
            },
            {
                id: 'tsmc-2',
                name: panGreenSources[2].name,
                bias: 'pan-green',
                credibility: panGreenSources[2].credibility,
                url: 'https://example.com/newtalk-2',
                publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                headline: '台積電海外布局 專家：台灣仍是核心研發基地',
                summary: '儘管赴美設廠，分析師認為台積電最先進製程仍將保留在台灣...',
                factualReporting: 'high',
            },
            {
                id: 'tsmc-3',
                name: centerSources[0].name,
                bias: 'center',
                credibility: centerSources[0].credibility,
                url: 'https://example.com/cna-2',
                publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                headline: '台積電美國第三廠2030年投產 2奈米製程',
                summary: '台積電發布新聞稿表示，亞利桑那第三座晶圓廠預計2030年開始生產...',
                factualReporting: 'very-high',
            },
            {
                id: 'tsmc-4',
                name: centerSources[1].name,
                bias: 'center',
                credibility: centerSources[1].credibility,
                url: 'https://example.com/pts-2',
                publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                headline: '半導體產業鏈全球化 台積電海外投資影響分析',
                summary: '公視深度報導探討台積電海外投資對台灣產業鏈、就業市場的長期影響...',
                factualReporting: 'very-high',
            },
            {
                id: 'tsmc-5',
                name: panBlueSources[1].name,
                bias: 'pan-blue',
                credibility: panBlueSources[1].credibility,
                url: 'https://example.com/udn-2',
                publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                headline: '台積電美國擴廠 台灣產業空洞化疑慮待解',
                summary: '台積電持續擴大海外投資規模，引發台灣半導體產業是否面臨空洞化的討論...',
                factualReporting: 'high',
            },
            {
                id: 'tsmc-6',
                name: panBlueSources[0].name,
                bias: 'pan-blue',
                credibility: panBlueSources[0].credibility,
                url: 'https://example.com/china-times-2',
                publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                headline: '台積電赴美建廠成本高昂 股東權益引關注',
                summary: '美國廠建置成本遠高於台灣，部分股東關切投資報酬率與長期獲利能力...',
                factualReporting: 'mostly-factual',
            },
        ],
        biasDistribution: { panGreen: 2, center: 2, panBlue: 2 },
    },
    {
        id: 'healthcare-reform',
        title: '健保改革方案出爐 部分負擔調整引發討論',
        description: '衛福部公布健保財務改革方案，調整門診及住院部分負擔額度，引發各界正反意見。',
        category: '社會',
        sourceCount: 7,
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        sources: [
            {
                id: 'health-1',
                name: panGreenSources[1].name,
                bias: 'pan-green',
                credibility: panGreenSources[1].credibility,
                url: 'https://example.com/formosa-2',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                headline: '健保改革兼顧公平與永續 政府承諾弱勢保障不變',
                summary: '衛福部長強調改革方案已考量弱勢族群，低收入戶與特定重大傷病患者不受影響...',
                factualReporting: 'mostly-factual',
            },
            {
                id: 'health-2',
                name: centerSources[0].name,
                bias: 'center',
                credibility: centerSources[0].credibility,
                url: 'https://example.com/cna-3',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                headline: '健保部分負擔調整方案 門診最高收費250元',
                summary: '根據衛福部規劃，醫學中心門診部分負擔將從現行210元調整至250元...',
                factualReporting: 'very-high',
            },
            {
                id: 'health-3',
                name: centerSources[1].name,
                bias: 'center',
                credibility: centerSources[1].credibility,
                url: 'https://example.com/pts-3',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
                headline: '健保永續挑戰：收支平衡與醫療品質如何兼顧',
                summary: '公視專題報導分析台灣健保制度面臨高齡化、醫療支出增加等挑戰...',
                factualReporting: 'very-high',
            },
            {
                id: 'health-4',
                name: centerSources[2].name,
                bias: 'center',
                credibility: centerSources[2].credibility,
                url: 'https://example.com/storm-2',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(),
                headline: '健保改革民調：六成民眾願接受合理調整',
                summary: '最新民調顯示，多數民眾理解健保財務壓力，但希望政府提供更透明的財務資訊...',
                factualReporting: 'high',
            },
            {
                id: 'health-5',
                name: panBlueSources[1].name,
                bias: 'pan-blue',
                credibility: panBlueSources[1].credibility,
                url: 'https://example.com/udn-3',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                headline: '健保調漲恐加重民眾負擔 在野黨要求審慎評估',
                summary: '國民黨立委指出，在物價上漲壓力下，健保部分負擔調整將影響民生...',
                factualReporting: 'high',
            },
            {
                id: 'health-6',
                name: panBlueSources[0].name,
                bias: 'pan-blue',
                credibility: panBlueSources[0].credibility,
                url: 'https://example.com/china-times-3',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
                headline: '健保改革應先檢討浪費 醫界籲落實分級醫療',
                summary: '醫師公會認為，健保財務問題根源在於醫療資源分配不均與重複就醫...',
                factualReporting: 'mostly-factual',
            },
            {
                id: 'health-7',
                name: panGreenSources[2].name,
                bias: 'pan-green',
                credibility: panGreenSources[2].credibility,
                url: 'https://example.com/newtalk-3',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
                headline: '健保改革勢在必行 學者籲建立永續機制',
                summary: '公衛學者表示，面對人口老化趨勢，健保制度必須及早改革以確保永續...',
                factualReporting: 'high',
            },
        ],
        biasDistribution: { panGreen: 2, center: 3, panBlue: 2 },
    },
];

// Function to get all topics (for home page)
export function getAllTopics(): NewsTopic[] {
    return mockTopics.map(topic => ({
        ...topic,
        biasDistribution: calculateBiasDistribution(topic.sources),
    }));
}

// Function to get topic by ID (for detail page)
export function getTopicById(id: string): NewsTopic | null {
    const topic = mockTopics.find(t => t.id === id);
    if (!topic) return null;

    return {
        ...topic,
        biasDistribution: calculateBiasDistribution(topic.sources),
    };
}

// Function to get topics by category
export function getTopicsByCategory(category: string): NewsTopic[] {
    if (category === '全部') return getAllTopics();

    return mockTopics
        .filter(topic => topic.category === category)
        .map(topic => ({
            ...topic,
            biasDistribution: calculateBiasDistribution(topic.sources),
        }));
}
