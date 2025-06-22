import { Todo } from "../Models/Todos.model.js";


export const getAllTodos = async (req, res) => {
  try {
    const userId = req.user._id;

    const todos = await Todo.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Todos fetched successfully",
      todos
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};




export const createTodo = async (req, res) => {
    try {
        const { title, description, dueDate, completed = false, priority = 'medium' } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const newTodo = new Todo({
            userId: req.user._id,
            title,
            description,
            dueDate,
            completed,
            priority
        });

        await newTodo.save();

        res.status(201).json({ message: 'Todo Created', todo: newTodo });

    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const updateTodo = async (req, res) => {
  const todoId = req.params.id;
  const userId = req.user._id;

  const updateData = req.body; 

  try {
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: todoId, userId }, 
      { $set: updateData },
      
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: "Todo not found or unauthorized" });
    }

    res.status(200).json({
      message: "Todo updated successfully",
      todo: updatedTodo
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
  
export const deleteTodo = async (req, res) => {
  const todoId = req.params.id;
  const userId = req.user._id;

  try {
    const deletedTodo = await Todo.findOneAndDelete({ _id: todoId, userId });

    if (!deletedTodo) {
      return res.status(404).json({ message: "Todo not found or unauthorized" });
    }

    res.status(200).json({
      message: "Todo deleted successfully",
      todoId: deletedTodo._id, 
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
