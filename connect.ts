/*
author: Paul Kim
date: August 10, 2024
Version: 1.0.0
description: postgreSQL db connection and models for http webserver app for Vision Coding Academy
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = pg.Pool;
