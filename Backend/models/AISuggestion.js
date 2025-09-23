import mongoose from 'mongoose';

const aiSuggestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  suggestions: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Suggestion title cannot exceed 200 characters']
    },
    rationale: {
      type: String,
      maxlength: [500, 'Rationale cannot exceed 500 characters']
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    estimatedDuration: Number // in minutes
  }],
  promptUsed: String, // for debugging/improving prompts
  modelUsed: {
    type: String,
    default: 'gpt-4o-mini'
  },
  tokensUsed: Number,
  generationDuration: Number, // milliseconds
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    helpful: Boolean
  }
}, {
  timestamps: true
});

// Ensure one suggestion per user per day
aiSuggestionSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('AISuggestion', aiSuggestionSchema);