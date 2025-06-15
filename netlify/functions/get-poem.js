// 檔案路徑: netlify/functions/get-poem.js
exports.handler = async (event) => {
    console.log("Function 'get-poem' triggered.");
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("FATAL: GOOGLE_API_KEY environment variable not set on Netlify.");
        return { statusCode: 500, body: JSON.stringify({ error: "伺服器端金鑰設定遺失，請檢查 Netlify 環境變數。" }) };
    }

    const lotNumber = Math.floor(Math.random() * 100) + 1;
    const prompt = `你是一位充滿智慧與慈悲的觀音菩薩廟宇裡的解籤師。一位信眾剛剛抽到了觀音靈籤第 ${lotNumber} 號籤。請為這支籤生成一首最具代表性的七言絕句籤詩，並附上簡短的白話文解說。你的回覆必須嚴格遵循以下格式，不得有任何多餘的文字：籤詩：[四句七言詩]解曰：[白話文解說]`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        console.log("Calling Google AI API...");
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        });

        const data = await response.json();

        // --- 智慧偵錯區塊 ---
        // 情況一: Google 直接回報錯誤 (例如：API金鑰無效)
        if (data.error) {
            console.error("Google AI returned an error object:", JSON.stringify(data.error));
            return { statusCode: 500, body: JSON.stringify({ error: `Google AI 服務錯誤: ${data.error.message}` }) };
        }

        // 情況二: 成功回應，但內容被阻擋或遺失
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
            console.error("Google AI response is missing valid candidate content. Response:", JSON.stringify(data));
            const reason = data.promptFeedback?.blockReason || "未知原因";
            return { statusCode: 500, body: JSON.stringify({ error: `AI 未能生成內容，可能原因: ${reason}。` }) };
        }

        // 情況三: 完美成功！
        console.log("Successfully got response from Google AI.");
        const rawText = data.candidates[0].content.parts[0].text;

        let poem = "天意難測，請再試一次。";
        let interpretation = "未能順利取得解說。";
        const poemMatch = rawText.match(/籤詩：([\s\S]*?)解曰：/);
        const interpretationMatch = rawText.match(/解曰：([\s\S]*)/);
        if (poemMatch && poemMatch[1]) poem = poemMatch[1].trim();
        if (interpretationMatch && interpretationMatch[1]) interpretation = interpretationMatch[1].trim();

        return {
            statusCode: 200,
            body: JSON.stringify({ lotNumber, poem, interpretation }),
        };

    } catch (error) {
        console.error("An unexpected error occurred in the function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "後端函式發生未知錯誤。" }) };
    }
};

