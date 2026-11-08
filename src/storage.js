const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "..", "data", "comments.json");

async function ensureFile() {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, "[]", "utf8");
    }
}

async function readComments() {
    await ensureFile();
    try {
        return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
    } catch {
        return [];
    }
}

async function writeComments(comments) {
    await ensureFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(comments, null, 2), "utf8");
}

module.exports = { readComments, writeComments };
