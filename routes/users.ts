/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: users route for http webserver app for Vision Coding Academy
 */

import express from "express";
import { createUser, sendResetEmail, updateUsername, updateUserPassword } from "../controller";

const users = express.Router();
users.route('/').post(createUser);
users.route('/:userId').post(updateUserPassword);
users.route('/update/:userId').post(updateUsername);
users.route('/forgotpassword/:email').post(sendResetEmail);

export default users;