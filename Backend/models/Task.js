import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    index: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
    index: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: Date,
  archived: {
    type: Boolean,
    default: false,
    index: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: 0
  },
  actualDuration: {
    type: Number, // calculated from focus sessions
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
taskSchema.index({ userId: 1, completed: 1, archived: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, priority: 1, createdAt: -1 });
taskSchema.index({ userId: 1, category: 1, completed: 1 });

// Update completedAt when task is marked complete
taskSchema.pre('save', function(next) {
  if (this.isModified('completed')) {
    if (this.completed) {
      this.completedAt = new Date();
    } else {
      this.completedAt = undefined;
    }
  }
  next();
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && !this.completed;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export default mongoose.model('Task', taskSchema);
