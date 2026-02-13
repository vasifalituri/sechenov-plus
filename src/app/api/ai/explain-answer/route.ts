import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const GROK_API_KEY = process.env.GROK_API_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 [AI Explain Answer] Starting request...');
    
    const session = await getServerSession(authOptions);
    console.log('🤖 [AI Explain Answer] Session:', session?.user?.id ? 'OK' : 'MISSING');
    
    if (!session?.user?.id) {
      console.error('❌ [AI Explain Answer] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 [AI Explain Answer] GROK_API_KEY:', GROK_API_KEY ? 'PRESENT' : 'MISSING');
    if (!GROK_API_KEY) {
      console.error('❌ [AI Explain Answer] GROK_API_KEY not configured');
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

    console.log('🤖 [AI Explain Answer] Calling Grok API...');
    console.log('🤖 [AI Explain Answer] Question:', questionText?.substring(0, 50) + '...');

    const grokUrl = 'https://api.x.ai/chat/completions';
    
    console.log('🤖 [AI Explain Answer] Sending request to Grok...');
    const response = await fetch(grokUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    console.log('🤖 [AI Explain Answer] Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [AI Explain Answer] Grok API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate explanation', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🤖 [AI Explain Answer] Grok response received');
    console.log('🤖 [AI Explain Answer] Full response:', JSON.stringify(data, null, 2));
    const explanation = data.choices?.[0]?.message?.content;

    if (!explanation) {
      console.error('❌ No explanation in Grok response');
      console.error('❌ Response data:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: 'Failed to generate explanation' },
        { status: 500 }
      );
    }

    console.log('✅ Explanation generated successfully');
    return NextResponse.json({
      explanation,
      source: 'grok'
    });

  } catch (error) {
    console.error('❌ Error in explain-answer endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
