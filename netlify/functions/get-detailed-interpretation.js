// 檔案路徑: netlify/functions/get-detailed-interpretation.js

exports.handler = async (event) => {
    // 檢查請求方法
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { lotNumber, poemText, userQuery } = JSON.parse(event.body);

        if (!lotNumber || !poemText || !userQuery) {
            return { statusCode: 400, body: JSON.stringify({ error: "請求的資料不完整。" }) };
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("FATAL: GOOGLE_API_KEY is not set.");
            return { statusCode: 500, body: JSON.stringify({ error: "伺服器金鑰設定遺失。" }) };
        }

        // 準備給 AI 的新提示
        const prompt = `
            你是一位德高望重的解籤大師。一位信眾剛剛抽到了觀音靈籤第 ${lotNumber} 號籤，籤詩內容如下：
            """
            ${poemText}
            """
            現在，這位信眾想針對「${userQuery}」這個特定的問題，請求更深入的解釋。

            請根據這支籤詩的意涵，專門針對「${userQuery}」這個主題，提供詳細、具體、有條理的分析與建議。你的解釋必須：
            1.  緊扣籤詩原文的意象與典故。
            2.  完全專注在「${userQuery}」這個問題上。
            3.  語氣溫和、慈悲，給予信眾清晰的指引與信心。

            請直接開始解說。
        `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const aiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        });

        if (!aiResponse.ok) {
            const errorBody = await aiResponse.text();
            console.error("Google AI API error:", errorBody);
            throw new Error(`AI 服務呼叫失敗`);
        }

        const aiData = await aiResponse.json();
        const detailedInterpretation = aiData.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ detailedInterpretation }),
        };

    } catch (error) {
        console.error("Detailed interpretation function error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "伺服器內部錯誤" }),
        };
    }
};
