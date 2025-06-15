import express from "express";
import dotenv from "dotenv";
import connectDB from "./Config/db.js"; 
import AuthRoute from "./Routes/Auth.route.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/auth',AuthRoute)
// app.use('/api/user',UserRoute)

app.get("/", (req, res) => {
  res.send("CheckMate API is running ✅");
}); 


connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
});
