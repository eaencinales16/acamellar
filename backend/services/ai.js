require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Shared persona — every AI surface evaluates and writes through this lens.
const RECRUITER_PERSONA = `You are a seasoned senior recruiter and hiring manager at a Fortune 500 company with 15+ years of experience screening candidates and running interview loops. You know exactly what makes a resume survive ATS keyword filters and a 6-second human skim, what makes a hiring committee say yes, and where candidates undersell themselves. You are direct, strategic, and hold the candidate to the bar a top-tier company actually uses — while being encouraging and constructive.`;

// Build a "voice" instruction block from the user's saved style preferences + sample docs.
function buildVoiceContext(writingStyle, examples = []) {
  let out = '';
  if (writingStyle && writingStyle.trim()) {
    out += `\n\nCANDIDATE'S WRITING STYLE & PREFERENCES (match this voice):\n${writingStyle.trim()}`;
  }
  if (examples && examples.length) {
    out += `\n\nSAMPLE DOCUMENTS THE CANDIDATE WROTE (mirror this tone, structure, and phrasing — this is their authentic voice):`;
    examples.forEach((ex, i) => {
      out += `\n\n--- EXAMPLE ${i + 1}${ex.label ? ` (${ex.label})` : ''} ---\n${ex.content}`;
    });
  }
  return out;
}

async function callClaude(systemPrompt, userMessage, conversationHistory = []) {
  const messages = [...conversationHistory, { role: 'user', content: userMessage }];
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages
  });
  return response.content[0].text;
}

async function callGemini(systemPrompt, userMessage) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = systemPrompt ? `${systemPrompt}\n\n${userMessage}` : userMessage;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callAI(systemPrompt, userMessage, conversationHistory = []) {
  try {
    return await callClaude(systemPrompt, userMessage, conversationHistory);
  } catch (err) {
    console.error('Claude failed, falling back to Gemini:', err.message);
    return await callGemini(systemPrompt, userMessage);
  }
}

async function tailorResume(resume, jobListing, company, position, opts = {}) {
  const { writingStyle, examples } = opts;
  const system = `${RECRUITER_PERSONA}

Your task: rewrite the candidate's resume so that, if it landed on your desk for the ${position} role at ${company}, it would make your shortlist. Keep every fact truthful — reframe and reprioritize, never fabricate. Output clean plain text suitable for copy-paste or PDF.${buildVoiceContext(writingStyle, examples)}`;

  const prompt = `Tailor this resume for the ${position} role at ${company}.

JOB LISTING:
${jobListing}

CURRENT RESUME:
${resume}

As the recruiter for this req, produce a tailored resume that:
1. Leads with the experience and impact most relevant to THIS role
2. Mirrors the job listing's keywords and competencies naturally (so it clears ATS)
3. Rewrites bullet points to be outcome- and metric-driven (action verb + what + quantified result)
4. Cuts or de-emphasizes anything irrelevant to this role
5. Has a punchy professional summary targeted to this exact position
6. Keeps every claim truthful — only reframe what's already there
Return only the tailored resume in clean plain text.`;

  return callAI(system, prompt);
}

async function generateCoverLetter(resume, jobListing, company, position, userName, opts = {}) {
  const { writingStyle, examples } = opts;
  const system = `${RECRUITER_PERSONA}

Your task: write a cover letter for this candidate that would genuinely move you to advance them for the ${position} role at ${company}. You know generic letters get discarded in seconds — make it specific, confident, and human.${buildVoiceContext(writingStyle, examples)}`;

  const prompt = `Write a cover letter for ${userName || 'the candidate'} applying to ${position} at ${company}.

JOB LISTING:
${jobListing}

CANDIDATE RESUME:
${resume}

As the recruiter for this req, write a 3-4 paragraph letter that:
1. Opens with a specific hook tied to ${company} or the role (no "I am writing to apply for...")
2. Connects 2-3 concrete, quantified accomplishments to the job's top requirements
3. Shows genuine, researched enthusiasm for THIS company specifically
4. Closes with a confident, forward-looking call to action
Format as a proper business letter. Match the candidate's authentic voice.`;

  return callAI(system, prompt);
}

async function chatAboutJob(jobListing, company, position, resume, conversationHistory, userMessage, opts = {}) {
  const { writingStyle, examples } = opts;
  const system = `${RECRUITER_PERSONA}

You are now coaching this candidate on the ${position} role at ${company} — giving them the inside view a Fortune 500 recruiter has but rarely shares. Help with interview prep, what the hiring committee actually weighs, how to frame their experience, salary/negotiation, and red/green flags. Be specific and candid; reference their resume and the listing.

JOB LISTING:
${jobListing || 'Not provided'}

CANDIDATE RESUME:
${resume || 'Not provided'}${buildVoiceContext(writingStyle, examples)}`;

  const history = conversationHistory.map(m => ({ role: m.role, content: m.content }));
  return callAI(system, userMessage, history);
}

async function chatGeneral(profile, jobSearchContext, conversationHistory, userMessage, opts = {}) {
  const { examples } = opts;
  const system = `${RECRUITER_PERSONA}

You are ${profile?.name || 'the job seeker'}'s personal recruiting strategist and accountability partner, talking with them from their dashboard. Bring the Fortune 500 recruiter lens to everything: what hiring teams actually look for, how to prioritize their pipeline, where they're leaving opportunities on the table, and how to keep aggressive momentum. Be specific, candid, and motivating. Use their real job-search data below.

CURRENT JOB SEARCH SNAPSHOT:
${jobSearchContext}

CANDIDATE RESUME:
${profile?.resume || 'Not provided yet — push them to add it in Profile.'}${profile?.writing_style ? `\n\nCANDIDATE'S WRITING STYLE:\n${profile.writing_style}` : ''}${buildVoiceContext(null, examples)}

Keep responses focused and actionable. Use markdown for structure when helpful.`;

  const history = conversationHistory.map(m => ({ role: m.role, content: m.content }));
  return callAI(system, userMessage, history);
}

module.exports = { tailorResume, generateCoverLetter, chatAboutJob, chatGeneral, callAI };
