// 檔案名稱: generate-poem.js
// 這是一個 Node.js 函式，它會作為我們的安全後端

exports.handler = async function (event, context) {
  // 從前端送來的請求中取得籤號
  const { lotNumber } = JSON.parse(event.body);
  
  // 從 Netlify 的安全環境變數中讀取 API Key (金鑰本身不在這裡)
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API 金鑰未在伺服器端設定。" }),
    };
  }
  
  const prompt = `
    你是一位充滿智慧與慈悲的觀音菩薩廟宇裡的解籤師。
    使用者剛剛抽到了第 ${lotNumber} 號籤。
    請根據這個籤號，為使用者生成一首充滿禪意與指引的七言絕句籤詩，並附上白話文解說。
    你的回覆必須嚴格遵循以下格式，不得有任何多餘的文字：
    籤詩：
    [這裡填寫四句七言詩，每句一行]
    解曰：
    [這裡填寫對籤詩的白話文解釋，內容需溫和、正面，給予使用者希望與方向]
  `;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google AI API 請求失敗，狀態碼: ${response.status}`);
    }

    const data = await response.json();

    // 將從 Google 得到的結果直接回傳給前端
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("後端函式出錯:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

