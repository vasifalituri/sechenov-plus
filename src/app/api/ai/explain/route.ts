import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Используем fetch для вызова Gemini API (не требует установки библиотеки)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash'; // Быстрая модель для экономии токенов

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 [AI Explain] Starting request...');
    
    const session = await getServerSession(authOptions);
    console.log('🤖 [AI Explain] Session:', session?.user?.id ? 'OK' : 'MISSING');
    
    if (!session?.user?.id) {
      console.error('❌ [AI Explain] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 [AI Explain] GEMINI_API_KEY:', GEMINI_API_KEY ? 'PRESENT' : 'MISSING');
    if (!GEMINI_API_KEY) {
      console.error('❌ [AI Explain] GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { questionText, correctAnswer, userAnswer, explanation: dbExplanation, options } = body;

    if (!questionText || !correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Если уже есть объяснение в БД, используем его вместо ИИ
    if (dbExplanation && dbExplanation.trim()) {
      console.log('📚 Using stored explanation instead of AI');
      return NextResponse.json({
        explanation: dbExplanation,
        source: 'database'
      });
    }

    // Формируем промпт для ИИ
    const prompt = `Ты преподаватель медицины, готовящий студентов к централизованному тестированию (ЦТ).

ВОПРОС:
${questionText}

ВАРИАНТЫ ОТВЕТОВ:
${options ? Object.entries(options).map(([key, value]) => `${key}) ${value}`).join('\n') : 'Варианты ответов не предоставлены'}

ПРАВИЛЬНЫЙ ОТВЕТ: ${correctAnswer}
${userAnswer ? `ОТВЕТ СТУДЕНТА: ${userAnswer}` : ''}

Твоя задача:
1. Объясни, почему правильный ответ именно "${correctAnswer}"
2. Укажи медицинское обоснование
3. Если студент ответил неправильно, объясни его ошибку кратко и понятно
4. Дай краткий совет для запоминания

Ответь на РУССКОМ языке. Будь лаконичен (2-3 абзаца максимум).`;

    console.log('🤖 [AI Explain] Calling Gemini API...');
    console.log('🤖 [AI Explain] Question:', questionText?.substring(0, 50) + '...');
    console.log('🤖 [AI Explain] API Key length:', GEMINI_API_KEY?.length);

    // Вызываем Gemini API через REST endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    console.log('🤖 [AI Explain] Gemini URL:', geminiUrl.substring(0, 80) + '...');
    
    console.log('🤖 [AI Explain] Sending request to Gemini...');
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      }),
    });

    console.log('🤖 [AI Explain] Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [AI Explain] Gemini API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate explanation', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🤖 [AI Explain] Gemini response received');
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!explanation) {
      console.error('❌ No explanation in Gemini response');
      return NextResponse.json(
        { error: 'Failed to generate explanation' },
        { status: 500 }
      );
    }

    console.log('✅ Explanation generated successfully');
    return NextResponse.json({
      explanation,
      source: 'gemini'
    });

  } catch (error) {
    console.error('❌ Error in explain endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
