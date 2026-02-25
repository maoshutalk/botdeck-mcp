// Path: /Users/jin/Documents/repo/nightbuilder/apps/botdeck/mcp-server/src/tools/index.ts

import axios from 'axios'
import 'dotenv/config'

const API_URL = process.env.BOTDECK_API_URL || ''

// Auth failure cooldown: prevent rapid retries on 401 errors
const AUTH_COOLDOWN_MS = 2000
const authFailureMap = new Map<string, number>() // key -> timestamp of last 401

function getAuthCooldownKey(agentName: string, apiToken: string): string {
  // Use agent name + last 8 chars of token as key
  const tokenSuffix = apiToken.length > 8 ? apiToken.slice(-8) : apiToken
  return `${agentName}:${tokenSuffix}`
}

function checkAuthCooldown(agentName: string, apiToken: string): void {
  const key = getAuthCooldownKey(agentName, apiToken)
  const lastFailure = authFailureMap.get(key)
  if (lastFailure) {
    const elapsed = Date.now() - lastFailure
    if (elapsed < AUTH_COOLDOWN_MS) {
      const waitSec = ((AUTH_COOLDOWN_MS - elapsed) / 1000).toFixed(1)
      throw new AuthCooldownError(
        `Authentication failed recently. Please wait ${waitSec}s before retrying. Check your api_token is valid.`
      )
    }
    // Cooldown expired, clear the record
    authFailureMap.delete(key)
  }
}

function recordAuthFailure(agentName: string, apiToken: string): void {
  const key = getAuthCooldownKey(agentName, apiToken)
  authFailureMap.set(key, Date.now())
}

// Custom error classes for different failure types
export class AuthCooldownError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthCooldownError'
  }
}

export class AuthMissingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthMissingError'
  }
}

export class AuthFailedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthFailedError'
  }
}

function createApiClient(agentName: string, apiToken: string) {
  // Check if apiToken is missing - ONLY from Authorization header
  if (!apiToken || apiToken.trim() === '') {
    throw new AuthMissingError(
      'Authorization header is missing. Please provide token in Authorization header: Authorization: Bearer <token>'
    )
  }
  
  // Check cooldown before creating client
  checkAuthCooldown(agentName, apiToken)

  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': apiToken ? `Bearer ${apiToken}` : '',
      'X-Agent-Name': agentName,
      'Content-Type': 'application/json'
    }
  })

  // Intercept 401 responses to record auth failure and throw clear error
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        recordAuthFailure(agentName, apiToken)
        throw new AuthFailedError(
          'Authentication failed (401). Your api_token is invalid or expired. Please check your token and try again after 2 seconds.'
        )
      }
      throw error
    }
  )

  return client
}

export async function ping(agentName: string, apiToken: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get('/agents/ping')
  return res.data
}

export async function getTaskList(agentName: string, apiToken: string, status?: string, limit: number = 20) {
  const api = createApiClient(agentName, apiToken)
  const params: any = { limit }
  if (status) params.status = status
  const res = await api.get('/tasks', { params })
  return res.data
}

export async function getTask(agentName: string, apiToken: string, taskId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get(`/tasks/${taskId}`)
  return res.data
}

export async function updateTask(agentName: string, apiToken: string, taskId: string, data: {
  status?: string
  assignee_id?: string | null
}) {
  const api = createApiClient(agentName, apiToken)
  const body: any = {}
  if (data.status) body.status = data.status
  if (data.assignee_id !== undefined) body.assigneeId = data.assignee_id
  const res = await api.patch(`/tasks/${taskId}`, body)
  return res.data
}

export async function createTask(agentName: string, apiToken: string, data: {
  title: string
  description: string
  assignee_id: string
  board_id: string
  priority: string
  status: string
}) {
  // Validate required fields for agent mode
  const requiredFields = {
    title: data.title,
    description: data.description,
    assignee_id: data.assignee_id,
    priority: data.priority,
    board_id: data.board_id,
    status: data.status
  }

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value || value === '')
    .map(([key, _]) => key)

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields in agent mode: ${missingFields.join(', ')}. ` +
      `All parameters are REQUIRED: title, description, assigneeId, priority, boardId, status.`
    )
  }

  const api = createApiClient(agentName, apiToken)
  const body: any = {
    title: data.title,
    description: data.description,
    assigneeId: data.assignee_id,
    boardId: data.board_id,
    priority: data.priority,
    status: data.status
  }
  const res = await api.post('/tasks', body)
  return res.data
}

export async function searchTasks(agentName: string, apiToken: string, query?: string, status?: string) {
  const api = createApiClient(agentName, apiToken)
  const params: any = {}
  if (query) params.query = query
  if (status) params.status = status
  const res = await api.get('/tasks', { params })
  return res.data
}

export async function getProjects(agentName: string, apiToken: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get('/projects')
  return res.data
}

export async function getComments(agentName: string, apiToken: string, taskId: string, limit: number = 10) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get(`/tasks/${taskId}/comments`, { params: { limit } })
  return res.data
}

export async function createComment(agentName: string, apiToken: string, data: {
  task_id: string
  content: string
}) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.post(`/tasks/${data.task_id}/comments`, {
    content: data.content
  })
  return res.data
}

export async function updateComment(agentName: string, apiToken: string, commentId: string, content: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.patch(`/comments/${commentId}`, {
    content
  })
  return res.data
}

export async function deleteComment(agentName: string, apiToken: string, commentId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.delete(`/comments/${commentId}`)
  return res.data
}

export async function getCommentRule(agentName: string, apiToken: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get('/agents/rule/comment')
  return res.data
}

export async function getTaskRule(agentName: string, apiToken: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get('/agents/rule/task')
  return res.data
}

export async function getTaskDependencies(agentName: string, apiToken: string, taskId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get(`/tasks/${taskId}/dependencies`)
  return res.data
}

export async function addTaskDependency(agentName: string, apiToken: string, taskId: string, dependsOnId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.post(`/tasks/${taskId}/dependencies`, { dependsOnId })
  return res.data
}

export async function removeTaskDependency(agentName: string, apiToken: string, taskId: string, dependsOnId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.delete(`/tasks/${taskId}/dependencies/${dependsOnId}`)
  return res.data
}

// ============================================================
// Workflow Tools
// ============================================================

export async function getWorkflows(agentName: string, apiToken: string, boardId?: string) {
  const api = createApiClient(agentName, apiToken)
  const params: any = {}
  if (boardId) params.boardId = boardId
  const res = await api.get('/workflows', { params })
  return res.data
}

export async function getWorkflow(agentName: string, apiToken: string, workflowId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get(`/workflows/${workflowId}`)
  return res.data
}

export async function createWorkflow(agentName: string, apiToken: string, data: {
  name: string
  boardId: string
  description?: string
}) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.post('/workflows', {
    name: data.name,
    boardId: data.boardId,
    description: data.description || ''
  })
  return res.data
}

export async function updateWorkflow(agentName: string, apiToken: string, workflowId: string, data: {
  name?: string
  description?: string
  isActive?: boolean
}) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.put(`/workflows/${workflowId}`, data)
  return res.data
}

export async function deleteWorkflow(agentName: string, apiToken: string, workflowId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.delete(`/workflows/${workflowId}`)
  return res.data
}

export async function addWorkflowNode(agentName: string, apiToken: string, workflowId: string, data: {
  nodeType: string
  name: string
  positionX?: number
  positionY?: number
  config?: Record<string, any>
}) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.post(`/workflows/${workflowId}/nodes`, data)
  return res.data
}

export async function updateWorkflowNode(agentName: string, apiToken: string, workflowId: string, nodeId: string, data: {
  name?: string
  positionX?: number
  positionY?: number
  config?: Record<string, any>
}) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.put(`/workflows/${workflowId}/nodes/${nodeId}`, data)
  return res.data
}

export async function deleteWorkflowNode(agentName: string, apiToken: string, workflowId: string, nodeId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.delete(`/workflows/${workflowId}/nodes/${nodeId}`)
  return res.data
}

export async function addWorkflowConnection(agentName: string, apiToken: string, workflowId: string, data: {
  sourceId: string
  targetId: string
  sourceHandle?: string
  targetHandle?: string
}) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.post(`/workflows/${workflowId}/connections`, data)
  return res.data
}

export async function deleteWorkflowConnection(agentName: string, apiToken: string, workflowId: string, connectionId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.delete(`/workflows/${workflowId}/connections/${connectionId}`)
  return res.data
}

export async function bulkSaveWorkflow(agentName: string, apiToken: string, workflowId: string, data: {
  nodes: Array<{
    id: string
    nodeType: string
    name: string
    positionX: number
    positionY: number
    config?: Record<string, any>
  }>
  connections: Array<{
    sourceId: string
    targetId: string
    sourceHandle?: string
    targetHandle?: string
  }>
}) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.put(`/workflows/${workflowId}/bulk-save`, data)
  return res.data
}

export async function exportWorkflow(agentName: string, apiToken: string, workflowId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get(`/workflows/${workflowId}/export`)
  return res.data
}

export async function importWorkflow(agentName: string, apiToken: string, data: {
  boardId: string
  workflowJson: any
  name?: string
}) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.post('/workflows/import', data)
  return res.data
}

export async function executeWorkflow(agentName: string, apiToken: string, workflowId: string, triggerData?: Record<string, any>) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.post(`/workflows/${workflowId}/execute`, { triggerData })
  return res.data
}

export async function getBoards(agentName: string, apiToken: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get('/boards')
  return res.data
}

// ============================================================
// Issue Tools
// ============================================================

export async function getIssues(agentName: string, apiToken: string, status?: string, limit: number = 20, page: number = 1) {
  const api = createApiClient(agentName, apiToken)
  const params: any = { limit, page }
  if (status) params.status = status
  const res = await api.get('/issues', { params })
  return res.data
}

export async function getIssue(agentName: string, apiToken: string, issueId: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.get(`/issues/${issueId}`)
  return res.data
}

export async function createIssue(agentName: string, apiToken: string, data: {
  title: string
  description?: string
}) {
  // Validate required fields
  if (!data.title || data.title.trim() === '') {
    throw new Error('title is required for creating an issue')
  }

  const api = createApiClient(agentName, apiToken)
  const body: any = {
    title: data.title
  }
  if (data.description) body.description = data.description
  const res = await api.post('/issues', body)
  return res.data
}

export async function updateIssue(agentName: string, apiToken: string, issueId: string, data: {
  title?: string
  description?: string
}) {
  const api = createApiClient(agentName, apiToken)
  const body: any = {}
  if (data.title !== undefined) body.title = data.title
  if (data.description !== undefined) body.description = data.description
  const res = await api.put(`/issues/${issueId}`, body)
  return res.data
}

export async function updateIssueStatus(agentName: string, apiToken: string, issueId: string, status: string) {
  const api = createApiClient(agentName, apiToken)
  const res = await api.patch(`/issues/${issueId}/status`, { status })
  return res.data
}
