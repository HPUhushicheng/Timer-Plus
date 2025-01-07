<template>
  <div class="doc-editor">
    <div class="toolbar">
      <div class="tool-group">
        <button 
          v-for="tool in tools" 
          :key="tool.id"
          class="tool-btn"
          @click="tool.action"
        >
          <i :class="tool.icon"></i>
          {{ tool.name }}
        </button>
      </div>
    </div>
    
    <div class="editor-container">
      <div class="editor-main">
        <!-- 编辑器主体 -->
        <div class="editor-content" contenteditable="true">
          <!-- 编辑区域 -->
        </div>
        
        <!-- 实时建议面板 -->
        <div class="suggestion-panel">
          <div class="suggestion-card" v-for="suggestion in suggestions" :key="suggestion.id">
            <span class="suggestion-type">{{ suggestion.type }}</span>
            <p class="suggestion-content">{{ suggestion.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-editor {
  @apply h-screen flex flex-col bg-gray-50;
}

.toolbar {
  @apply bg-white border-b border-gray-200 p-2 flex items-center;
}

.tool-btn {
  @apply px-4 py-2 rounded-md hover:bg-blue-50 transition-colors
         flex items-center gap-2 text-gray-700 hover:text-blue-600;
}

.editor-container {
  @apply flex-1 flex overflow-hidden;
}

.editor-main {
  @apply flex-1 flex gap-4 p-6;
}

.editor-content {
  @apply flex-1 bg-white rounded-lg shadow-lg p-8 
         min-h-[calc(100vh-12rem)] outline-none;
}

.suggestion-panel {
  @apply w-80 space-y-4;
}

.suggestion-card {
  @apply bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500
         hover:transform hover:scale-102 transition-all;
}
</style>
