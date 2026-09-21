<template>
  <RouterView />
  <GlobalAlertsProvider />
</template>

<script setup>
import { RouterView } from 'vue-router';
import GlobalAlertsProvider from './components/GlobalAlertsProvider.vue';
</script>