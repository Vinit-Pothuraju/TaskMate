import { FocusMate } from "../Models/FocusMate.model";

export const startSession = async (req, res) => {
  try {
    const { userId, taskId, goal } = req.body;

    if (!userId || !goal) {
      return res.status(400).json({ success: false, message: "userId and goal are required." });
    }

    const session = await FocusMate.create({
      userId,
      taskId,
      goal
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("Start Session Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const { sessionId, completed = true, notes = '' } = req.body;

    const session = await FocusMate.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime - session.startTime) / 1000); 

    session.endTime = endTime;
    session.duration = duration;
    session.completed = completed;
    session.notes = notes;

    await session.save();

    res.status(200).json({ success: true, session });
  } catch (error) {
    console.error("End Session Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = await FocusMate.find({ userId }).sort({ startTime: -1 });
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error("Get Sessions Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await FocusMate.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
