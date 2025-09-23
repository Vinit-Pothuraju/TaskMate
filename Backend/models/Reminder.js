import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  when: {
    type: Date,
    required: true,
    index: true
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'daily'
    },
    customCron: String, // for custom patterns
    endDate: Date
  },
  delivered: {
    type: Boolean,
    default: false,
    index: true
  },
  deliveredAt: Date,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for reminder queries
reminderSchema.index({ userId: 1, when: 1, delivered: 1 });
reminderSchema.index({ when: 1, active: 1, delivered: 1 }); // for background job

export default mongoose.model('Reminder', reminderSchema);