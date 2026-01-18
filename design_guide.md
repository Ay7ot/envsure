# Envsure Brand & Design System Specification

## Color Palette

### Primary Colors
- **Brand Orange**: `#FF5722` or similar vibrant coral-orange
  - Used for primary CTAs, accents, and interactive elements
  - This is the hero color that defines the brand
  
### Background Colors
- **Deep Black**: `#0A0A0A` to `#121212` - Primary background
- **Elevated Black**: `#1A1A1A` to `#1F1F1F` - Card backgrounds, elevated surfaces
- **Subtle Gray**: `#252525` to `#2A2A2A` - Secondary elevated elements, borders

### Text Colors
- **Primary Text**: `#FFFFFF` - Pure white for headings and important text
- **Secondary Text**: `#B0B0B0` to `#999999` - Muted gray for body text, descriptions
- **Tertiary Text**: `#666666` to `#707070` - Subtle text for disclaimers, fine print

### Accent Colors
- **Success/Check Green**: `#00E676` or similar bright green for checkmarks
- **Muted Highlights**: Subtle variations of the dark theme, never jarring

## Typography

### Font Family
- Primary typeface appears to be a modern, geometric sans-serif (similar to **Inter**, **Poppins**, or **GT America**)
- Clean, highly legible, slightly rounded corners on letters
- Professional but approachable

### Font Weights & Hierarchy
- **Headings**: 600-700 weight (Semi-bold to Bold)
- **Body Text**: 400-500 weight (Regular to Medium)
- **Fine Print**: 400 weight (Regular)

### Size Scale (Relative)
- **Hero Headline**: 3.5-4rem (very large, commanding)
- **Section Headers**: 2-2.5rem
- **Card Titles**: 1.25-1.5rem
- **Body Text**: 0.9-1rem
- **Small Text/Labels**: 0.75-0.85rem

### Letter Spacing
- Headlines: Slightly tight (-0.02em to -0.01em)
- Body text: Normal to slightly open (0 to 0.01em)
- All caps labels: Wide spacing (0.1em to 0.15em)

### Line Height
- Headlines: 1.1-1.2 (tight for impact)
- Body: 1.5-1.6 (comfortable reading)

## Spacing & Layout

### Spacing System (use a consistent scale)
- Base unit: 4px or 8px
- Common spacing: 8px, 16px, 24px, 32px, 48px, 64px, 96px
- Generous whitespace throughout - never cramped

### Padding
- **Cards/Containers**: 32-48px on larger screens, 24px on mobile
- **Buttons**: 16px horizontal, 12-14px vertical for standard buttons
- **Sections**: 80-120px vertical spacing between major sections

### Border Radius
- **Cards**: 12-16px (moderately rounded, modern)
- **Buttons**: 8-10px (slightly rounded, not pill-shaped)
- **Input Fields**: 8px
- **Small Elements**: 6px

### Borders
- Subtle borders: 1px solid with color around `#2A2A2A` to `#333333`
- Very low contrast, barely visible - more of a subtle separation than a hard line

## Component Styling

### Buttons

**Primary CTA (Orange)**
- Background: Brand orange (`#FF5722`)
- Text: White, 500-600 weight
- Padding: 14-16px vertical, 28-36px horizontal
- Border radius: 8-10px
- No border
- Hover: Slightly lighter or glowing effect
- Font size: Slightly larger than body (1.05-1.1rem)

**Secondary/Outline**
- Background: Transparent or very dark elevated background
- Border: 1px solid subtle gray
- Text: White or light gray
- Same padding and radius as primary
- Hover: Subtle background fill

### Cards

**Elevated Surface Style**
- Background: `#1A1A1A` to `#1F1F1F`
- Border: 1px solid `#2A2A2A` (very subtle)
- Border radius: 12-16px
- Padding: 32-40px
- Subtle shadow: Not heavy, maybe `0 4px 24px rgba(0,0,0,0.4)`
- Slight inner glow effect at edges (optional, very subtle)

### Pricing Cards
- Same elevated surface treatment
- Icons at top: Simple, monochromatic (white or gray)
- Price: Very large, bold white text
- Features list: Checkmarks in brand green, text in secondary gray
- Clear visual hierarchy: Plan name → Price → CTA → Features
- Hover state: Subtle lift or glow

### Input Fields
- Background: Slightly elevated dark (`#1F1F1F` to `#252525`)
- Border: 1px solid subtle gray, brightens on focus
- Border radius: 8px
- Padding: 12-14px
- Text: White
- Placeholder: Muted gray (`#666666`)
- Focus state: Border becomes brighter (`#444444`) or slight orange glow

## Visual Effects

### Shadows
- Very subtle, primarily for depth
- Example: `0 2px 12px rgba(0,0,0,0.3)` for cards
- Hover states: Slightly elevated `0 8px 32px rgba(0,0,0,0.4)`

### Gradients
- Minimal use, but when present: very subtle dark-to-darker gradients
- Background gradients: Almost imperceptible, adding depth
- Never gaudy or rainbow - stay within the dark monochrome palette

### Transparency/Opacity
- Overlays: `rgba(0,0,0,0.6)` to `rgba(0,0,0,0.8)`
- Disabled states: 40-50% opacity
- Secondary elements: 70-80% opacity

### Hover States
- Subtle scale: `transform: scale(1.02)` for cards
- Brightness increase: Very slight for buttons
- Smooth transitions: `transition: all 0.2s ease` or `0.3s ease-out`

## Iconography

### Style
- Line icons (outlined, not filled)
- Consistent stroke width (1.5-2px)
- Simple, geometric
- White or light gray default color
- Brand orange for interactive states

### Size
- Small icons: 16-20px
- Standard icons: 24px
- Large feature icons: 32-48px

## Overall Aesthetic

### The "Vibe"
- **Dark, premium, sophisticated** - like a high-end tech product
- **Spacious and breathable** - generous whitespace prevents claustrophobia
- **Confident minimalism** - every element earns its place
- **Subtle depth** - layers created through slight elevation changes, not heavy shadows
- **High contrast** - white text on deep black for clarity and impact
- **Warm accent** - the orange brings energy to an otherwise cool, dark palette
- **Modern without being trendy** - timeless design that won't feel dated quickly

### Contrast Principles
- Strong contrast between text and background (always accessible)
- Low contrast between surfaces (subtle elevation)
- Punchy accent color stands out dramatically against dark background

### Consistency
- Repeated spacing values
- Consistent border radius across similar elements
- Unified color palette - no random colors appearing
- Systematic type scale

## Responsive Behavior

### Breakpoints (approximate)
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Scaling
- Reduce padding proportionally on smaller screens (75% of desktop values)
- Font sizes scale down slightly (90-95% on mobile)
- Maintain generous whitespace even on mobile - don't cram
- Cards stack vertically on mobile with maintained padding
