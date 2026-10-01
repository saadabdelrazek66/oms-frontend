import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from './axios'

window.Pusher = Pusher

let echoInstance = null

export function getEchoInstance() {
  const token = localStorage.getItem('token')
  if (!token) {
    if (echoInstance) {
      echoInstance.disconnect()
      echoInstance = null
    }
    return null
  }

  if (echoInstance) {
    return echoInstance
  }

  const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY || 'fffa127e158a37f6f210'
  const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu'
  const rootUrl = (api.defaults.baseURL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '')
  const authUrl = `${rootUrl}/broadcasting/auth`

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster: pusherCluster,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
    authEndpoint: authUrl,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
    authorizer: (channel) => {
      return {
        authorize: (socketId, callback) => {
          const currentToken = localStorage.getItem('token')
          api
            .post(
              '/broadcasting/auth',
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                baseURL: rootUrl,
                headers: {
                  Authorization: `Bearer ${currentToken}`,
                  Accept: 'application/json',
                },
              },
            )
            .then((response) => {
              callback(null, response.data)
            })
            .catch((error) => {
              console.error('[Echo] Authorization error for channel ' + channel.name, error)
              callback(error)
            })
        },
      }
    },
  })

  return echoInstance
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}

export default {
  get instance() {
    return getEchoInstance()
  },
  init: getEchoInstance,
  disconnect: disconnectEcho,
}
