import { createClient } from "@convex-dev/better-auth";
import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { createAuth } from "./auth.js";

const http = httpRouter();
const auth = createClient(components.betterAuth, { verbose: true });
auth.registerRoutes(http, createAuth);

export default http;
