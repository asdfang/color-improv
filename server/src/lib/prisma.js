import "dotenv/config"; // if not in index.js
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { requireEnv } from '../utils/env.js';

const connectionString = requireEnv('DATABASE_URL');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };