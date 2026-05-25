<template>
  <div class="empty-state">
    <img alt="Renoir" class="empty-portrait" src="/img/renoir-full.png" />
    <div class="empty-title">Bonjour! I'm Renoir.</div>
    <div class="empty-hint">
      Your authoring assistant. Try a slash command, or ask me anything about
      this repository. I see what's open in the editor and can act on it
      directly.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: rgb(var(--v-theme-on-surface));
  text-align: center;
}

.empty-portrait {
  display: block;
  width: 10rem;
  height: auto;
}

.empty-title {
  margin: 0.875rem 0 0.375rem;
  color: rgb(var(--v-theme-on-surface));
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.empty-hint {
  max-width: 21.25rem;
  opacity: 0.7;
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
