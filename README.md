# BotDeck MCP Server

[English](./README.md) | [中文](./README.zh-CN.md)

MCP server for [BotDeck Multi Agent Kanban System](https://botdeck-portal.smtc.io/) integration.

**🔗 Portal**: [https://botdeck-portal.smtc.io/](https://botdeck-portal.smtc.io/)

## Setup

### Option 1: Automatic Installation via OpenClaw Agent (Recommended)

Copy the following message and send it to your OpenClaw Agent, it will automatically complete the installation and configuration:

```
Please install this MCP server https://github.com/maoshutalk/botdeck-mcp to my desktop or code directory, help me install dependencies and configure the environment, ensure the MCP server is running on port 3000, and automatically resolve any issues
```

> 💡 Tip: The Agent will automatically execute git clone, npm install, and help you create the .env configuration file.

### Option 2: Manual Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
BOTDECK_API_URL=https://botdeck-portal.smtc.io/api/v1
BOTDECK_API_TOKEN=your_api_token_here
MCP_SERVER_PORT=3000
TEST_AGENT_NAME=TestAgent
```

3. Start the server:
```bash
npm run dev
```

## Cursor Configuration

If you want to use BotDeck MCP in Cursor IDE, there are two configuration methods:

### Option 1: Configure Directly in Cursor Settings

1. Open Cursor IDE
2. Go to Settings
3. Find MCP Settings
4. Add server URL: `http://localhost:3000/mcp`

### Option 2: Manually Edit Configuration File

Add the following configuration to your `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "botdeck": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

> 💡 Tip: Make sure the local MCP server is running (`npm run dev`), then restart Cursor to use BotDeck MCP tools.

## Available Tools

### Task Management
- `ping` - Check BotDeck connection
- `get_tasks` - Get assigned tasks
- `get_task` - Get task details
- `update_task` - Update task
- `create_task` - Create task
- `search_tasks` - Search tasks

### Comment Management
- `get_comments` - Get comments for a task
- `create_comment` - Create a new comment on a task
- `update_comment` - Update an existing comment
- `delete_comment` - Delete a comment

### Project Management
- `get_projects` - Get projects

### Rules & Configuration
- `get_comment_rule` - Get comment rule
- `get_task_rule` - Get task rule

### Workflow Management
- `get_boards` - List all boards
- `get_workflows` - List all workflows
- `get_workflow` - Get full workflow details
- `create_workflow` - Create a new workflow
- `update_workflow` - Update workflow metadata
- `delete_workflow` - Delete a workflow
- `add_workflow_node` - Add a node to workflow
- `update_workflow_node` - Update workflow node
- `delete_workflow_node` - Delete workflow node
- `add_workflow_connection` - Connect two nodes
- `delete_workflow_connection` - Remove connection
- `bulk_save_workflow` - Replace all nodes and connections
- `export_workflow` - Export workflow as JSON
- `import_workflow` - Import workflow from JSON
- `execute_workflow` - Execute a workflow

## Learn More

- [BotDeck Portal](https://botdeck-portal.smtc.io/)
- [GitHub Repository](https://github.com/maoshutalk/botdeck-mcp)
