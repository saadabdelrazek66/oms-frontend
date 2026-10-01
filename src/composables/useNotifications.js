import { ref, computed } from 'vue'
import api from '../axios'
import { getEchoInstance } from '../echo'

// State is kept at module scope so all components share the same notifications state (Singleton Composable)
const notifications = ref([])
const unreadCount = ref(0)
const isLoading = ref(false)
const isDropdownOpen = ref(false)
const isMarkingAllAsRead = ref(false)
let isListening = false
let currentSubscribedUserId = null

/**
 * Synthesizes a subtle, pleasant chime using the Web Audio API without needing external audio files.
 */
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // First note: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.1, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.3)

    // Second note: 880 Hz (A5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.1)
    gain2.gain.setValueAtTime(0.12, now + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.1)
    osc2.stop(now + 0.5)
  } catch (e) {
    // Audio autoplay restrictions or errors safely ignored
  }
}

/**
 * Formats timestamps into human-readable Arabic relative time.
 */
export function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 45) return 'الآن'
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return 'منذ دقيقة'
  if (minutes === 2) return 'منذ دقيقتين'
  if (minutes >= 3 && minutes <= 10) return `منذ ${minutes} دقائق`
  if (minutes < 60) return `منذ ${minutes} دقيقة`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return 'منذ ساعة'
  if (hours === 2) return 'منذ ساعتين'
  if (hours >= 3 && hours <= 10) return `منذ ${hours} ساعات`
  if (hours < 24) return `منذ ${hours} ساعة`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'أمس'
  if (days === 2) return 'منذ يومين'
  if (days >= 3 && days <= 10) return `منذ ${days} أيام`
  if (days < 30) return `منذ ${days} يوماً`

  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
}

export function useNotifications() {
  /**
   * Fetches the current unread notifications count from backend:
   * GET /api/notifications/unread-count
   */
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      const count = res.data?.count ?? res.data?.data?.count ?? 0
      unreadCount.value = Number(count)
    } catch (err) {
      console.warn('[Notifications] Could not fetch unread count:', err)
    }
  }

  /**
   * Fetches the notifications list from backend:
   * GET /api/notifications
   */
  const fetchNotifications = async () => {
    isLoading.value = true
    try {
      const res = await api.get('/notifications')
      const payload = res.data
      let list = []
      if (Array.isArray(payload)) {
        list = payload
      } else if (payload && Array.isArray(payload.data)) {
        list = payload.data
      } else if (payload?.notifications && Array.isArray(payload.notifications)) {
        list = payload.notifications
      }
      notifications.value = list
    } catch (err) {
      console.warn('[Notifications] Could not fetch notifications list:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Subscribes to the authenticated user's private channel via Laravel Echo:
   * Echo.private(`App.Models.User.${userId}`).notification(...)
   */
  const initRealtimeListener = () => {
    let userId = localStorage.getItem('user_id')
    if (!userId) {
      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}')
        userId = userObj.id
      } catch (e) {
        // ignore parse error
      }
    }

    if (!userId) {
      return
    }

    // Avoid duplicate subscriptions on the same user
    if (isListening && currentSubscribedUserId === userId) {
      return
    }

    const echo = getEchoInstance()
    if (!echo) {
      return
    }

    // If previously subscribed to a different user, leave channel
    if (currentSubscribedUserId && currentSubscribedUserId !== userId) {
      try {
        echo.leave(`App.Models.User.${currentSubscribedUserId}`)
      } catch (e) {}
    }

    const channelName = `App.Models.User.${userId}`

    echo
      .private(channelName)
      .notification((notification) => {
        // 1. زيادة العداد (unreadCount) بمقدار 1
        unreadCount.value++

        // 2. تطبيع الإشعار وإضافته في بداية مصفوفة الإشعارات (unshift)
        const normalizedItem = {
          id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: notification.type || 'App\\Modules\\Notifications\\Notifications\\SystemNotification',
          data: notification.data || {},
          read_at: null,
          created_at: notification.created_at || new Date().toISOString(),
        }

        notifications.value.unshift(normalizedItem)

        // 3. تشغيل صوت تنبيه لطيف خفيف
        playNotificationSound()
      })

    isListening = true
    currentSubscribedUserId = userId
  }

  /**
   * Click handler for a single notification:
   * - Optimistically decrements unreadCount and marks notification as read locally.
   * - Sends POST /api/notifications/{id}/mark-as-read in background.
   * - Redirects user to notification.data.url if present.
   */
  const handleNotificationClick = async (notification, router) => {
    if (!notification) return

    const wasUnread = !notification.read_at

    if (wasUnread) {
      // Optimistic update
      notification.read_at = new Date().toISOString()
      if (unreadCount.value > 0) {
        unreadCount.value--
      }

      // Background request
      api.post(`/notifications/${notification.id}/mark-as-read`).catch((err) => {
        console.error('[Notifications] Failed to mark as read on server:', err)
      })
    }

    // Close dropdown
    isDropdownOpen.value = false

    // Route / URL redirect
    const targetUrl = notification.data?.url
    if (targetUrl) {
      if (router && typeof router.push === 'function') {
        if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
          window.location.href = targetUrl
        } else {
          router.push(targetUrl)
        }
      } else {
        window.location.href = targetUrl
      }
    }
  }

  /**
   * Click handler for "تحديد الكل كمقروء" (Mark all as read):
   * - Sends POST /api/notifications/mark-all-as-read in background.
   * - Sets unreadCount = 0.
   * - Updates all notifications locally to read.
   */
  const markAllAsRead = async () => {
    if (unreadCount.value === 0 && notifications.value.every((n) => n.read_at)) {
      return
    }

    isMarkingAllAsRead.value = true

    // Optimistic local update
    unreadCount.value = 0
    const nowIso = new Date().toISOString()
    notifications.value.forEach((item) => {
      if (!item.read_at) {
        item.read_at = nowIso
      }
    })

    try {
      await api.post('/notifications/mark-all-as-read')
    } catch (err) {
      console.error('[Notifications] Failed to mark all as read on server:', err)
    } finally {
      isMarkingAllAsRead.value = false
    }
  }

  /**
   * Toggles notifications dropdown visibility.
   */
  const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
    if (isDropdownOpen.value) {
      // Refresh list and unread count upon opening
      fetchUnreadCount()
      fetchNotifications()
    }
  }

  const closeDropdown = () => {
    isDropdownOpen.value = false
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    isDropdownOpen,
    isMarkingAllAsRead,
    hasUnread: computed(() => unreadCount.value > 0),
    fetchUnreadCount,
    fetchNotifications,
    initRealtimeListener,
    handleNotificationClick,
    markAllAsRead,
    toggleDropdown,
    closeDropdown,
    formatTimeAgo,
    playNotificationSound,
  }
}
