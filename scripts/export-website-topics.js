const fs = require('fs');
const path = require('path');
/**
 * Export Website Topics to CSV
 * 
 * This script exports the news topics currently featured on the website
 * to a CSV file for easy viewing.
 */
// These match the topics in lib/mockData.ts which are displayed on the website
const WEBSITE_TOPICS = [
    {
        title: '立法院預算審議引發朝野衝突',
        description: '執政黨與在野黨就2025年度中央政府總預算案產生重大分歧，雙方在議場發生激烈爭執。',
        category: '政治',
        sourceCount: 9,
        biasRatio: '3:3:3 (Balanced)',
        lastUpdated: '2 hours ago'
    },
    {
        title: '台積電美國廠進度更新 第三座工廠擬2030年投產',
        description: '台積電宣布美國亞利桑那州第三座晶圓廠建設計畫，預計2030年開始量產2奈米先進製程。',
        category: '經濟',
        sourceCount: 6,
        biasRatio: '2:2:2 (Balanced)',
        lastUpdated: '5 hours ago'
    },
    {
        title: '健保改革方案出爐 部分負擔調整引發討論',
        description: '衛福部公布健保財務改革方案，調整門診及住院部分負擔額度，引發各界正反意見。',
        category: '社會',
        sourceCount: 7,
        biasRatio: '2:3:2 (Balanced)',
        lastUpdated: '1 day ago'
    }
];
function main() {
    console.log('🚀 Exporting Website Topics...');
    // Create output directory if not exists
    const outputDir = path.join(__dirname, '../topic-exports');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // CSV Header
    const headers = ['Topic Title', 'Category', 'Sources', 'Bias Distribution', 'Description'];
    // CSV Content
    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    WEBSITE_TOPICS.forEach(topic => {
        const row = [
            `"${topic.title}"`,
            topic.category,
            topic.sourceCount,
            `"${topic.biasRatio}"`,
            `"${topic.description}"`
        ];
        csvContent += row.join(',') + '\n';
    });
    const fileName = `website_topics_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, csvContent);
    console.log(`✅ Exported ${WEBSITE_TOPICS.length} topics to:`);
    console.log(`   ${filePath}`);
}
main();
