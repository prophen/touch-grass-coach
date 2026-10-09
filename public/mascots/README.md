# Chaotic garden mascots

Original illustrations generated with the built-in imagegen tool. Transparent PNGs are separated from `garden-atlas.png` into padded 640 × 640 assets. Animation is provided by CSS, not baked into the PNG files.

| Tier | Name | Asset | Motion |
| --- | --- | --- | --- |
| Seedling | Pip | seedling.png | Gentle bob |
| Sprout | Sprig | sprout.png | Confident sway |
| Weed | Scruff | weed.png | Anticipation squash and hop |
| Feral | Goblin | feral.png | Wiggle and jump |

Use the reusable `GardenMascot` component from `app/components/GardenMascot.tsx`:

```tsx
<GardenMascot tier="feral" size={220} />
<GardenMascot tier="seedling" size={120} paused />
```

Preview all characters at `/mascots`. The home page automatically selects the character using the existing screen-time tiers. CSS respects `prefers-reduced-motion`. These loops animate the entire illustration; facial features and limbs are not individually rigged.

## Generation prompt

Create a production sprite atlas for Touch Grass Coach: four original full-body cartoon plant mascots on a truly transparent background in an exact 2 by 2 grid of equal square cells. No lettering, labels, grid lines or background. Each character completely inside its own cell, centered horizontally and vertically with generous 15 percent clear padding, identical overall visual scale. Top left: Seedling, a tiny bright lime pear-shaped seed body with two tender leaves on its head, dot eyes, shy happy smile, pink cheeks, short root feet and waving little arm. Top right: Sprout, a confident mint-green plump bean-shaped plant with three big leafy tufts, mischievous half-lidded eyes, smug smile, hands on hips and little root sneakers. Bottom left: Weed, scruffy darker green shaggy grass creature with jagged leafy hair, very raised skeptical eyebrows, crooked grin, stick arms and splayed root feet, a single tiny yellow daisy growing from its head. Bottom right: Feral, wild lime-and-forest-green round grass gremlin with huge chaotic spiky leafy crown, asymmetric enormous expressive cream eyes, an open goofy toothy grin, pink cheeks, raised root arms and dancing root feet. Friendly funny absurd expressive indie game sticker illustration, bold near-black hand-drawn wobbly outlines, flat vivid green fills, subtle hand drawn texture, no realistic rendering or 3D, clean readable silhouettes at small sizes. Shared design language, all facing viewer. Balanced identical cell registration is essential: centers at 25%/25%,75%/25%,25%/75%,75%/75% of canvas. Square image.
