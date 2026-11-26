import { computed, onUnmounted, ref } from 'vue'
import { formatFileSize, getFileCategory } from '../utils/quickTaskHelpers'

const BLOCKED_EXTENSIONS = [
  'php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'phps', 'pht',
  'exe', 'bat', 'cmd', 'sh', 'bash', 'bin', 'com', 'cpl', 'dll', 'jar', 'msi', 'scr', 'vbs',
  'js', 'jsp', 'asp', 'aspx', 'cgi', 'pl', 'py', 'pyc', 'htaccess', 'htpasswd', 'env', 'config',
]

/**
 * Composable encapsulating Web Audio API voice recording + secure file attachment preview.
 */
export function useVoiceAttachmentRecorder(errorRef) {
  const isRecording = ref(false)
  const audioBlob = ref(null)
  const feedbackAudioUrl = ref(null)
  const recordingDuration = ref(0)
  const audioLevel = ref(0)
  const isSilentMic = ref(false)

  const attachedFile = ref(null)
  const attachedFileName = ref('')
  const attachedFileType = ref('')
  const attachedFileSize = ref('')
  const attachedFilePreviewUrl = ref(null)
  const feedbackFileInput = ref(null)

  let mediaRecorder = null
  let audioChunks = []
  let audioStream = null
  let timerInterval = null
  let audioContext = null
  let analyser = null
  let animFrameId = null
  let silentCheckTimer = null
  let maxVolumeRecorded = 0

  const formattedDuration = computed(() => {
    const mins = Math.floor(recordingDuration.value / 60)
    const secs = recordingDuration.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  const stopAnalysis = () => {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close()
      } catch {
        // Ignore close errors on already-closed context
      }
      audioContext = null
    }
    analyser = null
    audioLevel.value = 0
  }

  const stopRecordingCleanup = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (silentCheckTimer) {
      clearTimeout(silentCheckTimer)
      silentCheckTimer = null
    }
    stopAnalysis()
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop())
      audioStream = null
    }
    isRecording.value = false
  }

  const clearVoiceRecording = () => {
    stopRecordingCleanup()
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop()
      } catch {
        // Ignore inactive recorder stop
      }
    }
    mediaRecorder = null
    audioBlob.value = null
    if (feedbackAudioUrl.value) {
      URL.revokeObjectURL(feedbackAudioUrl.value)
      feedbackAudioUrl.value = null
    }
    audioChunks = []
    recordingDuration.value = 0
    isSilentMic.value = false
  }

  const clearAttachedFile = () => {
    attachedFile.value = null
    attachedFileName.value = ''
    attachedFileType.value = ''
    attachedFileSize.value = ''
    if (attachedFilePreviewUrl.value) {
      URL.revokeObjectURL(attachedFilePreviewUrl.value)
      attachedFilePreviewUrl.value = null
    }
    if (feedbackFileInput.value) {
      feedbackFileInput.value.value = ''
    }
  }

  const clearAll = () => {
    clearVoiceRecording()
    clearAttachedFile()
  }

  const startRecording = async () => {
    try {
      if (errorRef) errorRef.value = ''
      clearVoiceRecording()
      recordingDuration.value = 0
      audioChunks = []
      audioLevel.value = 0
      isSilentMic.value = false
      maxVolumeRecorded = 0

      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (AudioCtx) {
          audioContext = new AudioCtx()
          if (audioContext.state === 'suspended') {
            await audioContext.resume()
          }
          const source = audioContext.createMediaStreamSource(audioStream)
          analyser = audioContext.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)

          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          const checkAudioLevel = () => {
            if (!isRecording.value || !analyser) return
            analyser.getByteFrequencyData(dataArray)
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
            const level = Math.min(100, Math.round((sum / dataArray.length / 128) * 100))
            audioLevel.value = level
            if (level > maxVolumeRecorded) maxVolumeRecorded = level
            animFrameId = requestAnimationFrame(checkAudioLevel)
          }
          animFrameId = requestAnimationFrame(checkAudioLevel)

          silentCheckTimer = setTimeout(() => {
            if (isRecording.value && maxVolumeRecorded < 2) {
              isSilentMic.value = true
            }
          }, 2500)
        }
      } catch (e) {
        console.warn('Web Audio API analyser not supported, continuing normal recording:', e)
      }

      const supportedMime =
        [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/wav',
        ].find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || ''

      mediaRecorder = new MediaRecorder(audioStream, supportedMime ? { mimeType: supportedMime } : {})
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunks.push(event.data)
      }
      mediaRecorder.onstop = () => {
        stopAnalysis()
        const mimeType = mediaRecorder?.mimeType || supportedMime || 'audio/webm'
        const blob = new Blob(audioChunks, { type: mimeType })
        audioBlob.value = blob
        feedbackAudioUrl.value = URL.createObjectURL(blob)
        isRecording.value = false
      }

      mediaRecorder.start(200)
      isRecording.value = true
      timerInterval = setInterval(() => {
        recordingDuration.value++
      }, 1000)
    } catch (err) {
      console.error('Mic access error:', err)
      if (errorRef) {
        errorRef.value =
          'تعذر تشغيل الميكروفون. يرجى إعطاء الصلاحية في المتصفح أو رفع ملف صوتي جاهز من جهازك.'
      }
      stopRecordingCleanup()
    }
  }

  const stopRecording = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (silentCheckTimer) {
      clearTimeout(silentCheckTimer)
      silentCheckTimer = null
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  }

  const triggerFileInput = () => feedbackFileInput.value?.click()

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (errorRef) errorRef.value = ''

    const maxBytes = 25 * 1024 * 1024
    if (file.size > maxBytes) {
      if (errorRef) {
        errorRef.value = `حجم الملف (${(file.size / 1048576).toFixed(1)} ميجابايت) يتجاوز الحد الأقصى المسموح به (25 ميجابايت).`
      }
      if (feedbackFileInput.value) feedbackFileInput.value.value = ''
      return
    }

    const nameParts = file.name.toLowerCase().split('.')
    if (nameParts.some((part) => BLOCKED_EXTENSIONS.includes(part))) {
      if (errorRef) errorRef.value = 'نوع الملف محظور وغير آمن للرفع لأسباب أمنية.'
      if (feedbackFileInput.value) feedbackFileInput.value.value = ''
      return
    }

    clearAttachedFile()
    attachedFile.value = file
    attachedFileName.value = file.name
    attachedFileType.value = getFileCategory(file.name, file.type)
    attachedFileSize.value = formatFileSize(file.size)
    if (file.type && (file.type.startsWith('image/') || file.type.startsWith('audio/'))) {
      attachedFilePreviewUrl.value = URL.createObjectURL(file)
    }
  }

  onUnmounted(clearAll)

  return {
    isRecording,
    audioBlob,
    feedbackAudioUrl,
    recordingDuration,
    formattedDuration,
    audioLevel,
    isSilentMic,
    attachedFile,
    attachedFileName,
    attachedFileType,
    attachedFileSize,
    attachedFilePreviewUrl,
    feedbackFileInput,
    startRecording,
    stopRecording,
    clearVoiceRecording,
    triggerFileInput,
    handleFileUpload,
    clearAttachedFile,
    clearAll,
  }
}
