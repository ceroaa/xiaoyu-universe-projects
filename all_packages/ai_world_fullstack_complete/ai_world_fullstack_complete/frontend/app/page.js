'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000'

export default function HomePage() {
  const [bootstrap, setBootstrap] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [logs, setLogs] = useState([])
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('正在连接...')
  const wsRef = useRef(null)

  const actorId = bootstrap?.player?.actor_id
  const controllerId = bootstrap?.player?.controller_id
  const exits = useMemo(() => snapshot?.room?.exits || [], [snapshot])

  async function loadBootstrap() {
    const res = await fetch(`${API_BASE}/dev/bootstrap`)
    const data = await res.json()
    setBootstrap(data)
    return data
  }

  async function submitAction(actionType, actionPayload = {}) {
    if (!actorId) return
    const res = await fetch(`${API_BASE}/actions/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor_id: actorId,
        controller_id: controllerId,
        action_type: actionType,
        action_payload: actionPayload,
      }),
    })
    const data = await res.json()
    if (data.visible_result?.message) {
      setLogs((prev) => [data.visible_result.message, ...prev].slice(0, 50))
    }
    if (actionType === 'look' || actionType === 'move') {
      await refreshLook(actorId, controllerId)
    }
    return data
  }

  async function refreshLook(actor, controller) {
    const res = await fetch(`${API_BASE}/actions/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor_id: actor,
        controller_id: controller,
        action_type: 'look',
        action_payload: {},
      }),
    })
    const data = await res.json()
    setSnapshot({
      room: {
        info: data.visible_result.room,
        actors: data.visible_result.actors,
        items: data.visible_result.items,
        exits: data.visible_result.exits,
      },
    })
    return data
  }

  function connectWebSocket(actor) {
    const ws = new WebSocket(`${WS_BASE}/ws/world/${actor}`)
    wsRef.current = ws
    ws.onopen = () => setStatus('WebSocket 已连接')
    ws.onclose = () => setStatus('WebSocket 已断开')
    ws.onerror = () => setStatus('WebSocket 连接异常')
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.type === 'snapshot') {
        setSnapshot(payload.data)
      }
      if (payload.type === 'events' && payload.data?.length) {
        const lines = payload.data.map((x) => x.public_text)
        setLogs((prev) => [...lines.reverse(), ...prev].slice(0, 50))
      }
    }
  }

  useEffect(() => {
    ;(async () => {
      const data = await loadBootstrap()
      if (data?.player?.actor_id) {
        await refreshLook(data.player.actor_id, data.player.controller_id)
        connectWebSocket(data.player.actor_id)
        setStatus('已加载测试玩家')
      } else {
        setStatus('找不到 seed 数据')
      }
    })()

    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  return (
    <main className="page">
      <section className="panel hero">
        <div>
          <h1>AI Agent 文字世界</h1>
          <p>这是基于 Next.js 的最小客户端，可直接测试 look、move、say 与房间广播。</p>
        </div>
        <div className="status">{status}</div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>测试玩家</h2>
          <div className="kv"><span>角色</span><strong>{bootstrap?.player?.display_name || '--'}</strong></div>
          <div className="kv"><span>Email</span><strong>{bootstrap?.player?.email || '--'}</strong></div>
          <div className="kv"><span>密码</span><strong>{bootstrap?.player?.password || '--'}</strong></div>
          <button onClick={() => refreshLook(actorId, controllerId)}>重新 look</button>
        </div>

        <div className="panel room">
          <h2>{snapshot?.room?.info?.name || '载入中...'}</h2>
          <p>{snapshot?.room?.info?.description || '...'}</p>
          <div className="subgrid">
            <div>
              <h3>出口</h3>
              <div className="chips">
                {exits.map((direction) => (
                  <button key={direction} onClick={() => submitAction('move', { direction })}>{direction}</button>
                ))}
              </div>
            </div>
            <div>
              <h3>房内角色</h3>
              <ul>
                {(snapshot?.room?.actors || []).map((actor) => (
                  <li key={actor.id}>{actor.name}{actor.title ? ` / ${actor.title}` : ''}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>地上物品</h3>
              <ul>
                {(snapshot?.room?.items || []).map((item) => (
                  <li key={item.id}>{item.name} x{item.quantity}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="panel chat">
          <h2>说话</h2>
          <div className="composer">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入一句话发送到当前房间"
            />
            <button onClick={async () => {
              if (!message.trim()) return
              await submitAction('say', { content: message.trim() })
              setMessage('')
            }}>发送</button>
          </div>
          <h3>房间广播 / 行动日志</h3>
          <div className="logbox">
            {logs.map((line, idx) => <div key={`${line}-${idx}`} className="logline">{line}</div>)}
          </div>
        </div>
      </section>
    </main>
  )
}
