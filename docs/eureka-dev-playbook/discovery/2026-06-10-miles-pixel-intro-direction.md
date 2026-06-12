# Miles Pixel Intro Direction

## Goal

Build a web-based pixel-style self-introduction game for a Tencent new hire group.
The game should make Fang Mingzheng / Miles memorable in a light, playful way.

## Approved Direction

- Format: 3-5 minute top-down pixel exploration game.
- Visual tone: Tencent arcade room, with bright blue HUD, neon accents, and a larger explorable map.
- Art constraint: do not use emoji as game art. Early prototype may use code-drawn pixel tiles and sprites; later art can be refined into tilesets and sprite sheets.
- Map structure: Xiamen University spawn point, hobby street, personality energy station, meet-everyone plaza, main path, and locked Tencent entrance.
- Core loop: move Miles, follow exploration guidance, discover points of interest, collect six info cards, unlock Tencent entrance, view final profile card.

## Personal Content

- Name: 方明正 / Miles
- Age: 22
- School: Xiamen University
- Major: Software Engineering
- Personality: a little outgoing, helpful, curious, likes exploring
- Hobbies: games, movies, sports
- New stage: from campus quest to Tencent new map; hopes to meet everyone

## Exploration Guidance

- Opening mission panel explains the goal.
- HUD shows card progress and current objective.
- Visible beacons mark undiscovered points.
- Nearby prompts tell the player to press E or tap to inspect.
- The Tencent entrance clearly shows locked and unlocked states.
- A mini objective list nudges the next useful action without over-explaining the game.

## Prototype Route

Use React + Vite with a Canvas/DOM hybrid:

- Canvas: map, tiles, player, camera, collision, beacons.
- DOM: HUD, dialog, info cards, start/end screens, mobile controls.
- Keyboard: WASD / arrow keys to move; E / Enter / Space to inspect.
- Mobile: on-screen directional pad and inspect button.

## Character Art Update

The Miles player sprite should closely follow the provided MC-style reference image:

- Pale skin tone, not saturated yellow or tan.
- Layered black/dark-brown block hair with front bangs.
- Gray square eyes and subtle face detail.
- Black oversized jacket, white inner shirt, black pants, white shoes with gray soles.
- Slightly cool, slim voxel/MC-skin feeling rather than a round cute chibi style.
- Use four-direction movement with visible arm/leg switching; front-facing sprite should be the closest match to the reference, with side/back views inferred from the same clothing and hair system.

## Environment Art Update

The map art direction has shifted from a dark neon arcade map to a brighter campus-to-tech-park map:

- Base terrain: green grass with visible tile variation, grass flecks, small flowers, and decorative beds.
- Main route: light stone slab paths with individual block outlines, highlights, and intersections.
- Xiamen University landmark: Q-version Songen Building / Jiageng-style landmark with red tiled roofs, central tower, symmetric side wings, blue windows, and an `XMU 颂恩楼` plaque.
- Tencent landmark: blue-glass twin towers with sky bridges, a `TENCENT` sign, a nearby task terminal, and a locked/unlocked arcade-like new-map portal.
- Other zones: hobby, personality, sports, movie, hello, and info buildings use lighter game-town colors so the map feels closer to a high-detail cozy pixel RPG rather than a dark cyberpunk grid.
