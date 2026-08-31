<template>
  <div class="layout-wrapper" dir="rtl">
    <div v-if="isSidebarOpen" class="sidebar-overlay" aria-hidden="true" @click="isSidebarOpen = false"></div>

    <aside class="sidebar-container" :class="{ open: isSidebarOpen }">
      <Sidebar @close="isSidebarOpen = false" />
    </aside>

    <div class="main-content">
      <Navbar @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      <main class="page-content">
        <div class="content-glow content-glow-one" aria-hidden="true"></div>
        <div class="content-glow content-glow-two" aria-hidden="true"></div>
        <div class="page-inner">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';
import Navbar from '../components/Navbar.vue';

const isSidebarOpen = ref(false);
const route = useRoute();

// إغلاق القائمة تلقائيًا بعد الانتقال إلى صفحة جديدة على الهاتف.
watch(() => route.fullPath, () => {
  isSidebarOpen.value = false;
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:root {
  color-scheme: dark;
  font-family: 'Cairo', sans-serif;
  background: #080d29;
}

* { box-sizing: border-box; }
html, body, #app { min-height: 100%; }
body { margin: 0; background: #080d29; }
button, input { font-family: inherit; }

.layout-wrapper { min-height: 100vh; display: flex; background: #080d29; }
.sidebar-container { flex: 0 0 286px; position: sticky; top: 0; z-index: 30; height: 100vh; }
.sidebar-container > .sidebar { height: 100%; min-height: 100vh; }
.main-content { min-width: 0; min-height: 100vh; flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at 86% 0%, rgba(91, 61, 180, .12), transparent 32%), #0a1030; }
.main-content > .navbar { position: sticky; top: 0; z-index: 20; }
.page-content { position: relative; flex: 1; min-height: calc(100vh - 82px); padding: clamp(20px, 3vw, 38px); overflow: hidden; background: linear-gradient(145deg, rgba(15, 22, 62, .74), rgba(8, 13, 41, .94)); }
.page-inner { position: relative; z-index: 1; width: 100%; max-width: 1500px; margin: 0 auto; }
.content-glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(20px); opacity: .12; }.content-glow-one { width: 380px; height: 380px; top: -230px; left: 8%; background: #8a57e8; }.content-glow-two { width: 270px; height: 270px; right: -180px; bottom: -150px; background: #42dace; }
.sidebar-overlay { display: none; }

@media (max-width: 760px) {
  .layout-wrapper { display: block; }
  .sidebar-container { position: fixed; inset: 0 0 0 auto; z-index: 50; width: min(286px, 88vw); height: 100vh; transform: translateX(105%); transition: transform .28s ease; box-shadow: -18px 0 50px rgba(0,0,0,.35); }
  .sidebar-container.open { transform: translateX(0); }
  .sidebar-container > .sidebar { min-height: 100%; }
  .sidebar-overlay { display: block; position: fixed; inset: 0; z-index: 40; background: rgba(3, 6, 24, .68); backdrop-filter: blur(3px); }
  .page-content { min-height: calc(100vh - 70px); padding: 20px 15px 28px; }
}
</style>
