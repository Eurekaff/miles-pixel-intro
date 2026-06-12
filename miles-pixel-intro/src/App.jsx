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
const versionedPublicAsset = (path, version) => `${publicAsset(path)}?v=${version}`

const WALK_SHEET_SRC = versionedPublicAsset('/character/miles-walk-sheet.png', '20260612-walk-sheet-2')
const USE_WALK_SHEET_CHARACTER = true
const CHARACTER_SHEET_SRC = versionedPublicAsset('/character/miles-reference.png', '20260612-reference-2')
const PHOTO_ASSETS = {
  library: publicAsset('/photos/library.jpg'),
  casino: publicAsset('/photos/casino.jpg'),
  winter: publicAsset('/photos/winter.jpg'),
}
const CHARACTER_SPRITE_BOXES = {
  front: { x: 60, y: 220, width: 510, height: 1655 },
  back: { x: 585, y: 220, width: 475, height: 1655 },
  side: { x: 1080, y: 220, width: 425, height: 1655 },
}
const USE_REFERENCE_CHARACTER = false

const characterSprites = {
  loading: false,
  ready: false,
  url: '',
  sprites: null,
}

const walkSheetSprites = {
  loading: false,
  ready: false,
  failed: false,
  promise: null,
  url: '',
  frames: null,
}

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
    body: `获得道具：学生证。

基础档案已解锁：方明正 / Miles，22 岁，来自厦门大学。

目前身份正在切换中：从校园玩家切到职场新人。
新手教程还在加载，不过会认真跟上节奏。`,
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
    body: `获得道具：厦大校徽。

这是我上一张地图的出生点。
在厦大副本里，我刷过代码、项目、协作和 debug，也慢慢习惯了把一个想法拆成能落地的小任务。

现在带着这些经验值，准备进入更大的地图继续升级。`,
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
    body: `获得道具：游戏手柄。

兴趣模块已开启：我平时喜欢打王者荣耀、第五人格，也玩崩坏：星穹铁道。

玩游戏的时候，我有时会研究机制和阵容，有时也只是想放松一下。
如果之后有同样爱玩的同学，欢迎一起开黑。`,
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
    body: `获得道具：电影票根。

电影也是我的回血道具之一。
我看的类型比较杂，主要看故事、氛围和角色有没有打动人。

如果之后大家有想看的电影，也欢迎约我一起去。`,
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
    body: `获得道具：运动鞋。

运动对我来说是比较稳定的充电方式。
跑步、球类、散步、简单活动一下都可以。

有时候状态卡住了，出去动一动，回来就像重新读档，脑子会清爽很多。`,
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
    body: `获得道具：探索指南针。

性格属性已解锁：好奇。

我对新东西通常会比较感兴趣，看到没接触过的工具、业务或者玩法，会想先靠近看看。

新地图里应该还有很多未知区域，希望之后能多向大家学习。`,
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
    body: `获得道具：热心能量饮料。

性格属性继续解锁：ENFP内向型社牛，熟起来会更好聊。

如果队友需要帮忙，我非常愿意搭把手。

希望之后能和大家顺利组队。`,
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
    body: `获得道具：组队邀请函。

新阶段已解锁：腾讯新地图。

接下来我会从新人模式开始，先熟悉环境、熟悉业务、熟悉大家的节奏。
希望能尽快加入队伍，也期待之后和大家一起学习、协作、打出一些漂亮配合。

如果路上遇到我迷路了，也欢迎顺手指个方向。`,
  },
  {
    id: 'photo-library',
    title: '书房照片',
    short: '书房照',
    zone: '相片放映亭',
    x: 310,
    y: 1060,
    kind: 'photo',
    photo: PHOTO_ASSETS.library,
    unlocks: ['photo-library'],
    body: `获得道具：书房照片。

相册图鉴 +1。

这一张看起来比较正式，像是个人面板里的默认头像。
适合用来假装沉稳，也适合在需要认真一点的场合出现。

实际本人可能更随和一点。`,
  },
  {
    id: 'photo-casino',
    title: '电影感照片',
    short: '电影照',
    zone: '相片放映亭',
    x: 430,
    y: 1060,
    kind: 'photo',
    photo: PHOTO_ASSETS.casino,
    unlocks: ['photo-casino'],
    body: `获得道具：电影感照片。

相册图鉴 +1。

冷色灯光、黑色穿搭，看起来像是误入了某个电影支线。
这张的氛围感比较足，但本人平时没有这么神秘。

大多数时候，我只是一个普通的新手玩家。`,
  },
  {
    id: 'photo-winter',
    title: '冬日近照',
    short: '近照',
    zone: '相片放映亭',
    x: 550,
    y: 1060,
    kind: 'photo',
    photo: PHOTO_ASSETS.winter,
    unlocks: ['photo-winter'],
    body: `获得道具：冬日近照。

相册图鉴 +1。

这一张更接近日常状态。
没有特殊剧情，也没有隐藏 boss，只是一个正在认真适应新地图的 Miles。

如果在群里或者线下见到我，应该会比照片里更好认一点。`,
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
    locked: '收集学生证后，可以解锁我的基础信息。',
    lines: ['姓名：方明正 / Miles', '年龄：22 岁', '专业：厦门大学 软件工程', '当前身份：刚进入腾讯新地图的新玩家'],
  },
  {
    id: 'campus',
    title: '校园副本',
    required: ['school'],
    locked: '收集厦大校徽后，可以查看我的上一张地图。',
    lines: ['来自厦门大学', '软件工程专业出身', '之前主要在代码、项目、协作和 debug 里积累经验', '现在准备把校园副本里的经验带到新的真实地图里'],
  },
  {
    id: 'personality',
    title: '性格属性',
    required: ['personality', 'helpful-drink'],
    locked: '收集探索指南针和热心能量饮料后，可以解锁我的性格属性。',
    lines: ['好相处：ENFP内向型社牛，也愿意和大家多交流', '热心：队友需要帮忙时，能搭把手就搭把手', '好奇：喜欢了解新工具、新业务和新想法'],
  },
  {
    id: 'hobbies',
    title: '兴趣爱好',
    required: ['hobby-game', 'movie-ticket', 'sport-shoes'],
    locked: '收集游戏手柄、电影票根和运动鞋后，可以解锁我的兴趣爱好。',
    lines: ['游戏：王者荣耀、第五人格、崩坏：星穹铁道都玩，欢迎一起开黑', '电影：类型看得比较杂，主要看故事和氛围，欢迎约电影', '运动：各种运动都可以，主要是给自己充电、保持状态在线'],
  },
  {
    id: 'new-stage',
    title: '腾讯新阶段',
    required: ['hello'],
    locked: '收集组队邀请函后，可以解锁我的新阶段介绍。',
    lines: ['从校园副本进入腾讯新地图', '目前处于新人加载中', '希望尽快熟悉团队节奏，也认识更多有趣的队友', '期待之后和大家一起学习、协作、打配合'],
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

function isReferenceBackground(data, index) {
  const red = data[index]
  const green = data[index + 1]
  const blue = data[index + 2]
  const alpha = data[index + 3]
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  return alpha === 0 || (max >= 214 && max - min <= 18)
}

function removeConnectedBackground(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = image
  const seen = new Uint8Array(width * height)
  const queue = []

  const enqueue = (x, y) => {
    const pixel = y * width + x
    const dataIndex = pixel * 4
    if (!seen[pixel] && isReferenceBackground(data, dataIndex)) {
      seen[pixel] = 1
      queue.push([x, y])
    }
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor]
    data[(y * width + x) * 4 + 3] = 0
    if (x > 0) enqueue(x - 1, y)
    if (x < width - 1) enqueue(x + 1, y)
    if (y > 0) enqueue(x, y - 1)
    if (y < height - 1) enqueue(x, y + 1)
  }

  context.putImageData(image, 0, 0)
}

function createCharacterSprite(image, box) {
  const canvas = document.createElement('canvas')
  canvas.width = box.width
  canvas.height = box.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.imageSmoothingEnabled = false
  context.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height)
  removeConnectedBackground(canvas)
  return canvas
}

function createWalkFrame(image, row, column) {
  const cellWidth = image.naturalWidth / 4
  const cellHeight = image.naturalHeight / 4
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(cellWidth)
  canvas.height = Math.ceil(cellHeight)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.imageSmoothingEnabled = false
  context.drawImage(
    image,
    column * cellWidth,
    row * cellHeight,
    cellWidth,
    cellHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  removeConnectedBackground(canvas)
  return canvas
}

function getAlphaBounds(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = image
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX || maxY < minY) return null
  return { minX, minY, maxX, maxY }
}

function getUpperBodyAnchorX(canvas, bounds) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width } = image
  const upperLimit = Math.floor(bounds.minY + (bounds.maxY - bounds.minY) * 0.48)
  let totalX = 0
  let count = 0

  for (let y = bounds.minY; y <= upperLimit; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 12) {
        totalX += x
        count += 1
      }
    }
  }

  return count ? totalX / count : (bounds.minX + bounds.maxX) / 2
}

function stabilizeWalkFrames(frames, padding = 12) {
  const frameData = frames
    .map((frame) => {
      const bounds = getAlphaBounds(frame)
      return bounds ? { frame, bounds, anchorX: getUpperBodyAnchorX(frame, bounds) } : null
    })
    .filter(Boolean)

  if (!frameData.length) return frames

  const maxBodyWidth = Math.max(...frameData.map(({ bounds }) => bounds.maxX - bounds.minX + 1))
  const maxBodyHeight = Math.max(...frameData.map(({ bounds }) => bounds.maxY - bounds.minY + 1))
  const width = maxBodyWidth + padding * 2
  const height = maxBodyHeight + padding * 2
  const targetAnchorX = Math.round(width / 2)
  const targetBottom = height - padding

  return frameData.map(({ frame, bounds, anchorX }) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    context.imageSmoothingEnabled = false
    const offsetX = Math.round(targetAnchorX - anchorX)
    const offsetY = Math.round(targetBottom - bounds.maxY)
    context.drawImage(frame, offsetX, offsetY)
    return canvas
  })
}

function loadImageAsset(src) {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error(`Image API is unavailable for ${src}`))
      return
    }
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load ${src}`))
    image.src = src
  })
}

function buildWalkSheetSprites(image) {
  const directions = ['down', 'up', 'left', 'right']
  return directions.reduce((frames, direction, row) => {
    frames[direction] = stabilizeWalkFrames(
      Array.from({ length: 4 }, (_, column) => createWalkFrame(image, row, column)),
    )
    return frames
  }, {})
}

function preloadWalkSheetSprites() {
  if (walkSheetSprites.ready) return Promise.resolve()
  if (walkSheetSprites.loading && walkSheetSprites.promise) return walkSheetSprites.promise
  if (walkSheetSprites.failed) {
    walkSheetSprites.failed = false
    walkSheetSprites.promise = null
  }

  walkSheetSprites.loading = true
  walkSheetSprites.url = WALK_SHEET_SRC
  walkSheetSprites.promise = loadImageAsset(WALK_SHEET_SRC)
    .then((image) => {
      walkSheetSprites.frames = buildWalkSheetSprites(image)
      walkSheetSprites.ready = true
      walkSheetSprites.failed = false
    })
    .catch((error) => {
      walkSheetSprites.ready = false
      walkSheetSprites.failed = true
      walkSheetSprites.promise = null
      throw error
    })
    .finally(() => {
      walkSheetSprites.loading = false
    })

  return walkSheetSprites.promise
}

function ensureWalkSheetSprites() {
  if (walkSheetSprites.ready || walkSheetSprites.loading || walkSheetSprites.failed) return
  preloadWalkSheetSprites().catch(() => {})
}

function preloadGameAssets(onProgress) {
  const assets = [
    { label: '角色行走帧', load: preloadWalkSheetSprites },
    { label: '书房照片', load: () => loadImageAsset(PHOTO_ASSETS.library) },
    { label: '电影感照片', load: () => loadImageAsset(PHOTO_ASSETS.casino) },
    { label: '冬日近照', load: () => loadImageAsset(PHOTO_ASSETS.winter) },
  ]

  return assets.reduce(
    (chain, asset, index) => chain.then(() => {
      onProgress?.({ loaded: index, total: assets.length, label: asset.label, failed: false })
      return asset.load().then(() => {
        onProgress?.({ loaded: index + 1, total: assets.length, label: asset.label, failed: false })
      })
    }),
    Promise.resolve(),
  )
}

function ensureCharacterSprites() {
  if (characterSprites.ready || characterSprites.loading || typeof Image === 'undefined') return

  characterSprites.loading = true
  characterSprites.url = CHARACTER_SHEET_SRC

  const image = new Image()
  image.onload = () => {
    characterSprites.sprites = {
      front: createCharacterSprite(image, CHARACTER_SPRITE_BOXES.front),
      back: createCharacterSprite(image, CHARACTER_SPRITE_BOXES.back),
      side: createCharacterSprite(image, CHARACTER_SPRITE_BOXES.side),
    }
    characterSprites.ready = true
    characterSprites.loading = false
  }
  image.onerror = () => {
    characterSprites.loading = false
  }
  image.src = CHARACTER_SHEET_SRC
}

function drawWalkSheetMiles(ctx, x, y, direction, frame, moving) {
  ensureWalkSheetSprites()
  if (!walkSheetSprites.ready) return false

  const frames = walkSheetSprites.frames[direction] || walkSheetSprites.frames.down
  const sprite = frames[moving ? frame % frames.length : 0]
  const bob = moving && (frame === 1 || frame === 3) ? -2 : 0
  const height = 142
  const width = (sprite.width / sprite.height) * height
  const drawX = x - width / 2
  const drawY = y - height + bob

  ctx.fillStyle = 'rgba(0, 0, 0, 0.23)'
  ctx.beginPath()
  ctx.ellipse(x, y + 5, width * 0.34, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sprite, drawX, drawY, width, height)
  ctx.restore()

  return true
}

function drawReferenceMiles(ctx, x, y, direction, frame, moving) {
  ensureCharacterSprites()
  if (!characterSprites.ready) return false

  const sprite = direction === 'up' ? characterSprites.sprites.back : direction === 'down' ? characterSprites.sprites.front : characterSprites.sprites.side
  const flip = direction === 'left'
  const bob = moving && (frame === 1 || frame === 3) ? -4 : 0
  const stepSway = moving ? (frame === 1 ? -2 : frame === 3 ? 2 : 0) : 0
  const height = 174
  const naturalWidth = (sprite.width / sprite.height) * height
  const width = Math.max(direction === 'up' ? 72 : 68, naturalWidth * 1.45)
  const drawX = x - width / 2 + stepSway
  const drawY = y - height + bob

  ctx.fillStyle = 'rgba(0, 0, 0, 0.23)'
  ctx.beginPath()
  ctx.ellipse(x, y + 5, width * 0.38, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.imageSmoothingEnabled = false
  if (flip) {
    ctx.translate(drawX + width, drawY)
    ctx.scale(-1, 1)
    ctx.drawImage(sprite, 0, 0, width, height)
  } else {
    ctx.drawImage(sprite, drawX, drawY, width, height)
  }
  ctx.restore()

  return true
}

function drawFrontMiles(ctx, originX, originY, scale, frame) {
  const bob = frame === 1 || frame === 3 ? -1 : 0
  const leftStep = frame === 1 ? -5 : frame === 3 ? 5 : 0
  const rightStep = -leftStep
  const leftArm = frame === 1 ? 4 : frame === 3 ? -4 : 0
  const rightArm = -leftArm
  const r = (x, y, w, h, c) => drawRect(ctx, originX, originY + bob * scale, scale, x, y, w, h, c)

  r(7, 15, 42, 26, '#050607')
  r(10, 9, 36, 11, '#111318')
  r(16, 3, 24, 8, '#17191f')
  r(5, 21, 8, 15, '#15171c')
  r(43, 20, 8, 17, '#08090b')
  r(20, 17, 10, 20, '#08090b')
  r(31, 17, 10, 18, '#08090b')
  r(13, 25, 32, 21, '#ffd8bd')
  r(14, 35, 30, 17, '#ffd0b2')
  r(10, 32, 5, 12, '#ffb896')
  r(44, 32, 5, 12, '#ffb896')
  r(17, 37, 7, 5, '#ffffff')
  r(34, 37, 7, 5, '#ffffff')
  r(20, 39, 4, 5, '#4a2424')
  r(34, 39, 4, 5, '#4a2424')
  r(28, 43, 3, 2, '#e9977f')
  r(24, 49, 11, 2, '#d7675f')
  r(15, 46, 4, 3, '#ffaaa0')
  r(40, 46, 4, 3, '#ffaaa0')

  r(17, 54, 26, 8, '#ffd0b2')
  r(9, 59, 40, 44, '#1b5c93')
  r(13, 62, 13, 39, '#2f78af')
  r(34, 62, 11, 38, '#245f93')
  r(18, 63, 24, 9, '#0d375d')
  r(22, 61, 18, 49, '#ffffff')
  r(23, 72, 15, 31, '#f2f4ff')
  r(15, 70, 4, 27, '#0c1520')
  r(41, 70, 4, 27, '#0c1520')
  r(12, 84, 9, 7, '#1a4d7d')
  r(38, 84, 8, 7, '#194a76')

  r(5, 62 + leftArm, 11, 42, '#1b5c93')
  r(3, 91 + leftArm, 10, 15, '#ffd0b2')
  r(45, 62 + rightArm, 11, 42, '#164c79')
  r(48, 91 + rightArm, 9, 15, '#ffd0b2')

  r(17 + leftStep, 101, 14, 41, '#101215')
  r(31 + rightStep, 101, 14, 41, '#070809')
  r(21 + leftStep, 127, 8, 9, '#24262a')
  r(35 + rightStep, 129, 8, 9, '#24262a')
  r(13 + leftStep, 139, 20, 9, '#ffffff')
  r(13 + leftStep, 146, 21, 5, '#d9dde1')
  r(32 + rightStep, 139, 20, 9, '#ffffff')
  r(32 + rightStep, 146, 21, 5, '#d9dde1')
  r(17 + leftStep, 142, 12, 3, '#111318')
  r(36 + rightStep, 142, 12, 3, '#111318')
}

function drawBackMiles(ctx, originX, originY, scale, frame) {
  const bob = frame === 1 || frame === 3 ? -1 : 0
  const leftStep = frame === 1 ? -5 : frame === 3 ? 5 : 0
  const rightStep = -leftStep
  const leftArm = frame === 1 ? 4 : frame === 3 ? -4 : 0
  const rightArm = -leftArm
  const r = (x, y, w, h, c) => drawRect(ctx, originX, originY + bob * scale, scale, x, y, w, h, c)

  r(8, 14, 42, 28, '#050607')
  r(13, 8, 35, 11, '#111318')
  r(18, 3, 25, 8, '#17191f')
  r(5, 23, 9, 17, '#15171c')
  r(44, 22, 8, 18, '#08090b')
  r(13, 38, 34, 17, '#050607')
  r(11, 46, 36, 13, '#ffd0b2')

  r(8, 58, 42, 51, '#1b5c93')
  r(13, 61, 34, 20, '#2f78af')
  r(17, 61, 26, 13, '#0d375d')
  r(19, 74, 21, 11, '#1b5c93')
  r(12, 89, 31, 19, '#245f93')
  r(22, 107, 17, 4, '#ffffff')
  r(10, 73, 4, 28, '#0c1520')
  r(46, 73, 4, 28, '#0c1520')

  r(5, 62 + leftArm, 11, 42, '#1b5c93')
  r(4, 92 + leftArm, 9, 14, '#ffd0b2')
  r(47, 62 + rightArm, 10, 42, '#164c79')
  r(49, 92 + rightArm, 8, 14, '#ffd0b2')

  r(17 + leftStep, 105, 14, 39, '#101215')
  r(31 + rightStep, 105, 14, 39, '#070809')
  r(20 + leftStep, 130, 9, 8, '#24262a')
  r(35 + rightStep, 130, 9, 8, '#24262a')
  r(13 + leftStep, 141, 20, 9, '#ffffff')
  r(13 + leftStep, 148, 21, 5, '#d9dde1')
  r(32 + rightStep, 141, 20, 9, '#ffffff')
  r(32 + rightStep, 148, 21, 5, '#d9dde1')
  r(17 + leftStep, 144, 12, 3, '#111318')
  r(36 + rightStep, 144, 12, 3, '#111318')
}

function drawSideMiles(ctx, originX, originY, scale, frame, facingLeft) {
  const bob = frame === 1 || frame === 3 ? -1 : 0
  const frontStep = frame === 1 ? 7 : frame === 3 ? -7 : 0
  const backStep = -frontStep
  const frontArm = frame === 1 ? -5 : frame === 3 ? 5 : 0

  ctx.save()
  if (facingLeft) {
    ctx.translate(originX + 62 * scale, 0)
    ctx.scale(-1, 1)
    originX = 0
  }

  const sideR = (x, y, w, h, c) => {
    const baseX = facingLeft ? 0 : originX
    drawRect(ctx, baseX, originY + bob * scale, scale, x, y, w, h, c)
  }

  sideR(9, 13, 41, 27, '#050607')
  sideR(14, 7, 34, 11, '#111318')
  sideR(20, 2, 23, 8, '#17191f')
  sideR(8, 24, 9, 18, '#15171c')
  sideR(38, 22, 9, 17, '#08090b')
  sideR(18, 29, 30, 24, '#ffd0b2')
  sideR(45, 36, 4, 4, '#ffd0b2')
  sideR(15, 34, 5, 11, '#ffb896')
  sideR(34, 40, 8, 5, '#ffffff')
  sideR(37, 41, 4, 5, '#4a2424')
  sideR(44, 39, 5, 3, '#ffd0b2')
  sideR(45, 49, 4, 2, '#d7675f')
  sideR(26, 45, 3, 3, '#ffaaa0')

  sideR(18, 56, 28, 8, '#ffd0b2')
  sideR(12, 60, 39, 48, '#1b5c93')
  sideR(16, 63, 16, 42, '#2f78af')
  sideR(31, 61, 12, 48, '#ffffff')
  sideR(39, 63, 7, 44, '#f2f4ff')
  sideR(17, 70, 4, 29, '#0c1520')
  sideR(46, 72, 4, 31, '#0c1520')
  sideR(14, 84, 10, 8, '#1a4d7d')

  sideR(45, 62 + frontArm, 10, 42, '#164c79')
  sideR(48, 92 + frontArm, 9, 15, '#ffd0b2')

  sideR(20 + backStep, 104, 14, 39, '#101215')
  sideR(35 + frontStep, 104, 14, 39, '#070809')
  sideR(16 + backStep, 141 + (frame === 1 ? -2 : 0), 21, 9, '#ffffff')
  sideR(16 + backStep, 148 + (frame === 1 ? -2 : 0), 22, 5, '#d9dde1')
  sideR(35 + frontStep, 141 + (frame === 3 ? -2 : 0), 22, 9, '#ffffff')
  sideR(35 + frontStep, 148 + (frame === 3 ? -2 : 0), 23, 5, '#d9dde1')
  sideR(20 + backStep, 144, 13, 3, '#111318')
  sideR(39 + frontStep, 144, 13, 3, '#111318')
  ctx.restore()
}

function drawVoxelMiles(ctx, x, y, direction, frame, moving) {
  if (USE_WALK_SHEET_CHARACTER) {
    if (drawWalkSheetMiles(ctx, x, y, direction, frame, moving)) return
    return
  }
  if (USE_REFERENCE_CHARACTER && drawReferenceMiles(ctx, x, y, direction, frame, moving)) return

  const scale = 1.08
  const originX = x - (62 * scale) / 2
  const originY = y - 151 * scale
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
  const joystickRef = useRef(null)
  const joystickThumbRef = useRef(null)
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
  const [phase, setPhase] = useState('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 4,
    label: '连接腾讯新地图',
    failed: false,
  })
  const [nearby, setNearby] = useState(null)
  const [activePanel, setActivePanel] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    let cancelled = false

    preloadGameAssets((progress) => {
      if (!cancelled) setLoadingProgress(progress)
    })
      .then(() => {
        if (!cancelled) {
          setLoadingProgress({
            loaded: 4,
            total: 4,
            label: '资源加载完成',
            failed: false,
          })
          window.setTimeout(() => {
            if (!cancelled) setPhase('start')
          }, 280)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadingProgress((current) => ({
            ...current,
            failed: true,
            label: '资源加载失败',
          }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadAttempt])

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
    if (found.length === cards.length) return '个人面板已补全，前往腾讯入口提交这份自我介绍。'
    return `前往 ${target.zone}，看看那里藏着什么线索。`
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
          body: `个人面板还没有补全，目前还差 ${cards.length - foundRef.current.length} 个道具。

先沿着地图继续探索吧。
等资料收集完整之后，就可以前往腾讯入口，提交这份新手自我介绍。`,
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
        if (dialog) {
          setDialog(null)
          return
        }
        if (phase === 'playing' && !activePanel && !selectedPhoto) inspect()
      }
      if (key === 'p') {
        event.preventDefault()
        togglePanel('profile')
      }
      if (key === 'b') {
        event.preventDefault()
        togglePanel('bag')
      }
      if (key === 'escape') {
        setDialog(null)
        setSelectedPhoto(null)
      }
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
  }, [activePanel, dialog, inspect, phase, selectedPhoto, togglePanel])

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

  const resetJoystick = useCallback(() => {
    keysRef.current.delete('arrowup')
    keysRef.current.delete('arrowdown')
    keysRef.current.delete('arrowleft')
    keysRef.current.delete('arrowright')
    if (joystickThumbRef.current) joystickThumbRef.current.style.transform = 'translate(-50%, -50%)'
  }, [])

  const updateJoystick = useCallback((event) => {
    const joystick = joystickRef.current
    const thumb = joystickThumbRef.current
    if (!joystick || !thumb) return

    const rect = joystick.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const maxDistance = rect.width * 0.32
    const rawX = event.clientX - centerX
    const rawY = event.clientY - centerY
    const distanceFromCenter = Math.hypot(rawX, rawY)
    const scale = distanceFromCenter > maxDistance ? maxDistance / distanceFromCenter : 1
    const x = rawX * scale
    const y = rawY * scale
    const deadZone = rect.width * 0.12

    thumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
    keysRef.current.delete('arrowup')
    keysRef.current.delete('arrowdown')
    keysRef.current.delete('arrowleft')
    keysRef.current.delete('arrowright')

    if (distanceFromCenter < deadZone) return
    if (x < -deadZone) keysRef.current.add('arrowleft')
    if (x > deadZone) keysRef.current.add('arrowright')
    if (y < -deadZone) keysRef.current.add('arrowup')
    if (y > deadZone) keysRef.current.add('arrowdown')
  }, [])

  const startJoystick = useCallback((event) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    updateJoystick(event)
  }, [updateJoystick])

  const retryLoading = useCallback(() => {
    setLoadingProgress({
      loaded: 0,
      total: 4,
      label: '重新连接腾讯新地图',
      failed: false,
    })
    setLoadAttempt((current) => current + 1)
  }, [])

  const loadingPercent = Math.round((loadingProgress.loaded / Math.max(loadingProgress.total, 1)) * 100)

  return (
    <main className="game-shell">
      <section className="game-stage" aria-label="Miles pixel introduction game">
        <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />

        {phase === 'loading' && (
          <div className="overlay loading-overlay">
            <div className="loading-card" role="status" aria-live="polite">
              <span className="tiny-label">资源装载中</span>
              <h1>进入腾讯新地图</h1>
              <div className="loading-avatar" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="loading-meta">
                <strong>{loadingProgress.label}</strong>
                <span>{loadingPercent}%</span>
              </div>
              <div className="loading-bar" aria-hidden="true">
                <span style={{ width: `${loadingPercent}%` }} />
              </div>
              <div className="loading-steps" aria-hidden="true">
                {Array.from({ length: loadingProgress.total }, (_, index) => (
                  <span
                    key={index}
                    className={index < loadingProgress.loaded ? 'loaded' : ''}
                  />
                ))}
              </div>
              {loadingProgress.failed && (
                <button type="button" className="primary-button" onClick={retryLoading}>
                  重新加载
                </button>
              )}
            </div>
          </div>
        )}

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
            <span>附近</span>
            查看 {nearby.title}
          </button>
        )}

        {phase === 'start' && (
          <div className="overlay">
            <div className="start-card">
              <span className="tiny-label">新地图已解锁</span>
              <h1>Miles 的腾讯新地图</h1>
              <p>
                {`你好，我是方明正，也可以叫我 Miles。

上一站是厦门大学副本，日常任务大概是上课、做项目、赶 ddl、偶尔和 bug 反复拉扯。现在我准备进入一张新的地图：腾讯。

自我介绍被做成了一个小型探索游戏。你可以在地图里收集 ${cards.length} 个道具，慢慢解锁我的个人面板。
希望通关之后，你会对这个刚进新地图的新人多一点了解。`}
              </p>
              <div className="control-row">
                <span>移动：键盘 / 手机摇杆</span>
                <span>查看：靠近后点击提示</span>
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
                      <p>{unlocked ? photo.body : '收集照片道具后解锁图鉴文案。'}</p>
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
                    {collected && item.photo ? (
                      <img className="bag-photo" src={item.photo} alt={item.title} />
                    ) : (
                      <div className={`bag-icon ${item.kind}`} />
                    )}
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
          <div className={dialog.photo ? 'dialog-panel photo-dialog' : 'dialog-panel'} role="dialog" aria-live="polite">
            <span className="tiny-label">{dialog.zone}</span>
            <h2>{dialog.title}</h2>
            {dialog.photo && <img className="dialog-photo" src={dialog.photo} alt={dialog.title} />}
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
              <p>
                {`你好，我是方明正，也可以叫我 Miles。
22 岁，来自厦门大学软件工程。

ENFP内向型社牛；熟起来之后会更愿意聊天、开玩笑，也愿意和大家一起把事情推进。`}
              </p>
              <div className="final-grid">
                {collectedCards.map((card) => (
                  <span key={card.id}>{card.short}</span>
                ))}
              </div>
              <p>
                {`平时喜欢玩王者荣耀、第五人格和崩坏：星穹铁道，也喜欢看电影、运动。
如果你也打游戏、看电影，或者刚好想找人一起活动一下，欢迎随时叫我。`}
              </p>
              <p>
                {`现在我已经抵达腾讯新地图。
接下来希望能尽快熟悉这里的节奏，也期待认识大家，和大家一起学习、协作、组队通关新的任务。`}
              </p>
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
          <div
            ref={joystickRef}
            className="joystick"
            role="application"
            aria-label="移动摇杆"
            onPointerDown={startJoystick}
            onPointerMove={updateJoystick}
            onPointerUp={resetJoystick}
            onPointerCancel={resetJoystick}
            onPointerLeave={resetJoystick}
          >
            <span ref={joystickThumbRef} className="joystick-thumb" />
          </div>
        </div>
        )}
      </section>
    </main>
  )
}

export default App
