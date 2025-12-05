/* scripts/scrape-and-upload.js */
const axios = require('axios');
const xml2js = require('xml2js');
const admin = require('firebase-admin');
const path = require('path');
// Initialize Firebase
try {
  const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
  if (admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} catch (error) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT && admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
}
const db = admin.apps.length > 0 ? admin.firestore() : null;
// Feeds
const FEEDS = [
  { id: 'ltn', name: '自由時報', nameEn: 'Liberty Times', bias: 'pan-green', credibility: 4, url: 'https://news.ltn.com.tw/rss/all.xml' },
  { id: 'setn', name: '三立新聞', nameEn: 'SETN', bias: 'pan-green', credibility: 3, url: 'https://www.setn.com/rss.aspx?PageGroupID=1' },
  { id: 'newtalk', name: '新頭殼', nameEn: 'Newtalk', bias: 'pan-green', credibility: 3, url: 'https://newtalk.tw/rss/news/all' },
  { id: 'cna', name: '中央社', nameEn: 'CNA', bias: 'center', credibility: 5, url: 'https://feeds.feedburner.com/cnaFirstNews' },
  { id: 'pts', name: '公視新聞', nameEn: 'PTS News', bias: 'center', credibility: 5, url: 'https://news.pts.org.tw/xml/newsfeed.xml' },
  { id: 'tnl', name: '關鍵評論網', nameEn: 'The News Lens', bias: 'center', credibility: 4, url: 'https://feeds.feedburner.com/TheNewsLens' },
  { id: 'udn', name: '聯合報', nameEn: 'United Daily News', bias: 'pan-blue', credibility: 4, url: 'https://udn.com/rssfeed/news/2/7227?ch=news' },
  { id: 'tvbs', name: 'TVBS', nameEn: 'TVBS News', bias: 'pan-blue', credibility: 4, url: 'https://news.tvbs.com.tw/rss/news.xml' },
  { id: 'ettoday', name: 'ETtoday', nameEn: 'ETtoday', bias: 'pan-blue', credibility: 3, url: 'https://feeds.feedburner.com/ettoday/realtime' }
];
// --- 🧠 CATEGORY DETECTOR ---
function detectCategory(text) {
    const t = text.toLowerCase();
    
    // Priority: Tech > Economy > International > Society > Politics (Default)
    
    if (t.match(/台積電|輝達|ai|蘋果|iphone|半導體|晶片|科技|特斯拉/)) return '科技';
    
    if (t.match(/股市|台股|美股|匯率|央行|房價|房市|營收|經濟|gdp|通膨/)) return '經濟';
    
    if (t.match(/美國|川普|拜登|中國|日本|烏克蘭|以色列|以哈|習近平|普丁|國際/)) return '國際';
    
    if (t.match(/車禍|命案|氣象|颱風|地震|放假|停班|交通|捷運|公車|社會|甚至/)) return '社會';
    if (t.match(/賴清德|柯文哲|侯友宜|國民黨|民進黨|民眾黨|立法院|韓國瑜|內閣|行政院|總統|大選|罷免/)) return '政治';
    // If uncertain, default to Society for breaking news, or Politics if it sounds official
    return '其他'; 
    // Note: You can change this default to '政治' if you prefer most things to be politics
}
async function fetchAndParseRSS(feed) {
  try {
    const response = await axios.get(feed.url, { timeout: 10000 });
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;'));
    
    let items = result.rss?.channel?.item || result.feed?.entry || [];
    if (!Array.isArray(items)) items = [items];
    
    return items.map(item => {
      const headline = item.title || '';
      return { 
        name: feed.name,
        nameEn: feed.nameEn,
        bias: feed.bias,
        headline: headline,
        url: item.link && typeof item.link === 'string' ? item.link : (item.link?.href || ''),
        summary: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
        publishedAt: new Date(item.pubDate || item.published || new Date()).toISOString(),
        sourceId: feed.id,
        // Detect category immediately
        categoryTag: detectCategory(headline) 
      };
    }).filter(i => i.url && i.headline);
  } catch (e) { return []; }
}
async function getExistingUrls() {
    if (!db) return new Set();
    const existingUrls = new Set();
    try {
        const snapshot = await db.collection('topics').orderBy('updatedAt', 'desc').limit(200).get();
        const promises = snapshot.docs.map(doc => doc.ref.collection('sources').get());
        const results = await Promise.all(promises);
        results.forEach(snap => snap.forEach(doc => { if (doc.data().url) existingUrls.add(doc.data().url); }));
    } catch (e) {}
    return existingUrls;
}
function smartClustering(articles) {
  const clusters = [];
  const processedUrls = new Set();
  
  const getTokens = (str) => {
    const clean = str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const tokens = new Set();
    for (let i = 0; i < clean.length - 1; i++) tokens.add(clean.substring(i, i + 2));
    return tokens;
  };
  const calculateSimilarity = (setA, setB) => {
    let intersection = 0;
    setA.forEach(token => { if(setB.has(token)) intersection++; });
    return intersection / (setA.size + setB.size - intersection);
  };
  // Sort by time
  const sortedArticles = articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  for (const article of sortedArticles) {
    if (processedUrls.has(article.url)) continue;
    const articleTokens = getTokens(article.headline);
    let bestCluster = null;
    let maxSim = 0;
    for (const cluster of clusters) {
        const leaderTokens = getTokens(cluster.sources[0].headline);
        const sim = calculateSimilarity(articleTokens, leaderTokens);
        if (sim > 0.25 && sim > maxSim) { maxSim = sim; bestCluster = cluster; }
    }
    if (bestCluster) {
        bestCluster.sources.push(article);
        if (article.bias === 'pan-green') bestCluster.biasDistribution.panGreen++;
        if (article.bias === 'center') bestCluster.biasDistribution.center++;
        if (article.bias === 'pan-blue') bestCluster.biasDistribution.panBlue++;
        
        // Update category if the new article has a stronger category than "其他"
        if (bestCluster.category === '其他' && article.categoryTag !== '其他') {
            bestCluster.category = article.categoryTag;
        }
        
    } else {
        clusters.push({
            title: article.headline,
            description: article.summary,
            category: article.categoryTag, // Use detected category
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
  return clusters.map(c => ({...c, sourceCount: c.sources.length})).sort((a,b)=>b.sourceCount-a.sourceCount);
}
async function main() {
  console.log('🚀 Starting News Scraper (Smart Categories)...');
  const existingUrls = await getExistingUrls();
  let allArticles = [];
  for (const feed of FEEDS) {
    const articles = await fetchAndParseRSS(feed);
    allArticles = [...allArticles, ...articles];
  }
  
  const newArticles = allArticles.filter(a => !existingUrls.has(a.url));
  console.log(`📊 Found ${newArticles.length} new articles.`);
  if (newArticles.length === 0) return;
  const topics = smartClustering(newArticles);
  console.log(`✨ Generated ${topics.length} topics. Uploading...`);
  if (!db) return;
  for (const topic of topics) {
    try {
      const topicRef = db.collection('topics').doc();
      const { sources, ...topicData } = topic;
      await topicRef.set({ ...topicData, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      for (const source of sources) {
        await topicRef.collection('sources').add({ ...source, publishedAt: new Date(source.publishedAt) });
      }
      console.log(`✅ [${topic.category}] ${topic.title}`);
    } catch (e) { console.error(e); }
  }
}
main();
