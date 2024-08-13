/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: controller for http webserver app for Vision Coding Academy
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, questions, users } from './connect';
import dotenv from "dotenv";
dotenv.config()

export async function createUser(req: Request, res: Response) {
    try {
        const { email, username, password } = req.body;
        const user_id = uuidv4();
        const now = new Date();
        const timestamp = now.toISOString();
        await db.insert(users).values({ user_id, email, username, password, created_at: timestamp })
        res.status(200).json({ success: true, message: "User created successfully" })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "Internal Server Error: could not create user" })
    }
}

export async function getUsers(req: Request, res: Response) {
    try {
        const result = await db.select().from(users)
        res.status(200).send("success2")
    }
    catch (err) {
        console.log(err)
        res.status(500).send("error")
    }
}

export async function createQuestion(req: Request, res: Response) {
    try {
        const { first_name, last_name, contact, content } = req.body
        const question_id = uuidv4();
        const now = new Date();
        const timestamp = now.toISOString();
        await db.insert(questions).values({ question_id, first_name, last_name, contact, message: content, created_at: timestamp })
        res.status(200).json({ success: true, message: "Question created successfully" })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "Internal Server Error: could not create question" })
    }

}