/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: postgreSQL db connection and models for http webserver app for Vision Coding Academy
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { boolean, pgTable, varchar } from "drizzle-orm/pg-core";
import dotenv from "dotenv"
dotenv.config()

const Pool = pg.Pool;

const connectionString = process.env.CONNECTIONSTRING

export const pool = new Pool(
    {
        connectionString
    }
)

export const db = drizzle(pool)

export const users = pgTable('users', {
    user_id: varchar('user_id').primaryKey(),
    email: varchar('email'),
    username: varchar('username'),
    password: varchar('password'),
    created_at: varchar('created_at'),
    active: boolean('active').default(true)
})