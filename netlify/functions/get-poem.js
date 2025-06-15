// 檔案路徑: netlify/functions/get-poem.js
// 這是經過強化的後端函式

exports.handler = async (event) => {
  console.log("Function 'get-poem' has been triggered.");

  // 只接受 POST 請求
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 檢查 API 金鑰是否存在
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("FATAL: GOOGLE_API_KEY environment variable not set on Netlify.");
    return { statusCode: 500, body: JSON.stringify({ error: "伺服器端金鑰設定遺失。" }) };
  }

  // 解析從前端傳來的籤號
  let lotNumber;
  try {
    const body = JSON.parse(event.body);
    lotNumber = body.lotNumber;
    if (!lotNumber) throw new Error("Request body is missing 'lotNumber'.");
    console.log(`Received request for lot number: ${lotNumber}`);
  } catch (e) {
    console.error("Could not parse request body:", e);
    return { statusCode: 400, body: JSON.stringify({ error: "請求的資料格式錯誤。" }) };
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

  try {
    console.log("Attempting to call Google AI API...");
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    console.log(`Google AI API response status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Google AI API error:", errorBody);
      throw new Error(`Google AI API 請求失敗`);
    }

    const data = await response.json();
    console.log("Successfully received data from Google AI.");

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    console.error("Error during API call to Google:", error);
    return { statusCode: 502, body: JSON.stringify({ error: error.message }) };
  }
};

