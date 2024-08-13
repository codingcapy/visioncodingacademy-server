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
import { eq } from 'drizzle-orm';
import bcrypt from "bcrypt"
dotenv.config()

const saltRounds = 10;

export async function createUser(req: Request, res: Response) {
    const { email, username, password } = req.body;
    if (username.length > 32) {
        return res.json({ success: false, message: "Username max char limit is 32" });
    }
    if (password.length > 80) {
        return res.json({ success: false, message: "password max char limit is 80" });
    }
    if (email.length > 255) {
        return res.json({ success: false, message: "email max char limit is 255" });
    }
    try {
        const usernameQuery = await db.select().from(users).where(eq(users.username, username))
        if (usernameQuery.length > 0) {
            return res.json({ success: false, message: "Username already exists" });
        };
        const emailQuery = await db.select().from(users).where(eq(users.email, email))
        if (emailQuery.length > 0) {
            return res.json({ success: false, message: "An account associated with this email already exists" });
        };
        const encrypted = await bcrypt.hash(password, saltRounds);
        const user_id = uuidv4();
        const now = new Date();
        const timestamp = now.toISOString();
        await db.insert(users).values({ user_id, email, username, password:encrypted, created_at: timestamp })
        res.status(200).json({ success: true, message: "Success! Redirecting..." })
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