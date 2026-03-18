import { useState, useEffect, useRef, useCallback } from 'react'
import { Device } from 'mediasoup-client'
import { io } from 'socket.io-client'

export const useViewer = (streamId, userId) => {
    const [remoteStream, setRemoteStream] = useState(null)
    const [isLive, setIsLive] = useState(false)
    const [error, setError] = useState(null)
    const [viewerCount, setViewerCount] = useState(0)

    const socketRef = useRef(null)
    const deviceRef = useRef(null)
    const transportRef = useRef(null)
    const consumersRef = useRef(new Map())

    const socketRequest = (event, data, responseEvent) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) return reject('Socket not connected')
            
            socketRef.current.once(responseEvent, (response) => {
                if (response.error) reject(new Error(response.error))
                else resolve(response)
            })
            
            socketRef.current.once(`${event}-error`, (err) => reject(new Error(err.error || 'Socket request failed')))
            
            socketRef.current.emit(event, data)
        })
    }

    const initializeSocket = useCallback(() => {
        const socket = io('http://localhost:8000', {
            withCredentials: true,
        })

        socket.on('viewer-count-update', ({ currentViewerCount }) => {
            setViewerCount(currentViewerCount)
        })

        socket.on('stream-ended', () => {
            setIsLive(false)
            stopViewing()
        })

        socketRef.current = socket
        return socket
    }, [])

    const startViewing = async () => {
        try {
            setError(null)
            const socket = socketRef.current || initializeSocket()

            const joinResponse = await socketRequest('join-webrtc-stream', { streamId, userId }, 'stream-joined')
            setViewerCount(joinResponse.totalViewers)
            setIsLive(true)

            const { capabilities } = await socketRequest('get-router-capabilities', { streamId }, 'router-capabilities')
            
            const device = new Device()
            await device.load({ routerRtpCapabilities: capabilities })
            deviceRef.current = device

            const { transport: transportOptions } = await socketRequest('create-transport', { 
                streamId, 
                direction: 'recv' 
            }, 'transport-created')

            const transport = device.createRecvTransport(transportOptions)
            transportRef.current = transport

            transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    await socketRequest('connect-transport', {
                        transportId: transport.id,
                        dtlsParameters
                    }, 'transport-connected')
                    callback()
                } catch (err) {
                    errback(err)
                }
            })

            const { producers } = await socketRequest('get-producers', { streamId }, 'producers-list')
            const stream = new MediaStream()

            for (const producer of producers) {
                const { consumer: consumerOptions } = await socketRequest('consume', {
                    transportId: transport.id,
                    producerId: producer.id,
                    rtpCapabilities: device.rtpCapabilities
                }, 'consumer-created')

                const consumer = await transport.consume({
                    id: consumerOptions.id,
                    producerId: consumerOptions.producerId,
                    kind: consumerOptions.kind,
                    rtpParameters: consumerOptions.rtpParameters
                })

                consumersRef.current.set(consumer.id, consumer)
                stream.addTrack(consumer.track)
            }

            setRemoteStream(stream)

        } catch (err) {
            setError(err.message)
            stopViewing()
        }
    }

    const stopViewing = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect()
            socketRef.current = null
        }

        if (transportRef.current) transportRef.current.close()
        
        consumersRef.current.forEach(consumer => consumer.close())
        consumersRef.current.clear()

        setRemoteStream(null)
        setIsLive(false)
    }, [])

    useEffect(() => {
        return () => stopViewing()
    }, [stopViewing])

    return {
        remoteStream,
        isLive,
        error,
        viewerCount,
        startViewing,
        stopViewing
    }
}