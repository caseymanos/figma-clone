# Vercel AI SDK Tools Investigation

## Problem
The AI canvas feature was experiencing compilation errors on Vercel deployments, with TypeScript errors related to tool definitions. The user reported "the ai just runs forever" indicating runtime failures.

## Root Cause
Incorrect understanding of the Vercel AI SDK's `streamText` + tools API, specifically:
1. The difference between `Tool` type (uses `inputSchema`) and `tool()` function (uses `parameters`)
2. The requirement for `execute` functions in `ToolSet` type
3. The correct response method for streaming

## Investigation Findings

### Key Type Definitions

#### Tool Type (from `@ai-sdk/provider-utils`)
```typescript
type Tool<INPUT, OUTPUT> = {
  description?: string;
  inputSchema: FlexibleSchema<INPUT>;  // Note: inputSchema, not parameters
  // ... other properties
} & ToolOutputProperties<INPUT, OUTPUT>
```

#### ToolSet Type (from `ai` package)
```typescript
type ToolSet = Record<string, Tool & Pick<Tool<any, any>, 'execute' | ...>>
```
**Critical**: `ToolSet` requires tools to have the `execute` property!

#### tool() Helper Function
The `tool()` helper function from Vercel AI SDK accepts:
- `parameters` (not `inputSchema`) - this is syntactic sugar
- `execute` function for tool execution
- Returns a properly typed `Tool` object

### Correct Pattern for Client-Side Tool Execution

When using `streamText` with tools that should be executed client-side:

```typescript
import { streamText, tool } from 'ai'
import { z } from 'zod'

const tools = {
  createShape: tool({
    description: 'Create a new shape...',
    parameters: z.object({  // Use 'parameters', not 'inputSchema'
      type: z.enum(['rect', 'circle', 'text']),
      x: z.number(),
      y: z.number(),
    }),
    execute: async (params) => params,  // Return params for client handling
  }),
}

const result = streamText({
  model: openai('gpt-4o-mini'),
  prompt: 'Create a rectangle',
  tools,
  maxSteps: 5,  // Allow multi-step reasoning
})

return result.toDataStreamResponse()  // For streaming with tool calls
```

### Response Methods

- `toDataStreamResponse()` - **Correct** for streaming with tool calls
- `toTextStreamResponse()` - For text-only streaming (no tools)
- `toDataStream()` - **Does not exist** on `StreamTextResult`

### What Didn't Work

1. ❌ Using raw `Tool` type without `tool()` wrapper
2. ❌ Using `CoreTool` type (doesn't exist in package exports)
3. ❌ Omitting `execute` function (required by `ToolSet`)
4. ❌ Using `inputSchema` directly (tool() expects `parameters`)
5. ❌ Using `maxToolRoundtrips` (doesn't exist, use `maxSteps`)
6. ❌ Using `toTextStreamResponse()` with tools (use `toDataStreamResponse()`)

## Solution

Use the `tool()` helper function with:
1. `parameters` property (Zod schema)
2. `execute` function that returns params for client-side execution
3. `toDataStreamResponse()` for streaming response
4. `maxSteps` for multi-step tool calling

## Package Versions
- `ai`: 5.0.75
- `@ai-sdk/openai`: 2.0.52
- `@ai-sdk/provider-utils`: 3.0.12

## Deployment
- Successful deployment: https://figma-clone-5smqqpaqr-ralc.vercel.app
- Build time: 28 seconds
- Status: ● Ready

## Related Files
- `/web/api/ai/canvas.ts` - Edge function with tool definitions
- `/web/src/components/AIPanel.tsx` - Client-side tool execution handler

## Lessons Learned

1. **Use the documentation examples** - The Vercel AI SDK docs show `tool()` with `parameters` and `execute`
2. **Type definitions can be misleading** - The underlying `Tool` type uses `inputSchema`, but the `tool()` helper uses `parameters`
3. **ToolSet requires execute** - Even for client-side execution, a no-op `execute` returning params is required
4. **Local success ≠ Vercel success** - Always test on Vercel, as type checking may differ

## References
- Vercel AI SDK Docs: https://ai-sdk.dev/docs
- GitHub Issues: https://github.com/vercel/ai/issues
- Type definitions: `node_modules/ai/dist/index.d.ts`

