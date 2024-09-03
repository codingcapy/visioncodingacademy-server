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
import nodemailer from "nodemailer";
import axios from "axios";
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
        await db.insert(users).values({ user_id, email, username, password: encrypted, created_at: timestamp })
        const userQuery = await db.select().from(users).where(eq(users.username, username))
        const user = userQuery[0]
        sendVerificationEmail(user)
        res.status(200).json({ success: true, message: "Success! Redirecting..." })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "Internal Server Error: could not create user" })
    }
}

export async function validateUser(req: Request, res: Response) {
    const { email, password } = req.body;
    try {
        const queryResult = await db.select().from(users).where(eq(users.email, email));
        const user = queryResult[0];
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

export async function updateUserPassword(req: Request, res: Response) {
    const userId = req.params.userId;
    const incomingPassword = req.body.password;
    if (incomingPassword.length > 80) {
        return res.json({ success: false, message: "password max char limit is 80" });
    }
    try {
        const encrypted = await bcrypt.hash(incomingPassword, saltRounds);
        await db.update(users).set({ password: encrypted.toString() }).where(eq(users.user_id, userId));
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error updating password" });
    }
}

export async function updateUsername(req: Request, res: Response) {
    const userId = req.params.userId;
    const incomingUsername = await req.body.username;
    if (incomingUsername.length > 32) {
        return res.json({ success: false, message: "Username max char limit is 32" });
    }
    try {
        const usernameQuery = await db.select().from(users).where(eq(users.username, incomingUsername))
        if (usernameQuery.length > 0) {
            return res.json({ success: false, message: "Username already exists" });
        };
        await db.update(users).set({ username: incomingUsername.toString() }).where(eq(users.user_id, userId));
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error updating username" });
    }
}

export async function createQuestion(req: Request, res: Response) {
    const { first_name, last_name, contact, content } = req.body
    const token = req.body.token
    const question_id = uuidv4();
    const now = new Date();
    const timestamp = now.toISOString();
    try {
        await db.insert(questions).values({ question_id, first_name, last_name, contact, message: content, created_at: timestamp })
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=6Lc6lSgqAAAAAGuz6cbWxpmEjkgaTRT_8v1sXkEQ&response=${token}`
        );
        sendFowardEmail(first_name, last_name, contact, content)
        res.status(200).json({ success: true, message: "Question created successfully" })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "Internal Server Error: could not create question" })
    }
}

export async function sendResetEmail(req: Request, res: Response) {
    const temp_password = uuidv4()
    const encrypted = await bcrypt.hash(temp_password, saltRounds);
    try {
        const email = req.body.email;
        const result = await db.select().from(users).where(eq(users.email, email));
        if (result.length < 1) {
            return res.json({ success: false, message: "User not found" })
        }
        const user = result[0];
        await db.update(users).set({ password: encrypted }).where(eq(users.email, email));
        sendPasswordEmail(email, user.username || "", temp_password);
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error sending recovery email" });
    }
}

export function sendPasswordEmail(email: string, username: string, temp_pass: string) {
    return new Promise((resolve, reject) => {
        var transporter = nodemailer.createTransport({
            service: "gmail",
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "noreply.visioncoding@gmail.com",
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mail_configs = {
            from: "noreply.visioncoding@gmail.com",
            to: email,
            subject: "Vision Coding Password Recovery",
            html: `<!DOCTYPE html>
    <html lang="en" >
    <head>
      <meta charset="UTF-8">
      <title>Vision Coding Academy - Password Recovery</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
    <!-- partial:index.partial.html -->
    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Vision Coding Academy</a>
        </div>
        <p style="font-size:1.1em">Hi ${username},</p>
        <p>We received a request to reset your password. Your temporary password is:</p>
        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${temp_pass}</h2>
        <p>Please ensure to change to a new, more secure password after logging in by navigating to your Profile.</p>
        <p style="font-size:0.9em;">Regards,<br />Vision Coding Academy</p>
        <hr style="border:none;border-top:1px solid #eee" />
        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
          <p>Vision Coding Academy</p>
        </div>
      </div>
    </div>
    <!-- partial -->
      
    </body>
    </html>`,
        };
        transporter.sendMail(mail_configs, function (error, info) {
            if (error) {
                console.log(error);
                return reject({ message: `An error has occured` });
            }
            return resolve({ message: "Email sent succesfuly" });
        });
    });
}

export async function verifyEmail(req: Request, res: Response) {
    const user_id = req.params.userId;
    try {
        await db.update(users).set({ email_verified: true }).where(eq(users.user_id, user_id));
        res.status(200).redirect('https://visioncoding.ca/verified')
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "Error sending verification email" })
    }
}

export function sendVerificationEmail(user: any) {
    return new Promise((resolve, reject) => {
        var transporter = nodemailer.createTransport({
            service: "gmail",
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "noreply.visioncoding@gmail.com",
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mail_configs = {
            from: "noreply.visioncoding@gmail.com",
            to: user.email,
            subject: "Vision Coding Email Verification",
            html: `<!DOCTYPE html>
    <html lang="en" >
    <head>
      <meta charset="UTF-8">
      <title>Vision Coding Academy - Email Verification</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
    <!-- partial:index.partial.html -->
    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="https://www.visioncoding.ca" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Vision Coding Academy</a>
        </div>
        <p style="font-size:1.1em">Hi ${user.username},</p>
        <p>Please verify your email</p>
        <a href='https://visioncodingacademy-server-production.up.railway.app/api/users/verify/${user.user_id}' style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">Verify</a>
        <p style="font-size:0.9em;">Regards,<br />Vision Coding Academy</p>
        <hr style="border:none;border-top:1px solid #eee" />
        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
          <p>Vision Coding Academy</p>
        </div>
      </div>
    </div>
    <!-- partial -->
      
    </body>
    </html>`,
        };
        transporter.sendMail(mail_configs, function (error, info) {
            if (error) {
                console.log(error);
                return reject({ message: `An error has occured` });
            }
            return resolve({ message: "Email sent succesfuly" });
        });
    });
}

export function sendFowardEmail(first_name: string, last_name: string, contact: string, content: string) {
    return new Promise((resolve, reject) => {
        var transporter = nodemailer.createTransport({
            service: "gmail",
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "noreply.visioncoding@gmail.com",
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mail_configs = {
            from: "noreply.visioncoding@gmail.com",
            to: "visioncodingca@gmail.com",
            subject: "Vision Coding Incoming User Question",
            html: `<!DOCTYPE html>
    <html lang="en" >
    <head>
      <meta charset="UTF-8">
      <title>Vision Coding Academy - Incoming User Question</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
    <!-- partial:index.partial.html -->
    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="https://www.visioncoding.ca" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Vision Coding Academy</a>
        </div>
        <p style="font-size:1.1em">First Name: ${first_name},</p>
        <p style="font-size:1.1em">Last Name: ${last_name},</p>
        <p style="font-size:1.1em">Contact: ${contact},</p>
        <p style="font-size:1.1em">Content: ${content},</p>
        <p style="font-size:0.9em;">Regards,<br />Vision Coding Academy</p>
        <hr style="border:none;border-top:1px solid #eee" />
        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
          <p>Vision Coding Academy</p>
        </div>
      </div>
    </div>
    <!-- partial -->
      
    </body>
    </html>`,
        };
        transporter.sendMail(mail_configs, function (error, info) {
            if (error) {
                console.log(error);
                return reject({ message: `An error has occured` });
            }
            return resolve({ message: "Email sent succesfuly" });
        });
    });
}