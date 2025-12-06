
scrape-and-upload.js
stpircs/rotagergga-swen-nawiat



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
// ... (FEEDS config and fetchAndParseRSS function remain unchanged) ...
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
            bestCluster.sources.push(article);
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
            // Fetch existing sources to check duplicates
            const sourcesRef = db.collection('topics').doc(match.id).collection('sources');
            const sourceSnaps = await sourcesRef.get();
            const existingUrls = new Set();
            sourceSnaps.forEach(doc => existingUrls.add(doc.data().url));
            let addedSources = 0;
            const batch = db.batch(); // Batch writes for atomicity
            for (const source of cluster.sources) {
                if (!existingUrls.has(source.url)) {
                    const newSourceRef = sourcesRef.doc();
                    batch.set(newSourceRef, { ...source, publishedAt: new Date(source.publishedAt) });
                    existingUrls.add(source.url); // Prevent adding twice in same loop
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
