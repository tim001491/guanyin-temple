// 檔案路徑: netlify/functions/get-detailed-interpretation.js
exports.handler = async (event) => {
    console.log("Function 'get-detailed-interpretation' triggered.");
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("FATAL: GOOGLE_API_KEY not set.");
        return { statusCode: 500, body: JSON.stringify({ error: "伺服器金鑰設定遺失。" }) };
    }

    try {
        const { lotNumber, poemText, userQuery } = JSON.parse(event.body);
        if (!lotNumber || !poemText || !userQuery) return { statusCode: 400, body: JSON.stringify({ error: "請求的資料不完整。" }) };

        const prompt = `你是一位德高望重的解籤大師。一位信眾剛剛抽到了觀音靈籤第 ${lotNumber} 號籤，籤詩內容如下：\n"""\n${poemText}\n"""\n現在，這位信眾想針對「${userQuery}」這個特定的問題，請求更深入的解釋。請根據這支籤詩的意涵，專門針對「${userQuery}」這個主題，提供詳細、具體、有條理的分析與建議。你的解釋必須緊扣籤詩原文的意象與典故，語氣溫和、慈悲，給予信眾清晰的指引與信心。請直接開始解說。`;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        });

        const data = await response.json();

        // --- 智慧偵錯區塊 ---
        if (data.error) {
            console.error("Google AI returned an error object:", JSON.stringify(data.error));
            return { statusCode: 500, body: JSON.stringify({ error: `Google AI 服務錯誤: ${data.error.message}` }) };
        }

        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
            console.error("Google AI response is missing valid candidate content. Response:", JSON.stringify(data));
            const reason = data.promptFeedback?.blockReason || "未知原因";
            return { statusCode: 500, body: JSON.stringify({ error: `AI 未能生成內容，可能原因: ${reason}。` }) };
        }

        const detailedInterpretation = data.candidates[0].content.parts[0].text;
        return {
            statusCode: 200,
            body: JSON.stringify({ detailedInterpretation }),
        };
    } catch (error) {
        console.error("Detailed interpretation function error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "後端函式發生未知錯誤。" }) };
    }
};

