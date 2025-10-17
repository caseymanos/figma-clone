#!/usr/bin/env node

/**
 * Test script for AI Canvas API
 * Tests that the Edge function returns proper tool calls
 */

const API_URL = 'https://figma-clone-jc3zu4ip3-ralc.vercel.app/api/ai/canvas'

async function testAIAPI() {
  console.log('🧪 Testing AI Canvas API...\n')

  const testPrompt = 'create 2 circles'
  console.log(`📝 Prompt: "${testPrompt}"`)
  console.log(`🌐 URL: ${API_URL}\n`)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: testPrompt,
        canvasId: 'test-canvas',
        selectedIds: [],
      }),
    })

    if (!response.ok) {
      console.error('❌ API returned error:', response.status, response.statusText)
      const text = await response.text()
      console.error('Response:', text.substring(0, 500))
      process.exit(1)
    }

    console.log('✅ API responded successfully\n')
    console.log('📡 Streaming response...\n')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    const toolCalls = []
    let lineCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        lineCount++
        
        try {
          let json
          if (line.includes(':')) {
            const colonIndex = line.indexOf(':')
            json = JSON.parse(line.slice(colonIndex + 1))
          } else {
            json = JSON.parse(line)
          }

          if (json.type === 'tool-call' || json.type === 'tool_call') {
            toolCalls.push(json)
            console.log(`🔧 Tool call ${toolCalls.length}:`, json.toolName, JSON.stringify(json.args, null, 2))
          } else {
            console.log(`📦 Event:`, json.type || 'unknown', JSON.stringify(json).substring(0, 100))
          }
        } catch (e) {
          console.log(`⚠️  Could not parse line:`, line.substring(0, 100))
        }
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Total lines: ${lineCount}`)
    console.log(`   Tool calls: ${toolCalls.length}`)
    
    if (toolCalls.length > 0) {
      console.log('\n✅ TEST PASSED: Tool calls received')
      console.log('\nTool calls:', JSON.stringify(toolCalls, null, 2))
    } else {
      console.log('\n❌ TEST FAILED: No tool calls received')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error(error)
    process.exit(1)
  }
}

testAIAPI()

