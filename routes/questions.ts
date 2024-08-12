
import express from "express";
import { createQuestion } from "../controller";

const questions = express.Router();
questions.route('/').post(createQuestion);

export default questions;