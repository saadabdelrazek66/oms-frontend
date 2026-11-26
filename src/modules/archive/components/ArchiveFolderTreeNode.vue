<template>
  <div class="tree-node-wrap">
    <button
      type="button"
      class="tree-node-btn"
      :class="{ active: selectedId === node.id }"
      :style="{ paddingRight: `${10 + depth * 14}px` }"
      @click="$emit('select', node)"
    >
      <span class="tree-node-icon" :style="{ color: node.color || '#94a3b8' }">
        {{ node.icon || '📁' }}
      </span>
      <span class="tree-node-name">{{ node.name }}</span>
      <span v-if="node.is_system" class="tree-sys-dot" title="مجلد نظام أساسي"></span>
    </button>

    <div v-if="node.children && node.children.length" class="tree-children">
      <ArchiveFolderTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :depth="depth + 1"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'ArchiveFolderTreeNode' });

defineProps({
  node: { type: Object, required: true },
  selectedId: { type: [Number, String, null], default: null },
  depth: { type: Number, default: 0 },
});

defineEmits(['select']);
</script>

<style scoped>
.tree-node-wrap {
  display: flex;
  flex-direction: column;
}

.tree-node-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  text-align: right;
  font-size: 0.85rem;
  transition: background 0.16s ease, color 0.16s ease;
}

.tree-node-btn:hover {
  background: rgba(148, 163, 184, 0.12);
  color: #f8fafc;
}

.tree-node-btn.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.2));
  color: #e0f2fe;
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.35);
}

.tree-node-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.tree-node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-sys-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  opacity: 0.75;
  flex-shrink: 0;
}
</style>
