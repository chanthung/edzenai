

## Plan: Replace single dashboard image with an auto-sliding carousel of all 5 screenshots

### What changes

**1. Copy all 5 uploaded images into the project assets**
- `src/assets/dashboard-overview.png` (Dashboard_Overview.png)
- `src/assets/dashboard-fee1.png` (Dashboard_Fee1.png)
- `src/assets/dashboard-fee2.png` (Dashboard_Fee_2.png)
- `src/assets/dashboard-ai-assist.png` (Dashboard_AI_Assist.png)
- `src/assets/dashboard-payment-proofs.png` (Dashboard_PaymentProofs.png)

**2. Update the Dashboard Showcase section in `src/pages/Index.tsx`**
- Replace the single `<img>` with an auto-playing carousel using the existing `Carousel` component (from `embla-carousel`)
- Configure autoplay with `embla-carousel-autoplay` (3-second interval, pause on hover)
- Add dot indicators below the carousel so users can see which slide is active
- Each slide shows one screenshot with a small caption label (e.g., "Overview", "Fee Tracking", "AI Insights", "Payment Proofs", "Fee Details")
- Keep the left-side text content unchanged

**3. Install autoplay plugin**
- `bun add embla-carousel-autoplay`

### Files to change
- `src/pages/Index.tsx` — replace static image with carousel
- 5 new image assets copied from uploads

### Technical details
- Uses the existing `Carousel`, `CarouselContent`, `CarouselItem` components
- Autoplay plugin for hands-free sliding
- Dot indicators built with the carousel API's `scrollSnapList` and `selectedScrollSnap`
- Responsive: carousel takes full width of the right column, same max-w-xl constraint
- All images lazy-loaded

