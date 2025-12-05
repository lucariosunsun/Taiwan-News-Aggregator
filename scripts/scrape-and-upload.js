/* scripts/scrape-and-upload.js */
const axios = require('axios');
const xml2js = require('xml2js');
const admin = require('firebase-admin');
const path = require('path');
// Initialize Firebase Admin (Backend Mode)
try {
  // Try local first
  const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
  if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
  }
  console.log('✅ Firebase Admin Initialized');
} catch (error) {
  // If local file missing, check environment variable (for GitHub Actions)
  if (process.env.FIREBASE_SERVICE_ACCOUNT && admin.apps.length === 0) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin Initialized from Env');
  } else if (admin.apps.length === 0) {
     console.error('❌ Error: serviceAccountKey.json not found and env var missing.');
  }
}
const db = admin.apps.length > 0 ? admin.firestore() : null;
// News Sources Configuration
const FEEDS = [
  // --- Pan-Green (泛綠) ---
  { id: 'ltn', name: '自由時報', nameEn: 'Liberty Times', bias: 'pan-green', credibility: 4, url: 'https://news.ltn.com.tw/rss/politics.xml' },
  { id: 'setn', name: '三立新聞', nameEn: 'SETN', bias: 'pan-green', credibility: 3, url: 'https://www.setn.com/rss.aspx?PageGroupID=6' },
  { id: 'newtalk', name: '新頭殼', nameEn: 'Newtalk', bias: 'pan-green', credibility: 3, url: 'https://newtalk.tw/rss/news/all' },
  // --- Center (中立) ---
  { id: 'cna', name: '中央社', nameEn: 'CNA', bias: 'center', credibility: 5, url: 'https://feeds.feedburner.com/cnaFirstNews' },
  { id: 'pts', name: '公視新聞', nameEn: 'PTS News', bias: 'center', credibility: 5, url: 'https://news.pts.org.tw/xml/newsfeed.xml' },
  { id: 'tnl', name: '關鍵評論網', nameEn: 'The News Lens', bias: 'center', credibility: 4, url: 'https://feeds.feedburner.com/TheNewsLens' },
  // --- Pan-Blue (泛藍) ---
  { id: 'udn', name: '聯合報', nameEn: 'United Daily News', bias: 'pan-blue', credibility: 4, url: 'https://udn.com/rssfeed/news/2/6638?ch=news' },
  { id: 'tvbs', name: 'TVBS', nameEn: 'TVBS News', bias: 'pan-blue', credibility: 4, url: 'https://news.tvbs.com.tw/rss/politics.xml' },
  { id: 'ettoday', name: 'ETtoday', nameEn: 'ETtoday', bias: 'pan-blue', credibility: 3, url: 'https://feeds.feedburner.com/ettoday/realtime' }
];
async function fetchAndParseRSS(feed) {
  try {
    // console.log(`📡 Fetching ${feed.name}...`);
    const response = await axios.get(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 10000
    });
    const parser = new xml2js.Parser({ explicitArray: false });
    const cleanXml = response.data.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;'); 
    const result = await parser.parseStringPromise(cleanXml);
    
    let items = result.rss?.channel?.item || result.feed?.entry || [];
    if (!Array.isArray(items)) items = [items];
    
    return items.slice(0, 50).map(item => ({ 
      name: feed.name,
      nameEn: feed.nameEn,
      bias: feed.bias,
      credibility: feed.credibility,
      headline: item.title,
      url: item.link && typeof item.link === 'string' ? item.link : (item.link?.href || item.guid || ''),
      summary: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
      publishedAt: new Date(item.pubDate || item.published || new Date()).toISOString(),
      sourceId: feed.id
    })).filter(i => i.url && i.headline); // Ensure URL exists
  } catch (error) {
    // console.error(`Error fetching ${feed.name}:`, error.message);
    return [];
  }
}
/**
 * 🔍 DEDUPLICATION CHECK
 * Fetches recent articles from DB to prevent re-uploading
 */
async function getExistingUrls() {
    if (!db) return new Set();
    
    console.log('🔍 Checking for existing articles in database...');
    const existingUrls = new Set();
    
    try {
        // Look at the last 100 topics
        const snapshot = await db.collection('topics')
            .orderBy('updatedAt', 'desc')
            .limit(100)
            .get();
            
        // For each topic, check its sources
        // Note: This does multiple reads, but ensures we capture URLs. 
        // Optimized: Uses Promise.all
        const promises = snapshot.docs.map(doc => doc.ref.collection('sources').get());
        const results = await Promise.all(promises);
        
        results.forEach(querySnap => {
            querySnap.forEach(doc => {
                const data = doc.data();
                if (data.url) existingUrls.add(data.url);
            });
        });
        
        console.log(`✅ Found ${existingUrls.size} existing article URLs. Skipping them.`);
    } catch (error) {
        console.error('Error checking duplicates:', error);
    }
    
    return existingUrls;
}
function smartClustering(articles) {
  const clusters = [];
  const processedUrls = new Set();
  
  const getTokens = (str) => {
    const clean = str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const tokens = new Set();
    for (let i = 0; i < clean.length - 1; i++) {
        tokens.add(clean.substring(i, i + 2));
    }
    return tokens;
  };
  const calculateSimilarity = (setA, setB) => {
    let intersection = 0;
    setA.forEach(token => { if(setB.has(token)) intersection++; });
    return intersection / (setA.size + setB.size - intersection);
  };
  const sortedArticles = articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  for (const article of sortedArticles) {
    if (processedUrls.has(article.url)) continue;
    const articleTokens = getTokens(article.headline);
    let bestCluster = null;
    let maxSim = 0;
    for (const cluster of clusters) {
        const leaderTokens = getTokens(cluster.sources[0].headline);
        const sim = calculateSimilarity(articleTokens, leaderTokens);
        
        if (sim > 0.25 && sim > maxSim) {
            maxSim = sim;
            bestCluster = cluster;
        }
    }
    if (bestCluster) {
        bestCluster.sources.push(article);
        if (article.bias === 'pan-green') bestCluster.biasDistribution.panGreen++;
        if (article.bias === 'center') bestCluster.biasDistribution.center++;
        if (article.bias === 'pan-blue') bestCluster.biasDistribution.panBlue++;
    } else {
        clusters.push({
            title: article.headline,
            description: article.summary,
            category: '政治', 
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
  return clusters.map(c => ({
    ...c,
    sourceCount: c.sources.length
  })).sort((a, b) => b.sourceCount - a.sourceCount);
}
async function main() {
  console.log('🚀 Starting News Scraper...');
  
  // 1. Fetch Existing URLs to skip
  const existingUrls = await getExistingUrls();
  // 2. Fetch new articles
  let allArticles = [];
  for (const feed of FEEDS) {
    const articles = await fetchAndParseRSS(feed);
    allArticles = [...allArticles, ...articles];
  }
  
  // 3. Filter out duplicates
  const newArticles = allArticles.filter(a => !existingUrls.has(a.url));
  console.log(`📊 Collected ${allArticles.length} raw articles. (${newArticles.length} are new)`);
  if (newArticles.length === 0) {
      console.log('🎉 No new articles found. Database is up to date.');
      return;
  }
  // 4. Cluster
  console.log('🧠 Analyzing and grouping topics...');
  const topics = smartClustering(newArticles);
  
  const topTopics = topics.slice(0, 50); 
  console.log(`✨ Generated ${topTopics.length} new topics.`);
  if (!db) return;
  // 5. Upload
  console.log('🔥 Uploading to Firestore...');
  
  for (const topic of topTopics) {
    try {
      const topicRef = db.collection('topics').doc();
      const { sources, ...topicData } = topic;
      
      await topicRef.set({
        ...topicData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
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
