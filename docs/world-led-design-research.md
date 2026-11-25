# World-led web art direction — 2026-11-26

## Evidence and transfer
- Koi He, Arknights anniversary design: https://koikoi.me/Arknights-2nd-Anniversary-Web-Design-copy — visual composition and layered characters designed as a single key visual, rather than a card containing art.
- ZZZ concept site: https://act.hoyoverse.com/nap/event/e20220508concept-6oj9/index.html?lang=zh-cn — CRT, shelves and calendar constitute the world, not unrelated decoration.
- Wintee_DCT, Reverse:1999 motion/UI study: https://www.zcool.com.cn/article/ZMTYyODI1Ng==.html — time-related objects and restrained motion support the fictional setting.
- Tencent ISUX: https://www.zcool.com.cn/article/ZMTAzMzA3Mg==.html — platform identity and title-specific mood are separate layers; prototype comparisons precede implementation.
- JZY: https://www.zcool.com.cn/article/ZMTg1NDY4.html — establish the overall composition before details; preserve usability.
- wen0: https://www.zcool.com.cn/article/ZMTEwMTAwNA==.html — derive interface from the underlying product mechanics.
- Independent Arknights rendered UI research: https://ak-ui.yyj.moe/en/guide/official-site-study — meaningful index numbers, bilingual hierarchy, responsive reflow.
- Agent Memory candidate: 81b8765c1abb85e998cff8617295614f8494c0412b69f530b8ebc9bfb0b16a5b.

## Baseline failure and implementation
Previous framed illustration + cards was judged little changed by the owner. Replace its geometry rather than adding decoration. Full-bleed book cover with character in the scene; typographic table of contents with real links; reading room with rows instead of genre cards; a character's marginal note that links to a concept. Retain the actual library, all source text, notes and reader behavior.

## Validation
Local Chromium prototype using the original 669×565 crop: viewport widths 320/390/768/1024/1440, no horizontal overflow; CTA and marginal note bounds do not overlap after tablet fix. Desktop/mobile screenshots inspected. Production Astro build and reader regression require CI. Aesthetic approval is pending, no claim of general mastery.
