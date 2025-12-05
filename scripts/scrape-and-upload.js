/* scripts/scrape-and-upload.js */
const axios = require('axios');
const xml2js = require('xml2js');
const admin = require('firebase-admin');
const path = require('path');
// --- 1. CONFIGURATION & SETUP ---
try {
  // Try local credentials first
  const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
  if (admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} catch (error) {
  // Fallback to GitHub Secret
  if (process.env.FIREBASE_SERVICE_ACCOUNT && admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
}
const db = admin.apps.length > 0 ? admin.firestore() : null;
// The "Real-Time / Hot" Feed List
const FEEDS = [
  { id: 'ltn', name: '自由時報', nameEn: 'Liberty Times', bias: 'pan-green', credibility: 4, url: 'https://news.ltn.com.tw/rss/all.xml' },
  { id: 'setn', name: '三立新聞', nameEn: 'SETN', bias: 'pan-green', credibility: 3, url: 'https://www.setn.com/rss.aspx?PageGroupID=1' }, // Breaking
  { id: 'newtalk', name: '新頭殼', nameEn: 'Newtalk', bias: 'pan-green', credibility: 3, url: 'https://newtalk.tw/rss/news/all' },
  { id: 'cna', name: '中央社', nameEn: 'CNA', bias: 'center', credibility: 5, url: 'https://feeds.feedburner.com/cnaFirstNews' },
  { id: 'pts', name: '公視新聞', nameEn: 'PTS News', bias: 'center', credibility: 5, url: 'https://news.pts.org.tw/xml/newsfeed.xml' },
  { id: 'tnl', name: '關鍵評論網', nameEn: 'The News Lens', bias: 'center', credibility: 4, url: 'https://feeds.feedburner.com/TheNewsLens' }, // Latest
  { id: 'udn', name: '聯合報', nameEn: 'United Daily News', bias: 'pan-blue', credibility: 4, url: 'https://udn.com/rssfeed/news/2/7227?ch=news' }, // Realtime
  { id: 'tvbs', name: 'TVBS', nameEn: 'TVBS News', bias: 'pan-blue', credibility: 4, url: 'https://news.tvbs.com.tw/rss/news.xml' }, // Focus
  { id: 'ettoday', name: 'ETtoday', nameEn: 'ETtoday', bias: 'pan-blue', credibility: 3, url: 'https://feeds.feedburner.com/ettoday/realtime' }
];
// --- 2. INTELLIGENT HELPERS ---
// A. Keyword Detector (Your "Library" for sorting)
function detectCategory(text) {
    const t = text.toLowerCase();
    if (t.match(/台積電|輝達|ai|蘋果|iphone|半導體|晶片|科技|特斯拉|伺服器/)) return '科技';
    if (t.match(/股市|台股|美股|匯率|央行|房價|房市|營收|經濟|gdp|通膨|理財/)) return '經濟';
    if (t.match(/美國|川普|拜登|中國|日本|烏克蘭|以色列|以哈|習近平|普丁|國際|南韓/)) return '國際';
    if (t.match(/車禍|命案|氣象|颱風|地震|放假|停班|交通|捷運|公車|社會|食安/)) return '社會';
    if (t.match(/賴清德|柯文哲|侯友宜|國民黨|民進黨|民眾黨|立法院|韓國瑜|內閣|行政院|總統|大選|罷免|政治/)) return '政治';
    return '其他'; // Check your "Others" tab frequently to see what it misses!
}
// B. Smart Similarity (Jaccard Index)
function calculateSimilarity(str1, str2) {
    const tokenize = (s) => {
        const clean = s.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
        const tokens = new Set();
        for (let i = 0; i < clean.length - 1; i++) tokens.add(clean.substring(i, i + 2));
        return tokens;
    };
    const setA = tokenize(str1);
    const setB = tokenize(str2);
    let intersection = 0;
    setA.forEach(t => { if(setB.has(t)) intersection++; });
    return intersection / (setA.size + setB.size - intersection);
}
// --- 3. MAIN LOGIC ---
async function fetchAndParseRSS(feed) {
  try {
    const response = await axios.get(feed.url, { timeout: 10000 });
    const parser = new xml2js.Parser({ explicitArray: false });
    const cleanXml = response.data.replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;'); 
    const result = await parser.parseStringPromise(cleanXml);
    
    let items = result.rss?.channel?.item || result.feed?.entry || [];
    if (!Array.isArray(items)) items = [items];
    
    // NO SLICE/LIMIT - Get everything
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
        categoryTag: detectCategory(headline) // <--- APPLY CATEGORY HERE
      };
    }).filter(i => i.url && i.headline);
  } catch (error) {
    return [];
  }
}
async function getExistingUrls() {
    if (!db) return new Set();
    const existingUrls = new Set();
    try {
        // Optimized check: Look at last 300 topics
        const snapshot = await db.collection('topics').orderBy('updatedAt', 'desc').limit(300).get();
        const promises = snapshot.docs.map(doc => doc.ref.collection('sources').get());
        const results = await Promise.all(promises);
        results.forEach(snap => snap.forEach(doc => { if (doc.data().url) existingUrls.add(doc.data().url); }));
    } catch (e) {}
    return existingUrls;
}
function groupArticles(articles) {
    const clusters = [];
    const processedUrls = new Set();
    
    // Sort critical for finding the "Best First" article
    const sorted = articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    for (const article of sorted) {
        if (processedUrls.has(article.url)) continue;
        let bestCluster = null;
        let maxSim = 0;
        for (const cluster of clusters) {
            const sim = calculateSimilarity(article.headline, cluster.sources[0].headline);
            if (sim > 0.25 && sim > maxSim) { // 25% similarity threshold
                maxSim = sim;
                bestCluster = cluster;
            }
        }
        if (bestCluster) {
            bestCluster.sources.push(article);
            // Bias Update
            if (article.bias === 'pan-green') bestCluster.biasDistribution.panGreen++;
            else if (article.bias === 'center') bestCluster.biasDistribution.center++;
            else if (article.bias === 'pan-blue') bestCluster.biasDistribution.panBlue++;
            
            // Category Update: If we found a better category than "Other", switch to it
            if (bestCluster.category === '其他' && article.categoryTag !== '其他') {
                bestCluster.category = article.categoryTag;
            }
        } else {
            clusters.push({
                title: article.headline,
                description: article.summary,
                category: article.categoryTag,
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
    
    return clusters.map(c => ({...c, sourceCount: c.sources.length})).sort((a,b) => b.sourceCount - a.sourceCount);
}
async function main() {
  console.log('🚀 Starting NO-LIMIT Smart Scraper...');
  const existingUrls = await getExistingUrls();
  let allArticles = [];
  for (const feed of FEEDS) {
    const articles = await fetchAndParseRSS(feed);
    allArticles = [...allArticles, ...articles];
  }
  
  const newArticles = allArticles.filter(a => !existingUrls.has(a.url));
  console.log(`📊 Found ${newArticles.length} NEW articles (out of ${allArticles.length} total).`);
  if (newArticles.length === 0) return;
  const topics = groupArticles(newArticles);
  console.log(`✨ Generated ${topics.length} topics. Uploading...`);
  if (!db) return;
  for (const topic of topics) {
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
      console.log(`✅ [${topic.category}] ${topic.title}`);
    } catch (e) {
      console.error('Upload error:', e);
    }
  }
  console.log('🎉 Done!');
}
main();
