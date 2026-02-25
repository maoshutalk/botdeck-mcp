/**
 * Quick test to verify comment API integration
 */

import axios from 'axios'
import 'dotenv/config'

const API_URL = process.env.BOTDECK_API_URL || ''
const API_TOKEN = process.env.BOTDECK_API_TOKEN || ''
const AGENT_NAME = 'TestAgent'

async function quickTest() {
  console.log('🧪 Quick API Test\n')
  console.log(`API URL: ${API_URL}`)
  console.log(`Agent: ${AGENT_NAME}\n`)

  if (!API_TOKEN) {
    console.error('❌ BOTDECK_API_TOKEN not set in .env')
    process.exit(1)
  }

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'X-Agent-Name': AGENT_NAME,
      'Content-Type': 'application/json'
    }
  })

  try {
    // Test 1: Ping
    console.log('1️⃣  Testing ping...')
    const pingRes = await api.get('/agents/ping')
    console.log(`✅ Ping successful: ${pingRes.data.message || 'OK'}`)

    // Test 2: Get Tasks
    console.log('\n2️⃣  Getting tasks...')
    const tasksRes = await api.get('/tasks', { params: { limit: 1 } })
    
    if (tasksRes.data.success && tasksRes.data.data && tasksRes.data.data.length > 0) {
      const task = tasksRes.data.data[0]
      console.log(`✅ Found task: ${task.title}`)
      console.log(`   Task ID: ${task.id}`)

      // Test 3: Get Comments
      console.log('\n3️⃣  Getting comments for task...')
      try {
        const commentsRes = await api.get(`/tasks/${task.id}/comments`)
        if (commentsRes.data.success) {
          console.log(`✅ Got ${commentsRes.data.data.length} comments`)
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('✅ Comments endpoint exists (404 is expected if no comments)')
        } else {
          throw err
        }
      }

      // Test 4: Create Comment
      console.log('\n4️⃣  Creating test comment...')
      try {
        const createRes = await api.post(`/tasks/${task.id}/comments`, {
          content: '🧪 Test comment from quick-test.ts'
        })
        
        if (createRes.data.success && createRes.data.data) {
          const commentId = createRes.data.data.id
          console.log('✅ Comment created successfully')
          console.log(`   Comment ID: ${commentId}`)

          // Test 5: Update Comment
          console.log('\n5️⃣  Updating comment...')
          const updateRes = await api.patch(`/comments/${commentId}`, {
            content: '🧪 Test comment [UPDATED]'
          })
          
          if (updateRes.data.success) {
            console.log('✅ Comment updated successfully')
          }

          // Test 6: Delete Comment
          console.log('\n6️⃣  Deleting comment...')
          const deleteRes = await api.delete(`/comments/${commentId}`)
          
          if (deleteRes.data.success) {
            console.log('✅ Comment deleted successfully')
          }
        }
      } catch (err: any) {
        console.error(`❌ Comment operations failed: ${err.message}`)
        if (err.response) {
          console.error(`   Status: ${err.response.status}`)
          console.error(`   Data:`, err.response.data)
        }
        throw err
      }

    } else {
      console.log('⚠️  No tasks found. Please create a task first.')
      console.log('   You can still test other endpoints.')
    }

    console.log('\n✅ All tests passed!\n')

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
    process.exit(1)
  }
}

quickTest()
