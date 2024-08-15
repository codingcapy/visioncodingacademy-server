/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: http webserver app for Vision Coding Academy
 */

console.log('Hello')
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import users from "./routes/users";
import questions from "./routes/questions";
import user from "./routes/user";

dotenv.config();
const app = express();
const port = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("welcome"));
app.use("/api/users/", users)
app.use("/api/user/", user)
app.use("/api/questions/", questions)

app.listen(port, () => console.log(`Server listening on port: ${port}`));
