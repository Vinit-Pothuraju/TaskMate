import mongoose from "mongoose";

const TodoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    dueDate: {
      type: Date,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"], 
    },
  },
  { timestamps: true } 
);

export const Todo = mongoose.model("Todo", TodoSchema);
