import express from "express";
import authController from "../controllers/authController.js";

const publicRouter = express.Router();
publicRouter.post('/api/register', authController.register);

export {
    publicRouter
}