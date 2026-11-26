import { httpRouter } from "convex/server";
import { createAuth } from "./auth.js";
import { createClient } from "@convex-dev/better-auth";
import { components } from "./_generated/api";

const http = httpRouter();
const auth = createClient(components.betterAuth, { verbose: true });
auth.registerRoutes(http, createAuth);

export default http;
