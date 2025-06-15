// 檔案路徑: netlify/functions/get-poem.js

exports.handler = async (event) => {
    try {
        const lotNumber = Math.floor(Math.random() * 100) + 1; // 產生 1-100 的隨機數

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("FATAL: GOOGLE_API_KEY is not set.");
            return { statusCode: 500, body: JSON.stringify({ error: "伺服器金鑰設定遺失。" }) };
        }
        
        const prompt = `
            你是一位充滿智慧與慈悲的觀音菩薩廟宇裡的解籤師。
            一位信眾剛剛抽到了觀音靈籤第 ${lotNumber} 號籤。
            請為這支籤生成一首最具代表性的七言絕句籤詩，並附上簡短的白話文解說。

            你的回覆必須嚴格遵循以下格式，不得有任何多餘的文字：
            籤詩：
            [這裡填寫四句七言詩，每句一行]
            解曰：
            [這裡填寫對籤詩的白話文總體解釋]
        `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const aiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        });

        if (!aiResponse.ok) {
            throw new Error(`AI 服務呼叫失敗`);
        }
        
        const aiData = await aiResponse.json();
        const rawText = aiData.candidates[0].content.parts[0].text;
        
        // 解析籤詩與解說
        let poem = "天意難測，請再試一次。";
        let interpretation = "未能順利取得解說。";
        const poemMatch = rawText.match(/籤詩：([\s\S]*?)解曰：/);
        const interpretationMatch = rawText.match(/解曰：([\s\S]*)/);
        if (poemMatch && poemMatch[1]) poem = poemMatch[1].trim();
        if (interpretationMatch && interpretationMatch[1]) interpretation = interpretationMatch[1].trim();

        return {
            statusCode: 200,
            body: JSON.stringify({
                lotNumber,
                poem,
                interpretation
            }),
        };

    } catch (error) {
        console.error("Get poem function error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "伺服器內部錯誤" }),
        };
    }
};
