import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from 'langchain/prompts';
import { ObjectId, WithId, Document } from 'mongodb';

// Interfaces
interface Article {
  _id: ObjectId;
  title: string;
  content: string;
}

interface ArticleWithSimilarity extends Article {
  similarity: number;
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  conversationId: string;
}

// Constants
const SIMILARITY_THRESHOLD = 0.5;
const MAX_CONVERSATION_HISTORY = 5;

// Initialize OpenAI models
const model = new ChatOpenAI({ 
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Utility functions
const getStringContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(getStringContent).join(' ');
  if (typeof content === 'object' && content !== null) return JSON.stringify(content);
  return '';
};

const normalizeString = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const calculateSimilarity = (str1: string, str2: string): number => {
  const set1 = new Set(normalizeString(str1).split(' '));
  const set2 = new Set(normalizeString(str2).split(' '));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  return intersection.size / Math.max(set1.size, set2.size);
};

// Database functions
const getConversationHistory = async (messagesCollection: any, conversationId: string): Promise<string> => {
  const previousMessages = await messagesCollection
    .find({ conversationId })
    .sort({ timestamp: -1 })
    .limit(MAX_CONVERSATION_HISTORY)
    .toArray();
  return previousMessages
    .reverse()
    .map((msg: Message) => `${msg.isUser ? 'User' : 'Bot'}: ${msg.text}`)
    .join('\n');
};

const searchArticles = async (articlesCollection: any, message: string): Promise<ArticleWithSimilarity[]> => {
  const articles: WithId<Document>[] = await articlesCollection.find().toArray();
  return articles
    .filter((doc): doc is WithId<Article> => 'title' in doc && 'content' in doc)
    .map(article => ({
      ...article,
      similarity: Math.max(
        calculateSimilarity(message, article.title),
        calculateSimilarity(message, article.content)
      )
    }))
    .filter(article => article.similarity > SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);
};

// Classification function
const classifyQuery = async (message: string, history: string): Promise<string> => {
  const classificationPrompt = PromptTemplate.fromTemplate(`
    You are a disaster management assistant bot developed by mrselva.eth. Classify the following query into one of these categories:
    1. greeting: General greetings, pleasantries, or expressions of gratitude (e.g., "hello", "nice to meet you", "thanks")
    2. bot_info: Queries about the bot itself, its capabilities, or its creation (e.g., "what can you do", "tell me about yourself")
    3. developer_info: Queries specifically about who created the bot or mentioning mrselva.eth
    4. general_disaster_info: General queries about disasters or disaster management concepts
    5. specific_disaster_info: Queries about specific disasters, disaster management techniques, or relief teams
    6. other: Any query that doesn't fit into the above categories

    Previous conversation:
    {history}

    Current query: {query}
    
    Classification (greeting/bot_info/developer_info/general_disaster_info/specific_disaster_info/other):
  `);

  const classificationChain = classificationPrompt.pipe(model);
  const classification = await classificationChain.invoke({ query: message, history });
  return getStringContent(classification.content).toLowerCase();
};

// Handler functions
const handleGreeting = async (message: string, history: string): Promise<string> => {
  const greetingPrompt = PromptTemplate.fromTemplate(`
    You are a friendly disaster management assistant bot. Respond to the following greeting or expression of gratitude:
    
    Previous conversation:
    {history}

    Current user message: {query}
    
    Provide a warm, concise response that acknowledges the user's greeting and subtly reminds them of your purpose as a disaster management assistant. Response:
  `);
  const greetingChain = greetingPrompt.pipe(model);
  const greetingResponse = await greetingChain.invoke({ query: message, history });
  return getStringContent(greetingResponse.content);
};

const handleBotInfo = async (message: string, history: string): Promise<string> => {
  const botInfoPrompt = PromptTemplate.fromTemplate(`
    You are an AI-powered disaster management assistant bot. Answer the following question about yourself:
    
    Previous conversation:
    {history}

    Current user question: {query}
    
    Provide a clear, concise response that answers the user's question and emphasizes your focus on disaster management. Do not provide any information about your internal workings or sensitive data. Response:
  `);
  const botInfoChain = botInfoPrompt.pipe(model);
  const botInfoResponse = await botInfoChain.invoke({ query: message, history });
  return getStringContent(botInfoResponse.content);
};

const handleArticleRelatedQuestion = async (message: string, articles: ArticleWithSimilarity[]): Promise<string> => {
  const articlesContent = articles.map(article => article.content).join('\n\n');
  
  const articleQuestionPrompt = PromptTemplate.fromTemplate(`
    You are a disaster management assistant bot. Analyze the following question and provide an answer based on the given articles. If the question is not directly related to the articles, provide a general answer based on your knowledge.

    Articles:
    {articles}

    Question: {query}

    Instructions:
    1. Understand the question by analyzing it word by word.
    2. Identify the key concepts and intent of the question.
    3. Search for relevant information in the provided articles.
    4. If the articles contain relevant information, use it to formulate your answer.
    5. If the articles don't contain directly relevant information, provide a general answer based on your knowledge of disaster management.
    6. Ensure your answer is clear, concise, and directly addresses the question.

    Answer:
  `);

  const articleQuestionChain = articleQuestionPrompt.pipe(model);
  const articleQuestionResponse = await articleQuestionChain.invoke({ 
    articles: articlesContent, 
    query: message 
  });
  return getStringContent(articleQuestionResponse.content);
};

const handleGeneralDisasterInfo = async (message: string, history: string): Promise<string> => {
  const generalDisasterInfoPrompt = PromptTemplate.fromTemplate(`
    You are a disaster management assistant. Provide a concise overview of disasters based on the following query:
    
    Previous conversation:
    {history}

    Current query: {query}
    
    Provide a brief explanation including:
    1. A general definition of disasters
    2. Types of disasters (natural and man-made)
    3. The importance of disaster management
    4. A brief mention of disaster preparedness, response, and recovery
    
    Keep the response concise and informative. Response:
  `);

  const generalDisasterInfoChain = generalDisasterInfoPrompt.pipe(model);
  const generalDisasterInfoResponse = await generalDisasterInfoChain.invoke({ query: message, history });
  return getStringContent(generalDisasterInfoResponse.content);
};

const handleSpecificDisasterInfo = async (message: string, history: string): Promise<string> => {
  const specificDisasterInfoPrompt = PromptTemplate.fromTemplate(`
    You are a disaster management assistant. Provide information about the following specific disaster-related topic or relief team:
    
    Previous conversation:
    {history}

    Current topic: {query}
    
    Provide a detailed explanation including:
    1. Overview of the specific disaster or relief team
    2. Their role in disaster management or relief efforts
    3. Any specific details about their operations or services
    4. How individuals can prepare for or respond to this specific disaster (if applicable)
    
    Response:
  `);

  const specificDisasterInfoChain = specificDisasterInfoPrompt.pipe(model);
  const specificDisasterInfoResponse = await specificDisasterInfoChain.invoke({ query: message, history });
  return getStringContent(specificDisasterInfoResponse.content);
};

const handleOtherQuery = async (message: string, history: string): Promise<string> => {
  const relatePrompt = PromptTemplate.fromTemplate(`
    You are a disaster management assistant. Try to relate the following topic to disaster management:
    
    Previous conversation:
    {history}

    Current topic: {query}
    If there's a connection to disaster management, explain it. If not, respond with "UNRELATED".
    Response:
  `);

  const relateChain = relatePrompt.pipe(model);
  const relateResponse = await relateChain.invoke({ query: message, history });
  const relatedContent = getStringContent(relateResponse.content);

  if (relatedContent.toLowerCase().includes('unrelated')) {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(message)}`;
    return `I am your Disaster Management Assistant Bot. I can answer questions related to disaster management topics and relevant technologies. For your off-topic question, please 🤖➡️<a href="${googleSearchUrl}" target="_blank" style="color: blue; text-decoration: underline;">visit here</a>.`;
  }
  return relatedContent;
};

const isFollowUpQuestion = async (message: string, history: string): Promise<boolean> => {
  const followUpPrompt = PromptTemplate.fromTemplate(`
    Analyze the following message and determine if it's a follow-up question based on the conversation history.
    
    Conversation history:
    {history}

    Current message: {message}
    
    Is this a follow-up question? Respond with 'yes' or 'no':
  `);

  const followUpChain = followUpPrompt.pipe(model);
  const followUpResponse = await followUpChain.invoke({ message, history });
  return getStringContent(followUpResponse.content).toLowerCase().includes('yes');
};

const handleContinuousTopic = async (message: string, history: string): Promise<string> => {
  const continuousTopicPrompt = PromptTemplate.fromTemplate(`
    You are a disaster management assistant bot. The user has asked a follow-up question related to the previous conversation. Provide a response that addresses the current query in the context of the entire conversation history.

    Conversation history:
    {history}

    Current user question: {query}
    
    Provide a clear, concise response that answers the user's question in the context of the previous conversation. If the question is asking for a brief summary, provide a concise overview of the main points. Response:
  `);

  const continuousTopicChain = continuousTopicPrompt.pipe(model);
  const continuousTopicResponse = await continuousTopicChain.invoke({ query: message, history });
  return getStringContent(continuousTopicResponse.content);
};

// Main POST handler
export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();

    const client = await clientPromise;
    const db = client.db("dmbot");
    const messagesCollection = db.collection('messages');
    const articlesCollection = db.collection('articles');

    const conversationHistory = await getConversationHistory(messagesCollection, conversationId);

    await messagesCollection.insertOne({
      text: message,
      isUser: true,
      timestamp: new Date(),
      conversationId
    });

    const classificationResult = await classifyQuery(message, conversationHistory);

    let botResponse: string;

    if (classificationResult.includes('greeting')) {
      botResponse = await handleGreeting(message, conversationHistory);
    } else if (classificationResult.includes('bot_info')) {
      botResponse = await handleBotInfo(message, conversationHistory);
    } else if (classificationResult.includes('developer_info')) {
      botResponse = "I was developed by mrselva.eth. He created me from scratch to assist with disaster management queries. If you ask, 'Does God exist?' to me, I would say mrselva.eth created me, so God does exist.";
    } else {
      const relevantArticles = await searchArticles(articlesCollection, message);

      if (relevantArticles.length > 0) {
        botResponse = await handleArticleRelatedQuestion(message, relevantArticles);
      } else if (classificationResult.includes('general_disaster_info')) {
        botResponse = await handleGeneralDisasterInfo(message, conversationHistory);
      } else if (classificationResult.includes('specific_disaster_info')) {
        botResponse = await handleSpecificDisasterInfo(message, conversationHistory);
      } else if (await isFollowUpQuestion(message, conversationHistory)) {
        botResponse = await handleContinuousTopic(message, conversationHistory);
      } else {
        botResponse = await handleOtherQuery(message, conversationHistory);
      }
    }

    await messagesCollection.insertOne({
      text: botResponse,
      isUser: false,
      timestamp: new Date(),
      conversationId
    });

    return NextResponse.json({ 
      content: botResponse,
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}