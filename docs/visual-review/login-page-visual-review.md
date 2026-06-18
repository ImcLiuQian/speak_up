# Login Page Visual Review

Target: `/Users/bytedance/.codex/generated_images/019e35ee-1067-7800-8e29-cbb929257398/ig_02ca6a44221b1435016a2e30d28f7481918d9b8635048387b3.png`

Implementation screenshot: `/private/tmp/speakup-internal-login.png`

Viewport: 1280 x 720 Codex in-app browser

Reviewer: Codex browser QA + cr verifier

Result: directionally aligned, not pixel-perfect

Notes:
- The current login form intentionally contains only internal account, password, and the primary login button.
- The removed secondary verification artifacts should not reappear in the UI.
- The visual direction matches the generated concept: dark training-console left panel, coach-card collage, light lavender login card, two input fields, purple CTA, and three quota cards.
- Known differences from the generated reference: the in-app browser screenshot is narrower, coach cards are more clipped at 1280 px, and the footer pill remains visible as part of the current product shell.

Validation commands:
- `npm run lint` in `frontend`
- `npm run build` in `frontend`
- `.venv/bin/python -m unittest tests.test_auth_and_storage` in `backend`
