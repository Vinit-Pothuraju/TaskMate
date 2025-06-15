import mongoose from "mongoose";

const userSchema= new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true,
    unique:true
  },
  phoneNumber:{
    type:Number,
    required:true,
  },
  password:{
    type:String,
    required:true
  },
  createdAt:{
    type:Date,
    default:Date.now

  }
})

export const User=mongoose.model("User",userSchema);