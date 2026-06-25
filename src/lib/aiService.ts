import type { CommentaryData } from '@/types';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const MODEL = 'gpt-oss-120b';

export async function generateCommentary(extractedText: string): Promise<CommentaryData> {
  const systemPrompt = 'You are a senior financial analyst writing manager commentaries for global mutual funds and ETFs. You write clear, jargon-free manager commentaries that retail investors can understand. Always respond with valid JSON only.';

  const userPrompt = `You are a senior portfolio analyst writing a fund manager commentary. Read the provided factsheet and create a detailed yet accessible commentary for investors.

Generate a manager commentary with these sections:

1. **FUND MANAGER TEAM**
   - Name the lead manager(s) with years of experience and relevant credentials (CFA, MBA, etc.)
   - Mention team size and stability (how long they've managed this fund)
   - Note any recent manager changes if mentioned
   - Keep to 3-4 sentences

2. **STRATEGY**
   - Explain the fund's core investment philosophy and process in plain language
   - Describe the approach: active vs passive, top-down vs bottom-up, quantitative vs fundamental
   - Mention market cap focus, style tilt (value/growth/blend/quality/momentum), sector constraints
   - For bond funds: mention duration strategy, credit quality focus, yield curve positioning
   - For international/global funds: explain country/region allocation approach, currency hedging policy
   - For thematic/sector funds: explain the specific theme and how it's implemented
   - Keep to 4-5 sentences

3. **PERFORMANCE ATTRIBUTION** (MOST IMPORTANT - BE VERY DETAILED)
   - First write a 2-3 sentence summary of overall fund performance vs benchmark

   **TOP CONTRIBUTORS** (3-5 items):
   For each contributor, analyze MULTIPLE dimensions:
   - **Sector/Theme Level**: Which sectors or themes contributed most? Why did they perform well? (Connect to macro events, policy changes, earnings trends, commodity prices, geopolitical factors, regulatory shifts)
   - **Security Selection**: Which specific stocks/bonds/securities were the best performers? Why did these specific holdings outperform their peers in the same sector?
   - **Geographic Exposure**: For global funds, which regions/countries contributed most? Why? (e.g., "US allocation helped as the Fed signaled rate cuts" or "Emerging market exposure hurt as the dollar strengthened")
   - **Style Factors**: Did value, growth, quality, momentum, or small-cap factors contribute? (e.g., "The fund's quality bias helped as investors favored profitable companies during volatility")
   - **Currency Impact**: For international funds, how did FX movements affect returns?
   - **Position Sizing**: Did overweight positions in winning areas help? Did underweight positions in losing areas help?

   **BOTTOM DETRACTORS** (2-4 items):
   Same multi-dimensional analysis for detractors:
   - **Sector/Theme**: Which sectors/themes dragged performance and why?
   - **Security Selection**: Which specific holdings underperformed and why? (e.g., "Despite strong sector tailwinds, XYZ stock lagged due to company-specific earnings miss")
   - **Geographic**: Which regions/countries hurt and why?
   - **Style Factors**: Which style factors were headwinds?
   - **Currency**: FX drag on international holdings?
   - **Position Sizing**: Did overweight in losing areas hurt, or underweight in winning areas?

   Each contributor/detractor entry should have:
   - "name": A clear label (can be sector, region, theme, security, or factor)
   - "specifics": Specific securities, regions, or metrics mentioned
   - "contribution": What it added/subtracted to returns (e.g., "Added ~1.2% to total returns" or "-0.5% drag")
   - "reason": A detailed 2-3 sentence explanation covering the multi-dimensional analysis above

4. **BENCHMARK COMPARISON** (BE DETAILED)
   - State absolute and relative performance: fund return vs benchmark, and the gap
   - Analyze WHY the fund out/underperformed using attribution:
     - Was it stock/sector selection? (picking winners vs losers within sectors)
     - Was it allocation effect? (over/underweighting sectors/regions vs benchmark)
     - Was it currency timing? (for international funds)
     - Was it style tilt? (value vs growth, large vs small)
   - For global funds: compare geographic allocation decisions vs benchmark weights
   - Mention the tracking error or information ratio if available
   - What does this mean for investors? (skill-based alpha vs luck, consistency of process)
   - Keep to 4-6 sentences

5. **OUTLOOK**
   - Manager's view on key markets, sectors, and themes
   - Any planned strategy shifts or positioning changes
   - Key risks and opportunities ahead
   - For global funds: regional outlook (US, Europe, EM, etc.)
   - For bond funds: rate outlook and duration positioning
   - Keep to 3-4 sentences

CRITICAL RULES:
- Use VERY SIMPLE language. No jargon. Explain finance terms in brackets immediately.
- Be SPECIFIC with names: mention actual securities, countries, indices when available.
- Do NOT limit to sectors alone. Include security selection, geographic, currency, style factor analysis.
- This is for GLOBAL funds - do not assume India-specific context unless the fund is Indian.
- Keep everything concise but DETAILED - it must fit on ONE page when formatted but packed with insight.

The output must be valid JSON in this exact structure:

{
  "fundInfo": {
    "fundName": "...",
    "amcName": "...",
    "fundCategory": "...",
    "fundManager": ["..."],
    "benchmark": "...",
    "aum": "...",
    "expenseRatio": "...",
    "inceptionDate": "...",
    "riskProfile": "..."
  },
  "fundManagerTeam": "...",
  "strategy": "...",
  "performanceAttribution": {
    "summary": "...",
    "topPerformers": [
      {"name": "...", "specifics": "...", "contribution": "...", "reason": "..."}
    ],
    "bottomPerformers": [
      {"name": "...", "specifics": "...", "contribution": "...", "reason": "..."}
    ]
  },
  "benchmarkComparison": "...",
  "outlook": "...",
  "quarter": "...",
  "year": "..."
}

Here is the factsheet data:

` + extractedText;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FundFacts AI',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('API request failed. The API key may be invalid or expired.');
      }
      throw new Error(errorData.error?.message || 'Failed to generate commentary. Please try again.');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI. Please try again.');
    }

    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const commentary: CommentaryData = JSON.parse(cleanContent);

    if (!commentary.fundInfo || !commentary.performanceAttribution || !commentary.strategy) {
      throw new Error('Invalid response structure from AI. Please try again.');
    }

    return commentary;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response. Please try again.');
    }
    throw error;
  }
}
