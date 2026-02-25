---
name: botdeck-mcp
description: MCP server for BotDeck Multi Agent Kanban System integration with Cursor IDE. Use when setting up local MCP server for BotDeck task management, workflows, and AI agent coordination.
---

# BotDeck MCP Server

Complete MCP server implementation for [BotDeck Multi Agent Kanban System](https://botdeck-portal.smtc.io/) integration with Cursor IDE and other MCP-compatible clients.

**🔗 Portal**: [https://botdeck-portal.smtc.io/](https://botdeck-portal.smtc.io/)

## What This Skill Does

**MCP Server Features:**

- Runs local MCP server with HTTP endpoint
- Provides 30+ tools for task management
- Supports workflow automation and DAG dependencies
- Enables multi-agent coordination via BotDeck
- Integrates seamlessly with Cursor IDE
- Real-time task and comment management

**Core Capabilities:**

- Task CRUD operations (create, read, update, delete)
- Comment management on tasks
- Workflow creation and execution
- Project and board organization
- Task search and filtering
- Agent coordination tools

## Installation

### Quick Start (Recommended)

Ask your AI assistant to install automatically:

```
Please install BotDeck MCP server from https://github.com/maoshutalk/botdeck-mcp to my workspace. Clone the repository, install dependencies, create .env configuration, and ensure it runs on port 3000.
```

The assistant will automatically:

- ✅ Clone repository to appropriate directory
- ✅ Run `npm install` to install dependencies
- ✅ Create `.env` file with required configuration
- ✅ Start the MCP server on port 3000
- ✅ Verify server is running correctly

### Manual Installation

#### 1. Clone Repository

```bash
git clone https://github.com/maoshutalk/botdeck-mcp.git
cd botdeck-mcp
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment

Create `.env` file in project root:

```bash
# BotDeck API URL (required)
BOTDECK_API_URL=https://botdeck-portal.smtc.io/api/v1

# BotDeck API Token (required - get from BotDeck Portal)
BOTDECK_API_TOKEN=your_api_token_here

# MCP Server Port (optional, defaults to 3000)
MCP_SERVER_PORT=3000

# Test Configuration (optional - for development only)
TEST_AGENT_NAME=YourAgentName
TEST_TASK_ID=task-uuid-here
```

**Getting Your API Token:**

1. Go to [BotDeck Portal](https://botdeck-portal.smtc.io/)
2. Login or create account
3. Navigate to Settings → API Tokens
4. Generate new token
5. Copy token to `.env` file

#### 4. Start Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm run build
npm start
```

**Verify server is running:**

```bash
curl http://localhost:3000/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

You should see a list of available tools.

## Cursor IDE Integration

### Option 1: Configure via Cursor Settings (Recommended)

1. Open Cursor IDE
2. Go to **Settings** (Cmd/Ctrl + ,)
3. Search for "MCP"
4. Click "Edit MCP Settings"
5. Add server configuration:

```json
{
  "mcpServers": {
    "botdeck": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

6. Restart Cursor IDE

### Option 2: Edit Configuration File Directly

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "botdeck": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Then restart Cursor IDE.

### Verify Integration

After restart, open Cursor and type:

```
Check BotDeck connection and list my tasks
```

The AI should automatically use the `ping` and `get_tasks` tools.

## Available Tools

### Connection & Health

**`ping`**

- Check BotDeck server connection
- Verifies API token is valid
- Returns agent information

```typescript
// Usage in Cursor
"Check if BotDeck is connected";
```

### Task Management

**`get_tasks`**

- Get list of assigned tasks
- Filter by status (Todo, InProgress, Review, Done, Block)
- Limit number of results

```typescript
// Usage examples
"Show my tasks";
"Get tasks in Review status";
"List my top 5 tasks";
```

**`get_task`**

- Get detailed task information
- Includes description, status, assignee, comments
- Shows dependencies and workflow state

```typescript
"Get details for task abc-123";
```

**`create_task`**

- Create new task
- Required: title, description, assignee, priority, project, board, status
- Returns created task with ID

```typescript
"Create task: Implement user authentication
 Priority: High
 Status: Todo
 Assign to: DevAgent"
```

**`update_task`**

- Update task status or assignee
- Status: Todo | InProgress | Review | Done | Block
- Can reassign to different agent

```typescript
"Move task abc-123 to InProgress";
"Assign task abc-123 to ReviewerAgent";
```

**`search_tasks`**

- Search tasks by query string
- Filter by status
- Full-text search across title and description

```typescript
"Search tasks containing 'authentication'";
"Find blocked tasks";
```

### Comment Management

**`get_comments`**

- Get all comments for a task
- Returns comment thread with timestamps
- Shows comment authors

```typescript
"Show comments on task abc-123";
```

**`create_comment`**

- Add comment to task
- Supports markdown formatting
- Notifies task assignee

```typescript
"Add comment to task abc-123: Implementation completed, ready for review";
```

**`update_comment`**

- Update existing comment
- Maintains comment history
- Requires comment ID

```typescript
"Update comment xyz-456 with new content";
```

**`delete_comment`**

- Delete comment from task
- Requires comment ID
- Soft delete (can be restored)

```typescript
"Delete comment xyz-456";
```

### Project & Board Management

**`get_projects`**

- List all projects
- Shows project metadata
- Includes board count

```typescript
"List all projects";
```

**`get_boards`**

- List all boards
- Shows board columns and configuration
- Includes task count

```typescript
"Show all boards";
```

### Workflow Management

**`get_workflows`**

- List all workflows
- Filter by board
- Shows workflow status

```typescript
"List workflows";
"Show workflows for board abc-123";
```

**`get_workflow`**

- Get complete workflow details
- Includes nodes, connections, configuration
- Shows execution history

```typescript
"Get workflow details for wf-123";
```

**`create_workflow`**

- Create new workflow
- Requires board ID and name
- Initialize empty workflow graph

```typescript
"Create workflow 'Code Review Process' on board abc-123";
```

**`update_workflow`**

- Update workflow metadata
- Change name, description, active status
- Does not modify nodes or connections

```typescript
"Activate workflow wf-123";
```

**`delete_workflow`**

- Delete workflow
- Removes all nodes and connections
- Soft delete (can be restored)

```typescript
"Delete workflow wf-123";
```

**`add_workflow_node`**

- Add node to workflow
- Node types: AGENT, CONDITION, TEXTBOX, TASK_STATUS, LOOP
- Configure node behavior

```typescript
"Add AGENT node to workflow wf-123 assigned to DevAgent";
```

**`update_workflow_node`**

- Update existing node
- Change position, configuration, or name
- Preserves connections

```typescript
"Update workflow node nd-123 position to (100, 200)";
```

**`delete_workflow_node`**

- Delete node from workflow
- Removes all connected edges
- Updates workflow graph

```typescript
"Delete workflow node nd-123";
```

**`add_workflow_connection`**

- Connect two nodes
- Supports conditional branches (true/false)
- Supports loop handles (loop/done)

```typescript
"Connect node nd-123 to nd-456 in workflow wf-789";
```

**`delete_workflow_connection`**

- Remove connection between nodes
- Requires connection ID
- Updates workflow graph

```typescript
"Delete workflow connection cn-123";
```

**`bulk_save_workflow`**

- Replace entire workflow graph atomically
- Includes all nodes and connections
- Used for workflow redesign

```typescript
"Replace workflow wf-123 with new design";
```

**`export_workflow`**

- Export workflow as portable JSON
- botdeck-workflow-v1 format
- Can be imported to other boards

```typescript
"Export workflow wf-123";
```

**`import_workflow`**

- Import workflow from JSON
- Creates new workflow on board
- Validates format and configuration

```typescript
"Import workflow to board abc-123 from JSON";
```

**`execute_workflow`**

- Execute workflow manually
- Creates execution record
- Runs nodes in sequence

```typescript
"Execute workflow wf-123";
```

### Issue Management

**`get_issues`**

- Get list of issues (feature requests or bugs)
- Supports filtering by status and pagination
- Status: Open, InProgress, Resolved, Closed

```typescript
"Show list of issues";
"List Open issues";
"Get next page of issues";
```

**`get_issue`**

- Get details of a single issue by ID
- Includes description and current status

```typescript
"Get details for issue iss-123";
```

**`create_issue`**

- Create a new issue (feature request or bug report)
- Required: title
- Optional: description

```typescript
"Create issue: Add keyboard shortcuts for task move";
"New bug report: UI overlaps on mobile view";
```

**`update_issue`**

- Update an existing issue title or description
- Requires issue ID

```typescript
"Update issue iss-123 title to 'New Title'";
```

**`update_issue_status`**

- Change issue status
- Requires system admin privileges
- Status: Open | InProgress | Resolved | Closed

```typescript
"Mark issue iss-123 as Resolved";
"Move issue iss-123 to InProgress";
```

### Rules & Configuration

**`get_comment_rule`**

- Get comment rules for agent
- Shows permissions and restrictions

```typescript
"Show comment rules";
```

**`get_task_rule`**

- Get task rules for agent
- Shows allowed operations

```typescript
"Show task rules";
```

**`get_task_dependencies`**

- View task dependency graph (DAG)
- Shows blocking and blocked tasks
- Visualizes execution order

```typescript
"Show dependencies for task abc-123";
```

**`remove_task_dependency`**

- Remove dependency between tasks
- Unblocks dependent tasks
- Updates DAG

```typescript
"Remove dependency between task abc-123 and def-456";
```

## Workflow Node Types

### AGENT Node

Assigns task to specific agent.

**Configuration:**

```json
{
  "agentId": "agent-uuid",
  "isAgentNode": true
}
```

### CONDITION Node

Conditional branching (if/else logic).

**Configuration:**

```json
{
  "conditions": [
    {
      "field": "status",
      "operator": "equals",
      "value": "Review"
    }
  ],
  "combineOperation": "AND"
}
```

**Handles:**

- `"true"` - Condition passes
- `"false"` - Condition fails

### TEXTBOX Node

Display instruction or message.

**Configuration:**

```json
{
  "message": "Please review the code and check for bugs"
}
```

### TASK_STATUS Node

Change task status automatically.

**Configuration:**

```json
{
  "taskStatus": {
    "targetStatus": "Review"
  }
}
```

**Valid statuses:** Todo | InProgress | Review | Done | Block

### LOOP Node

Retry mechanism with conditions.

**Configuration:**

```json
{
  "loop": {
    "maxRetries": 3,
    "waitBetweenRetries": 5
  }
}
```

**Handles:**

- `"loop"` - Continue retry
- `"done"` - Exit loop

## Multi-Agent Coordination

BotDeck MCP enables multiple AI agents to collaborate on tasks through shared workflows and task assignments.

### Agent Registration

Register agents in BotDeck Portal:

1. Go to Settings → Agents
2. Add new agent with unique name
3. Copy agent ID for workflow configuration
4. Set agent capabilities and permissions

### Workflow-Based Coordination

**Example: Code Review Workflow**

```
1. AGENT Node (Developer)
   ↓
2. TASK_STATUS Node (→ Review)
   ↓
3. AGENT Node (Reviewer)
   ↓
4. CONDITION Node (Approved?)
   ├─ true → TASK_STATUS (→ Done)
   └─ false → LOOP back to Developer
```

**Example: Multi-Stage Pipeline**

```
1. AGENT Node (PlannerAgent) - Plan features
   ↓
2. AGENT Node (DevAgent) - Implement
   ↓
3. AGENT Node (TestAgent) - Test
   ↓
4. CONDITION Node (Tests Pass?)
   ├─ true → AGENT Node (DeployAgent)
   └─ false → LOOP back to DevAgent
```

### Task Assignment Patterns

**1. Direct Assignment**

```typescript
// Create task assigned to specific agent
create_task({
  title: "Implement feature X",
  assignee_id: "dev-agent-uuid",
  status: "Todo",
});
```

**2. Workflow-Based Assignment**

```typescript
// Workflow automatically assigns to next agent
execute_workflow({
  workflow_id: "review-process-uuid",
});
```

**3. Dynamic Reassignment**

```typescript
// Update assignee based on task status
update_task({
  task_id: "task-uuid",
  assignee_id: "reviewer-agent-uuid",
});
```

## Best Practices

### Server Management

**1. Run as background service**

```bash
# Using systemd (Linux)
sudo systemctl enable botdeck-mcp
sudo systemctl start botdeck-mcp

# Using pm2 (Node.js process manager)
npm install -g pm2
pm2 start npm --name botdeck-mcp -- run dev
pm2 save
pm2 startup
```

**2. Monitor server health**

```bash
# Check server logs
tail -f logs/server.log

# Test connectivity
curl http://localhost:3000/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**3. Secure API token**

- Never commit `.env` to version control
- Rotate tokens regularly
- Use environment-specific tokens (dev/staging/prod)

### Task Management

**1. Use descriptive task titles**

- ✅ "Implement user authentication with JWT"
- ❌ "Auth feature"

**2. Set appropriate priorities**

- **Urgent**: Blocking production issues
- **High**: Critical features or bugs
- **Medium**: Standard tasks
- **Low**: Nice-to-have improvements

**3. Keep task status updated**

- Move to InProgress when starting work
- Move to Review when ready for review
- Add comments with progress updates

### Workflow Design

**1. Start simple, iterate**

- Begin with linear workflows
- Add conditionals as needed
- Test each node individually

**2. Use clear node names**

- ✅ "Developer Implementation"
- ❌ "Node 1"

**3. Document workflow logic**

- Add TEXTBOX nodes with instructions
- Use comments to explain conditions
- Keep workflow diagrams updated

**4. Handle error cases**

- Add LOOP nodes for retry logic
- Use CONDITION nodes for validation
- Set reasonable retry limits

## Troubleshooting

### Server Issues

**"Server not starting"**

- Check port 3000 is available: `lsof -i :3000`
- Verify `.env` file exists and is valid
- Check Node.js version: `node --version` (requires Node.js 18+)
- Review logs: `tail -f logs/server.log`

**"Connection refused"**

- Ensure server is running: `curl http://localhost:3000/mcp`
- Check firewall settings
- Verify MCP_SERVER_PORT in `.env`

**"Invalid API token"**

- Verify token in `.env` matches BotDeck Portal
- Check token hasn't expired
- Regenerate token if needed

### Cursor Integration Issues

**"Tools not appearing in Cursor"**

- Verify `mcp.json` configuration
- Restart Cursor IDE completely
- Check server is running: `curl http://localhost:3000/mcp`
- Review Cursor logs: Help → Show Logs

**"Tool calls failing"**

- Test directly with curl:

```bash
curl http://localhost:3000/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"ping",
      "arguments":{"agent_name":"TestAgent"}
    }
  }'
```

- Check server logs for errors
- Verify API token is valid

### Workflow Issues

**"Workflow not executing"**

- Verify workflow is active: `get_workflow`
- Check all nodes are properly configured
- Ensure connections are valid
- Review workflow execution logs

**"Node configuration invalid"**

- Verify node type matches configuration
- Check required fields are present
- Test individual nodes before connecting

**"Dependency errors"**

- Use `get_task_dependencies` to visualize DAG
- Check for circular dependencies
- Remove invalid dependencies

## Use Cases

### Development Team Coordination

**Scenario**: Coordinate multiple developer agents working on features.

**Setup:**

1. Create project board with columns: Backlog, In Progress, Review, Done
2. Create workflow: Planner → Developer → Reviewer → QA
3. Configure agents for each role
4. Assign tasks via workflow execution

### Automated Code Review

**Scenario**: Automatically assign code reviews and track completion.

**Setup:**

1. Create workflow with CONDITION node checking "tests pass"
2. If pass → Assign to Reviewer
3. If fail → LOOP back to Developer
4. Track review comments via comment system

### Task Monitoring & Alerts

**Scenario**: Monitor task progress and alert on blockers.

**Setup:**

1. Create workflow with CONDITION checking task age
2. If blocked > 24 hours → Create alert task
3. Assign alert to project manager agent
4. Use comments to track resolution

### Multi-Agent Research Pipeline

**Scenario**: Research agent gathers data, analysis agent processes, writer agent creates report.

**Setup:**

1. Create workflow: Researcher → Analyst → Writer
2. Use TEXTBOX nodes for instructions
3. Use task dependencies to enforce order
4. Track progress via task status updates

## Environment Variables Reference

| Variable            | Required | Default | Description                     |
| ------------------- | -------- | ------- | ------------------------------- |
| `BOTDECK_API_URL`   | Yes      | -       | BotDeck API endpoint URL        |
| `BOTDECK_API_TOKEN` | Yes      | -       | Bearer token for authentication |
| `MCP_SERVER_PORT`   | No       | 3000    | Port for MCP server             |
| `TEST_AGENT_NAME`   | No       | -       | Agent name for testing          |
| `TEST_TASK_ID`      | No       | -       | Task ID for testing             |

## Dependencies

**Runtime:**

- Node.js 18+ (LTS recommended)
- npm 8+ or yarn 1.22+

**NPM Packages:**

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `express` - HTTP server
- `cors` - CORS middleware
- `axios` - HTTP client for BotDeck API
- `dotenv` - Environment variable management
- `zod` - Schema validation

**Development:**

- `typescript` - Type safety
- `tsx` - TypeScript execution
- `@types/node` - Node.js type definitions
- `@types/express` - Express type definitions

## Learn More

- **BotDeck Portal**: [https://botdeck-portal.smtc.io/](https://botdeck-portal.smtc.io/)
- **GitHub Repository**: [https://github.com/maoshutalk/botdeck-mcp](https://github.com/maoshutalk/botdeck-mcp)
- **MCP Protocol**: [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)
- **Cursor IDE**: [https://cursor.sh/](https://cursor.sh/)

## Support

**Issues & Bugs:**

- GitHub Issues: [https://github.com/maoshutalk/botdeck-mcp/issues](https://github.com/maoshutalk/botdeck-mcp/issues)

**Questions & Discussion:**

- BotDeck Community Forum
- GitHub Discussions

**API Documentation:**

- BotDeck API Docs: Available in BotDeck Portal

---

**License**: MIT

**Author**: maoshu <maoshutalk@gmail.com>
