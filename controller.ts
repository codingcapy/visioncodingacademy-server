/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: controller for http webserver app for Vision Coding Academy
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, users } from './connect';

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

}