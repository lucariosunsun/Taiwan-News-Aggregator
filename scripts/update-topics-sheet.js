const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
/**
 * Automate Google Sheets Updates for Website Topics
 * 
 * This script:
 * 1. Reads the current website topics
 * 2. Clears the target Google Sheet
 * 3. Writes the fresh topic data
 */
// Configuration: load sheet ID
// We'll look for a 'summary' key in sheets-config.json, or use a hardcoded fallback/env var
const configPath = path.join(__dirname, '../sheets-config.json');
let config = {};
if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
const SPREADSHEET_ID = config.sheets?.summary || process.env.TOPICS_SHEET_ID;
// The topics to sync
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
async function authenticate() {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error('serviceAccountKey.json not found');
    }
    const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth;
}
async function updateSheet() {
    console.log('🚀 Starting Google Sheets Topic Update...');
    // Check if configured
    if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('REPLACE')) {
        console.log('⚠️  Skipping: No valid SPREADSHEET_ID found in sheets-config.json');
        console.log('   (This is expected until you configure it)');
        return; // Exit successfuly
    }
    try {
        const auth = await authenticate();
        const sheets = google.sheets({ version: 'v4', auth });
        console.log(`📡 Connecting to Sheet ID: ${SPREADSHEET_ID}`);
        // 1. Prepare Data
        const headers = ['Topic Title', 'Category', 'Sources', 'Bias Distribution', 'Description', 'Last Updated'];
        const rows = WEBSITE_TOPICS.map(t => [
            t.title,
            t.category,
            t.sourceCount,
            t.biasRatio,
            t.description,
            t.lastUpdated
        ]);
        const values = [headers, ...rows];
        // 2. Clear existing content
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:Z',
        });
        // 3. Write new data
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            requestBody: { values },
        });
        console.log('✅ Successfully updated Google Sheet!');
        // 4. Format Header (Optional, makes it look nice)
        // We need the sheetId (integer) for formatting, default first sheet is 0
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 0,
                            endRowIndex: 1
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                                textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                            }
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                }]
            }
        });
    } catch (error) {
        console.error('❌ Failed to update sheet:', error.message);
        if (error.response) {
            console.error('   Details:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}
updateSheet();
