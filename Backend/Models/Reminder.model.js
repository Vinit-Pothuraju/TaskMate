import mongoose from "mongoose";


const ReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    remindAt:{
      type:Date,
      required:true
    },
    message: {
      type: String, 
      required: true,
    },
    isSent:{
      type:Boolean,
      default:false,
  
    },
  },
  { timestamps: true }
);


export const Reminder = mongoose.model("Reminder", ReminderSchema);
