const axios = require('axios');
const xml2js = require('xml2js');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/**
 * ⚠️ CONFIGURATION
 * 1. Download serviceAccountKey.json from Firebase Console
 * 2. Place it in the root directory
 * 3. Run: npm install axios xml2js firebase-admin date-fns
 */

// Initialize Firebase Admin (Backend Mode)
try {
    const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin Initialized');
} catch (error) {
    console.error('❌ Error: serviceAccountKey.json not found. Please download it from Firebase Console.');
    // We continue just to show the scraping logic working, but upload will fail
}

const db = admin.firestore ? admin.firestore() : null;

// News Sources Configuration
const FEEDS = [
    // --- Pan-Green (泛綠) ---
    {
        id: 'ltn',
        name: '自由時報',
        nameEn: 'Liberty Times',
        bias: 'pan-green',
        credibility: 4,
        url: 'https://news.ltn.com.tw/rss/politics.xml',
        parser: 'rss'
    },
    {
        id: 'setn',
        name: '三立新聞',
        nameEn: 'SETN',
        bias: 'pan-green',
        credibility: 3,
        url: 'https://www.setn.com/rss.aspx?PageGroupID=6', // Politics
        parser: 'rss'
    },
    {
        id: 'newtalk',
        name: '新頭殼',
        nameEn: 'Newtalk',
        bias: 'pan-green',
        credibility: 3,
        url: 'https://newtalk.tw/rss/news/all', // Fixed URL
        parser: 'rss'
    },

    // --- Center (中立) ---
    {
        id: 'cna',
        name: '中央社',
        nameEn: 'CNA',
        bias: 'center',
        credibility: 5,
        url: 'https://feeds.feedburner.com/cnaFirstNews',
        parser: 'rss'
    },
    {
        id: 'pts',
        name: '公視新聞',
        nameEn: 'PTS News',
        bias: 'center',
        credibility: 5,
        url: 'https://news.pts.org.tw/xml/newsfeed.xml',
        parser: 'rss'
    },
    {
        id: 'tnl',
        name: '關鍵評論網',
        nameEn: 'The News Lens',
        bias: 'center',
        credibility: 4,
        url: 'https://feeds.feedburner.com/TheNewsLens', // Replaced Storm Media
        parser: 'rss'
    },

    // --- Pan-Blue (泛藍) ---
    {
        id: 'udn',
        name: '聯合報',
        nameEn: 'United Daily News',
        bias: 'pan-blue',
        credibility: 4,
        url: 'https://udn.com/rssfeed/news/2/6638?ch=news',
        parser: 'rss'
    },
    {
        id: 'tvbs',
        name: 'TVBS',
        nameEn: 'TVBS News',
        bias: 'pan-blue',
        credibility: 4,
        url: 'https://news.tvbs.com.tw/rss/politics.xml', // Replaced China Times
        parser: 'rss'
    },
    {
        id: 'ettoday',
        name: 'ETtoday',
        nameEn: 'ETtoday',
        bias: 'pan-blue',
        credibility: 3,
        url: 'https://feeds.feedburner.com/ettoday/realtime', // Replaced CTi
        parser: 'rss'
    }
];

async function fetchAndParseRSS(feed) {
    try {
        console.log(`📡 Fetching ${feed.name}...`);
        const response = await axios.get(feed.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Referer': 'https://www.google.com/'
            },
            timeout: 10000 // 10 seconds timeout
        });

        const parser = new xml2js.Parser({ explicitArray: false });
        // Clean up potential XML issues before parsing
        const cleanXml = response.data.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');

        const result = await parser.parseStringPromise(cleanXml);

        // RSS structure varies, usually rss.channel.item
        const items = result.rss?.channel?.item || result.feed?.entry || [];
        const itemsArray = Array.isArray(items) ? items : [items]; // Handle single item case

        // Normalize data
        return itemsArray.slice(0, 15).map(item => ({ // Take top 15 from EACH source
            name: feed.name,
            nameEn: feed.nameEn,
            bias: feed.bias,
            credibility: feed.credibility,
            headline: item.title,
            url: item.link,
            summary: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
            publishedAt: new Date(item.pubDate || item.published || new Date()).toISOString(),
            sourceId: feed.id
        }));

    } catch (error) {
        console.error(`Error fetching ${feed.name}:`, error.message);
        return [];
    }
}

/**
 * 🧠 KEY STEP: CLUSTERING (SIMULATED)
 * In a real app, you would send all 'allArticles' to GPT-4 
 * to group them into Topics.
 * 
 * Here, we will just create "Daily Topics" based on common keywords
 * to demonstrate the upload structure.
 */
function simpleKeywordClustering(articles) {
    const clusters = [];

    // Example keywords that might appear in Taiwan news
    const keywords = ['立法院', '賴清德', '中國', '美國', '台積電', '預算', '柯文哲', '國民黨', '民進黨'];

    keywords.forEach(keyword => {
        const matchedArticles = articles.filter(a => a.headline.includes(keyword));

        if (matchedArticles.length > 1) {
            const biasCount = { 'pan-green': 0, 'center': 0, 'pan-blue': 0 };
            matchedArticles.forEach(a => { if (biasCount[a.bias] !== undefined) biasCount[a.bias]++; });

            clusters.push({
                title: `${keyword}相關報導重點整理`,
                description: `關於${keyword}的最新媒體報導彙整。`,
                category: '政治',
                updatedAt: new Date().toISOString(),
                sourceCount: matchedArticles.length,
                biasDistribution: {
                    panGreen: biasCount['pan-green'],
                    center: biasCount['center'],
                    panBlue: biasCount['pan-blue']
                },
                sources: matchedArticles
            });
        }
    });

    // Fallback: If no clusters found (or even if they were), create topics for everything else
    // This ensures your database fills up with ALL the news we found
    if (clusters.length < 5) {
        console.log('ℹ️ Creating Single-Source topics for remaining articles...');

        // Shuffle array to mix sources
        const shuffled = articles.sort(() => 0.5 - Math.random());

        // Upload up to 20 ungrouped articles
        shuffled.slice(0, 20).forEach(article => {
            // Don't duplicate if already in a cluster
            const alreadyGrouped = clusters.some(c => c.sources.some(s => s.url === article.url));

            if (!alreadyGrouped) {
                clusters.push({
                    title: article.headline,
                    description: article.summary,
                    category: '其他',
                    updatedAt: new Date().toISOString(),
                    sourceCount: 1,
                    biasDistribution: {
                        panGreen: article.bias === 'pan-green' ? 1 : 0,
                        center: article.bias === 'center' ? 1 : 0,
                        panBlue: article.bias === 'pan-blue' ? 1 : 0
                    },
                    sources: [article]
                });
            }
        });
    }

    return clusters;
}

async function main() {
    console.log('🚀 Starting News Scraper...');

    // 1. Fetch all raw articles
    let allArticles = [];
    for (const feed of FEEDS) {
        const articles = await fetchAndParseRSS(feed);
        allArticles = [...allArticles, ...articles];
    }

    console.log(`📊 Collected ${allArticles.length} raw articles.`);

    // 2. Cluster into Topics (The "Ground News" Logic)
    console.log('🧠 Analyzing and grouping topics...');
    const topics = simpleKeywordClustering(allArticles);
    console.log(`✨ Found ${topics.length} grouped topics.`);

    if (!db) {
        console.log('⚠️ Database not connected. Skipping upload.');
        return;
    }

    // 3. Upload to Firebase
    console.log('🔥 Uploading to Firestore...');

    for (const topic of topics) {
        try {
            // Create a new Topic document
            const topicRef = db.collection('topics').doc();

            const { sources, ...topicData } = topic;

            // Upload Topic Metadata
            await topicRef.set({
                ...topicData,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Upload Sources as Subcollection
            for (const source of sources) {
                await topicRef.collection('sources').add({
                    ...source,
                    publishedAt: new Date(source.publishedAt)
                });
            }

            console.log(`✅ Uploaded Topic: ${topic.title}`);

        } catch (e) {
            console.error('Upload failed:', e);
        }
    }

    console.log('🎉 Done!');
}

main();
