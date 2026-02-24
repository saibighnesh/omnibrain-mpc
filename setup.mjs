#!/usr/bin/env node

/**
 * MCP Memory Server — Interactive Setup Wizard
 * 
 * Guides the user through setting up the server, Firebase credentials,
 * the web dashboard environment variables, and client configs.
 */

import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as readline from "readline/promises";

const serverPath = resolve("dist/index.js").replace(/\\/g, "/");

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

const CHECK = `${GREEN}✓${RESET}`;
const CROSS = `${RED}✗${RESET}`;
const ARROW = `${BLUE}→${RESET}`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const args = process.argv.slice(2);
const isNonInteractive = args.includes("--non-interactive");
const userIdArg = args.find(a => a.startsWith("--user-id="));
const providedUserId = userIdArg ? userIdArg.split("=")[1] : null;

async function prompt(question, defaultValue = "") {
    if (isNonInteractive) return defaultValue;
    const answer = await rl.question(`${BOLD}${question}${RESET}${defaultValue ? ` ${DIM}(${defaultValue})${RESET}` : ''}: `);
    return answer.trim() || defaultValue;
}

console.log(`
${BOLD}${BLUE}╔════════════════════════════════════════════════╗
║       MCP Memory Server — Interactive Setup    ║
╚════════════════════════════════════════════════╝${RESET}
`);

async function main() {
    // 1. Get User ID
    console.log(`${BOLD}1. Identity${RESET}`);
    const defaultUserId = providedUserId || process.env.USERNAME || process.env.USER || "default-user";
    const userId = await prompt("Enter your User ID for the MCP Server", defaultUserId);
    console.log(`  ${CHECK} Using User ID: ${CYAN}${userId}${RESET}\n`);

    // 2. Check for serviceAccountKey.json
    console.log(`${BOLD}2. Firebase Admin SDK${RESET}`);
    let hasServiceKey = existsSync("serviceAccountKey.json");
    if (!hasServiceKey) {
        console.log(`${YELLOW}⚠ Missing serviceAccountKey.json${RESET}`);
        console.log(`  The MCP server requires a Firebase Service Account key to access the database.`);
        console.log(`  1. Go to ${CYAN}https://console.firebase.google.com${RESET}`);
        console.log(`  2. Project Settings → Service Accounts → Generate New Private Key`);
        console.log(`  3. Save the file as ${BOLD}serviceAccountKey.json${RESET} in this folder.`);
        
        while (!hasServiceKey) {
            const answer = await prompt("Press Enter when you have saved the file (or type 'skip' to ignore)");
            if (answer.toLowerCase() === 'skip') {
                console.log(`  ${YELLOW}Skipping serviceAccountKey.json check. The server will crash if run without it.${RESET}\n`);
                break;
            }
            hasServiceKey = existsSync("serviceAccountKey.json");
            if (!hasServiceKey) {
                console.log(`  ${RED}File not found. Please ensure it's named exactly 'serviceAccountKey.json' in the root directory.${RESET}`);
            } else {
                console.log(`  ${CHECK} Found serviceAccountKey.json!\n`);
            }
        }
    } else {
        console.log(`  ${CHECK} Found serviceAccountKey.json\n`);
    }

    // 3. Setup Web Dashboard (.env.local)
    console.log(`${BOLD}3. Web Dashboard Configuration${RESET}`);
    const setupDashboard = await prompt("Do you want to configure the Web Dashboard environment? (y/N)", "N");
    if (setupDashboard.toLowerCase() === 'y' || setupDashboard.toLowerCase() === 'yes') {
        console.log(`\n  Please enter your Firebase Client Configuration (found in Project Settings → General → Web App):`);
        const apiKey = await prompt("  NEXT_PUBLIC_FIREBASE_API_KEY");
        const authDomain = await prompt("  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
        const projectId = await prompt("  NEXT_PUBLIC_FIREBASE_PROJECT_ID");
        const storageBucket = await prompt("  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
        const messagingSenderId = await prompt("  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
        const appId = await prompt("  NEXT_PUBLIC_FIREBASE_APP_ID");

        const envLocalContent = `NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${appId}
`;
        writeFileSync("dashboard/.env.local", envLocalContent);
        console.log(`\n  ${CHECK} Saved to dashboard/.env.local\n`);
    } else {
        console.log(`  ${DIM}Skipped dashboard configuration.${RESET}\n`);
    }

    // 4. Build Server
    console.log(`${BOLD}4. Building Server${RESET}`);
    const hasDist = existsSync("dist/index.js");
    if (!hasDist) {
        console.log(`  ${YELLOW}Building server...${RESET}`);
        const { execSync } = await import("child_process");
        try {
            execSync("npm run build", { stdio: "inherit" });
            console.log(`  ${CHECK} Build complete!\n`);
        } catch {
            console.log(`  ${CROSS} Build failed — run ${BOLD}npm run build${RESET} manually\n`);
        }
    } else {
        console.log(`  ${CHECK} Server is already built (${DIM}dist/index.js${RESET})\n`);
    }

    // 5. Output Configs
    console.log(`${BOLD}5. MCP Client Configuration${RESET}`);
    const mcpConfig = {
        mcpServers: {
            "memory": {
                command: "node",
                args: [serverPath, `--user-id=${userId}`]
            }
        }
    };
    const configJSON = JSON.stringify(mcpConfig, null, 2);

    console.log(`  ${ARROW} Add this to your MCP Client's configuration file (e.g., Claude Desktop, Cursor, VS Code):\n`);
    for (const line of configJSON.split("\n")) {
        console.log(`    ${GREEN}${line}${RESET}`);
    }
    console.log(`\n  Alternatively, for Claude Code run:`);
    console.log(`    ${CYAN}claude mcp add memory -- node ${serverPath} --user-id=${userId}${RESET}\n`);

    console.log(`${BOLD}${GREEN}Setup Complete!${RESET} Restart your MCP client to start using your memory server.`);
    
    rl.close();
}

main().catch(console.error);
