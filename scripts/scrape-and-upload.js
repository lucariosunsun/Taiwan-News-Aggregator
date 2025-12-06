const axios = require('axios');
const xml2js = require('xml2js');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
/**
 * ⚠️ CONFIGURATION & SETUP
 * Local: Place serviceAccountKey.json in root.
 * GitHub Actions: Set FIREBASE_SERVICE_ACCOUNT_KEY secret (Base64 encoded json).
 */
// Initialize Firebase Admin
let db = null;
async function initFirebase() {
    try {
        let serviceAccount;
        const localKeyPath = path.join(__dirname, '../serviceAccountKey.json');
        if (fs.existsSync(localKeyPath)) {
            console.log('🔑 Using local serviceAccountKey.json');
            serviceAccount = require(localKeyPath);
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            console.log('🔑 Using FIREBASE_SERVICE_ACCOUNT_KEY from environment');
            try {
                // Try parsing as plain JSON first
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            } catch (e) {
                // If fail, try Base64 decoding
                try {
                    const buffer = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64');
                    serviceAccount = JSON.parse(buffer.toString('utf8'));
                } catch (e2) {
                    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY (tried JSON and Base64)');
                    return;
                }
            }
        } else {
            console.warn('⚠️ No credentials found. Scraper will run in DRY RUN mode (no upload).');
            return;
        }
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        db = admin.firestore();
        console.log('✅ Firebase Database Connected');
    } catch (error) {
        console.error('❌ Firebase Init Error:', error.message);
    }
}
// News Sources Configuration
const FEEDS = [
    // --- Pan-Green ---
    // { id: 'ltn', name: '自由時報', bias: 'pan-green', credibility: 4, url: 'https://news.ltn.com.tw/rss/all.xml' }, // Often slow?
    { id: 'setn', name: '三立新聞', bias: 'pan-green', credibility: 3, url: 'https://www.setn.com/rss.aspx?PageGroupID=1' },
    { id: 'newtalk', name: '新頭殼', bias: 'pan-green', credibility: 3, url: 'https://newtalk.tw/rss/news/all' },
    // --- Center ---
    { id: 'cna', name: '中央社', bias: 'center', credibility: 5, url: 'https://feeds.feedburner.com/cnaFirstNews' },
    { id: 'pts', name: '公視新聞', bias: 'center', credibility: 5, url: 'https://news.pts.org.tw/xml/newsfeed.xml' },
    { id: 'tnl', name: '關鍵評論網', bias: 'center', credibility: 4, url: 'https://feeds.feedburner.com/TheNewsLens' },
    // --- Pan-Blue ---
    { id: 'udn', name: '聯合報', bias: 'pan-blue', credibility: 4, url: 'https://udn.com/rssfeed/news/2/7227?ch=news' },
    { id: 'tvbs', name: 'TVBS', bias: 'pan-blue', credibility: 4, url: 'https://news.tvbs.com.tw/rss/news.xml' },
    { id: 'ettoday', name: 'ETtoday', bias: 'pan-blue', credibility: 3, url: 'https://feeds.feedburner.com/ettoday/realtime' }
];
async function fetchAndParseRSS(feed) {
    try {
        // console.log(`📡 Fetching ${feed.name}...`);
        const response = await axios.get(feed.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml',
            },
            timeout: 10000
        });
        const parser = new xml2js.Parser({ explicitArray: false });
        const cleanXml = response.data.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;');
        const result = await parser.parseStringPromise(cleanXml);
        const items = result.rss?.channel?.item || result.feed?.entry || [];
        const itemsArray = Array.isArray(items) ? items : [items];
        return itemsArray.slice(0, 30).map(item => ({
            name: feed.name,
            bias: feed.bias,
            credibility: feed.credibility,
            headline: item.title,
            url: item.link,
            summary: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
            publishedAt: new Date(item.pubDate || item.published || new Date()).toISOString(),
            sourceId: feed.id
        }));
    } catch (error) {
        // console.error(`Error fetching ${feed.name}:`, error.message);
        return [];
    }
}
// Tokenize title for comparison (Bigrams)
const getTokens = (str) => {
    const clean = str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const tokens = new Set();
    for (let i = 0; i < clean.length - 1; i++) {
        tokens.add(clean.substring(i, i + 2));
    }
    return tokens;
};
// Jaccard Similarity
const calculateSimilarity = (setA, setB) => {
    let intersection = 0;
    setA.forEach(token => { if (setB.has(token)) intersection++; });
    return intersection / (setA.size + setB.size - intersection);
};
// Group raw articles into clusters
function clusterArticles(articles) {
    const clusters = [];
    const processedUrls = new Set();
    // Sort by date desc so newest is "leader"
    // Also filter out very old articles (older than 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const sorted = articles
        .filter(a => new Date(a.publishedAt) > threeDaysAgo)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    for (const article of sorted) {
        if (processedUrls.has(article.url)) continue;
        const articleTokens = getTokens(article.headline);
        let bestCluster = null;
        let maxSim = 0;
        for (const cluster of clusters) {
            const leaderTokens = getTokens(cluster.sources[0].headline);
            const sim = calculateSimilarity(articleTokens, leaderTokens);
            if (sim > 0.15 && sim > maxSim) { // RELAXED THRESHOLD: 0.15
                maxSim = sim;
                bestCluster = cluster;
            }
        }
        if (bestCluster) {
            // ENFORCE UNIQUE SOURCE: Check if this source (e.g. TVBS) is already in the cluster
            const existingSourceIndex = bestCluster.sources.findIndex(s => s.sourceId === article.sourceId);
            if (existingSourceIndex !== -1) {
                // If same source exists, keep the NEWER one
                const existing = bestCluster.sources[existingSourceIndex];
                if (new Date(article.publishedAt) > new Date(existing.publishedAt)) {
                    bestCluster.sources[existingSourceIndex] = article;
                }
            } else {
                bestCluster.sources.push(article);
            }
        } else {
            clusters.push({
                title: article.headline,
                description: article.summary,
                category: '政治', // Default
                updatedAt: article.publishedAt, // Will track latest update
                sources: [article]
            });
        }
        processedUrls.add(article.url);
    }
    // FILTER: Only return topics with at least 2 sources
    const filteredClusters = clusters.filter(c => c.sources.length >= 2);
    console.log(`   -> Filtered ${clusters.length} clusters down to ${filteredClusters.length} (>= 2 sources)`);
    return filteredClusters;
}
async function syncToFirestore(newClusters) {
    if (!db) return;
    console.log('🔄 Syncing to Firestore...');
    // 1. Fetch recent active topics from Firestore (last 48 hours)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const snapshot = await db.collection('topics')
        .where('updatedAt', '>', twoDaysAgo) // Only check recent topics
        .get();
    const existingTopics = [];
    snapshot.forEach(doc => existingTopics.push({ id: doc.id, ...doc.data() }));
    console.log(`📂 Loaded ${existingTopics.length} recent existing topics to check against.`);
    let createdCount = 0;
    let mergedCount = 0;
    let ignoredCount = 0;
    for (const cluster of newClusters) {
        // Check if this cluster matches an existing topic
        const clusterTokens = getTokens(cluster.title);
        let match = null;
        let maxSim = 0;
        for (const topic of existingTopics) {
            const topicTokens = getTokens(topic.title);
            const sim = calculateSimilarity(clusterTokens, topicTokens);
            if (sim > 0.35 && sim > maxSim) {
                maxSim = sim;
                match = topic;
            }
        }
        if (match) {
            // MERGE: Add new sources to existing topic
            // console.log(`   🔗 Merging into "${match.title}" (Sim: ${maxSim.toFixed(2)})`);
            // Fetch existing sources (Map by sourceId to prevent publisher duplicates)
            const sourcesRef = db.collection('topics').doc(match.id).collection('sources');
            const sourceSnaps = await sourcesRef.get();
            const existingPublishers = new Map();
            sourceSnaps.forEach(doc => {
                const data = doc.data();
                // Ensure we have a date object
                const pDate = data.publishedAt && data.publishedAt.toDate ? data.publishedAt.toDate() : new Date(data.publishedAt || 0);
                existingPublishers.set(data.sourceId, {
                    docId: doc.id,
                    publishedAt: pDate,
                    url: data.url
                });
            });
            let addedSources = 0;
            let updatedSources = 0;
            const batch = db.batch();
            for (const source of cluster.sources) {
                // Skip if no sourceId (shouldn't happen given our config)
                if (!source.sourceId) continue;
                const existing = existingPublishers.get(source.sourceId);
                const newDate = new Date(source.publishedAt);
                if (existing) {
                    // Update ONLY if newer
                    if (newDate > existing.publishedAt && source.url !== existing.url) {
                        const docRef = sourcesRef.doc(existing.docId);
                        batch.set(docRef, { ...source, publishedAt: newDate });
                        existingPublishers.set(source.sourceId, { ...existing, publishedAt: newDate }); // Update map
                        updatedSources++;
                    }
                } else {
                    // New Publisher -> Create
                    const newSourceRef = sourcesRef.doc();
                    batch.set(newSourceRef, { ...source, publishedAt: newDate });
                    existingPublishers.set(source.sourceId, { docId: newSourceRef.id, publishedAt: newDate });
                    addedSources++;
                }
            }
            if (addedSources > 0) {
                const topicRef = db.collection('topics').doc(match.id);
                batch.update(topicRef, {
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    sourceCount: admin.firestore.FieldValue.increment(addedSources)
                });
                await batch.commit();
                mergedCount++;
            } else {
                ignoredCount++;
            }
        } else {
            // CREATE: New Topic
            const topicRef = db.collection('topics').doc();
            const { sources, ...topicData } = cluster;
            const biasDist = { panGreen: 0, center: 0, panBlue: 0 };
            sources.forEach(s => {
                if (s.bias === 'pan-green') biasDist.panGreen++;
                else if (s.bias === 'center') biasDist.center++;
                else if (s.bias === 'pan-blue') biasDist.panBlue++;
            });
            const batch = db.batch();
            // Set Topic
            batch.set(topicRef, {
                ...topicData,
                biasDistribution: biasDist,
                sourceCount: sources.length,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Set Sources
            sources.forEach(source => {
                const sRef = topicRef.collection('sources').doc();
                batch.set(sRef, { ...source, publishedAt: new Date(source.publishedAt) });
            });
            await batch.commit();
            createdCount++;
        }
    }
    console.log('\n📊 Sync Summary:');
    console.log(`   ✨ Created: ${createdCount} new topics`);
    console.log(`   🔗 Merged:  ${mergedCount} into existing topics`);
    console.log(`   ⏭️  No New Sources: ${ignoredCount} topics`);
}
async function main() {
    console.log('🚀 Starting Automated News Scraper & Sync...');
    await initFirebase();
    // 1. Fetch
    let allArticles = [];
    console.log('📡 Fetching RSS feeds...');
    const fetchPromises = FEEDS.map(feed => fetchAndParseRSS(feed));
    const results = await Promise.all(fetchPromises);
    results.forEach(res => allArticles.push(...res));
    console.log(`   -> Collected ${allArticles.length} articles.`);
    // 2. Cluster
    console.log('🧠 Clustering articles...');
    const clusters = clusterArticles(allArticles);
    console.log(`   -> Formed ${clusters.length} clusters.`);
    // 3. Sync
    if (db) {
        await syncToFirestore(clusters);
    } else {
        console.log('🚫 DRY RUN: Skipping Firestore sync.');
        // console.log(JSON.stringify(clusters.slice(0,2), null, 2));
    }
    console.log('✅ Done.');
    process.exit(0);
}
main();
