import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Groq API для объяснений вопросов (быстрая и надежная)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 [Quiz Explain] Starting request...');
    
    const session = await getServerSession(authOptions);
    console.log('🤖 [Quiz Explain] Session:', session?.user?.id ? 'OK' : 'MISSING');
    
    if (!session?.user?.id) {
      console.error('❌ [Quiz Explain] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 [Quiz Explain] GROQ_API_KEY:', GROQ_API_KEY ? 'PRESENT' : 'MISSING');
    if (!GROQ_API_KEY) {
      console.error('❌ [Quiz Explain] GROQ_API_KEY not configured');
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

    console.log('🤖 [Quiz Explain] Calling Groq API...');
    console.log('🤖 [Quiz Explain] Question:', questionText?.substring(0, 50) + '...');
    console.log('🤖 [Quiz Explain] API Key length:', GROQ_API_KEY?.length);

    // Вызываем Groq API
    console.log('🤖 [Quiz Explain] Sending request to Groq...');
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Ты преподаватель медицины, готовящий студентов к централизованному тестированию (ЦТ). Объясняй кратко и понятно на русском языке.',
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.95,
      }),
    });

    console.log('🤖 [Quiz Explain] Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [Quiz Explain] Groq API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate explanation', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🤖 [Quiz Explain] Groq response received');
    const explanation = data.choices?.[0]?.message?.content;

    if (!explanation) {
      console.error('❌ No explanation in Groq response');
      return NextResponse.json(
        { error: 'Failed to generate explanation' },
        { status: 500 }
      );
    }

    console.log('✅ Explanation generated successfully');
    return NextResponse.json({
      explanation,
      source: 'groq'
    });

  } catch (error) {
    console.error('❌ Error in quiz explain endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
