<template>
  <div class="custom-multiselect" ref="dropdownRef">
    <button
      type="button"
      class="multiselect-toggle"
      :class="{ disabled: disabled }"
      @click="toggleDropdown"
      :disabled="disabled"
    >
      <span class="selected-text">{{ selectedText }}</span>
      <span class="arrow" :class="{ up: isOpen }">▼</span>
    </button>
    <div v-if="isOpen" class="dropdown-menu">
      <div v-if="options.length === 0" class="no-options">لا توجد خيارات</div>
      <label
        v-for="option in options"
        :key="option.value"
        class="dropdown-item"
        :class="{ selected: isSelected(option.value) }"
      >
        <input
          type="checkbox"
          :value="option.value"
          :checked="isSelected(option.value)"
          @change="toggleSelection(option.value)"
        />
        <span class="checkbox-box"></span>
        <span class="label-text">{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: {
    type: [Array, String, Number],
    default: () => []
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'اختيار...'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const dropdownRef = ref(null);

const safeModelValue = computed(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue;
  if (typeof props.modelValue === 'string') {
    if (!props.modelValue.trim()) return [];
    try {
      const parsed = JSON.parse(props.modelValue);
      return Array.isArray(parsed) ? parsed : [props.modelValue];
    } catch {
      return [props.modelValue];
    }
  }
  if (props.modelValue !== null && props.modelValue !== undefined) {
    return [props.modelValue];
  }
  return [];
});

const selectedText = computed(() => {
  const vals = safeModelValue.value;
  if (vals.length === 0) {
    return props.placeholder;
  }
  
  const selectedOptions = props.options.filter(o => {
    return vals.some(val => val == o.value);
  });
  
  if (selectedOptions.length > 0) {
    return selectedOptions.map(o => o.label).join(', ');
  }
  
  return `${vals.length} مختار`;
});

const isSelected = (val) => {
  return safeModelValue.value.some(item => item == val);
};

const toggleSelection = (val) => {
  let newValue = [...safeModelValue.value];
  const existingIndex = newValue.findIndex(item => item == val);
  
  if (existingIndex !== -1) {
    newValue.splice(existingIndex, 1);
  } else {
    newValue.push(val);
  }
  emit('update:modelValue', newValue);
  emit('change', newValue);
};

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<style scoped>
.custom-multiselect {
  position: relative;
  width: 100%;
  font-family: inherit;
}

.multiselect-toggle {
  width: 100%;
  padding: 6px 10px;
  background-color: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  min-height: 32px;
  text-align: right;
  transition: border-color 0.2s;
}

/* Match the input styles of the parent */
:deep(.spreadsheet-table) .multiselect-toggle {
  background-color: transparent;
}
.multiselect-toggle:hover:not(.disabled) {
  background-color: #f5f5f5;
}
.multiselect-toggle.disabled {
  background-color: #f1f3f4;
  cursor: not-allowed;
  color: #666;
}

.selected-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2c3e50; /* تأكيد اللون الداكن حتى لا يختفي مع الخلفية البيضاء */
}

.arrow {
  font-size: 8px;
  color: #666;
  transition: transform 0.2s;
}
.arrow.up {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  min-width: 150px;
  text-align: right;
}

.no-options {
  padding: 10px;
  text-align: center;
  color: #999;
  font-size: 11px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.1s;
}
.dropdown-item:hover {
  background: #f5f5f5;
}
.dropdown-item.selected {
  background: #e3f2fd;
}

.dropdown-item input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-box {
  width: 14px;
  height: 14px;
  border: 1px solid #ccc;
  border-radius: 3px;
  margin-left: 8px;
  position: relative;
  background: #fff;
  flex-shrink: 0;
}
.dropdown-item input:checked + .checkbox-box {
  background: #2196f3;
  border-color: #2196f3;
}
.dropdown-item input:checked + .checkbox-box::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.label-text {
  font-size: 11px;
  color: #333;
  user-select: none;
}
</style>
