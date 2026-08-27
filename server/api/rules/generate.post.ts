import { runRuleGenerationPipeline } from '../../utils/agents/pipeline'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const description = body?.description
  if (!description || typeof description !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing description' })
  }

  const eventStream = createEventStream(event)

  ;(async () => {
    try {
      for await (const pipelineEvent of runRuleGenerationPipeline(description)) {
        await eventStream.push(JSON.stringify(pipelineEvent))
      }
    } catch (err) {
      await eventStream.push(
        JSON.stringify({
          stage: 'error',
          message: err instanceof Error ? err.message : 'Unexpected error',
        })
      )
    } finally {
      await eventStream.close()
    }
  })()

  return eventStream.send()
})
