import { useRef, useState, useCallback } from 'react'
import { BLE_DEVICE_NAME, BLE_SERVICE_UUID, BLE_CHAR_UUID } from '../constants/ble'

export type BleStatus = 'disconnected' | 'connecting' | 'connected'

export function useBle() {
  const [status, setStatus] = useState<BleStatus>('disconnected')
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const deviceRef = useRef<BluetoothDevice | null>(null)

  const connect = useCallback(async () => {
    if (status === 'connecting') return
    setStatus('connecting')
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: BLE_DEVICE_NAME }],
        optionalServices: [BLE_SERVICE_UUID],
      })
      deviceRef.current = device

      device.addEventListener('gattserverdisconnected', () => {
        charRef.current = null
        setStatus('disconnected')
      })

      const server  = await device.gatt!.connect()
      const service = await server.getPrimaryService(BLE_SERVICE_UUID)
      const char    = await service.getCharacteristic(BLE_CHAR_UUID)
      charRef.current = char
      setStatus('connected')
    } catch (e) {
      // ユーザーキャンセルや接続失敗
      charRef.current = null
      setStatus('disconnected')
    }
  }, [status])

  // T14: UNO判定時に 0x01 を送信（未接続時はスキップ）
  const sendUno = useCallback(async () => {
    if (!charRef.current) return
    try {
      await charRef.current.writeValue(new Uint8Array([0x01]))
    } catch {
      // 送信失敗は無視
    }
  }, [])

  return { status, connect, sendUno }
}
