<template>
  <div class="stats-grid">
    <article class="stat-card">
      <div class="stat-icon teal" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      </div>
      <div class="stat-content">
        <span>إجمالي المهام</span>
        <strong>{{ total }}</strong>
      </div>
      <small>مهمة مسجلة</small>
    </article>

    <article class="stat-card">
      <div class="stat-icon purple" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div class="stat-content">
        <span>المهام النشطة</span>
        <strong>{{ activeCount }}</strong>
      </div>
      <small>قيد التنفيذ والمراجعة</small>
    </article>

    <article class="stat-card">
      <div class="stat-icon orange" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div class="stat-content">
        <span>المهام المكتملة</span>
        <strong>{{ completedCount }}</strong>
      </div>
      <small>تم إنجازها بنجاح</small>
    </article>
  </div>
</template>

<script setup>
defineProps({
  total: { type: Number, default: 0 },
  activeCount: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
})
</script>
