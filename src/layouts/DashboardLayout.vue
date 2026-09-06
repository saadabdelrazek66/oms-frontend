<template>
  <div class="layout-wrapper" dir="rtl">
    <div
      v-if="isSidebarOpen && isMobile"
      class="sidebar-overlay"
      aria-hidden="true"
      @click="closeSidebar"
    ></div>

    <aside
      id="app-sidebar"
      class="sidebar-container"
      :class="{ open: isSidebarOpen }"
      :aria-hidden="isSidebarHidden"
      :inert="isSidebarHidden"
    >
      <Sidebar @close="closeSidebar" @navigate="handleNavigation" />
    </aside>

    <div class="main-content">
      <Navbar
        :sidebar-open="isSidebarOpen"
        @toggle-sidebar="toggleSidebar"
      />
      <main class="page-content">
        <div class="content-glow content-glow-one" aria-hidden="true"></div>
        <div class="content-glow content-glow-two" aria-hidden="true"></div>
        <div class="page-inner">
          <router-view v-slot="{ Component, route: viewRoute }">
            <component :is="Component" :key="viewRoute.fullPath" />
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import Navbar from '../components/Navbar.vue'

const MOBILE_QUERY = '(max-width: 760px)'
const isSidebarOpen = ref(true)
const isMobile = ref(false)
const route = useRoute()
let mediaQuery

const isSidebarHidden = computed(() => !isSidebarOpen.value)

const updateViewportState = (event) => {
  isMobile.value = event.matches

  // Keep the Sidebar open by default on desktop and closed by default on mobile.
  isSidebarOpen.value = !event.matches
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const handleNavigation = () => {
  // Keep the desktop Sidebar visible; close it only after a mobile link click.
  if (isMobile.value) closeSidebar()
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && isSidebarOpen.value && isMobile.value) {
    closeSidebar()
  }
}

watch(
  () => route.fullPath,
  () => {
    if (isMobile.value) closeSidebar()
  },
  { flush: 'post' },
)
watch(isSidebarOpen, (open) => {
  if (!isMobile.value) return
  document.body.classList.toggle('sidebar-is-open', open)
})

onMounted(() => {
  mediaQuery = window.matchMedia(MOBILE_QUERY)
  isMobile.value = mediaQuery.matches
  isSidebarOpen.value = !isMobile.value
  mediaQuery.addEventListener('change', updateViewportState)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateViewportState)
  window.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('sidebar-is-open')
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:root {
  color-scheme: dark;
  font-family: 'Cairo', sans-serif;
  background: #080d29;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
}

body {
  margin: 0;
  background: #080d29;
}

body.sidebar-is-open {
  overflow: hidden;
}

button,
input,
textarea,
select {
  font: inherit;
}

.layout-wrapper {
  min-height: 100vh;
  display: flex;
  background: #080d29;
}

.sidebar-container {
  flex: 0 0 286px;
  position: sticky;
  top: 0;
  z-index: 50;
  width: 286px;
  height: 100vh;
  overflow: hidden;
  transition: width .28s ease, flex-basis .28s ease;
}

.sidebar-container > .sidebar {
  height: 100%;
  min-height: 100vh;
}

.main-content {
  min-width: 0;
  min-height: 100vh;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 86% 0%, rgba(91, 61, 180, .12), transparent 32%),
    #0a1030;
}

.main-content > .navbar {
  position: sticky;
  top: 0;
  z-index: 20;
}

.page-content {
  position: relative;
  flex: 1 1 auto;
  min-height: calc(100vh - 82px);
  padding: clamp(20px, 3vw, 38px);
  overflow-x: clip;
  background: linear-gradient(145deg, rgba(15, 22, 62, .74), rgba(8, 13, 41, .94));
}

.page-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
}

.content-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(20px);
  opacity: .12;
}

.content-glow-one {
  width: 380px;
  height: 380px;
  top: -230px;
  left: 8%;
  background: #8a57e8;
}

.content-glow-two {
  width: 270px;
  height: 270px;
  right: -180px;
  bottom: -150px;
  background: #42dace;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(3, 6, 24, .68);
  backdrop-filter: blur(3px);
}

@media (max-width: 760px) {
  .layout-wrapper {
    display: block;
  }

  .sidebar-container {
    position: fixed;
    inset: 0 0 0 auto;
    z-index: 150;
    width: min(286px, 88vw);
    height: 100dvh;
    transform: translate3d(105%, 0, 0);
    transition: transform .28s ease;
    box-shadow: -18px 0 50px rgba(0, 0, 0, .35);
    will-change: transform;
  }

  .sidebar-container.open {
    transform: translate3d(0, 0, 0);
  }

  .sidebar-container > .sidebar {
    min-height: 100%;
    height: 100%;
  }

  .page-content {
    min-height: calc(100dvh - 70px);
    padding: clamp(18px, 5vw, 24px) clamp(14px, 4vw, 20px) 28px;
  }
}

.sidebar-container:not(.open) {
  width: 0;
  flex-basis: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Keep every page modal above both the Sidebar and its mobile overlay. */
:global(.modal-overlay),
:global(.details-overlay),
:global(.image-viewer-overlay),
:global(.toast-message) {
  z-index: 1000 !important;
}

@media (max-width: 760px) {
  .sidebar-container:not(.open) {
    width: min(286px, 88vw);
    flex-basis: auto;
    transform: translate3d(105%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-container {
    transition: none;
  }
}
</style>
