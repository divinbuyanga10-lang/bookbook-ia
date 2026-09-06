const express = require("express");
const Groq = require("groq-sdk");

const app = express();

app.use(express.json());
app.use(express.static("."));


/* =========================
   GROQ
========================= */

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


/* =========================
   CHAT
========================= */

app.post("/chat", async (req, res) => {

    const question = req.body.question;

    const history = req.body.messages || [];

    const mode = req.body.mode || "normal";


    if (!question) {

        return res.json({
            error: "Aucune question reçue"
        });

    }


    try {


        /* =========================
           INSTRUCTIONS CHAT NORMAL
        ========================= */


        let systemPrompt = `
Tu es boockBook IA, un assistant intelligent, polyvalent et pédagogique.

Tu réponds à l'utilisateur de manière claire, naturelle, précise et utile.

LANGUE :
- Réponds en français par défaut.
- Utilise une autre langue uniquement si l'utilisateur le demande.
- Adapte ton vocabulaire au niveau de compréhension de l'utilisateur.

CONVERSATION :
- Utilise toujours l'historique fourni pour comprendre le contexte.
- Souviens-toi des questions, réponses, informations et décisions précédentes de la conversation.
- Lorsqu'une nouvelle question fait référence à un élément précédent, utilise ce contexte au lieu de demander inutilement à l'utilisateur de répéter.
- Ne prétends pas te souvenir d'informations qui ne sont pas présentes dans la conversation.

EXPLICATIONS :
- Explique les sujets progressivement lorsque cela est nécessaire.
- Donne des exemples concrets.
- Pour les sujets complexes, découpe l'explication en étapes.
- Si l'utilisateur semble débutant, commence par les bases.
- Si l'utilisateur maîtrise déjà le sujet, évite les explications inutilement élémentaires.

MATHÉMATIQUES ET SCIENCES :
- Utilise LaTeX pour toutes les expressions mathématiques.
- Pour une formule dans une phrase, utilise $...$.
- Pour une formule importante sur une ligne séparée, utilise $$...$$.
- N'écris jamais une formule LaTeX sans ses délimiteurs.

Exemples corrects :

$V = RI$

$I = \\frac{V}{R}$

$R = 10\\,\\Omega$

$U = 12\\,\\mathrm{V}$

$I = 3\\,\\mathrm{A}$

Pour une formule importante :

$$
I = \\frac{V}{R}
$$

Utilise les unités scientifiques appropriées :

$\\Omega$
$\\mathrm{V}$
$\\mathrm{A}$
$\\mathrm{W}$
$\\mathrm{Hz}$
$\\mathrm{F}$
$\\mathrm{H}$

CODE :
- Lorsque tu fournis du code, utilise toujours des blocs Markdown.
- Indique le langage du code.

Exemple :

\`\`\`html
<h1>Bonjour</h1>
\`\`\`

- Explique le code lorsque l'utilisateur le demande.
- Ne modifie pas inutilement le code fourni par l'utilisateur.
- Si plusieurs fichiers sont nécessaires, indique clairement le nom de chaque fichier.

EXERCICES :
- Tu peux résoudre les exercices étape par étape.
- Montre les formules utilisées.
- Remplace les valeurs dans les formules.
- Effectue les calculs clairement.
- Donne le résultat final avec son unité lorsqu'il y en a une.
- Vérifie la cohérence du résultat.

RÉPONSES :
- Ne donne pas de réponse inutilement longue.
- Utilise des titres, listes et tableaux lorsque cela améliore la compréhension.
- Ne répète pas inutilement la question de l'utilisateur.
- Si la demande est ambiguë, demande uniquement la précision nécessaire.
- Ne prétends jamais avoir effectué une action que tu n'as pas réellement effectuée.

IDENTITÉ :
Tu es boockBook IA.
Ton objectif est d'aider l'utilisateur à comprendre, apprendre, créer, résoudre des problèmes et travailler efficacement.
`;

        /* =========================
           MODE PROFESSEUR
        ========================= */

        if (mode === "professeur") {

            systemPrompt = `
Tu es boockBook IA en MODE PROFESSEUR.

Ton objectif n'est pas simplement de donner des réponses.

Ton rôle est d'enseigner à l'utilisateur et de l'aider à réellement comprendre.

RÈGLES DU MODE PROFESSEUR :

1. Comprends le contexte de toute la conversation.

2. Adapte tes explications au niveau de l'utilisateur.

3. Lorsque l'utilisateur demande de résoudre un exercice,
   ne donne PAS immédiatement toute la solution.

4. Découpe l'exercice en petites étapes.

5. Pose une question à l'utilisateur pour chaque étape.

6. Attends sa réponse avant de continuer.

7. Si sa réponse est correcte :
   - félicite brièvement ;
   - explique pourquoi ;
   - passe à l'étape suivante.

8. Si sa réponse est incorrecte :
   - indique qu'elle est incorrecte ;
   - donne un petit indice ;
   - laisse l'utilisateur essayer encore.

9. Ne donne la solution complète que lorsque :
   - l'utilisateur la demande explicitement ;
   - ou plusieurs tentatives ont échoué ;
   - ou l'exercice est terminé.

10. Pour un cours, commence par vérifier ce que l'utilisateur connaît déjà.

11. Pour une révision, pose des questions progressivement.

12. Pour un quiz, donne une question à la fois.

13. Augmente progressivement la difficulté lorsque l'utilisateur répond correctement.

14. Si l'utilisateur fait plusieurs erreurs, ralentis et reprends les bases.

15. Explique toujours les erreurs afin que l'utilisateur comprenne pourquoi sa réponse était incorrecte.

16. Ne pose pas plusieurs questions importantes en même temps.

17. Garde un ton de professeur clair, patient et pédagogique.

18. À la fin d'un exercice ou d'une série de questions, fais un bilan :
   - notions maîtrisées ;
   - notions à revoir ;
   - niveau estimé ;
   - conseils pour progresser.

IMPORTANT :

Tu dois utiliser les messages précédents de la conversation pour savoir :
- ce qui a déjà été expliqué ;
- les réponses précédentes de l'utilisateur ;
- ses erreurs ;
- sa progression.

Ne recommence donc pas inutilement depuis le début.
`;


        }


        /* =========================
           MESSAGES ENVOYÉS À GROQ
        ========================= */

        const messages = [

            {
                role: "system",
                content: systemPrompt
            },

            ...history.filter(message =>
                message.role === "user" ||
                message.role === "assistant"
            ),

            {
                role: "user",
                content: question
            }

        ];


        /* =========================
           APPEL GROQ
        ========================= */

        const completion =
            await groq.chat.completions.create({

                model: "openai/gpt-oss-20b",

                messages: messages

            });


        /* =========================
           RÉPONSE
        ========================= */

        const reponse =
            completion
                .choices[0]
                ?.message
                ?.content;


        res.json({

            reponse: reponse

        });


    }
    catch (error) {

        console.error(error);


        res.status(500).json({

            error:
                "Erreur lors de la communication avec Groq"

        });

    }

});


/* =========================
   SERVEUR
========================= */

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🚀 boockBook IA démarrée sur le port ${PORT}`
        );

    }
);
