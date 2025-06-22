import express from 'express';
import { ensureAuthenticated } from '../Middlewares/Auth.middleware.js';

import { createTodo, deleteTodo, getAllTodos, updateTodo } from '../Controllers/Todos.controller.js';

const TodoRoute = express.Router();


TodoRoute.get('/todos', ensureAuthenticated, getAllTodos);            
TodoRoute.post('/todos', ensureAuthenticated, createTodo);         
TodoRoute.put('/todos/:id', ensureAuthenticated, updateTodo);     
TodoRoute.delete('/todos/:id', ensureAuthenticated, deleteTodo);  

export default TodoRoute;
