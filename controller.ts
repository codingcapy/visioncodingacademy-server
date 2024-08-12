/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: controller for http webserver app for Vision Coding Academy
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, questions, users } from './connect';

export async function createUser(req: Request, res: Response) {
    const user_id = uuidv4();
    console.log(user_id)
    res.status(200).send("success")

}

export async function getUsers(req: Request, res: Response) {
    try {
        const result = await db.select().from(users)
        console.log(result)
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
        console.log(first_name, last_name, contact, content)
        const question_id = uuidv4();
        const now = new Date();
        const timestamp = now.toISOString();
        await db.insert(questions).values({ question_id, first_name, last_name, contact, message: content, created_at: timestamp })
        res.status(200).json({ success: true, message: "success" })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "Internal Server Error: could not create question" })
    }

}