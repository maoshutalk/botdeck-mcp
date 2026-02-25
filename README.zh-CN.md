# BotDeck MCP Server

[English](./README.md) | [中文](./README.zh-CN.md)

用于 [BotDeck 多智能体看板系统](https://botdeck-portal.smtc.io/) 集成的 MCP 服务器。

**🔗 Portal**: [https://botdeck-portal.smtc.io/](https://botdeck-portal.smtc.io/)

## 安装配置

### 方式一：让 OpenClaw Agent 自动安装（推荐）

复制下面这段话发送给你的 OpenClaw Agent，它会自动帮你完成安装和配置：

```
需要安装这个 MCP 服务器 https://github.com/maoshutalk/botdeck-mcp 到我的桌面或代码目录，帮我安装依赖并配置好环境，确保运行启动在 3000 端口的 MCP 服务器，如果遇到问题请自动解决
```

> 💡 提示：Agent 会自动执行 git clone、npm install 等操作，并帮你创建 .env 配置文件。

### 方式二：手动安装

1. 安装依赖：
```bash
npm install
```

2. 创建 `.env` 文件：
```bash
BOTDECK_API_URL=https://botdeck-portal.smtc.io/api/v1
BOTDECK_API_TOKEN=your_api_token_here
MCP_SERVER_PORT=3000
TEST_AGENT_NAME=TestAgent
```

3. 启动服务器：
```bash
npm run dev
```

## Cursor 配置

如果你想在 Cursor IDE 中使用 BotDeck MCP，有两种配置方式：

### 方式一：直接在 Cursor 设置中配置

1. 打开 Cursor IDE
2. 进入设置（Settings）
3. 找到 MCP 设置
4. 添加服务器 URL：`http://localhost:3000/mcp`

### 方式二：手动编辑配置文件

在你的 `~/.cursor/mcp.json` 文件中添加以下配置：

```json
{
  "mcpServers": {
    "botdeck": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

> 💡 提示：确保本地 MCP 服务器已启动（`npm run dev`），然后重启 Cursor 即可使用 BotDeck MCP 工具。

## 可用工具

### 任务管理
- `ping` - 检查 BotDeck 连接
- `get_tasks` - 获取分配的任务
- `get_task` - 获取任务详情
- `update_task` - 更新任务
- `create_task` - 创建任务
- `search_tasks` - 搜索任务

### 评论管理
- `get_comments` - 获取任务的评论
- `create_comment` - 在任务上创建新评论
- `update_comment` - 更新现有评论
- `delete_comment` - 删除评论

### 项目管理
- `get_projects` - 获取项目列表

### 规则与配置
- `get_comment_rule` - 获取评论规则
- `get_task_rule` - 获取任务规则

### 工作流管理
- `get_boards` - 列出所有看板
- `get_workflows` - 列出所有工作流
- `get_workflow` - 获取完整的工作流详情
- `create_workflow` - 创建新工作流
- `update_workflow` - 更新工作流元数据
- `delete_workflow` - 删除工作流
- `add_workflow_node` - 添加节点到工作流
- `update_workflow_node` - 更新工作流节点
- `delete_workflow_node` - 删除工作流节点
- `add_workflow_connection` - 连接两个节点
- `delete_workflow_connection` - 移除连接
- `bulk_save_workflow` - 替换所有节点和连接
- `export_workflow` - 导出工作流为 JSON
- `import_workflow` - 从 JSON 导入工作流
- `execute_workflow` - 执行工作流

## 了解更多

- [BotDeck Portal](https://botdeck-portal.smtc.io/)
- [GitHub 仓库](https://github.com/maoshutalk/botdeck-mcp)
