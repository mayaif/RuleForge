// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI || '',
    mongodbDb: process.env.MONGODB_DB || 'ruleforge',
    groqApiKey: process.env.GROQ_API_KEY || '',
  },
  app: {
    head: {
      title: 'RuleForge',
      meta: [
        {
          name: 'description',
          content:
            'A no-code fraud/risk rule builder for e-commerce orders, with an AI intent agent, validator, and explainer.',
        },
      ],
    },
  },
})
