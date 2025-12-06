const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
// Configuration: Topics to search for (Keywords)
const TARGET_TOPICS = [
    { title: "立法院預算審議", keywords: "立法院 預算" },
    { title: "台積電美國設廠", keywords: "台積電 美國" },
    { title: "健保費率改革", keywords: "健保 改革" }
];
// Sources Search Configuration
const SOURCES = [
    // Pan-Green
    {
        id: 'ltn', name: '自由時報', bias: 'pan-green',
        url: (kw) => `https://news.ltn.com.tw/search?keyword=${encodeURIComponent(kw)}`,
        selector: '.searchlist li',
        titleSel: '.tit',
        linkSel: 'a.tit',
        dateSel: '.time'
    },
    {
        id: 'setn', name: '三立新聞', bias: 'pan-green',
        url: (kw) => `https://www.setn.com/search.aspx?q=${encodeURIComponent(kw)}`,
        selector: '.news-list-item', // General guess, might need tuning
        titleSel: '.news-title h3',
        linkSel: 'a.news-title',
        dateSel: '.news-time'
    },
    {
        id: 'newtalk', name: '新頭殼', bias: 'pan-green',
        url: (kw) => `https://newtalk.tw/search?s=${encodeURIComponent(kw)}`,
        selector: '.news_list .news_item',
        titleSel: '.news_title a',
        linkSel: '.news_title a',
        dateSel: '.news_date'
    },
    // Center
    {
        id: 'cna', name: '中央社', bias: 'center',
        url: (kw) => `https://www.cna.com.tw/search/hysearchws.aspx?q=${encodeURIComponent(kw)}`,
        selector: '.mainList li',
        titleSel: 'h2',
        linkSel: 'a',
        dateSel: '.date'
    },
    {
        id: 'pts', name: '公視新聞', bias: 'center',
        url: (kw) => `https://news.pts.org.tw/search?q=${encodeURIComponent(kw)}`,
        selector: '.news-list .item',
        titleSel: 'h2 a',
        linkSel: 'h2 a',
        dateSel: '.date'
    },
    {
        id: 'tnl', name: '關鍵評論網', bias: 'center',
        url: (kw) => `https://www.thenewslens.com/search?q=${encodeURIComponent(kw)}`,
        selector: '.search-result-list-item',
        titleSel: '.title a',
        linkSel: '.title a',
        dateSel: '.time'
    },
    // Pan-Blue
    {
        id: 'udn', name: '聯合報', bias: 'pan-blue',
        url: (kw) => `https://udn.com/search/word/2/${encodeURIComponent(kw)}`,
        selector: '.story-list__news',
        titleSel: '.story-list__text h2 a',
        linkSel: '.story-list__text h2 a',
        dateSel: '.story-list__time'
    },
    {
        id: 'tvbs', name: 'TVBS', bias: 'pan-blue',
        url: (kw) => `https://news.tvbs.com.tw/search?q=${encodeURIComponent(kw)}`,
        selector: '.search_list_box li',
        titleSel: '.search_list_txt',
        linkSel: 'a',
        dateSel: '.icon_time'
    },
    {
        id: 'ettoday', name: 'ETtoday', bias: 'pan-blue',
        url: (kw) => `https://www.ettoday.net/news_search/do_search.php?keywords=${encodeURIComponent(kw)}`,
        selector: '.box_2 .clearfix',
        titleSel: 'h2 a',
        linkSel: 'h2 a',
        dateSel: '.date'
    }
];
// Helper to clean CSV text
function escapeCSV(str) {
    if (!str) return '';
    str = str.toString().replace(/"/g, '""').trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str}"`;
    }
    return str;
}
async function searchSource(source, topicTitle, keyword) {
    const searchUrl = source.url(keyword);
    console.log(`🔍 [${source.name}] Searching for: ${keyword}`);
    try {
        const response = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36' },
            timeout: 8000
        });
        const $ = cheerio.load(response.data);
        const results = [];
        const seenLinks = new Set();
        $(source.selector).each((i, el) => {
            if (results.length >= 3) return; // Limit to 3 top results per source per topic
            let title = $(el).find(source.titleSel).text().trim();
            const linkRel = $(el).find(source.linkSel).attr('href');
            let date = $(el).find(source.dateSel).text().trim();
            if (!title || !linkRel) return;
            // Resolve relative URLs
            let finalLink = linkRel;
            if (linkRel.startsWith('/')) {
                const origin = new URL(searchUrl).origin;
                finalLink = `${origin}${linkRel}`;
            }
            if (seenLinks.has(finalLink)) return;
            seenLinks.add(finalLink);
            results.push({
                topic: topicTitle,
                keyword,
                source: source.name,
                bias: source.bias,
                title,
                link: finalLink,
                date: date || new Date().toISOString().split('T')[0] // Fallback to today
            });
        });
        console.log(`   ✅ Found ${results.length} articles`);
        return results;
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message} (${source.id})`);
        return [];
    }
}
async function main() {
    console.log('🚀 Starting Targeted Related News Search...');
    // Create output directory
    const outputDir = path.join(__dirname, '../scraped-news-related');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    let allResults = [];
    // Search for each topic
    for (const topic of TARGET_TOPICS) {
        console.log(`\n📚 TOPIC: ${topic.title} (${topic.keywords})`);
        console.log('='.repeat(40));
        // Search in all sources parallel-ish (limited concurrency)
        const topicPromises = SOURCES.map(source => searchSource(source, topic.title, topic.keywords));
        const topicResults = await Promise.all(topicPromises);
        topicResults.forEach(res => allResults = [...allResults, ...res]);
    }
    // Export to CSV
    const csvHeader = 'Topic,Keyword,Source,Bias,Headline,URL,DateString\n';
    const csvRows = allResults.map(r =>
        `${escapeCSV(r.topic)},${escapeCSV(r.keyword)},${escapeCSV(r.source)},${escapeCSV(r.bias)},${escapeCSV(r.title)},${escapeCSV(r.link)},${escapeCSV(r.date)}`
    ).join('\n');
    const csvContent = '\uFEFF' + csvHeader + csvRows; // Add BOM
    const fileName = `related_news_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, csvContent);
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEARCH COMPLETED!');
    console.log(`📄 Saved ${allResults.length} articles to:`);
    console.log(`   ${filePath}`);
    console.log('='.repeat(60));
}
main();
