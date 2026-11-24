<template>
  <div class="templates-page-view" dir="rtl">
    <!-- مساحة العمل الرئيسية للمكون المستقل -->
    <main class="page-main-content">
      <NotificationTemplatesTab />
    </main>
  </div>
</template>

<script setup>
import NotificationTemplatesTab from '@/components/settings/NotificationTemplatesTab.vue';
</script>

<style scoped>
.templates-page-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 100%;
  color: #f1f5f9;
  font-family: inherit;
  padding-bottom: 5rem;
  width: 100%;
  max-width: 100%;
}

.page-main-content {
  width: 100%;
}
</style>

