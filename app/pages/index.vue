<script setup lang="ts"></script>

<template>
  <main
    id="main-content"
    class="mx-auto flex w-full max-w-[1280px] flex-col items-center px-6 pb-24 pt-16 sm:pt-24"
  >
    <!-- Status badge -->
    <span
      class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground shadow-sm"
    >
      <span class="h-2 w-2 rounded-full bg-success"></span>
      V2.4 Engine Active
    </span>

    <!-- Headline -->
    <h1
      class="mt-8 text-center font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl"
    >
      Plain English.
      <br />
      <span class="text-primary">Powerful Rules.</span>
    </h1>

    <p class="mt-6 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">
      Describe a fraud rule in a sentence. RuleForge drafts it, checks it for contradictions, and
      previews its impact on your orders in seconds.
    </p>

    <!-- Actions -->
    <div class="mt-10 flex flex-col gap-3 sm:flex-row">
      <NuxtLink
        to="/builder"
        class="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Open the builder
        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M4 10h12M11 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </NuxtLink>
      <NuxtLink
        to="/tutorial"
        class="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 text-primary" fill="currentColor" aria-hidden="true">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 6.5l6 3.5-6 3.5v-7z" />
        </svg>
        New here? Take the tutorial
      </NuxtLink>
    </div>

    <!-- How it works -->
    <h2 class="sr-only">How it works</h2>
    <div class="relative mt-16 grid w-full gap-6 lg:mt-24 lg:grid-cols-3 lg:gap-8">
      <span aria-hidden="true" class="absolute left-1/3 top-[54px] hidden h-px w-10 -translate-x-1/2 bg-border lg:block"></span>
      <span aria-hidden="true" class="absolute left-2/3 top-[54px] hidden h-px w-10 -translate-x-1/2 bg-border lg:block"></span>

      <!-- 1. Describe it -->
      <article class="rounded-xl border border-border bg-card p-6">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <svg viewBox="0 0 20 20" class="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M4 3h12a2 2 0 012 2v8a2 2 0 01-2 2H8l-4 3v-3H4a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          </span>
          <h3 class="font-display text-lg font-semibold text-foreground">1. Describe it</h3>
        </div>
        <hr class="my-4 border-border" />
        <p class="text-sm leading-relaxed text-muted-foreground">
          Write the rule the way you'd explain it to a colleague. An agent turns it into a
          structured rule — no query language, no dragging boxes around.
        </p>
        <span
          class="mt-4 inline-block rounded-md bg-secondary px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          What you type
        </span>
        <p class="mt-2 rounded-lg border border-border bg-muted p-4 font-mono text-[13px] leading-relaxed text-foreground">
          Flag orders over $500 shipping to a different country than billing, from accounts under 7
          days old.
        </p>
      </article>

      <!-- 2. We pressure-test it -->
      <article class="rounded-xl border border-border bg-card p-6">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <svg viewBox="0 0 20 20" class="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M10 1.5 3 4v5c0 4.2 2.9 8 7 9 4.1-1 7-4.8 7-9V4l-7-2.5Z" />
            </svg>
          </span>
          <h3 class="font-display text-lg font-semibold text-primary">2. We pressure-test it</h3>
        </div>
        <hr class="my-4 border-border" />
        <p class="text-sm leading-relaxed text-muted-foreground">
          A reviewer agent checks the draft and fixes it automatically before you ever see it.
        </p>
        <ul class="mt-4 flex flex-col gap-3 text-sm">
          <li
            v-for="check in ['No conditions that cancel each other out', 'No branch that can never fire', 'Actually does what you asked for']"
            :key="check"
            class="flex items-center justify-between gap-2"
          >
            <span class="flex items-center gap-2 text-foreground">
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-success"></span>
              {{ check }}
            </span>
            <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-success" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M4 10.5l4 4 8-9" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </li>
        </ul>
      </article>

      <!-- 3. See the impact -->
      <article class="rounded-xl border border-border bg-card p-6">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-md bg-success/10 text-success">
            <svg viewBox="0 0 20 20" class="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M3 3h2v12h12v2H3V3Zm4 8 3-4 3 3 4-6 1.6 1.2L14 14l-3-3-2.8 3.7L7 11Z" />
            </svg>
          </span>
          <h3 class="font-display text-lg font-semibold text-foreground">3. See the impact</h3>
        </div>
        <hr class="my-4 border-border" />
        <p class="text-sm leading-relaxed text-muted-foreground">
          The rule runs against real order data right away, so you can see what it would catch
          before it goes live.
        </p>
        <div class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg border border-border bg-muted p-2">
            <p class="font-display text-lg font-semibold text-success">331</p>
            <p class="text-[11px] text-muted-foreground">Allow</p>
          </div>
          <div class="rounded-lg border border-border bg-muted p-2">
            <p class="font-display text-lg font-semibold text-warning">52</p>
            <p class="text-[11px] text-muted-foreground">Review</p>
          </div>
          <div class="rounded-lg border border-border bg-muted p-2">
            <p class="font-display text-lg font-semibold text-destructive">17</p>
            <p class="text-[11px] text-muted-foreground">Block</p>
          </div>
        </div>
        <p class="mt-3 rounded-lg bg-secondary px-3 py-2 text-[13px] leading-relaxed text-secondary-foreground">
          “Orders over $500 shipping to a country that doesn't match billing, from accounts less
          than a week old, are sent for review. Everything else is allowed.”
        </p>
        <details class="group mt-3">
          <summary class="cursor-pointer list-none text-xs font-medium text-primary hover:underline">
            <span class="group-open:hidden">▸ View the compiled query</span>
            <span class="hidden group-open:inline">▾ Hide compiled query</span>
          </summary>
          <pre class="mt-2 overflow-x-auto rounded-lg bg-[#111827] p-4 font-mono text-[11px] leading-relaxed"><code><span class="text-slate-400">{</span> <span class="text-sky-300">"$addFields"</span><span class="text-slate-400">: {</span>
  <span class="text-sky-300">"action"</span><span class="text-slate-400">: {</span> <span class="text-sky-300">"$switch"</span><span class="text-slate-400">: {</span>
    <span class="text-sky-300">"branches"</span><span class="text-slate-400">: [{ </span><span class="text-sky-300">"case"</span><span class="text-slate-400">: {</span> <span class="text-rose-400">"$and"</span><span class="text-slate-400">: [</span>
      <span class="text-slate-400">{</span> <span class="text-rose-400">"$gt"</span><span class="text-slate-400">: [</span><span class="text-emerald-300">"$amountCents"</span><span class="text-slate-400">,</span> <span class="text-orange-400">50000</span><span class="text-slate-400">] },</span>
      <span class="text-slate-400">{</span> <span class="text-rose-400">"$ne"</span><span class="text-slate-400">: [</span><span class="text-emerald-300">"$shippingCountry"</span><span class="text-slate-400">,</span>
              <span class="text-emerald-300">"$billingCountry"</span><span class="text-slate-400">] },</span>
      <span class="text-slate-400">{</span> <span class="text-rose-400">"$lt"</span><span class="text-slate-400">: [</span><span class="text-emerald-300">"$accountAgeDays"</span><span class="text-slate-400">,</span> <span class="text-orange-400">7</span><span class="text-slate-400">] }</span>
    <span class="text-slate-400">] },</span> <span class="text-sky-300">"then"</span><span class="text-slate-400">:</span> <span class="text-emerald-300">"review"</span> <span class="text-slate-400">}],</span>
    <span class="text-sky-300">"default"</span><span class="text-slate-400">:</span> <span class="text-emerald-300">"allow"</span>
  <span class="text-slate-400">} }</span>
<span class="text-slate-400">} }</span></code></pre>
        </details>
      </article>
    </div>
  </main>
</template>
