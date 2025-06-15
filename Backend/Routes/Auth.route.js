import express from 'express'
import { signup,signin } from '../Controllers/Auth.controller.js';

const AuthRoute=express.Router();
AuthRoute.post('/register',signup)
AuthRoute.post('/login',signin)

export default AuthRoute;