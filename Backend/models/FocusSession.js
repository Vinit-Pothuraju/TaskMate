import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  startAt: {
    type: Date,
    required: true,
    index: true
  },
  endAt: {
    type: Date,
    required: true
  },
  durationSec: {
    type: Number,
    required: true,
    min: 0
  },
  interrupted: {
    type: Boolean,
    default: false
  },
  sessionType: {
    type: String,
    enum: ['work', 'shortBreak', 'longBreak'],
    default: 'work'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for analytics queries
focusSessionSchema.index({ userId: 1, startAt: -1 });
focusSessionSchema.index({ userId: 1, taskId: 1, startAt: -1 });
focusSessionSchema.index({ taskId: 1, startAt: -1 });

// Update task's actual duration when session is saved
focusSessionSchema.post('save', async function() {
  if (this.taskId && this.sessionType === 'work') {
    const Task = mongoose.model('Task');
    const totalDuration = await mongoose.model('FocusSession').aggregate([
      { 
        $match: { 
          taskId: this.taskId, 
          sessionType: 'work' 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$durationSec' } 
        } 
      }
    ]);

    const totalMinutes = Math.round((totalDuration[0]?.total || 0) / 60);
    await Task.findByIdAndUpdate(this.taskId, { 
      actualDuration: totalMinutes 
    });
  }
});

export default mongoose.model('FocusSession', focusSessionSchema);