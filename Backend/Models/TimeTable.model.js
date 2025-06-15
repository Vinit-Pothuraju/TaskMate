import mongoose from "mongoose";


const SlotSchema = new mongoose.Schema({
  startTime: String,
  endTime: String,
  title: String,
  linkedTodoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Todo",
  },
  status: {
    type: String,
    enum: ["pending", "completed", "skipped"],
    default: "pending",
  },
});

// Now define TimeTableSchema and use SlotSchema
const TimeTableSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    slots: [SlotSchema],
  },
  { timestamps: true }
);


export const TimeTable = mongoose.model("TimeTable", TimeTableSchema);
