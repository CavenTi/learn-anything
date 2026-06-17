<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown, highlightCode, getFileExtension, isMarkdownFile } from '../utils/markdown';

export interface SelectedFile {
  path: string;
  content: string;
  type: 'markdown' | 'code';
}

const props = defineProps<{
  file: SelectedFile | null;
}>();

const fileDisplayName = computed(() => {
  if (!props.file) return '';
  return props.file.path.split('/').pop() || '';
});

const fileExt = computed(() => getFileExtension(fileDisplayName.value));

const renderedHtml = computed(() => {
  if (!props.file) return '';
  if (props.file.type === 'markdown') return renderMarkdown(props.file.content);
  return highlightCode(props.file.content, fileExt.value);
});

const isMd = computed(() => props.file?.type === 'markdown');
</script>

<template>
  <div class="h-full">
    <div v-if="!file" class="flex items-center justify-center h-full min-h-75 text-sm text-text-3">
      Select a file from the sidebar to view its content
    </div>

    <!-- Markdown: VitePress-style — no wrapper, content flows -->
    <div v-else-if="isMd" class="prose-content" v-html="renderedHtml" />

    <!-- Code: VitePress code block style -->
    <div v-else class="prose-content rounded-lg overflow-hidden bg-(--color-bg-alt)">
      <div class="flex items-center justify-between px-5 py-2 bg-transparent">
        <span class="text-xs text-text-3 font-mono">{{ fileDisplayName }}</span>
      </div>
      <pre
        class="m-0! p-0! bg-transparent! text-left overflow-x-auto"
      ><code class="block px-6! py-5! leading-[1.7] font-mono text-[0.875em] text-text-2" v-html="renderedHtml" /></pre>
    </div>
  </div>
</template>
