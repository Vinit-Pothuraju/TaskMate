import express from 'express'


const TodoRoute=express.Router();
TodoRoute.get('/Todos',AllTodos)
TodoRoute.post('/Todos',createTodo)
TodoRoute.put('/Todos',updateTodo)
TodoRoute.delete('/Todos',DeleteTodo)



export default TodoRoute;