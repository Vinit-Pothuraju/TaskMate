import AISuggestion from '../models/AISuggestion.js';
import Task from '../models/Task.js';
import FocusSession from '../models/FocusSession.js';
import { validationResult } from 'express-validator';
import OpenAI from 'openai';

// Initialize openai as null. We will create the instance only when needed.
let openai = null;

// A helper function to get the initialized OpenAI client.
// This ensures the client is created only once and only if the API key exists.
const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// --- END: MODIFIED CODE ---

const buildPrompt = (userData) => {
  // ... (this function remains the same)
  const { incompleteTasks, focusHistory, todayDate } = userData;

  let prompt = `You are a productivity assistant helping with daily task prioritization.

Today's Date: ${todayDate}

User Context:
- Incomplete Tasks: ${incompleteTasks.length} tasks remaining
- Recent Focus History: ${focusHistory.totalSessions} sessions in last 7 days
- Average Session Length: ${focusHistory.avgDuration} minutes

Incomplete Tasks:
${incompleteTasks.map(task => 
  `- ${task.title} (Priority: ${task.priority}/5, Category: ${task.category || 'None'}, Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'})`
).join('\n')}

Recent Focus Patterns:
${focusHistory.topCategories.map(cat => 
  `- ${cat._id}: ${cat.totalTime} minutes across ${cat.sessions} sessions`
).join('\n')}

Please suggest 3-5 tasks for today, prioritized by:
1. Urgency (due dates, overdue items)
2. Importance (high priority tasks)
3. Focus momentum (categories user has been working on)
4. Task size (mix of quick wins and deep work)

For each suggestion, provide:
- Task title (if existing task) or suggested new task
- Priority score (1-10)
- Rationale (1-2 sentences)
- Estimated duration in minutes

Respond in JSON format:
{
  "suggestions": [
    {
      "title": "Task name",
      "taskId": "existing_task_id_or_null",
      "priority": 8,
      "rationale": "Why this task should be prioritized today",
      "estimatedDuration": 45
    }
  ]
}`;
  return prompt;
};

export const getSuggestions = async (req, res) => {
  try {
    // --- ADD THIS CHECK ---
    const client = getOpenAIClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. OPENAI_API_KEY is missing.'
      });
    }

    const { date } = req.query;
    // ... (rest of the function is the same)
    const userId = req.userId;
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let suggestion = await AISuggestion.findOne({
      userId,
      date: targetDate
    }).populate('suggestions.taskId', 'title category priority');

    if (suggestion) {
      return res.json({
        success: true,
        data: { suggestion }
      });
    }

    const generatedSuggestion = await generateSuggestions(userId, targetDate);
    
    res.json({
      success: true,
      data: { suggestion: generatedSuggestion }
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI suggestions'
    });
  }
};

export const generateSuggestions = async (userId, date = new Date()) => {
  try {
    // --- REPLACED THE ORIGINAL CHECK WITH THIS ---
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured. Cannot generate suggestions.');
    }
    
    // ... (rest of the function is the same)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const [incompleteTasks, focusHistory] = await Promise.all([
      Task.find({
        userId,
        completed: false,
        archived: false
      }).sort({ priority: -1, dueDate: 1 }).limit(20),
      FocusSession.aggregate([
        // ... aggregation pipeline
      ])
    ]);

    // ... (data processing logic)

    // Call OpenAI using the initialized client
    const response = await client.chat.completions.create({
      // ... parameters
    });

    // ... (rest of the function is the same)

  } catch (error) {
    console.error('Generate suggestions error:', error);
    throw error;
  }
};

export const provideFeedback = async (req, res) => {
  // ... (no changes needed in this function)
};