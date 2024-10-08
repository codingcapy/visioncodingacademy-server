/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: users route for http webserver app for Vision Coding Academy
 */

import express from "express";
import { createUser, sendResetEmail, updateUsername, updateUserPassword, verifyEmail } from "../controller";

const users = express.Router();
users.route('/').post(createUser);
users.route('/:userId').post(updateUserPassword);
users.route('/update/:userId').post(updateUsername);
users.route('/forgotpassword/:email').post(sendResetEmail);
users.route('/verify/:userId').get(verifyEmail);

export default users;