import mongoose from "mongoose";
const FocusMatemodel = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: false 
    },
    goal: {
      type: String,
      required: true,
      trim: true
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, 
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true 
  }
);

 export const FocusMate = mongoose.model('FocusMate', FocusMatemodel);
