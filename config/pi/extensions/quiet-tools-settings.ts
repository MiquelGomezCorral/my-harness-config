import { homedir } from "node:os"
import { join, resolve } from "node:path"

// Cuts long bash, grep, find and web-search output to save OpenCode Go tokens; full text goes to quiet-tools/.
// Reads stay whole on purpose: read cutting and its 120-line cap are off. Turn them on later if tool output
// still wastes too many tokens.
const quietDir = resolve(process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent"), "quiet-tools")
// Cut by size only (12,000 chars, about 3K tokens): many short lines are cheap, and a re-read would cost more.
process.env.QUIET_TOOLS_MAX_LINES ||= "1000000"
process.env.QUIET_TOOLS_COMPACT_READ ||= "false"
process.env.QUIET_TOOLS_COMPACT_SUBAGENT ||= "false"
process.env.QUIET_TOOLS_ARTIFACT_DIR ||= join(quietDir, "outputs")
process.env.QUIET_TOOLS_INDEX ||= join(quietDir, "index.jsonl")

export default function () {}
