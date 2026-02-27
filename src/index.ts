// Path: /Users/jin/Documents/repo/nightbuilder/apps/botdeck/mcp-server/src/index.ts

import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import {
  ping, getTaskList, getTask, updateTask, createTask,
  getCommentRule, getTaskRule, getTaskDependencies, addTaskDependency, removeTaskDependency,
  searchTasks, getProjects, getComments,
  createComment, updateComment, deleteComment,
  getWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow,
  addWorkflowNode, updateWorkflowNode, deleteWorkflowNode,
  addWorkflowConnection, deleteWorkflowConnection,
  bulkSaveWorkflow, exportWorkflow, importWorkflow, executeWorkflow, getBoards,
  getIssues, getIssue, createIssue, updateIssue, updateIssueStatus,
  AuthCooldownError, AuthFailedError, AuthMissingError
} from './tools/index.js'

const app = express()
app.use(cors())
app.use(express.json())

// Get API token from .env if available
const DEFAULT_API_TOKEN = process.env.BOTDECK_API_TOKEN || ''

async function handleRequest(req: any, res: any) {
  // Log raw request data for debugging only when body is invalid or missing
  const hasValidBody = req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0
  if (!hasValidBody) {
    console.log(`[MCP] 📥 RAW BODY:`, JSON.stringify(req.body, null, 2))
    console.log(`[MCP] 📥 HEADERS:`, JSON.stringify(req.headers, null, 2))
    console.log(`[MCP] 📥 CONTENT-TYPE:`, req.headers['content-type'])
  }
  
  const { jsonrpc, id, method, params } = req.body
  
  // Validate request structure
  if (!req.body || typeof req.body !== 'object') {
    console.error(`[MCP] ❌ Invalid body type: ${typeof req.body}`)
    res.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: body is not a valid JSON object' } })
    return
  }
  
  if (!method) {
    console.error(`[MCP] ❌ Missing method field in request`)
    res.json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request: method field is required' } })
    return
  }
  
  console.log(`[MCP] 📥 Method: ${method}`)
  if (params) console.log(`[MCP] 📥 Params:`, JSON.stringify(params, null, 2))
  
  try {
    // Initialize
    if (method === 'initialize') {
      console.log(`[MCP] 🔗 Initialized`)
      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: { name: 'botdeck-mcp', version: '1.0.0' }
        }
      })
      return
    }
    
    // Notifications/initialized
    if (method === 'notifications/initialized') {
      res.json({ jsonrpc: '2.0', id: null })
      return
    }
    
    // Tools/list
    if (method === 'tools/list') {
      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'ping',
              description: 'Check BotDeck connection',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional, uses .env BOTDECK_API_TOKEN if not provided)' }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_tasks',
              description: 'Get assigned tasks',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  status: { type: 'string', description: 'Task status (Todo, In Progress, Review, Done)' },
                  limit: { type: 'number', description: 'Max number of tasks', default: 20 }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_task',
              description: 'Get task details',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  task_id: { type: 'string', description: 'Task ID' }
                },
                required: ['agent_name', 'task_id']
              }
            },
            {
              name: 'update_task',
              description: 'Update task status or assignee. Use create_comment to add comments to the task.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  task_id: { type: 'string', description: 'Task ID' },
                  status: { type: 'string', description: 'New status (Todo, In Progress, Review, Done)' },
                  assignee_id: { type: 'string', description: 'Assignee ID (null to unassign)' }
                },
                required: ['agent_name', 'task_id']
              }
            },
            {
              name: 'create_task',
              description: 'Create a new task in agent mode. All parameters are REQUIRED: title, description, assignee_id, priority, board_id, status.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name (required)' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  title: { type: 'string', description: 'Task title (required)' },
                  description: { type: 'string', description: 'Task description (required)' },
                  assignee_id: { type: 'string', description: 'Assignee Agent ID (required)' },
                  priority: { type: 'string', description: 'Priority: Low, Medium, High, Urgent (required)' },
                  board_id: { type: 'string', description: 'Board ID (required)' },
                  status: { type: 'string', description: 'Task status: Todo, In Progress, Review, Done, Block (required)' }
                },
                required: ['agent_name', 'title', 'description', 'assignee_id', 'priority', 'board_id', 'status']
              }
            },
            {
              name: 'search_tasks',
              description: 'Search tasks',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  query: { type: 'string', description: 'Search query' },
                  status: { type: 'string', description: 'Filter by status' }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_projects',
              description: 'Get projects',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_comments',
              description: 'Get comments for a task',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  task_id: { type: 'string', description: 'Task ID' },
                  limit: { type: 'number', description: 'Max number of comments', default: 10 }
                },
                required: ['agent_name', 'task_id']
              }
            },
            {
              name: 'create_comment',
              description: 'Create a new comment on a task',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  task_id: { type: 'string', description: 'Task ID' },
                  content: { type: 'string', description: 'Comment content' }
                },
                required: ['agent_name', 'task_id', 'content']
              }
            },
            {
              name: 'update_comment',
              description: 'Update an existing comment',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  comment_id: { type: 'string', description: 'Comment ID' },
                  content: { type: 'string', description: 'New comment content' }
                },
                required: ['agent_name', 'comment_id', 'content']
              }
            },
            {
              name: 'delete_comment',
              description: 'Delete a comment',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  comment_id: { type: 'string', description: 'Comment ID' }
                },
                required: ['agent_name', 'comment_id']
              }
            },
            {
              name: 'get_comment_rule',
              description: 'Get comment rule',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_task_rule',
              description: 'Get task rule',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_task_dependencies',
              description: 'Get task dependencies (DAG relationships). Returns tasks that this task depends on (must complete first) and tasks that depend on this task (are blocked by this task).',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  task_id: { type: 'string', description: 'Task ID to query dependencies for' }
                },
                required: ['agent_name', 'task_id']
              }
            },
            {
              name: 'add_task_dependency',
              description: 'Add a dependency to a task. The task (task_id) will depend on another task (depends_on_id), meaning depends_on_id must be completed before task_id can start. Prevents circular dependencies.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  task_id: { type: 'string', description: 'Task ID that will have the dependency (current task id)' },
                  depends_on_id: { type: 'string', description: 'Task ID that must be completed first (new task id)' }
                },
                required: ['agent_name', 'task_id', 'depends_on_id']
              }
            },
            {
              name: 'remove_task_dependency',
              description: 'Remove a dependency from a task. This unlinks the dependency relationship between two tasks.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  task_id: { type: 'string', description: 'Task ID to remove the dependency from' },
                  depends_on_id: { type: 'string', description: 'Task ID of the dependency to remove' }
                },
                required: ['agent_name', 'task_id', 'depends_on_id']
              }
            },
            // Workflow tools
            {
              name: 'get_boards',
              description: 'List all boards. Boards are containers for tasks and workflows. Each board belongs to a project. You need a board_id to create a workflow.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_workflows',
              description: 'List all workflows. Each workflow is tied to a board (one-to-one). Returns workflow id, name, description, boardId, node count, connection count.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  board_id: { type: 'string', description: 'Filter by board ID (optional)' }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_workflow',
              description: 'Get full workflow details including all nodes and connections. Use this to understand the current workflow graph structure before editing.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID' }
                },
                required: ['agent_name', 'workflow_id']
              }
            },
            {
              name: 'create_workflow',
              description: 'Create a new empty workflow on a board. Each board can only have one workflow. After creation, add nodes and connections to build the workflow graph.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  board_id: { type: 'string', description: 'Board ID to attach workflow to (required, one workflow per board)' },
                  name: { type: 'string', description: 'Workflow name' },
                  description: { type: 'string', description: 'Workflow description' }
                },
                required: ['agent_name', 'board_id', 'name']
              }
            },
            {
              name: 'update_workflow',
              description: 'Update workflow metadata (name, description, active status). Does not modify nodes or connections.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID' },
                  name: { type: 'string', description: 'New workflow name' },
                  description: { type: 'string', description: 'New workflow description' },
                  is_active: { type: 'boolean', description: 'Whether workflow is active' }
                },
                required: ['agent_name', 'workflow_id']
              }
            },
            {
              name: 'delete_workflow',
              description: 'Soft-delete a workflow. This removes the workflow and all its nodes and connections from the board.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID to delete' }
                },
                required: ['agent_name', 'workflow_id']
              }
            },
            {
              name: 'add_workflow_node',
              description: 'Add a single node to a workflow. Node types: AGENT (assign to agent, requires config.agentId), CONDITION (if/else branching, uses config.conditions array), TEXTBOX (instruction message, uses config.message), TASK_STATUS (change task status, uses config.taskStatus.targetStatus), LOOP (retry mechanism, uses config.maxRetries and config.condition). Position is in canvas coordinates (x,y).',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID' },
                  node_type: { type: 'string', enum: ['AGENT', 'CONDITION', 'TEXTBOX', 'TASK_STATUS', 'LOOP'], description: 'Node type' },
                  name: { type: 'string', description: 'Display name for the node' },
                  position_x: { type: 'number', description: 'X position on canvas (default: 0)', default: 0 },
                  position_y: { type: 'number', description: 'Y position on canvas (default: 0)', default: 0 },
                  config: {
                    type: 'object',
                    description: 'Node configuration. For AGENT: {agentId: "uuid"}. For TEXTBOX: {message: "instructions"}. For CONDITION: {conditions: [{field, operator, value}], combineOperation: "AND"|"OR"}. For TASK_STATUS: {taskStatus: {targetStatus: "Review"|"Done"|"Block"}}. For LOOP: {maxRetries: 3, waitBetweenRetries: 5, condition: {field, operator, value}}.'
                  }
                },
                required: ['agent_name', 'workflow_id', 'node_type', 'name']
              }
            },
            {
              name: 'update_workflow_node',
              description: 'Update an existing workflow node (name, position, or config).',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID' },
                  node_id: { type: 'string', description: 'Node ID to update' },
                  name: { type: 'string', description: 'New node name' },
                  position_x: { type: 'number', description: 'New X position' },
                  position_y: { type: 'number', description: 'New Y position' },
                  config: { type: 'object', description: 'New node configuration (see add_workflow_node for config format)' }
                },
                required: ['agent_name', 'workflow_id', 'node_id']
              }
            },
            {
              name: 'delete_workflow_node',
              description: 'Delete a node from a workflow. Also removes all connections to/from this node.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID' },
                  node_id: { type: 'string', description: 'Node ID to delete' }
                },
                required: ['agent_name', 'workflow_id', 'node_id']
              }
            },
            {
              name: 'add_workflow_connection',
              description: 'Connect two nodes in a workflow. For CONDITION nodes, use sourceHandle "true" or "false" to specify branch. For LOOP nodes, use sourceHandle "loop" (continue) or "done" (exit). Default handles are empty strings.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID' },
                  source_id: { type: 'string', description: 'Source node ID (where the connection starts)' },
                  target_id: { type: 'string', description: 'Target node ID (where the connection ends)' },
                  source_handle: { type: 'string', description: 'Source handle name. Use "true"/"false" for CONDITION nodes, "loop"/"done" for LOOP nodes. Leave empty for default output.' },
                  target_handle: { type: 'string', description: 'Target handle name (usually empty for default input)' }
                },
                required: ['agent_name', 'workflow_id', 'source_id', 'target_id']
              }
            },
            {
              name: 'delete_workflow_connection',
              description: 'Remove a connection between two nodes.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID' },
                  connection_id: { type: 'string', description: 'Connection ID to delete' }
                },
                required: ['agent_name', 'workflow_id', 'connection_id']
              }
            },
            {
              name: 'bulk_save_workflow',
              description: [
                'Replace ALL nodes and connections in an EXISTING workflow at once (atomic operation).',
                'This deletes all existing nodes/connections and creates new ones. Use this to redesign a workflow.',
                'Unlike import_workflow which creates a NEW workflow on a board, bulk_save modifies an existing workflow in-place.',
                'Node IDs here are temporary — the backend creates real UUIDs. Connections reference these temp IDs.',
                'Use get_workflow first to see the current structure, then send the full replacement.',
              ].join(' '),
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Existing workflow ID to overwrite' },
                  nodes: {
                    type: 'array',
                    description: 'Full array of nodes to replace existing ones.',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'Temporary unique node ID for connection references (e.g. "agent-001", "if-001", "msg-001")' },
                        nodeType: { type: 'string', enum: ['AGENT', 'CONDITION', 'TEXTBOX', 'TASK_STATUS', 'LOOP'], description: 'Node type' },
                        name: { type: 'string', description: 'Display name' },
                        positionX: { type: 'number', description: 'Canvas X position' },
                        positionY: { type: 'number', description: 'Canvas Y position' },
                        config: {
                          type: 'object',
                          description: 'AGENT: {agentId, isAgentNode:true}. TEXTBOX: {message}. TASK_STATUS: {taskStatus:{targetStatus}}. CONDITION: {conditions:[{field,operator,value}], combineOperation}. LOOP: {loop:{maxRetries, waitBetweenRetries}}.'
                        }
                      },
                      required: ['id', 'nodeType', 'name', 'positionX', 'positionY']
                    }
                  },
                  connections: {
                    type: 'array',
                    description: 'Full array of connections. sourceId/targetId must match node id values above.',
                    items: {
                      type: 'object',
                      properties: {
                        sourceId: { type: 'string', description: 'Source node ID (must match a node id)' },
                        targetId: { type: 'string', description: 'Target node ID (must match a node id)' },
                        sourceHandle: { type: 'string', description: '"true"/"false" for CONDITION, "loop"/"done" for LOOP, "" for default output' },
                        targetHandle: { type: 'string', description: 'Usually "" for default input' }
                      },
                      required: ['sourceId', 'targetId']
                    }
                  }
                },
                required: ['agent_name', 'workflow_id', 'nodes', 'connections']
              }
            },
            {
              name: 'export_workflow',
              description: 'Export a workflow as portable JSON (botdeck-workflow-v1 format). Returns a clean JSON with nodes array and index-based connections. No internal IDs are included — connections reference nodes by their array index (sourceIndex/targetIndex). The exported JSON can be directly passed to import_workflow on another board.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID to export' }
                },
                required: ['agent_name', 'workflow_id']
              }
            },
            {
              name: 'import_workflow',
              description: [
                'Import a workflow from JSON to a target board. The board must not already have a workflow (delete existing first).',
                'Uses botdeck-workflow-v1 format. Old nodes are deleted and new ones are created fresh.',
                '',
                'workflow_json structure:',
                '{',
                '  "_format": "botdeck-workflow-v1",',
                '  "name": "My Workflow",',
                '  "description": "...",',
                '  "nodes": [',
                '    { "nodeType": "AGENT", "name": "Developer", "positionX": 0, "positionY": 0, "config": { "agentId": "uuid", "isAgentNode": true } },',
                '    { "nodeType": "TEXTBOX", "name": "Message", "positionX": 200, "positionY": 0, "config": { "message": "Please review the code" } },',
                '    { "nodeType": "TASK_STATUS", "name": "Status Change", "positionX": 400, "positionY": 0, "config": { "taskStatus": { "targetStatus": "Review" } } },',
                '    { "nodeType": "CONDITION", "name": "IF", "positionX": 600, "positionY": 0, "config": { "conditions": [{"field": "status", "operator": "equals", "value": "passed"}], "combineOperation": "AND" } },',
                '    { "nodeType": "LOOP", "name": "Retry Loop", "positionX": 0, "positionY": 300, "config": { "loop": { "maxRetries": 3, "waitBetweenRetries": 5 } } }',
                '  ],',
                '  "connections": [',
                '    { "sourceIndex": 0, "targetIndex": 1, "sourceHandle": "", "targetHandle": "" },',
                '    { "sourceIndex": 3, "targetIndex": 2, "sourceHandle": "false", "targetHandle": "" },',
                '    { "sourceIndex": 4, "targetIndex": 0, "sourceHandle": "loop", "targetHandle": "" },',
                '    { "sourceIndex": 4, "targetIndex": 1, "sourceHandle": "done", "targetHandle": "" }',
                '  ]',
                '}',
                '',
                'Node types: AGENT (assign task to agent), TEXTBOX (instruction message), TASK_STATUS (change task status), CONDITION (if/else branch), LOOP (retry mechanism).',
                'Connections use array index: sourceIndex/targetIndex point to the node position in the nodes array (0-based).',
                'CONDITION handles: "true" (pass branch), "false" (fail branch).',
                'LOOP handles: "loop" (retry body), "done" (exit after all retries).',
              ].join('\n'),
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  board_id: { type: 'string', description: 'Target board ID (use get_boards to find available boards)' },
                  workflow_json: {
                    type: 'object',
                    description: 'Workflow JSON in botdeck-workflow-v1 format. Must include _format, nodes array, and connections array with sourceIndex/targetIndex.',
                    properties: {
                      _format: { type: 'string', enum: ['botdeck-workflow-v1'], description: 'Must be "botdeck-workflow-v1"' },
                      name: { type: 'string', description: 'Workflow name' },
                      description: { type: 'string', description: 'Workflow description' },
                      nodes: {
                        type: 'array',
                        description: 'Array of workflow nodes. Order matters — connections reference nodes by their array index.',
                        items: {
                          type: 'object',
                          properties: {
                            nodeType: { type: 'string', enum: ['AGENT', 'CONDITION', 'TEXTBOX', 'TASK_STATUS', 'LOOP'], description: 'Node type' },
                            name: { type: 'string', description: 'Display name' },
                            positionX: { type: 'number', description: 'Canvas X position' },
                            positionY: { type: 'number', description: 'Canvas Y position' },
                            config: {
                              type: 'object',
                              description: 'AGENT: {agentId, isAgentNode:true}. TEXTBOX: {message}. TASK_STATUS: {taskStatus:{targetStatus:"Review"|"Done"|"Block"|"Todo"|"In Progress"}}. CONDITION: {conditions:[{field,operator,value}], combineOperation:"AND"|"OR"}. LOOP: {loop:{maxRetries:N, waitBetweenRetries:N}}.'
                            }
                          },
                          required: ['nodeType', 'name', 'positionX', 'positionY']
                        }
                      },
                      connections: {
                        type: 'array',
                        description: 'Array of connections between nodes, using array index references.',
                        items: {
                          type: 'object',
                          properties: {
                            sourceIndex: { type: 'number', description: '0-based index of source node in nodes array' },
                            targetIndex: { type: 'number', description: '0-based index of target node in nodes array' },
                            sourceHandle: { type: 'string', description: '"true"/"false" for CONDITION, "loop"/"done" for LOOP, "" for default' },
                            targetHandle: { type: 'string', description: 'Usually empty string ""' }
                          },
                          required: ['sourceIndex', 'targetIndex']
                        }
                      }
                    },
                    required: ['_format', 'nodes', 'connections']
                  },
                  name: { type: 'string', description: 'Override workflow name (optional, uses name from JSON if not provided)' }
                },
                required: ['agent_name', 'board_id', 'workflow_json']
              }
            },
            {
              name: 'execute_workflow',
              description: 'Execute a workflow manually. Creates an execution record and runs nodes in sequence.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  workflow_id: { type: 'string', description: 'Workflow ID to execute' },
                  trigger_data: { type: 'object', description: 'Optional trigger data (e.g. {triggerType: "manual"})' }
                },
                required: ['agent_name', 'workflow_id']
              }
            },
            // Issue tools
            {
              name: 'get_issues',
              description: 'Get list of issues. Issues are feature requests or bugs submitted by users. Supports filtering by status and pagination.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  status: { type: 'string', description: 'Filter by status (Open, In Progress, Resolved, Closed)' },
                  limit: { type: 'number', description: 'Max number of issues per page', default: 20 },
                  page: { type: 'number', description: 'Page number', default: 1 }
                },
                required: ['agent_name']
              }
            },
            {
              name: 'get_issue',
              description: 'Get details of a single issue by ID.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  issue_id: { type: 'string', description: 'Issue ID' }
                },
                required: ['agent_name', 'issue_id']
              }
            },
            {
              name: 'create_issue',
              description: 'Create a new issue (feature request or bug report).',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  title: { type: 'string', description: 'Issue title (required)' },
                  description: { type: 'string', description: 'Issue description (optional)' }
                },
                required: ['agent_name', 'title']
              }
            },
            {
              name: 'update_issue',
              description: 'Update an existing issue title or description.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  issue_id: { type: 'string', description: 'Issue ID to update' },
                  title: { type: 'string', description: 'New issue title' },
                  description: { type: 'string', description: 'New issue description' }
                },
                required: ['agent_name', 'issue_id']
              }
            },
            {
              name: 'update_issue_status',
              description: 'Change issue status. Note: Requires system admin privileges.',
              inputSchema: {
                type: 'object',
                properties: {
                  agent_name: { type: 'string', description: 'Agent name' },
                  api_token: { type: 'string', description: 'API token (optional if set in .env)' },
                  issue_id: { type: 'string', description: 'Issue ID' },
                  status: { type: 'string', description: 'New status (Open, In Progress, Resolved, Closed)' }
                },
                required: ['agent_name', 'issue_id', 'status']
              }
            }
          ]
        }
      })
      return
    }
    
    // Tools/call - agent_name is required, api_token is optional
    if (method === 'tools/call') {
      const { name, arguments: args } = params || {}
      console.log(`[MCP] 🔧 Tool: ${name}`)
      
      // Get agent name from args (required)
      const agentName = args?.agent_name
      if (!agentName) {
        throw new Error('agent_name is required in arguments')
      }
      
      // Get API token: ONLY from Authorization header
      const apiToken = req.headers.authorization?.replace(/^Bearer\s+/i, '') || ''
      if (!apiToken) {
        throw new Error('Authorization header is missing. Please provide token: Authorization: Bearer <token>')
      }
      
      // Remove credentials from args before passing to tools
      const toolArgs = { ...args }
      delete toolArgs.agent_name
      delete toolArgs.api_token
      
      console.log(`[MCP] 🔗 Agent: ${agentName}`)
      if (args?.api_token) {
        console.log(`[MCP] 🔑 Using token from arguments`)
      } else {
        console.log(`[MCP] 🔑 Using token from .env`)
      }
      
      let result: any
      
      switch (name) {
        case 'ping':
          result = await ping(agentName, apiToken)
          break
        case 'get_tasks':
          result = await getTaskList(agentName, apiToken, toolArgs?.status, toolArgs?.limit)
          break
        case 'get_task':
          result = await getTask(agentName, apiToken, toolArgs?.task_id)
          break
        case 'update_task':
          result = await updateTask(agentName, apiToken, toolArgs?.task_id, {
            status: toolArgs?.status,
            assignee_id: toolArgs?.assignee_id
          })
          break
        case 'create_task':
          result = await createTask(agentName, apiToken, {
            title: toolArgs?.title,
            description: toolArgs?.description,
            assignee_id: toolArgs?.assignee_id,
            board_id: toolArgs?.board_id,
            priority: toolArgs?.priority,
            status: toolArgs?.status
          })
          break
        case 'search_tasks':
          result = await searchTasks(agentName, apiToken, toolArgs?.query, toolArgs?.status)
          break
        case 'get_projects':
          result = await getProjects(agentName, apiToken)
          break
        case 'get_comments':
          result = await getComments(agentName, apiToken, toolArgs?.task_id, toolArgs?.limit)
          break
        case 'create_comment':
          result = await createComment(agentName, apiToken, {
            task_id: toolArgs?.task_id,
            content: toolArgs?.content
          })
          break
        case 'update_comment':
          result = await updateComment(agentName, apiToken, toolArgs?.comment_id, toolArgs?.content)
          break
        case 'delete_comment':
          result = await deleteComment(agentName, apiToken, toolArgs?.comment_id)
          break
        case 'get_comment_rule':
          result = await getCommentRule(agentName, apiToken)
          break
        case 'get_task_rule':
          result = await getTaskRule(agentName, apiToken)
          break
        case 'get_task_dependencies':
          result = await getTaskDependencies(agentName, apiToken, toolArgs?.task_id)
          break
        case 'add_task_dependency':
          result = await addTaskDependency(agentName, apiToken, toolArgs?.task_id, toolArgs?.depends_on_id)
          break
        case 'remove_task_dependency':
          result = await removeTaskDependency(agentName, apiToken, toolArgs?.task_id, toolArgs?.depends_on_id)
          break
        // Workflow tools
        case 'get_boards':
          result = await getBoards(agentName, apiToken)
          break
        case 'get_workflows':
          result = await getWorkflows(agentName, apiToken, toolArgs?.board_id)
          break
        case 'get_workflow':
          result = await getWorkflow(agentName, apiToken, toolArgs?.workflow_id)
          break
        case 'create_workflow':
          result = await createWorkflow(agentName, apiToken, {
            name: toolArgs?.name,
            boardId: toolArgs?.board_id,
            description: toolArgs?.description
          })
          break
        case 'update_workflow':
          result = await updateWorkflow(agentName, apiToken, toolArgs?.workflow_id, {
            name: toolArgs?.name,
            description: toolArgs?.description,
            isActive: toolArgs?.is_active
          })
          break
        case 'delete_workflow':
          result = await deleteWorkflow(agentName, apiToken, toolArgs?.workflow_id)
          break
        case 'add_workflow_node':
          result = await addWorkflowNode(agentName, apiToken, toolArgs?.workflow_id, {
            nodeType: toolArgs?.node_type,
            name: toolArgs?.name,
            positionX: toolArgs?.position_x,
            positionY: toolArgs?.position_y,
            config: toolArgs?.config
          })
          break
        case 'update_workflow_node':
          result = await updateWorkflowNode(agentName, apiToken, toolArgs?.workflow_id, toolArgs?.node_id, {
            name: toolArgs?.name,
            positionX: toolArgs?.position_x,
            positionY: toolArgs?.position_y,
            config: toolArgs?.config
          })
          break
        case 'delete_workflow_node':
          result = await deleteWorkflowNode(agentName, apiToken, toolArgs?.workflow_id, toolArgs?.node_id)
          break
        case 'add_workflow_connection':
          result = await addWorkflowConnection(agentName, apiToken, toolArgs?.workflow_id, {
            sourceId: toolArgs?.source_id,
            targetId: toolArgs?.target_id,
            sourceHandle: toolArgs?.source_handle || '',
            targetHandle: toolArgs?.target_handle || ''
          })
          break
        case 'delete_workflow_connection':
          result = await deleteWorkflowConnection(agentName, apiToken, toolArgs?.workflow_id, toolArgs?.connection_id)
          break
        case 'bulk_save_workflow':
          result = await bulkSaveWorkflow(agentName, apiToken, toolArgs?.workflow_id, {
            nodes: toolArgs?.nodes,
            connections: toolArgs?.connections
          })
          break
        case 'export_workflow':
          result = await exportWorkflow(agentName, apiToken, toolArgs?.workflow_id)
          break
        case 'import_workflow':
          result = await importWorkflow(agentName, apiToken, {
            boardId: toolArgs?.board_id,
            workflowJson: toolArgs?.workflow_json,
            name: toolArgs?.name
          })
          break
        case 'execute_workflow':
          result = await executeWorkflow(agentName, apiToken, toolArgs?.workflow_id, toolArgs?.trigger_data)
          break
        // Issue tools
        case 'get_issues':
          result = await getIssues(agentName, apiToken, toolArgs?.status, toolArgs?.limit, toolArgs?.page)
          break
        case 'get_issue':
          result = await getIssue(agentName, apiToken, toolArgs?.issue_id)
          break
        case 'create_issue':
          result = await createIssue(agentName, apiToken, {
            title: toolArgs?.title,
            description: toolArgs?.description
          })
          break
        case 'update_issue':
          result = await updateIssue(agentName, apiToken, toolArgs?.issue_id, {
            title: toolArgs?.title,
            description: toolArgs?.description
          })
          break
        case 'update_issue_status':
          result = await updateIssueStatus(agentName, apiToken, toolArgs?.issue_id, toolArgs?.status)
          break
        default:
          throw new Error(`Unknown tool: ${name}`)
      }
      
      res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(result) }] }
      })
      console.log(`[MCP] ✅ ${name}`)
      return
    }
    
    res.json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } })
  } catch (error: any) {
    // Auth errors: return non-retryable error with clear message
    
    if (error instanceof AuthMissingError) {
      console.warn(`[MCP] ⚠️ Auth missing: ${error.message}`)
      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `⚠️ ${error.message}`
          }],
          isError: true
        }
      })
      return
    }

    if (error instanceof AuthCooldownError) {
      console.warn(`[MCP] ⏳ Auth cooldown: ${error.message}`)
      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `⛔ ${error.message}\n\nThis is NOT a retryable error. Please verify your api_token before trying again.`
          }],
          isError: true
        }
      })
      return
    }

    if (error instanceof AuthFailedError) {
      console.error(`[MCP] 🔒 Auth failed: ${error.message}`)
      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `🔒 ${error.message}\n\nDo NOT retry immediately. Wait at least 2 seconds, and verify your api_token is correct.`
          }],
          isError: true
        }
      })
      return
    }

    console.error(`[MCP] ❌ ${error.message}`)
    res.json({ jsonrpc: '2.0', id, error: { code: -32603, message: error.message } })
  }
}

app.all('/mcp', (req, res) => {
  console.log(`[MCP] 🌐 ${req.method} ${req.url}`)
  // Only log query params if they exist or have undefined values
  const hasQueryParams = req.query && Object.keys(req.query).length > 0
  const hasUndefinedQuery = hasQueryParams && Object.values(req.query).some(v => v === undefined)
  if (hasUndefinedQuery || (!hasQueryParams && req.query !== undefined)) {
    console.log(`[MCP] 📥 Query Params:`, JSON.stringify(req.query, null, 2))
  }
  console.log(`[MCP] 📥 Body Type:`, typeof req.body)
  console.log(`[MCP] 📥 Body Empty:`, Object.keys(req.body || {}).length === 0)
  handleRequest(req, res)
})

const PORT = process.env.PORT || process.env.MCP_SERVER_PORT || '3000'
const BOTDECK_API_URL = process.env.BOTDECK_API_URL || 'Not configured'

app.listen(parseInt(PORT), () => {
  console.log(`
╔════════════════════════════════════════════╗
║       BotDeck MCP Server Started          ║
╠════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}/mcp                ║
║  API: ${BOTDECK_API_URL.padEnd(40)} ║
║  Time: ${new Date().toISOString().split('T')[0]}                      ║
╚════════════════════════════════════════════╝
  `)
})
