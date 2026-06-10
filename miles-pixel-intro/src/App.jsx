import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const MAP = {
  width: 2250,
  height: 1500,
  tile: 48,
}

const PLAYER = {
  width: 34,
  height: 44,
  speed: 260,
}

const publicAsset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

const START_POSITION = { x: 420, y: 560 }

const collectibles = [
  {
    id: 'name',
    title: '学生证',
    short: '姓名',
    zone: '厦大传送点',
    x: 420,
    y: 555,
    kind: 'id',
    unlocks: ['basic'],
    body: '解锁基础档案：方明正 / Miles，22 岁，厦门大学软件工程。',
  },
  {
    id: 'school',
    title: '厦大校徽',
    short: '厦大',
    zone: '厦大传送点',
    x: 575,
    y: 555,
    kind: 'badge',
    unlocks: ['campus'],
    body: '解锁校园副本：来自厦门大学软件工程，刚完成校园副本。',
  },
  {
    id: 'hobby-game',
    title: '游戏手柄',
    short: '游戏',
    zone: '兴趣庭院',
    x: 1240,
    y: 450,
    kind: 'gamepad',
    unlocks: ['game'],
    body: '解锁兴趣：喜欢游戏，也喜欢研究规则、系统和反馈。',
  },
  {
    id: 'movie-ticket',
    title: '电影票根',
    short: '电影',
    zone: '兴趣庭院',
    x: 1360,
    y: 450,
    kind: 'ticket',
    unlocks: ['movie'],
    body: '解锁兴趣：喜欢电影，负责打开想象力和故事感。',
  },
  {
    id: 'sport-shoes',
    title: '运动鞋',
    short: '运动',
    zone: '兴趣庭院',
    x: 1480,
    y: 450,
    kind: 'shoe',
    unlocks: ['sport'],
    body: '解锁兴趣：喜欢运动，给生活充电，也让状态保持在线。',
  },
  {
    id: 'personality',
    title: '探索指南针',
    short: '好奇探索',
    zone: '性格站',
    x: 1300,
    y: 960,
    kind: 'compass',
    unlocks: ['curious'],
    body: '解锁性格：好奇，喜欢探索没走过的路线。',
  },
  {
    id: 'helpful-drink',
    title: '热心能量饮料',
    short: '热心',
    zone: '性格站',
    x: 1440,
    y: 960,
    kind: 'drink',
    unlocks: ['helpful'],
    body: '解锁性格：一点点外向，也愿意热心帮忙。',
  },
  {
    id: 'hello',
    title: '组队邀请函',
    short: '认识大家',
    zone: '组队广场',
    x: 940,
    y: 1260,
    kind: 'letter',
    unlocks: ['hello'],
    body: '解锁新阶段：从校园副本进入腾讯新地图，希望认识大家。',
  },
  {
    id: 'photo-library',
    title: '书房照片',
    short: '书房照',
    zone: '相片放映亭',
    x: 310,
    y: 1060,
    kind: 'photo',
    photo: publicAsset('/photos/library.jpg'),
    unlocks: ['photo-library'],
    body: '解锁相册：书房照片。正式、沉稳、带一点复古电影感。',
  },
  {
    id: 'photo-casino',
    title: '电影感照片',
    short: '电影照',
    zone: '相片放映亭',
    x: 430,
    y: 1060,
    kind: 'photo',
    photo: publicAsset('/photos/casino.jpg'),
    unlocks: ['photo-casino'],
    body: '解锁相册：电影感照片。冷色灯光和黑西装，很适合做隐藏彩蛋。',
  },
  {
    id: 'photo-winter',
    title: '冬日近照',
    short: '近照',
    zone: '相片放映亭',
    x: 550,
    y: 1060,
    kind: 'photo',
    photo: publicAsset('/photos/winter.jpg'),
    unlocks: ['photo-winter'],
    body: '解锁相册：冬日近照。更贴近日常形象，可以在个人面板里查看。',
  },
]

const cards = collectibles

const tencentGate = {
  id: 'tencent',
  x: 1810,
  y: 1070,
  width: 230,
  height: 200,
}

const profileSections = [
  {
    id: 'basic',
    title: '基础档案',
    required: ['name'],
    locked: '收集学生证后解锁姓名、年龄和专业。',
    lines: ['方明正 / Miles', '22 岁', '厦门大学 软件工程'],
  },
  {
    id: 'campus',
    title: '校园副本',
    required: ['school'],
    locked: '收集厦大校徽后解锁校园来处。',
    lines: ['来自厦门大学', '刚完成校园副本，准备进入腾讯新地图'],
  },
  {
    id: 'personality',
    title: '性格属性',
    required: ['personality', 'helpful-drink'],
    locked: '收集探索指南针和热心能量饮料后解锁性格。',
    lines: ['一点点外向', '热心', '好奇', '喜欢探索'],
  },
  {
    id: 'hobbies',
    title: '兴趣爱好',
    required: ['hobby-game', 'movie-ticket', 'sport-shoes'],
    locked: '收集游戏手柄、电影票根和运动鞋后解锁兴趣。',
    lines: ['游戏', '电影', '运动'],
  },
  {
    id: 'new-stage',
    title: '腾讯新阶段',
    required: ['hello'],
    locked: '收集组队邀请函后解锁新阶段介绍。',
    lines: ['从校园副本进入腾讯新地图', '希望认识大家，也期待一起打配合'],
  },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function isInsideRect(point, rect, padding = 0) {
  return (
    point.x > rect.x - padding &&
    point.x < rect.x + rect.width + padding &&
    point.y > rect.y - padding &&
    point.y < rect.y + rect.height + padding
  )
}

function getNearestTarget(player, found) {
  const nextCard = cards
    .filter((card) => !found.includes(card.id))
    .sort((a, b) => distance(player, a) - distance(player, b))[0]

  if (nextCard) return nextCard
  return { ...tencentGate, x: tencentGate.x + 125, y: tencentGate.y + 120, short: '腾讯入口' }
}

function drawRect(ctx, originX, originY, scale, x, y, width, height, color) {
  ctx.fillStyle = color
  ctx.fillRect(originX + x * scale, originY + y * scale, width * scale, height * scale)
}

function drawFrontMiles(ctx, originX, originY, scale, frame) {
  const bob = frame === 1 || frame === 3 ? -1 : 0
  const leftStep = frame === 1
  const rightStep = frame === 3
  const r = (x, y, w, h, c) => drawRect(ctx, originX, originY + bob * scale, scale, x, y, w, h, c)

  r(15, 4, 24, 6, '#1f1a1d')
  r(10, 9, 34, 9, '#2b2428')
  r(8, 16, 8, 16, '#3a3035')
  r(35, 16, 9, 16, '#3a3035')
  r(18, 15, 8, 25, '#44383e')
  r(30, 16, 7, 21, '#241f22')
  r(16, 24, 24, 16, '#f0c8ab')
  r(17, 22, 23, 8, '#f3cfb7')
  r(17, 24, 5, 7, '#3a3035')
  r(36, 24, 4, 8, '#241f22')
  r(18, 30, 7, 8, '#8a929a')
  r(32, 30, 6, 8, '#8a929a')
  r(25, 37, 10, 4, '#edc2a2')

  r(9, 39, 36, 38, '#111315')
  r(13, 43, 12, 31, '#222629')
  r(36, 43, 7, 29, '#090a0b')
  r(23, 39, 15, 45, '#f3f3f3')
  r(31, 40, 7, 43, '#dedede')
  r(14, 55, 4, 16, '#168cff')
  r(4, 41, 11, 42, '#151719')
  r(1, 45, 6, 34, '#24282b')
  r(42, 41, 12, 42, '#101112')
  r(50, 45, 6, 34, '#060707')
  r(6, 78, 9, 7, '#101112')
  r(42, 78, 9, 7, '#101112')

  r(15, 78, 13, 26, '#0f1011')
  r(31, 78, 13, 26, '#0f1011')
  r(18, 91, 7, 9, '#f0c8ab')
  r(32, 97, 8, 8, '#f0c8ab')
  if (leftStep) r(13, 100, 14, 7, '#111315')
  if (rightStep) r(31, 100, 14, 7, '#111315')
  r(leftStep ? 12 : 14, 103, 17, 10, '#ffffff')
  r(leftStep ? 12 : 14, 111, 17, 6, '#d1d5d8')
  r(rightStep ? 30 : 32, 103, 17, 10, '#ffffff')
  r(rightStep ? 30 : 32, 111, 17, 6, '#d1d5d8')
}

function drawBackMiles(ctx, originX, originY, scale, frame) {
  const bob = frame === 1 || frame === 3 ? -1 : 0
  const leftStep = frame === 1
  const rightStep = frame === 3
  const r = (x, y, w, h, c) => drawRect(ctx, originX, originY + bob * scale, scale, x, y, w, h, c)

  r(13, 5, 28, 8, '#1d181b')
  r(9, 12, 35, 22, '#30272c')
  r(13, 28, 29, 14, '#1c181b')
  r(10, 18, 8, 24, '#3b3136')
  r(36, 17, 8, 25, '#241f22')
  r(8, 39, 38, 40, '#111315')
  r(14, 43, 12, 32, '#23272a')
  r(36, 43, 8, 30, '#080909')
  r(26, 42, 8, 39, '#1b1d1f')
  r(4, 42, 11, 42, '#151719')
  r(42, 42, 12, 42, '#101112')
  r(15, 79, 13, 27, '#101112')
  r(31, 79, 13, 27, '#101112')
  if (leftStep) r(13, 101, 14, 7, '#111315')
  if (rightStep) r(31, 101, 14, 7, '#111315')
  r(leftStep ? 12 : 14, 104, 17, 10, '#ffffff')
  r(leftStep ? 12 : 14, 112, 17, 6, '#d1d5d8')
  r(rightStep ? 30 : 32, 104, 17, 10, '#ffffff')
  r(rightStep ? 30 : 32, 112, 17, 6, '#d1d5d8')
}

function drawSideMiles(ctx, originX, originY, scale, frame, facingLeft) {
  const bob = frame === 1 || frame === 3 ? -1 : 0
  const step = frame === 1 ? -2 : frame === 3 ? 2 : 0

  ctx.save()
  if (facingLeft) {
    ctx.translate(originX + 56 * scale, 0)
    ctx.scale(-1, 1)
    originX = 0
  }

  const sideR = (x, y, w, h, c) => {
    const baseX = facingLeft ? 0 : originX
    drawRect(ctx, baseX, originY + bob * scale, scale, x, y, w, h, c)
  }

  sideR(13, 5, 22, 7, '#1d181b')
  sideR(9, 12, 31, 12, '#2d2529')
  sideR(10, 21, 13, 20, '#44383e')
  sideR(29, 21, 10, 18, '#241f22')
  sideR(20, 25, 20, 18, '#f0c8ab')
  sideR(21, 24, 12, 6, '#f3cfb7')
  sideR(30, 31, 7, 8, '#8a929a')
  sideR(15, 39, 31, 39, '#111315')
  sideR(20, 43, 11, 31, '#24282b')
  sideR(31, 40, 10, 42, '#f3f3f3')
  sideR(38, 40, 5, 42, '#dedede')
  sideR(42, 42, 12, 43, '#101112')
  sideR(45, 47 + (frame === 1 ? 4 : 0), 8, 32, '#060707')
  sideR(18, 78, 13, 27, '#101112')
  sideR(33, 78, 13, 27, '#101112')
  sideR(16 + step, 104, 18, 10, '#ffffff')
  sideR(16 + step, 112, 18, 6, '#d1d5d8')
  sideR(32 - step, 104, 18, 10, '#ffffff')
  sideR(32 - step, 112, 18, 6, '#d1d5d8')
  ctx.restore()
}

function drawVoxelMiles(ctx, x, y, direction, frame, moving) {
  const scale = 1.35
  const originX = x - (56 * scale) / 2
  const originY = y - 114 * scale
  const animationFrame = moving ? frame : 0

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
  ctx.beginPath()
  ctx.ellipse(x, y + 5, 32, 9, 0, 0, Math.PI * 2)
  ctx.fill()

  if (direction === 'up') {
    drawBackMiles(ctx, originX, originY, scale, animationFrame)
  } else if (direction === 'left') {
    drawSideMiles(ctx, originX, originY, scale, animationFrame, true)
  } else if (direction === 'right') {
    drawSideMiles(ctx, originX, originY, scale, animationFrame, false)
  } else {
    drawFrontMiles(ctx, originX, originY, scale, animationFrame)
  }
}

function drawGrassTile(ctx, x, y, tile) {
  const variant = ((x / tile) * 17 + (y / tile) * 31) % 7
  ctx.fillStyle = variant % 2 ? '#77c66a' : '#71bd63'
  ctx.fillRect(x, y, tile, tile)
  ctx.fillStyle = variant % 3 ? '#8bd77a' : '#5fae55'
  ctx.fillRect(x + 8 + variant, y + 10, 12, 4)
  ctx.fillRect(x + 26, y + 28 + (variant % 4), 10, 4)
  if (variant === 0 || variant === 4) {
    ctx.fillStyle = variant === 0 ? '#f2d66b' : '#e88aa0'
    ctx.fillRect(x + 34, y + 12, 5, 5)
    ctx.fillRect(x + 38, y + 16, 4, 4)
  }
}

function drawStonePath(ctx, x, y, width, height) {
  ctx.fillStyle = '#b9ad8c'
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = '#897d66'
  ctx.lineWidth = 2
  for (let px = x; px < x + width; px += 54) {
    for (let py = y; py < y + height; py += 36) {
      const offset = Math.floor((py - y) / 36) % 2 ? 18 : 0
      ctx.fillStyle = '#c9bfa0'
      ctx.fillRect(px + offset + 2, py + 3, 46, 28)
      ctx.fillStyle = '#ded3b4'
      ctx.fillRect(px + offset + 7, py + 7, 16, 4)
      ctx.strokeRect(px + offset + 2, py + 3, 46, 28)
    }
  }
  ctx.fillStyle = 'rgba(70, 92, 56, .24)'
  ctx.fillRect(x, y + height - 8, width, 8)
}

function drawTree(ctx, x, y) {
  ctx.fillStyle = 'rgba(57, 82, 45, .25)'
  ctx.fillRect(x - 18, y + 54, 72, 14)
  ctx.fillStyle = '#7a4e32'
  ctx.fillRect(x + 8, y + 30, 20, 38)
  ctx.fillStyle = '#2f7a42'
  ctx.fillRect(x - 12, y + 12, 58, 34)
  ctx.fillStyle = '#3e9651'
  ctx.fillRect(x - 22, y + 26, 78, 32)
  ctx.fillStyle = '#256b37'
  ctx.fillRect(x + 4, y, 42, 24)
  ctx.fillStyle = '#59b96a'
  ctx.fillRect(x - 4, y + 18, 18, 8)
}

function drawFlowerBed(ctx, x, y, color = '#e88aa0') {
  ctx.fillStyle = '#4e9a4e'
  ctx.fillRect(x, y, 86, 34)
  ctx.strokeStyle = '#2f6d3e'
  ctx.lineWidth = 4
  ctx.strokeRect(x, y, 86, 34)
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i % 2 ? '#f7d66b' : color
    ctx.fillRect(x + 12 + i * 14, y + 10 + (i % 2) * 6, 6, 6)
  }
}

function drawSongenBuilding(ctx) {
  ctx.fillStyle = 'rgba(71, 60, 41, .24)'
  ctx.fillRect(140, 396, 620, 36)
  ctx.fillStyle = '#d9bc86'
  ctx.fillRect(150, 288, 136, 112)
  ctx.fillRect(604, 288, 136, 112)
  ctx.fillStyle = '#f0d2a0'
  ctx.fillRect(260, 238, 370, 168)
  ctx.fillStyle = '#f6dfba'
  ctx.fillRect(340, 124, 210, 132)
  ctx.strokeStyle = '#8b4a37'
  ctx.lineWidth = 8
  ctx.strokeRect(150, 288, 136, 112)
  ctx.strokeRect(604, 288, 136, 112)
  ctx.strokeRect(260, 238, 370, 168)
  ctx.strokeRect(340, 124, 210, 132)

  ctx.fillStyle = '#b83a30'
  ctx.fillRect(128, 260, 180, 28)
  ctx.fillRect(582, 260, 180, 28)
  ctx.fillRect(232, 210, 426, 32)
  ctx.fillRect(316, 94, 258, 34)
  ctx.fillStyle = '#d65943'
  ctx.fillRect(146, 246, 144, 16)
  ctx.fillRect(600, 246, 144, 16)
  ctx.fillRect(258, 194, 374, 18)
  ctx.fillRect(342, 78, 206, 18)

  ctx.fillStyle = '#74b4d4'
  const windows = [
    [184, 322], [232, 322], [642, 322], [690, 322],
    [304, 278], [356, 278], [486, 278], [538, 278],
    [386, 166], [454, 166], [386, 210], [454, 210],
  ]
  windows.forEach(([wx, wy]) => {
    ctx.fillRect(wx, wy, 28, 28)
    ctx.fillStyle = '#eef8ff'
    ctx.fillRect(wx + 4, wy + 4, 9, 5)
    ctx.fillStyle = '#74b4d4'
  })
  ctx.fillStyle = '#6c3b31'
  ctx.fillRect(424, 332, 62, 74)
  ctx.fillStyle = '#4a261f'
  ctx.fillRect(452, 340, 6, 58)
  ctx.fillStyle = '#5b2d27'
  ctx.fillRect(348, 412, 194, 40)
  ctx.strokeStyle = '#f7dfad'
  ctx.lineWidth = 4
  ctx.strokeRect(348, 412, 194, 40)
  ctx.fillStyle = '#f7dfad'
  ctx.font = '20px "Courier New", monospace'
  ctx.fillText('XMU 颂恩楼', 374, 438)
}

function drawTencentCampus(ctx) {
  ctx.save()
  ctx.translate(290, 170)
  ctx.fillStyle = 'rgba(38, 73, 86, .24)'
  ctx.fillRect(1450, 1110, 380, 34)
  ctx.fillStyle = '#a9ddf7'
  ctx.fillRect(1480, 770, 90, 340)
  ctx.fillRect(1680, 810, 90, 300)
  ctx.strokeStyle = '#1477bf'
  ctx.lineWidth = 8
  ctx.strokeRect(1480, 770, 90, 340)
  ctx.strokeRect(1680, 810, 90, 300)
  ctx.fillStyle = '#6fbbe8'
  ctx.fillRect(1542, 770, 28, 340)
  ctx.fillRect(1742, 810, 28, 300)
  ctx.fillStyle = '#155bb2'
  ctx.fillRect(1570, 872, 110, 36)
  ctx.fillRect(1570, 970, 110, 34)
  ctx.strokeStyle = '#24d6ff'
  ctx.lineWidth = 5
  ctx.strokeRect(1570, 872, 110, 36)
  ctx.strokeRect(1570, 970, 110, 34)
  ctx.fillStyle = '#ecfbff'
  for (let y = 810; y < 1060; y += 48) {
    ctx.fillRect(1500, y, 16, 20)
    ctx.fillRect(1532, y, 16, 20)
  }
  for (let y = 850; y < 1060; y += 48) {
    ctx.fillRect(1700, y, 16, 20)
    ctx.fillRect(1732, y, 16, 20)
  }
  ctx.fillStyle = '#0b2b55'
  ctx.fillRect(1582, 1048, 130, 52)
  ctx.strokeStyle = '#24d6ff'
  ctx.lineWidth = 6
  ctx.strokeRect(1582, 1048, 130, 52)
  ctx.fillStyle = '#24d6ff'
  ctx.font = '22px "Courier New", monospace'
  ctx.fillText('腾讯', 1626, 1082)

  ctx.fillStyle = '#102b55'
  ctx.fillRect(1786, 980, 52, 88)
  ctx.strokeStyle = '#24d6ff'
  ctx.lineWidth = 5
  ctx.strokeRect(1786, 980, 52, 88)
  ctx.fillStyle = '#24d6ff'
  ctx.fillRect(1798, 998, 28, 13)
  ctx.fillStyle = '#f6d74a'
  ctx.fillRect(1802, 1030, 20, 20)
  ctx.restore()
}

function drawTencentPortal(ctx, gateOpen) {
  const glow = gateOpen ? '#2ee6a6' : '#86a4bd'
  ctx.fillStyle = gateOpen ? 'rgba(46, 230, 166, .16)' : 'rgba(11, 43, 85, .18)'
  ctx.beginPath()
  ctx.arc(tencentGate.x + 115, tencentGate.y + 92, gateOpen ? 86 : 68, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0b2b55'
  ctx.fillRect(tencentGate.x + 16, tencentGate.y + 28, tencentGate.width - 32, tencentGate.height - 46)
  ctx.strokeStyle = glow
  ctx.lineWidth = 8
  ctx.strokeRect(tencentGate.x + 16, tencentGate.y + 28, tencentGate.width - 32, tencentGate.height - 46)
  ctx.fillStyle = gateOpen ? '#102d40' : '#1c2a3a'
  ctx.fillRect(tencentGate.x + 54, tencentGate.y + 72, tencentGate.width - 108, tencentGate.height - 110)
  ctx.strokeStyle = gateOpen ? '#24d6ff' : '#5b6a82'
  ctx.lineWidth = 5
  ctx.strokeRect(tencentGate.x + 54, tencentGate.y + 72, tencentGate.width - 108, tencentGate.height - 110)
  ctx.fillStyle = glow
  ctx.font = '24px "Courier New", monospace'
  ctx.fillText(gateOpen ? '已开放' : '未解锁', tencentGate.x + 72, tencentGate.y + 118)
  ctx.font = '15px "Courier New", monospace'
  ctx.fillText('新地图', tencentGate.x + 86, tencentGate.y + 156)
}

function drawPixelSign(ctx, x, y, width, label, color = '#f6d74a') {
  ctx.fillStyle = '#07111f'
  ctx.fillRect(x, y, width, 42)
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.strokeRect(x, y, width, 42)
  ctx.fillStyle = color
  ctx.font = '16px "Courier New", monospace'
  ctx.fillText(label, x + 14, y + 27)
}

function drawPhotoCinema(ctx) {
  ctx.save()
  ctx.translate(-10, 130)
  ctx.fillStyle = 'rgba(47, 40, 58, .24)'
  ctx.fillRect(230, 1030, 430, 34)
  ctx.fillStyle = '#f1d0b4'
  ctx.fillRect(260, 830, 350, 205)
  ctx.strokeStyle = '#6d3334'
  ctx.lineWidth = 8
  ctx.strokeRect(260, 830, 350, 205)

  ctx.fillStyle = '#7b2e3d'
  ctx.fillRect(240, 790, 390, 52)
  ctx.fillStyle = '#a93b4c'
  ctx.fillRect(258, 772, 354, 24)
  ctx.fillStyle = '#f5c45a'
  for (let x = 274; x < 600; x += 44) {
    ctx.fillRect(x, 803, 18, 12)
  }

  ctx.fillStyle = '#372a34'
  ctx.fillRect(316, 870, 238, 112)
  ctx.strokeStyle = '#f6d74a'
  ctx.lineWidth = 5
  ctx.strokeRect(316, 870, 238, 112)
  ctx.fillStyle = '#5d4153'
  ctx.fillRect(326, 880, 218, 92)
  ctx.fillStyle = '#211b24'
  ctx.fillRect(336, 890, 88, 72)
  ctx.fillStyle = '#fff1cf'
  ctx.fillRect(354, 902, 52, 36)
  ctx.fillStyle = '#6ea4d9'
  ctx.fillRect(456, 894, 64, 50)
  ctx.fillStyle = '#f6d74a'
  ctx.fillRect(466, 906, 16, 12)
  ctx.fillStyle = '#6abc72'
  ctx.fillRect(456, 936, 64, 8)

  ctx.fillStyle = '#4b2d35'
  ctx.fillRect(272, 878, 30, 112)
  ctx.fillRect(568, 878, 30, 112)
  ctx.fillStyle = '#c84a5b'
  for (let y = 884; y < 982; y += 18) {
    ctx.fillRect(278, y, 18, 8)
    ctx.fillRect(574, y, 18, 8)
  }

  ctx.fillStyle = '#2f2836'
  ctx.fillRect(282, 754, 58, 58)
  ctx.fillRect(530, 754, 58, 58)
  ctx.strokeStyle = '#f6d74a'
  ctx.lineWidth = 5
  ctx.strokeRect(282, 754, 58, 58)
  ctx.strokeRect(530, 754, 58, 58)
  ctx.fillStyle = '#f6d74a'
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(296 + i * 13, 766, 8, 8)
    ctx.fillRect(544 + i * 13, 788, 8, 8)
  }
  drawPixelSign(ctx, 354, 810, 160, '相片放映亭', '#f6d74a')
  ctx.restore()
}

function drawInterestCourtyard(ctx) {
  ctx.save()
  ctx.translate(220, -20)
  ctx.fillStyle = 'rgba(54, 75, 52, .24)'
  ctx.fillRect(910, 612, 470, 34)
  ctx.fillStyle = '#dca957'
  ctx.fillRect(920, 318, 430, 72)
  ctx.fillStyle = '#f0cb7c'
  ctx.fillRect(948, 290, 374, 34)
  ctx.strokeStyle = '#7b4b29'
  ctx.lineWidth = 7
  ctx.strokeRect(920, 318, 430, 72)
  ctx.strokeRect(948, 290, 374, 34)

  ctx.fillStyle = '#f7e0ab'
  ctx.fillRect(942, 390, 386, 218)
  ctx.strokeStyle = '#7b4b29'
  ctx.lineWidth = 8
  ctx.strokeRect(942, 390, 386, 218)
  ctx.fillStyle = '#7b4b29'
  ctx.fillRect(970, 544, 92, 64)
  ctx.fillRect(1208, 544, 92, 64)

  ctx.fillStyle = '#283040'
  ctx.fillRect(980, 420, 96, 76)
  ctx.strokeStyle = '#24d6ff'
  ctx.lineWidth = 5
  ctx.strokeRect(980, 420, 96, 76)
  ctx.fillStyle = '#24d6ff'
  ctx.fillRect(1000, 438, 54, 18)
  ctx.fillStyle = '#ff5f9e'
  ctx.fillRect(1012, 464, 14, 14)

  ctx.fillStyle = '#fff1d6'
  ctx.fillRect(1100, 420, 96, 76)
  ctx.strokeStyle = '#c65a3a'
  ctx.lineWidth = 5
  ctx.strokeRect(1100, 420, 96, 76)
  ctx.fillStyle = '#c65a3a'
  ctx.fillRect(1114, 436, 68, 12)
  ctx.fillRect(1114, 462, 42, 10)

  ctx.strokeStyle = '#2e7b5f'
  ctx.lineWidth = 8
  ctx.strokeRect(1226, 420, 72, 70)
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(1238, 432, 48, 32)
  ctx.strokeStyle = '#c84a5b'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(1262, 484, 18, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#8a5a35'
  for (let x = 966; x <= 1262; x += 74) {
    ctx.fillRect(x, 512, 28, 40)
    ctx.fillStyle = '#f8eed2'
    ctx.fillRect(x + 4, 518, 20, 16)
    ctx.fillStyle = '#8a5a35'
  }
  drawPixelSign(ctx, 1084, 342, 138, '兴趣庭院', '#f6d74a')
  ctx.restore()
}

function drawPersonalityStation(ctx) {
  ctx.save()
  ctx.translate(260, 140)
  ctx.fillStyle = 'rgba(45, 48, 75, .25)'
  ctx.fillRect(950, 930, 420, 34)
  ctx.fillStyle = '#d9d1ff'
  ctx.fillRect(972, 708, 338, 218)
  ctx.strokeStyle = '#513875'
  ctx.lineWidth = 8
  ctx.strokeRect(972, 708, 338, 218)

  ctx.fillStyle = '#6d4ba0'
  ctx.fillRect(952, 672, 378, 48)
  ctx.fillStyle = '#8f62cf'
  ctx.fillRect(986, 646, 310, 28)
  ctx.strokeStyle = '#513875'
  ctx.lineWidth = 5
  ctx.strokeRect(986, 646, 310, 28)

  ctx.fillStyle = '#f8f4ff'
  ctx.fillRect(1010, 742, 78, 86)
  ctx.fillRect(1194, 742, 78, 86)
  ctx.strokeStyle = '#513875'
  ctx.lineWidth = 5
  ctx.strokeRect(1010, 742, 78, 86)
  ctx.strokeRect(1194, 742, 78, 86)
  ctx.fillStyle = '#86d9ff'
  ctx.fillRect(1022, 756, 54, 20)
  ctx.fillRect(1206, 756, 54, 20)
  ctx.fillStyle = '#2ee6a6'
  ctx.fillRect(1032, 792, 34, 20)
  ctx.fillRect(1218, 792, 30, 20)

  ctx.fillStyle = '#513875'
  ctx.fillRect(1114, 814, 56, 112)
  ctx.strokeStyle = '#d7fcff'
  ctx.lineWidth = 4
  ctx.strokeRect(1114, 814, 56, 112)
  ctx.fillStyle = '#f6d74a'
  ctx.beginPath()
  ctx.arc(1142, 784, 42, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#513875'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.fillStyle = '#168cff'
  ctx.beginPath()
  ctx.moveTo(1142, 752)
  ctx.lineTo(1156, 800)
  ctx.lineTo(1128, 800)
  ctx.fill()

  ctx.fillStyle = '#2c2144'
  ctx.fillRect(1040, 870, 34, 56)
  ctx.fillRect(1210, 870, 34, 56)
  ctx.fillStyle = '#2ee6a6'
  ctx.fillRect(1048, 884, 18, 22)
  ctx.fillStyle = '#ff5f9e'
  ctx.fillRect(1218, 884, 18, 22)
  drawPixelSign(ctx, 1086, 686, 118, '性格站', '#d7fcff')
  ctx.restore()
}

function drawTeamPlaza(ctx) {
  ctx.save()
  ctx.translate(120, 170)
  ctx.fillStyle = 'rgba(43, 83, 63, .22)'
  ctx.fillRect(602, 1160, 520, 34)
  ctx.fillStyle = '#b9ad8c'
  ctx.fillRect(632, 1028, 460, 128)
  ctx.strokeStyle = '#776c55'
  ctx.lineWidth = 6
  ctx.strokeRect(632, 1028, 460, 128)
  for (let x = 646; x < 1080; x += 58) {
    ctx.fillStyle = '#cfc39e'
    ctx.fillRect(x, 1042, 42, 28)
    ctx.fillRect(x + 18, 1084, 42, 28)
  }

  ctx.fillStyle = '#2e7b5f'
  ctx.fillRect(674, 930, 112, 100)
  ctx.strokeStyle = '#184b3a'
  ctx.lineWidth = 6
  ctx.strokeRect(674, 930, 112, 100)
  ctx.fillStyle = '#f8eed2'
  ctx.fillRect(688, 948, 84, 54)
  ctx.fillStyle = '#c84a5b'
  ctx.fillRect(698, 960, 32, 8)
  ctx.fillStyle = '#168cff'
  ctx.fillRect(698, 976, 54, 8)

  ctx.fillStyle = '#5c3b2d'
  ctx.fillRect(856, 940, 48, 96)
  ctx.fillRect(982, 940, 48, 96)
  ctx.fillStyle = '#f6d74a'
  ctx.fillRect(806, 902, 276, 48)
  ctx.strokeStyle = '#7b4b29'
  ctx.lineWidth = 6
  ctx.strokeRect(806, 902, 276, 48)
  ctx.fillStyle = '#7b4b29'
  ctx.font = '18px "Courier New", monospace'
  ctx.fillText('组队广场', 894, 932)

  ctx.fillStyle = '#69b9d8'
  ctx.beginPath()
  ctx.arc(958, 1090, 45, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#2d6f87'
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.fillStyle = '#f2f9ff'
  ctx.fillRect(934, 1068, 48, 18)
  ctx.fillRect(946, 1096, 26, 16)

  ctx.fillStyle = '#7b4b29'
  ctx.fillRect(650, 1116, 86, 20)
  ctx.fillRect(1038, 1116, 86, 20)
  ctx.fillStyle = '#4d3326'
  ctx.fillRect(660, 1136, 12, 22)
  ctx.fillRect(710, 1136, 12, 22)
  ctx.fillRect(1048, 1136, 12, 22)
  ctx.fillRect(1098, 1136, 12, 22)
  ctx.restore()
}

function drawCollectibleIcon(ctx, item, collected, pulse) {
  const bob = collected ? 0 : Math.sin(pulse / 180) * 4
  const x = item.x
  const y = item.y + bob
  ctx.fillStyle = collected ? 'rgba(34, 110, 81, .25)' : 'rgba(246, 215, 74, .24)'
  ctx.beginPath()
  ctx.arc(x, y, collected ? 22 : 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = collected ? '#2ee6a6' : '#f6d74a'
  ctx.lineWidth = 4

  if (item.kind === 'id') {
    ctx.fillStyle = '#f7ead0'
    ctx.fillRect(x - 24, y - 18, 48, 36)
    ctx.strokeRect(x - 24, y - 18, 48, 36)
    ctx.fillStyle = '#168cff'
    ctx.fillRect(x - 18, y - 10, 13, 13)
    ctx.fillStyle = '#7b4b29'
    ctx.fillRect(x, y - 8, 16, 4)
    ctx.fillRect(x, y + 3, 18, 4)
  } else if (item.kind === 'badge') {
    ctx.fillStyle = '#b83a30'
    ctx.fillRect(x - 20, y - 16, 40, 32)
    ctx.strokeRect(x - 20, y - 16, 40, 32)
    ctx.fillStyle = '#f7dfad'
    ctx.fillRect(x - 8, y - 8, 16, 16)
  } else if (item.kind === 'gamepad') {
    ctx.fillStyle = '#2b2d33'
    ctx.fillRect(x - 28, y - 14, 56, 28)
    ctx.strokeRect(x - 28, y - 14, 56, 28)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 19, y - 4, 16, 5)
    ctx.fillRect(x - 14, y - 9, 5, 16)
    ctx.fillStyle = '#ff5f9e'
    ctx.fillRect(x + 12, y - 7, 8, 8)
    ctx.fillStyle = '#2ee6a6'
    ctx.fillRect(x + 22, y + 2, 7, 7)
  } else if (item.kind === 'ticket') {
    ctx.fillStyle = '#ffe4a8'
    ctx.fillRect(x - 26, y - 15, 52, 30)
    ctx.strokeRect(x - 26, y - 15, 52, 30)
    ctx.fillStyle = '#d78b36'
    ctx.fillRect(x - 16, y - 5, 32, 5)
  } else if (item.kind === 'shoe') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 25, y - 4, 42, 17)
    ctx.fillRect(x - 7, y - 15, 20, 15)
    ctx.strokeRect(x - 25, y - 4, 42, 17)
    ctx.fillStyle = '#d1d5d8'
    ctx.fillRect(x - 25, y + 10, 42, 5)
  } else if (item.kind === 'compass') {
    ctx.fillStyle = '#f6d74a'
    ctx.beginPath()
    ctx.arc(x, y, 21, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#168cff'
    ctx.beginPath()
    ctx.moveTo(x, y - 14)
    ctx.lineTo(x + 7, y + 8)
    ctx.lineTo(x - 7, y + 8)
    ctx.fill()
  } else if (item.kind === 'drink') {
    ctx.fillStyle = '#2ee6a6'
    ctx.fillRect(x - 14, y - 22, 28, 44)
    ctx.strokeRect(x - 14, y - 22, 28, 44)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 8, y - 5, 16, 10)
  } else if (item.kind === 'letter') {
    ctx.fillStyle = '#f7ead0'
    ctx.fillRect(x - 25, y - 16, 50, 32)
    ctx.strokeRect(x - 25, y - 16, 50, 32)
    ctx.strokeStyle = '#7b4b29'
    ctx.beginPath()
    ctx.moveTo(x - 24, y - 15)
    ctx.lineTo(x, y + 4)
    ctx.lineTo(x + 24, y - 15)
    ctx.stroke()
  } else if (item.kind === 'photo') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 24, y - 20, 48, 40)
    ctx.strokeRect(x - 24, y - 20, 48, 40)
    ctx.fillStyle = '#24324a'
    ctx.fillRect(x - 18, y - 14, 36, 24)
    ctx.fillStyle = '#7ecf72'
    ctx.fillRect(x - 16, y + 2, 32, 8)
    ctx.fillStyle = '#f6d74a'
    ctx.fillRect(x - 10, y - 8, 7, 7)
  }
}

function drawMap(ctx, canvas, player, found, pulse, playerPose) {
  const dpr = window.devicePixelRatio || 1
  const width = canvas.width / dpr
  const height = canvas.height / dpr
  const cameraX = clamp(player.x - width / 2, 0, MAP.width - width)
  const cameraY = clamp(player.y - height / 2, 0, MAP.height - height)

  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.translate(-cameraX, -cameraY)

  ctx.fillStyle = '#71bd63'
  ctx.fillRect(0, 0, MAP.width, MAP.height)

  for (let x = 0; x < MAP.width; x += MAP.tile) {
    for (let y = 0; y < MAP.height; y += MAP.tile) {
      drawGrassTile(ctx, x, y, MAP.tile)
    }
  }

  drawStonePath(ctx, 300, 514, 1460, 96)
  drawStonePath(ctx, 744, 514, 104, 860)
  drawStonePath(ctx, 272, 986, 610, 96)
  drawStonePath(ctx, 1088, 398, 610, 96)
  drawStonePath(ctx, 1120, 898, 610, 96)
  drawStonePath(ctx, 720, 1198, 630, 96)
  drawStonePath(ctx, 1450, 1110, 560, 96)
  ctx.fillStyle = '#a7c6d2'
  ctx.fillRect(744, 514, 104, 96)
  ctx.fillRect(744, 986, 104, 96)
  ctx.fillRect(744, 1198, 104, 96)
  ctx.fillRect(1450, 1110, 104, 96)

  drawTree(ctx, 78, 112)
  drawTree(ctx, 752, 132)
  drawTree(ctx, 1480, 170)
  drawTree(ctx, 140, 1180)
  drawTree(ctx, 1370, 1240)
  drawTree(ctx, 2020, 690)
  drawTree(ctx, 1780, 300)
  drawFlowerBed(ctx, 880, 550)
  drawFlowerBed(ctx, 1510, 530, '#f6d74a')
  drawFlowerBed(ctx, 950, 1010, '#b46cff')
  drawFlowerBed(ctx, 1390, 1270, '#ff5f9e')
  drawFlowerBed(ctx, 1660, 1010, '#f6d74a')

  drawSongenBuilding(ctx)
  drawPhotoCinema(ctx)
  drawInterestCourtyard(ctx)
  drawPersonalityStation(ctx)
  drawTeamPlaza(ctx)
  drawTencentCampus(ctx)

  ctx.strokeStyle = 'rgba(91,199,255,.22)'
  ctx.lineWidth = 3
  for (let x = 80; x < MAP.width; x += 240) {
    ctx.beginPath()
    ctx.moveTo(x, 80)
    ctx.lineTo(x + 80, 120)
    ctx.stroke()
  }

  cards.forEach((card) => drawCollectibleIcon(ctx, card, found.includes(card.id), pulse))

  const gateOpen = found.length === cards.length
  drawTencentPortal(ctx, gateOpen)

  const target = getNearestTarget(player, found)
  ctx.strokeStyle = 'rgba(46,230,166,.82)'
  ctx.lineWidth = 5
  ctx.setLineDash([12, 14])
  ctx.beginPath()
  ctx.moveTo(player.x, player.y)
  ctx.lineTo(target.x, target.y)
  ctx.stroke()
  ctx.setLineDash([])

  drawVoxelMiles(
    ctx,
    player.x,
    player.y,
    playerPose.direction,
    playerPose.frame,
    playerPose.moving,
  )

  ctx.restore()

  return { cameraX, cameraY }
}

function App() {
  const canvasRef = useRef(null)
  const keysRef = useRef(new Set())
  const rafRef = useRef(0)
  const lastFrameRef = useRef(0)
  const playerRef = useRef({ ...START_POSITION })
  const directionRef = useRef('down')
  const movingRef = useRef(false)
  const [playerView, setPlayerView] = useState(START_POSITION)
  const [found, setFound] = useState([])
  const foundRef = useRef(found)
  const [dialog, setDialog] = useState(null)
  const [phase, setPhase] = useState('start')
  const [nearby, setNearby] = useState(null)
  const [activePanel, setActivePanel] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    foundRef.current = found
  }, [found])

  const collectedCards = useMemo(
    () => cards.filter((card) => found.includes(card.id)),
    [found],
  )

  const collectedSet = useMemo(() => new Set(found), [found])
  const photoItems = useMemo(() => cards.filter((card) => card.kind === 'photo'), [])

  const currentGuide = useMemo(() => {
    const target = getNearestTarget(playerView, found)
    if (found.length === cards.length) return '全部道具已收集，前往腾讯入口完成通关。'
    return `前往 ${target.zone}，找到 ${target.short} 道具。`
  }, [found, playerView])

  const inspect = useCallback(() => {
    const player = playerRef.current
    const card = cards.find(
      (item) => !foundRef.current.includes(item.id) && distance(player, item) < 86,
    )
    if (card) {
      setFound((current) => (current.includes(card.id) ? current : [...current, card.id]))
      setDialog(card)
      return
    }

    if (isInsideRect(player, tencentGate, 90)) {
      if (foundRef.current.length === cards.length) {
        setPhase('complete')
        setDialog(null)
      } else {
        setDialog({
          id: 'locked',
          title: '腾讯入口还未解锁',
          zone: '腾讯入口',
          body: `还差 ${cards.length - foundRef.current.length} 个道具。跟着蓝绿引导线继续探索吧。`,
        })
      }
    }
  }, [])

  const togglePanel = useCallback((panel) => {
    setDialog(null)
    setSelectedPhoto(null)
    setActivePanel((current) => (current === panel ? null : panel))
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault()
        keysRef.current.add(key)
      }
      if (['e', 'enter', ' '].includes(key)) {
        event.preventDefault()
        inspect()
      }
      if (key === 'p') {
        event.preventDefault()
        togglePanel('profile')
      }
      if (key === 'b') {
        event.preventDefault()
        togglePanel('bag')
      }
      if (key === 'escape') setDialog(null)
    }

    const handleKeyUp = (event) => {
      keysRef.current.delete(event.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [inspect, togglePanel])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
    }

    const tick = (time) => {
      if (!lastFrameRef.current) lastFrameRef.current = time
      const delta = Math.min((time - lastFrameRef.current) / 1000, 0.04)
      lastFrameRef.current = time

      const keys = keysRef.current
      let dx = 0
      let dy = 0
      if (keys.has('arrowleft') || keys.has('a')) dx -= 1
      if (keys.has('arrowright') || keys.has('d')) dx += 1
      if (keys.has('arrowup') || keys.has('w')) dy -= 1
      if (keys.has('arrowdown') || keys.has('s')) dy += 1

      if (dx || dy) {
        const magnitude = Math.hypot(dx, dy)
        directionRef.current = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
        movingRef.current = true
        const next = {
          x: clamp(playerRef.current.x + (dx / magnitude) * PLAYER.speed * delta, 60, MAP.width - 60),
          y: clamp(playerRef.current.y + (dy / magnitude) * PLAYER.speed * delta, 80, MAP.height - 70),
        }
        playerRef.current = next
      } else {
        movingRef.current = false
      }

      const nearCard = cards.find(
        (card) => !foundRef.current.includes(card.id) && distance(playerRef.current, card) < 86,
      )
      const nearGate = isInsideRect(playerRef.current, tencentGate, 90)
      setNearby(nearCard || (nearGate ? { id: 'gate', title: '腾讯入口' } : null))
      setPlayerView({ ...playerRef.current })

      drawMap(ctx, canvas, playerRef.current, foundRef.current, time, {
        direction: directionRef.current,
        frame: Math.floor(time / 135) % 4,
        moving: movingRef.current,
      })
      rafRef.current = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawMap(ctx, canvas, playerRef.current, found, performance.now(), {
      direction: directionRef.current,
      frame: 0,
      moving: false,
    })
  }, [found])

  const holdDirection = (direction, isDown) => {
    const map = {
      up: 'arrowup',
      down: 'arrowdown',
      left: 'arrowleft',
      right: 'arrowright',
    }
    if (isDown) keysRef.current.add(map[direction])
    else keysRef.current.delete(map[direction])
  }

  return (
    <main className="game-shell">
      <section className="game-stage" aria-label="Miles pixel introduction game">
        <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />

        <div className="top-hud">
          <div className="brand-panel">
            <span className="tiny-label">玩家</span>
            <strong>方明正 Miles</strong>
            <span>22 岁 / 厦门大学 软件工程</span>
          </div>
          <div className="progress-panel">
            <span className="tiny-label">道具</span>
            <strong>
              {found.length}/{cards.length}
            </strong>
            <div className="pixel-meter" aria-hidden="true">
              {cards.map((card) => (
                <span key={card.id} className={found.includes(card.id) ? 'filled' : ''} />
              ))}
            </div>
          </div>
          <div className="objective-panel">
            <span className="tiny-label">当前目标</span>
            <strong>{currentGuide}</strong>
          </div>
          <div className="panel-actions">
            <button type="button" onClick={() => togglePanel('profile')}>
              个人面板 P
            </button>
            <button type="button" onClick={() => togglePanel('bag')}>
              背包 B
            </button>
          </div>
        </div>

        <aside className="mini-map" aria-label="Mini map">
          <span className="tiny-label">小地图</span>
          <div className="mini-map-grid">
            <span className="spawn" />
            <span className="hobby" />
            <span className="energy" />
            <span className="plaza" />
            <span
              className="player-dot"
              style={{
                left: `${(playerView.x / MAP.width) * 100}%`,
                top: `${(playerView.y / MAP.height) * 100}%`,
              }}
            />
          </div>
        </aside>

        {nearby && phase === 'playing' && (
          <button type="button" className="inspect-prompt" onClick={inspect}>
            <span>按 E</span>
            查看 {nearby.title}
          </button>
        )}

        {phase === 'start' && (
          <div className="overlay">
            <div className="start-card">
              <span className="tiny-label">新地图已解锁</span>
              <h1>Miles 的腾讯新地图</h1>
              <p>
                从校园副本出发，探索城市街区，收集 {cards.length} 个道具，逐步补齐个人面板，最后打开腾讯入口。
              </p>
              <div className="control-row">
                <span>移动：WASD / 方向键</span>
                <span>查看：E / 回车 / 空格</span>
              </div>
              <button type="button" className="primary-button" onClick={() => setPhase('playing')}>
                开始探索
              </button>
            </div>
          </div>
        )}

        {activePanel === 'profile' && (
          <div className="info-panel profile-panel" role="dialog" aria-label="个人面板">
            <div className="panel-header">
              <div>
                <span className="tiny-label">个人面板</span>
                <h2>方明正 / Miles</h2>
              </div>
              <button type="button" onClick={() => setActivePanel(null)}>关闭</button>
            </div>

            <div className="profile-grid">
              {profileSections.map((section) => {
                const unlocked = section.required.every((id) => collectedSet.has(id))
                return (
                  <article key={section.id} className={unlocked ? 'profile-card unlocked' : 'profile-card'}>
                    <span>{unlocked ? '已解锁' : '未解锁'}</span>
                    <h3>{section.title}</h3>
                    {unlocked ? (
                      <ul>
                        {section.lines.map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    ) : (
                      <p>{section.locked}</p>
                    )}
                  </article>
                )
              })}
            </div>

            <section className="album-section">
              <h3>相册</h3>
              <div className="album-grid">
                {photoItems.map((photo) => {
                  const unlocked = collectedSet.has(photo.id)
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      className={unlocked ? 'photo-card unlocked' : 'photo-card'}
                      onClick={() => unlocked && setSelectedPhoto(photo)}
                    >
                      {unlocked ? <img src={photo.photo} alt={photo.title} /> : <span>???</span>}
                      <strong>{photo.title}</strong>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        )}

        {activePanel === 'bag' && (
          <div className="info-panel bag-panel" role="dialog" aria-label="背包">
            <div className="panel-header">
              <div>
                <span className="tiny-label">背包</span>
                <h2>已收集 {found.length}/{cards.length}</h2>
              </div>
              <button type="button" onClick={() => setActivePanel(null)}>关闭</button>
            </div>
            <div className="bag-grid">
              {cards.map((item) => {
                const collected = collectedSet.has(item.id)
                return (
                  <article key={item.id} className={collected ? 'bag-item collected' : 'bag-item'}>
                    <div className={`bag-icon ${item.kind}`} />
                    <div>
                      <h3>{collected ? item.title : '未发现道具'}</h3>
                      <p>{collected ? item.body : `前往 ${item.zone} 寻找线索。`}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {selectedPhoto && (
          <div className="photo-viewer" role="dialog" aria-label={selectedPhoto.title}>
            <button type="button" onClick={() => setSelectedPhoto(null)}>关闭照片</button>
            <img src={selectedPhoto.photo} alt={selectedPhoto.title} />
            <strong>{selectedPhoto.title}</strong>
          </div>
        )}

        {dialog && !activePanel && (
          <div className="dialog-panel" role="dialog" aria-live="polite">
            <span className="tiny-label">{dialog.zone}</span>
            <h2>{dialog.title}</h2>
            <p>{dialog.body}</p>
            <button type="button" onClick={() => setDialog(null)}>
              继续
            </button>
          </div>
        )}

        {phase === 'complete' && (
          <div className="overlay">
            <div className="final-card">
              <span className="tiny-label">通关</span>
              <h1>方明正 / Miles</h1>
              <p>22 岁，厦门大学软件工程。 一点点外向、热心、好奇，喜欢探索。</p>
              <div className="final-grid">
                {collectedCards.map((card) => (
                  <span key={card.id}>{card.short}</span>
                ))}
              </div>
              <p>从校园副本进入腾讯新地图，希望认识大家，也期待一起打配合。</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setFound([])
                  playerRef.current = { ...START_POSITION }
                  setPhase('playing')
                }}
              >
                再玩一次
              </button>
            </div>
          </div>
        )}

        {phase === 'playing' && (
        <div className="mobile-controls" aria-label="Mobile controls">
          <div className="dpad">
            {['up', 'left', 'right', 'down'].map((direction) => (
              <button
                key={direction}
                type="button"
                className={direction}
                aria-label={`Move ${direction}`}
                onPointerDown={() => holdDirection(direction, true)}
                onPointerUp={() => holdDirection(direction, false)}
                onPointerLeave={() => holdDirection(direction, false)}
              />
            ))}
          </div>
          <button type="button" className="inspect-button" onClick={inspect}>
            查看
          </button>
        </div>
        )}
      </section>
    </main>
  )
}

export default App
