const MODEL = "gemini-3.5-flash";

const SYSTEM_PROMPT = `
Você é o Aureon AI, assistente virtual oficial da Aureon.

SOBRE A AUREON:
A Aureon é uma marca de tecnologia focada em criação de sites,
sistemas, automações, inteligência artificial e soluções digitais.

PERSONALIDADE:
- Responda sempre em português do Brasil.
- Seja profissional, amigável e objetivo.
- Explique assuntos técnicos de maneira simples.
- Não invente informações sobre a Aureon.
- Não invente preços, clientes, prazos ou resultados.
- Se não souber alguma informação específica, diga claramente que não possui essa informação.
- Não diga que uma informação é da Aureon se ela não estiver disponível.
- Evite respostas desnecessariamente longas.

SERVIÇOS DA AUREON:
- Criação de sites
- Landing pages
- Sistemas web
- Sistemas administrativos
- Automação de processos
- Integrações
- Inteligência artificial
- Projetos personalizados
- Soluções digitais

ATENDIMENTO:
Quando alguém demonstrar interesse em contratar a Aureon,
oriente a pessoa a utilizar a área de contato do site.

IDENTIDADE:
Se perguntarem quem é você, responda:
"Eu sou o Aureon AI, assistente virtual da Aureon."

OBJETIVO:
Ajudar visitantes a entender a Aureon, seus serviços e tecnologia,
sempre fornecendo respostas úteis e honestas.
`;

function responseJSON(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store"
            }
        }
    );
}

export default async function handler(request) {

    // =====================================================
    // MÉTODO
    // =====================================================

    if (request.method !== "POST") {
        return responseJSON(
            {
                error: "Método não permitido."
            },
            405
        );
    }

    // =====================================================
    // CHAVE
    // =====================================================

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {

        console.error(
            "GEMINI_API_KEY não configurada no Netlify."
        );

        return responseJSON(
            {
                error: "O Aureon AI ainda não foi configurado."
            },
            500
        );
    }

    // =====================================================
    // BODY
    // =====================================================

    let body;

    try {

        body = await request.json();

    } catch {

        return responseJSON(
            {
                error: "Requisição inválida."
            },
            400
        );
    }

    const message =
        typeof body?.message === "string"
            ? body.message.trim()
            : "";

    // =====================================================
    // VALIDAÇÃO
    // =====================================================

    if (!message) {

        return responseJSON(
            {
                error: "Digite uma mensagem."
            },
            400
        );
    }

    if (message.length > 1000) {

        return responseJSON(
            {
                error:
                    "A mensagem é muito longa. Limite de 1000 caracteres."
            },
            400
        );
    }

    // =====================================================
    // GEMINI
    // =====================================================

    try {

        const endpoint =
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

        const response = await fetch(
            endpoint,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },

                body: JSON.stringify({

                    systemInstruction: {
                        parts: [
                            {
                                text: SYSTEM_PROMPT
                            }
                        ]
                    },

                    contents: [
                        {
                            role: "user",

                            parts: [
                                {
                                    text: message
                                }
                            ]
                        }
                    ],

                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 700
                    }

                })
            }
        );

        const data = await response.json();

        // =================================================
        // ERRO DA API
        // =================================================

        if (!response.ok) {

            console.error(
                "Erro Gemini:",
                response.status,
                data
            );

            return responseJSON(
                {
                    error:
                        "O Aureon AI não conseguiu responder agora."
                },
                502
            );
        }

        // =================================================
        // EXTRAIR RESPOSTA
        // =================================================

        const reply =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!reply) {

            return responseJSON(
                {
                    error:
                        "A IA não retornou uma resposta."
                },
                502
            );
        }

        // =================================================
        // RESPOSTA
        // =================================================

        return responseJSON({
            reply
        });

    } catch (error) {

        console.error(
            "Erro interno do Aureon AI:",
            error
        );

        return responseJSON(
            {
                error:
                    "O Aureon AI está temporariamente indisponível."
            },
            500
        );
    }
}