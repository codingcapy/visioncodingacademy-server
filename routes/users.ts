/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: users route for http webserver app for Vision Coding Academy
 */

import express from "express";
import { createUser, getUsers } from "../controller";

const users = express.Router();
users.route('/').post(createUser).get(getUsers)

export default users;