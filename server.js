const express = require("express");
const Groq = require("groq-sdk");

const app = express();

app.use(express.json());
app.use(express.static("."));

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.post("/chat", async (req, res) => {

    const question = req.body.question;

    if (!question) {
        return res.json({
            error: "Aucune question reçue"
        });
    }

    try {

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "system",
                    content: "Tu es boockBook IA, un assistant intelligent qui répond clairement en français."
                },
                {
                    role: "user",
                    content: question
                }
            ]
        });

        const reponse = completion.choices[0]?.message?.content;

        res.json({
            reponse: reponse
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Erreur lors de la communication avec Groq"
        });
    }
});

app.listen(3000, () => {
    console.log("🚀 boockBook IA démarrée sur http://localhost:3000");
});
