import express from "express";
import dotenv from "dotenv";
import connectDB from "./Config/db.js"; 
import AuthRoute from "./Routes/Auth.route.js";
import TodoRoute from "./Routes/Todo.route.js";
import FocusMate from "./Routes/FocusMate.route.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/auth',AuthRoute)
app.use('/api/todo',TodoRoute)
app.use('/api/focus',FocusMate)
// app.use('/api/user',UserRoute)

app.get("/", (req, res) => {
  res.send("TaskMate API is running ✅");
}); 


connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
});
