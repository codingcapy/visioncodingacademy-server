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
import jwt from "jsonwebtoken";
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

export async function validateUser(req: Request, res: Response) {
    const { email, password } = req.body;
    console.log(email)
    console.log(password)
    try {
        const queryResult = await db.select().from(users).where(eq(users.email, email));
        console.log(queryResult)
        const user = queryResult[0];
        console.log(user)
        if (!user) return res.json({ result: { user: null, token: null } });
        bcrypt.compare(password, user.password || "", function (err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send("Internal Server Error");
            }
            if (result) {
                const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "14 days" });
                return res.json({ result: { user, token } });
            } else {
                return res.json({ result: { user: null, token: null } });
            }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
}

export async function decryptToken(req: Request, res: Response) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(403).send("Header does not exist");
            return "";
        }
        const token = authHeader.split(" ")[1];
        const decodedUser = jwt.verify(token, "default_secret");
        //@ts-ignore
        const response = await db.select().from(users).where(eq(users.user_id, decodedUser.id));
        const user = response[0]
        res.json({ result: { user, token } });
    }
    catch (err) {
        res.status(401).json({ err });
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