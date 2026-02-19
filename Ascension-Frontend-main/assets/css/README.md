# CSS Architecture Documentation

## 📁 File Structure

```
assets/css/
├── main.css                    # Main entry point with imports
├── base/                       # Base styles and variables
│   ├── reset.css              # CSS reset
│   ├── variables.css          # CSS custom properties
│   └── typography.css         # Typography styles
├── components/                 # Reusable UI components
│   ├── header.css             # Header, navigation
│   ├── buttons.css            # Button styles
│   ├── forms.css              # Form elements
│   ├── modals.css             # Modal dialogs
│   └── dropdowns.css          # Dropdown menus
├── sections/                   # Page sections
│   ├── hero.css               # Hero section
│   ├── video.css              # Video section
│   ├── tagline.css            # Tagline ladder
│   └── daily-checklist.css    # Daily checklist
├── pages/                      # Page-specific styles
│   ├── main.css               # Main page
│   ├── test.css               # Test page
│   ├── arc.css                # Arc page
│   └── mental.css             # Mental page
└── utilities/                  # Utility classes
    ├── layout.css             # Layout utilities
    └── animations.css         # Animation utilities
```

## 🎯 Design System

### Colors
- `--accent`: #FFD700 (Gold)
- `--accent-light`: #FFC125 (Light Gold)
- `--dark`: #000000 (Black)
- `--charcoal`: #2b2b2b (Dark Gray)
- `--graphite`: #1f2022 (Darker Gray)
- `--text`: #ffffff (White)
- `--muted`: #888888 (Gray)

### Gradients
- `--gradient-primary`: Gold gradient
- `--gradient-secondary`: Light gold gradient
- `--gradient-dark`: Dark background gradient

### Spacing
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px
- `--spacing-2xl`: 48px
- `--spacing-3xl`: 64px

### Border Radius
- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-xl`: 16px
- `--radius-2xl`: 20px

### Shadows
- `--shadow-sm`: Small shadow
- `--shadow-md`: Medium shadow
- `--shadow-lg`: Large shadow
- `--shadow-glow`: Gold glow effect
- `--shadow-gold`: Gold border glow

## 🏗️ Architecture Principles

### 1. **Modular Structure**
- Each file has a single responsibility
- Components are reusable across pages
- Pages contain only page-specific styles

### 2. **CSS Custom Properties**
- All design tokens stored in variables
- Easy theming and maintenance
- Consistent design system

### 3. **Component-Based**
- Reusable components in `/components`
- Consistent styling across the app
- Easy to maintain and update

### 4. **Utility Classes**
- Helper classes in `/utilities`
- Rapid prototyping and development
- Consistent spacing, colors, effects

### 5. **Mobile-First**
- Responsive design built-in
- Progressive enhancement
- Consistent breakpoints

## 📝 Usage Guidelines

### Adding New Components
1. Create component file in `/components`
2. Use CSS custom properties
3. Follow naming conventions
4. Import in `main.css`

### Adding New Pages
1. Create page-specific file in `/pages`
2. Use utility classes when possible
3. Import in `main.css`

### Modifying Styles
1. Check variables first
2. Update component files
3. Test across pages
4. Document changes

## 🎨 Animation System

### Available Animations
- `fadeIn`, `fadeOut` - Fade effects
- `slideInLeft`, `slideInRight`, `slideInUp` - Slide effects
- `scaleIn`, `scaleOut` - Scale effects
- `pulse`, `bounce` - Interactive effects
- `glow`, `goldenGlow` - Glow effects
- `loading`, `shimmer` - Loading states

### Usage
```html
<div class="animate-fadeIn hover-lift">
  Content
</div>
```

## 🔧 Development Workflow

### 1. Setup
- All styles imported through `main.css`
- No need for multiple CSS links in HTML
- Automatic dependency management

### 2. Development
- Work in specific component/page files
- Use utility classes for quick styling
- Test in browser dev tools

### 3. Production
- CSS files are modular but imported as one
- No performance impact
- Easy to maintain and debug

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Consistent experience across devices

## 🎯 Best Practices

### 1. **Use Variables**
Always use CSS custom properties instead of hard-coded values.

### 2. **Component Thinking**
Think in reusable components, not individual elements.

### 3. **Utility First**
Use utility classes for common patterns.

### 4. **Mobile First**
Start with mobile styles, then enhance.

### 5. **Consistent Naming**
Use BEM-style naming for components.

### 6. **Performance**
- Minimize CSS file size
- Use efficient selectors
- Avoid unnecessary specificity

## 🔄 Migration Notes

### From main_style.css
- All styles have been migrated to modular structure
- `main.css` is the new entry point
- Old file can be removed after testing

### Benefits
- Better organization
- Easier maintenance
- Reusable components
- Consistent design system
- Better developer experience
