## Plan

1. **Keep the new Facebook token**
   - Use the token currently shown in Facebook: `28ub5zx1j1xdnt1d7briy8h91ryyee`.
   - Do not revert to the old `2e3m...` token.

2. **Move the verification tag to the very top of the static `<head>`**
   - Place `<meta name="facebook-domain-verification" content="28ub5zx1j1xdnt1d7briy8h91ryyee" />` immediately after the viewport/meta charset lines.
   - Keep it in `index.html`, not React or `usePageMeta`, so Facebook sees it in raw page source.

3. **Avoid anything that may confuse the crawler**
   - Keep only one Facebook verification meta tag.
   - Leave redirects as-is because `http://`, `https://`, `www`, and apex all currently resolve to `https://edzenai.com/` and expose the correct token.

4. **After publishing, verify the public source**
   - Confirm `view-source:https://edzenai.com/` shows the token near the top of `<head>`.
   - Then use Facebook’s Sharing Debugger / Verify Domain again.

## Current finding

The live site already returns the new token for all tested variants:

```text
http://edzenai.com/       -> 28ub5zx1j1xdnt1d7briy8h91ryyee
https://edzenai.com/      -> 28ub5zx1j1xdnt1d7briy8h91ryyee
http://www.edzenai.com/   -> 28ub5zx1j1xdnt1d7briy8h91ryyee
https://www.edzenai.com/  -> 28ub5zx1j1xdnt1d7briy8h91ryyee
```

So the safest code-side fix is to move the tag earlier in the static head. If Facebook still fails after that, the remaining cause is likely Meta-side caching/business verification state, not missing website code.