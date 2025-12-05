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
// News Sources Configuration (Focused on Real-time & Hot News)
const FEEDS = [
    // --- Pan-Green (泛綠) ---
    {
        id: 'ltn',
        name: '自由時報',
        nameEn: 'Liberty Times',
        bias: 'pan-green',
        credibility: 4,
        url: 'https://news.ltn.com.tw/rss/all.xml', // Changed to "All/Realtime"
        parser: 'rss'
    },
    {
        id: 'setn',
        name: '三立新聞',
        nameEn: 'SETN',
        bias: 'pan-green',
        credibility: 3,
        url: 'https://www.setn.com/rss.aspx?PageGroupID=1', // Changed to "Breaking/Realtime" (was 6 for Politics)
        parser: 'rss'
    },
    {
        id: 'newtalk',
        name: '新頭殼',
        nameEn: 'Newtalk',
        bias: 'pan-green',
        credibility: 3,
        url: 'https://newtalk.tw/rss/news/all', // All Realtime
        parser: 'rss'
    },
    // --- Center (中立) ---
    {
        id: 'cna',
        name: '中央社',
        nameEn: 'CNA',
        bias: 'center',
        credibility: 5,
        url: 'https://feeds.feedburner.com/cnaFirstNews', // "Focus/Hot News"
        parser: 'rss'
    },
    {
        id: 'pts',
        name: '公視新聞',
        nameEn: 'PTS News',
        bias: 'center',
        credibility: 5,
        url: 'https://news.pts.org.tw/xml/newsfeed.xml', // Daily News
        parser: 'rss'
    },
    {
        id: 'tnl',
        name: '關鍵評論網',
        nameEn: 'The News Lens',
        bias: 'center',
        credibility: 4,
        url: 'https://feeds.feedburner.com/TheNewsLens', // Latest/Hot
        parser: 'rss'
    },
    // --- Pan-Blue (泛藍) ---
    {
        id: 'udn',
        name: '聯合報',
        nameEn: 'United Daily News',
        bias: 'pan-blue',
        credibility: 4,
        url: 'https://udn.com/rssfeed/news/2/7227?ch=news', // Changed to "Realtime" (7227)
        parser: 'rss'
    },
    {
        id: 'tvbs',
        name: 'TVBS',
        nameEn: 'TVBS News',
        bias: 'pan-blue',
        credibility: 4,
        url: 'https://news.tvbs.com.tw/rss/news.xml', // Changed to "Focus/Hot" (was politics)
        parser: 'rss'
    },
    {
        id: 'ettoday',
        name: 'ETtoday',
        nameEn: 'ETtoday',
        bias: 'pan-blue',
        credibility: 3,
        url: 'https://feeds.feedburner.com/ettoday/realtime', // Realtime
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
        return itemsArray.slice(0, 50).map(item => ({ // Take top 50 from EACH source
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
 * 🧠 SMART CLUSTERING ALGORITHM
 * Groups articles based on title similarity (Jaccard Index of bigrams/words)
 */
function smartClustering(articles) {
    const clusters = [];
    const processedUrls = new Set();
    // Helper: Tokenize title into meaningful 2-character chunks (bigrams) for Chinese
    const getTokens = (str) => {
        // Remove punctuation and common useless tokens
        const clean = str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
        const tokens = new Set();
        for (let i = 0; i < clean.length - 1; i++) {
            tokens.add(clean.substring(i, i + 2));
        }
        return tokens;
    };
    // Helper: Calculate Jaccard Similarity (0.0 to 1.0)
    const calculateSimilarity = (setA, setB) => {
        let intersection = 0;
        setA.forEach(token => { if (setB.has(token)) intersection++; });
        return intersection / (setA.size + setB.size - intersection);
    };
    // Sort articles by date to prioritize fresh news as "Cluster Leaders"
    const sortedArticles = articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    for (const article of sortedArticles) {
        if (processedUrls.has(article.url)) continue;
        const articleTokens = getTokens(article.headline);
        let bestCluster = null;
        let maxSim = 0;
        // Try to find a matching existing cluster
        for (const cluster of clusters) {
            // Compare with the cluster's "leader" (the first article added)
            const leaderTokens = getTokens(cluster.sources[0].headline);
            const sim = calculateSimilarity(articleTokens, leaderTokens);
            // Threshold: 0.2 is generic, 0.3 is strict
            if (sim > 0.25 && sim > maxSim) {
                maxSim = sim;
                bestCluster = cluster;
            }
        }
        if (bestCluster) {
            // Add to existing topic
            bestCluster.sources.push(article);
            // Update bias counts
            if (article.bias === 'pan-green') bestCluster.biasDistribution.panGreen++;
            if (article.bias === 'center') bestCluster.biasDistribution.center++;
            if (article.bias === 'pan-blue') bestCluster.biasDistribution.panBlue++;
        } else {
            // Create new topic
            clusters.push({
                title: article.headline, // Use headline of most recent article
                description: article.summary || '點擊查看由不同觀點媒體對此事件的報導。',
                category: '政治', // Default to Politics for now
                updatedAt: article.publishedAt,
                sources: [article],
                biasDistribution: {
                    panGreen: article.bias === 'pan-green' ? 1 : 0,
                    center: article.bias === 'center' ? 1 : 0,
                    panBlue: article.bias === 'pan-blue' ? 1 : 0
                }
            });
        }
        processedUrls.add(article.url);
    }
    // Final Step: Format & Filter
    // Only keep topics with more than 1 source OR just keep everything but sorted
    // To solve "not enough news", we keep EVERYTHING, but we prioritize grouped ones.
    return clusters.map(c => ({
        ...c,
        sourceCount: c.sources.length
    })).sort((a, b) => b.sourceCount - a.sourceCount);
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
    // 2. Cluster into Topics
    console.log('🧠 Analyzing and grouping topics (Smart Clustering)...');
    const topics = smartClustering(allArticles);
    // Keep only top 40 topics to avoid cluttering DB too much (or remove limit)
    const topTopics = topics.slice(0, 40);
    console.log(`✨ Generated ${topTopics.length} topics. Top topic has ${topTopics[0]?.sourceCount} sources.`);
    if (!db) {
        console.log('⚠️ Database not connected. Skipping upload.');
        return;
    }
    // 3. Upload to Firebase
    console.log('🔥 Uploading to Firestore...');
    for (const topic of topTopics) {
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
