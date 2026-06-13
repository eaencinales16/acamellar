require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callClaude(systemPrompt, userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];
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

async function tailorResume(resume, jobListing, company, position) {
  const system = `You are an expert resume writer and career coach. Your job is to tailor resumes to specific job listings, highlighting the most relevant experience and skills while keeping all information truthful. Format the resume in clean plain text suitable for copy-pasting or PDF conversion.`;
  const prompt = `Please tailor the following resume for the ${position} role at ${company}.

JOB LISTING:
${jobListing}

ORIGINAL RESUME:
${resume}

Provide a tailored resume that:
1. Reorders and emphasizes experiences most relevant to this role
2. Uses keywords from the job listing naturally
3. Adjusts the professional summary/objective to match the role
4. Keeps all facts truthful — only reframe, don't fabricate
5. Is formatted cleanly in plain text`;

  return callAI(system, prompt);
}

async function generateCoverLetter(resume, jobListing, company, position, userName) {
  const system = `You are an expert cover letter writer. Write compelling, personalized cover letters that connect the candidate's experience to the specific role. Avoid generic phrases. Sound human and enthusiastic.`;
  const prompt = `Write a cover letter for ${userName || 'the candidate'} applying for ${position} at ${company}.

JOB LISTING:
${jobListing}

CANDIDATE RESUME:
${resume}

Write a 3-4 paragraph cover letter that:
1. Opens with a specific hook related to the company or role
2. Connects 2-3 key experiences to the job requirements
3. Shows enthusiasm for this specific company
4. Closes with a clear call to action
Format as a proper business letter.`;

  return callAI(system, prompt);
}

async function chatAboutJob(jobListing, company, position, resume, conversationHistory, userMessage) {
  const system = `You are a career coach and interview prep expert helping a job seeker who is applying for ${position} at ${company}. You have access to their resume and the job listing. Be specific, practical, and encouraging. Help them prepare for interviews, understand the role, research the company, and strategize their application.

JOB LISTING:
${jobListing || 'Not provided'}

CANDIDATE RESUME:
${resume || 'Not provided'}`;

  const history = conversationHistory.map(m => ({
    role: m.role,
    content: m.content
  }));

  return callAI(system, userMessage, history);
}

module.exports = { tailorResume, generateCoverLetter, chatAboutJob, callAI };
