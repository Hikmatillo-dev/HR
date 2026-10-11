// Ixtiyoriy AI chuqur tahlil (Claude API). Kalit bo'lmasa sayt va bot qoidalar tizimi bilan ishlayveradi.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import '../js/analyzer.js';

const { analyze } = globalThis.IshQalqon;

// Kalit muhit o'zgaruvchisidan (ANTHROPIC_API_KEY) yoki `ant auth login` profilidan olinadi
export const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.IQ_AI === '1');
const client = aiEnabled ? new Anthropic() : null;

const AiResult = z.object({
  risk_level: z.enum(['low', 'medium', 'high']),
  summary: z.string(),
  red_flags: z.array(z.object({ flag: z.string(), explanation: z.string() })),
  advice: z.string(),
  neutral_rewrite: z.string()
});

const SYSTEM = `You analyze job postings collected from Telegram channels in Uzbekistan to protect job seekers.
Posts may be in Uzbek (Latin or Cyrillic) or Russian.

Assess two things:
1. Fraud and trafficking risk: upfront fees (documents, uniform, training, medical check), requests for card numbers or SMS codes, passport retention, "guaranteed" visas, pyramid or crypto schemes, unrealistic pay for no experience, hidden job details, urgency pressure, suspicious links.
2. Discrimination: requirements based on age, gender, appearance, marital status, ethnicity or residence registration (propiska) that are not genuine job requirements.

A rule-based pre-check result is included for context. It can miss things or over-flag; use your own judgment.

Write every text field in Uzbek (Latin script), plainly, for a job seeker without legal training.
- summary: 2–3 sentences.
- red_flags: each concrete problem found in the post; empty list if none.
- advice: one practical next step for the job seeker.
- neutral_rewrite: if the post is discriminatory or lacks key facts but is not fraudulent, rewrite it as a fair, transparent posting, keeping the employer's facts and never inventing salary, company or contacts (mark missing facts as [ko'rsating]); otherwise return an empty string.`;

export async function aiAnalyze(text) {
  if (!client) throw new Error("AI o'chirilgan: ANTHROPIC_API_KEY o'rnatilmagan");
  const pre = analyze(text);
  const hint = {
    score: pre.score, level: pre.level,
    signals: pre.scam.map(s => s.label), discrimination: pre.discrimination.map(d => d.label),
    transparency: pre.transparency.score
  };

  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      // Xavfsizlik filtri so'rovni rad etsa, server boshqa modelda qayta ishlaydi
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(AiResult) },
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `<posting>\n${text.slice(0, 6000)}\n</posting>\n<rule_check>${JSON.stringify(hint)}</rule_check>`
      }]
    });
    if (response.stop_reason === 'refusal') throw new Error("AI bu matnni tahlil qilishdan bosh tortdi");
    if (!response.parsed_output) throw new Error("AI javobini o'qib bo'lmadi");
    return response.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error("API kaliti noto'g'ri");
    if (err instanceof Anthropic.RateLimitError) throw new Error("So'rovlar ko'payib ketdi, birozdan keyin urinib ko'ring");
    if (err instanceof Anthropic.APIConnectionError) throw new Error("AI serveriga ulanib bo'lmadi");
    if (err instanceof Anthropic.APIError) throw new Error(`AI xatosi (${err.status})`);
    throw err;
  }
}
