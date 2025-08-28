
import { GoogleGenAI, Type, GenerateContentResponse, Content } from "@google/genai";
import { UserLevel, GrammarError, AssessmentResult, VocabularyWord, UserData, LearningRecommendation } from '../types';

const defaultModelConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
};

// --- Helper Functions ---
const safelyParseJSON = <T,>(text: string, fallback: T): T => {
    try {
        const cleanText = text.replace(/^```json\s*|```$/g, '').trim();
        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Original text:", text);
        return fallback;
    }
};

const callGemini = async (apiKey: string, contents: string | (string | { inlineData: { mimeType: string; data: string; }; })[], schema?: any) => {
    if (!apiKey) {
        throw new Error("API key is not configured. Please set it in the Settings page.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: Array.isArray(contents) ? { parts: contents.map(c => typeof c === 'string' ? { text: c } : c) } : contents,
            config: {
                ...defaultModelConfig,
                ...(schema && {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                }),
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI. Please check your API key and network connection.");
    }
};


// --- API Functions ---

export const getAssessmentQuestions = async (apiKey: string, history: AssessmentResult[]) => {
    const lastResult = history[history.length - 1];
    const weaknessPrompt = lastResult ? `The user has previously shown weaknesses in these areas: ${lastResult.weaknesses.join(', ')}. Please create questions that test these areas, while also covering a general range of topics.` : '';

    const prompt = `You are an English proficiency assessment tool. Generate an 8-question multiple-choice test to evaluate a user's general level from primary school to university. The questions should cover: Vocabulary, Reading Comprehension, and Grammar. ${weaknessPrompt} Vary the question formats. Provide the questions in a JSON array.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
        }
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    return safelyParseJSON<{ question: string; options: string[]; correctAnswer: string }[]>(responseText, []);
};

export const generateAssessmentFromContext = async (apiKey: string, context: string, level: UserLevel) => {
    const prompt = `Based on the following text, generate a 5-question multiple-choice assessment for a user at the "${level}" level. The questions should test vocabulary found in the text, reading comprehension of the text's main ideas, and a grammatical structure present in the text. Text: """${context}""". Respond in JSON format.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
        }
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    return safelyParseJSON<{ question: string; options: string[]; correctAnswer: string }[]>(responseText, []);
};


export const analyzeAssessment = async (apiKey: string, answers: Record<number, string>) => {
    const prompt = `Analyze the following user answers to an English proficiency test. Based on their performance, determine their level ('Beginner', 'Intermediate', 'Advanced', or 'Proficient'), provide a detailed breakdown of their strengths and weaknesses, and give 3 concrete recommendations for improvement. User answers: ${JSON.stringify(answers)}. Respond in JSON format.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            level: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced', 'Proficient'] },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["level", "strengths", "weaknesses", "recommendations"]
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    // FIX: Corrected typo in fallback value from 'Beginger' to 'Beginner' to match UserLevel type.
    return safelyParseJSON<{ level: UserLevel, strengths: string[], weaknesses: string[], recommendations: string[] }>(responseText, { level: 'Beginner', strengths: [], weaknesses: [], recommendations: [] });
};

export const getSpellingWord = async (apiKey: string, level: UserLevel) => {
    const prompt = `Provide a single, moderately challenging English word for a spelling challenge for a user at the "${level}" level. Avoid common or very simple words (e.g., 'cat', 'sun', 'book'). Include its definition and an example sentence. Respond in JSON format.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING },
            example: { type: Type.STRING }
        },
        required: ["word", "definition", "example"]
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    return safelyParseJSON<{ word: string, definition: string, example: string }>(responseText, { word: '', definition: '', example: '' });
};

export const getChatResponse = async (apiKey:string, history: Content[], userData: UserData) => {
    if (!apiKey) {
        throw new Error("API key is not configured. Please set it in the Settings page.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        const personaPrompt = userData.profile.persona.interests.length > 0 ? `The user is interested in ${userData.profile.persona.interests.join(', ')}. Try to incorporate these topics into the conversation naturally.` : '';

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are an AI English tutor named Alex. Your goal is to help a student at the "${userData.profile.level}" level practice English through natural conversation. ${personaPrompt} Respond to their message conversationally. ALSO, analyze their last message for any grammar, spelling, or style errors.
Respond ONLY with a single JSON object with two keys: "response" (your conversational reply as a string) and "corrections" (an array of objects: [{"error": "the incorrect phrase", "correction": "the correct phrase", "explanation": "why it was wrong"}]). If there are no errors, the "corrections" array must be empty.`,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        response: { type: Type.STRING },
                        corrections: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    error: { type: Type.STRING },
                                    correction: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                },
                                required: ["error", "correction", "explanation"]
                            }
                        }
                    },
                    required: ["response", "corrections"]
                }
            },
            history: history,
        });
        const result = await chat.sendMessage({ message: history[history.length - 1].parts[0].text });
        return safelyParseJSON<{ response: string, corrections: Omit<GrammarError, 'id' | 'timestamp'>[] }>(result.text, { response: 'Sorry, I had trouble processing that.', corrections: [] });
    } catch (error) {
        console.error("Error in getChatResponse:", error);
        throw error;
    }
};

export const extractTextFromImage = async (apiKey: string, mimeType: string, base64Data: string) => {
    const prompt = "Extract all English text from the image.";
    const imagePart = {
        inlineData: {
            mimeType,
            data: base64Data
        }
    };
    const responseText = await callGemini(apiKey, [prompt, imagePart]);
    return responseText;
};

export const generateVocabularyFromContext = async (apiKey: string, context: string, level: UserLevel) => {
    const prompt = `From the provided text, identify 3-5 vocabulary words that would be appropriate for an English learner at the "${level}" level. For each word, provide a simple definition and the example sentence from the text where it appears. Text: """${context}""". Respond in JSON format.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                word: { type: Type.STRING },
                definition: { type: Type.STRING },
                example: { type: Type.STRING }
            },
            required: ["word", "definition", "example"]
        }
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    return safelyParseJSON<Omit<VocabularyWord, 'addedDate' | 'level'>[]>(responseText, []);
};

export const generateMemoryCards = async (apiKey: string, errors: GrammarError[], vocab: VocabularyWord[]) => {
    const recentErrors = errors.slice(-5).map(e => ({ error: e.error, correction: e.correction, explanation: e.explanation }));
    const recentVocab = vocab.slice(-5).map(v => ({ word: v.word, definition: v.definition }));

    const prompt = `Create 5 "fill-in-the-blank" style challenge cards based on a user's recent grammar mistakes and learned vocabulary.
    - For grammar, create a sentence that tempts the user to make their specific mistake, and ask them to fill in the correct word/phrase.
    - For vocabulary, create a sentence where the learned word is missing, and provide the definition as a clue.
    - Provide a category ('Grammar' or 'Vocabulary'), the challenge sentence with a blank (e.g., "She _____ to the store yesterday."), the single-word answer, and a brief hint.
    Data:
    - Recent Errors: ${JSON.stringify(recentErrors)}
    - Recent Vocab: ${JSON.stringify(recentVocab)}
    Respond in JSON format.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING, enum: ['Grammar', 'Vocabulary'] },
                challenge: { type: Type.STRING },
                answer: { type: Type.STRING },
                hint: { type: Type.STRING }
            },
            required: ["category", "challenge", "answer", "hint"]
        }
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    return safelyParseJSON<{ category: string, challenge: string, answer: string, hint: string }[]>(responseText, []);
};

export const generateQuiz = async (apiKey: string, topic: string) => {
    const prompt = `Generate a 5-question multiple-choice quiz about "${topic}". The questions should be interesting and test general knowledge and reading comprehension. Provide 4 options for each question.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
        }
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    return safelyParseJSON<{ question: string, options: string[], correctAnswer: string }[]>(responseText, []);
};

export const updatePersonaAndRecommendations = async (apiKey: string, userData: UserData) => {
    const prompt = `
      You are an AI learning coach. Analyze the provided user data to understand the learner's profile, interests, and recent performance.
      Based on this data, update their persona and generate 3 personalized, actionable recommendations for the main dashboard.
      The recommendations should be cross-functional, encouraging the user to connect different features of the learning app.
      
      User Data:
      - Current Level: ${userData.profile.level}
      - Known Interests: ${userData.profile.persona.interests.join(', ') || 'None specified yet.'}
      - Chat History Summary: Analyze the last 10 messages for topics. Chat: ${JSON.stringify(userData.chatHistory.slice(-10).map(m => m.parts[0].text))}
      - Recent Grammar Errors (last 5): ${JSON.stringify(userData.grammarErrors.slice(-5).map(e => e.error))}
      - Recent Vocabulary Learned (last 5): ${JSON.stringify(userData.vocabulary.slice(-5).map(v => v.word))}
      - Recent Quiz Topics: ${JSON.stringify(userData.quizHistory.slice(-3).map(q => q.topic))}
      
      Instructions:
      1.  **Update Persona**: Based on chat history and quiz topics, refine the user's persona. Identify key interests (keep it to a max of 5) and provide a concise one-sentence summary for the user's dashboard.
      2.  **Generate Recommendations**: Create 3 unique recommendations. Each should be a clear action the user can take in the app.
          - Connect interests to activities (e.g., "Since you're interested in space, try a quiz on 'black holes'").
          - Target weaknesses (e.g., "You've made a few errors with verb tenses. Try focusing on past and present tense in your next chat with Alex.").
          - Encourage using different app sections together (e.g., "Learn new words in the Spelling Game, then try using them in the Chat Trainer.").
      
      Respond with a single JSON object.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            persona: {
                type: Type.OBJECT,
                properties: {
                    interests: { type: Type.ARRAY, items: { type: Type.STRING } },
                    summary: { type: Type.STRING }
                },
                required: ["interests", "summary"]
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["persona", "recommendations"]
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    return safelyParseJSON<{ persona: { interests: string[], summary: string }, recommendations: string[] }>(responseText, { persona: userData.profile.persona, recommendations: userData.recommendations });
};

export const generateLearningPlan = async (apiKey: string, userData: UserData) => {
    const prompt = `
        You are an AI learning coach. Based on the user's data, generate a personalized learning plan with 5 actionable items to help them improve.
        
        User Data:
        - Level: ${userData.profile.level}
        - Interests: ${userData.profile.persona.interests.join(', ') || 'General'}
        - Recent Assessment Weaknesses: ${userData.assessmentHistory.slice(-1)[0]?.weaknesses.join(', ') || 'N/A'}
        - Recent Grammar Errors: ${JSON.stringify(userData.grammarErrors.slice(-5).map(e => e.error))}
        - Recent Quiz Performance: ${JSON.stringify(userData.quizHistory.slice(-3))}

        Instructions:
        Create a JSON array of 5 objects. Each object represents a task and must have "type", "title", and "description".
        - type: Can be 'quiz', 'spelling', or 'chat_topic'.
        - title: A short, engaging title for the task. For 'spelling', this should be the word to practice.
        - description: A one-sentence explanation of the task and why it's useful. For 'spelling', this should be the definition.

        Example item: {"type": "quiz", "title": "Take a quiz on 'Verb Tenses'", "description": "Practice your verb tense skills, which was noted as a weak area in your last assessment."}
        Example item: {"type": "spelling", "title": "conscientious", "description": "Wishing to do one's work or duty well and thoroughly."}
        Example item: {"type": "chat_topic", "title": "Talk about your favorite movie", "description": "Practice using descriptive language and expressing opinions in a casual conversation."}

        Tailor the plan to the user's data.
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['quiz', 'spelling', 'chat_topic'] },
                title: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ["type", "title", "description"]
        }
    };
    const responseText = await callGemini(apiKey, prompt, schema);
    const parsed = safelyParseJSON<Omit<LearningRecommendation, 'id' | 'completed'>[]>(responseText, []);
    return parsed.map(item => ({...item, id: `task-${Date.now()}-${Math.random()}`, completed: false }));
};