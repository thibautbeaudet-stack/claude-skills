---
name: manim
description: This skill should be used when the user asks to "create an animation", "make a manim video", "animate this concept", "visualize this process", "create a GIF for my blog", "plot a graph", "animate a value", or mentions "manim", "mathematical animation", "code animation", "process visualization", "technical animation", "3D scene", "camera animation", "ValueTracker", "number animation". Provides ManimCE (Community Edition) syntax, patterns, and best practices for creating programmatic animations.
version: 1.5.0
---

# Manim Animation Skill

Create precise, programmatic animations for technical blogs, educational content, and concept visualization using Manim Community Edition (ManimCE).

**Test animations:** https://docs.manim.community/en/stable/examples.html

## Installation (v0.19+)

```bash
# Recommended: uv (no ffmpeg needed since v0.19!)
uv venv && source .venv/bin/activate
uv pip install manim

# Or pip (still works)
pip install manim

# Check installation
manim checkhealth
```

**Note:** v0.19+ uses pyav internally, eliminating the external ffmpeg dependency.

**Virtual environment tip:** If not activated, use `uv run manim ...` instead of `manim`.

### Windows Quick Start (PowerShell)

```powershell
# Install uv (if needed)
python -m pip install --user uv

# Verify uv is on PATH
where uv

# One-off run without creating a venv
uv run --with manim manim checkhealth
```

## ManimCE vs ManimGL

| Aspect | ManimCE (Recommended) | ManimGL |
|--------|----------------------|---------|
| Package | `pip install manim` | `pip install manimgl` |
| Stability | Stable, well-documented | Experimental, breaking changes |
| Jupyter | Supported (`%%manim` magic) | Limited |
| ffmpeg | Not required (v0.19+) | Required |
| Caching | Supported | Not supported |

**Always use ManimCE** unless reproducing exact 3Blue1Brown videos.

## Core Concepts

### Three Building Blocks

1. **Mobjects** - Mathematical objects displayed on screen (Circle, Text, Code, etc.)
2. **Scenes** - Canvas containing animations, subclass of `Scene`
3. **Animations** - Transformations applied to Mobjects (Create, Write, FadeIn, etc.)

### Basic Scene Structure

```python
from manim import *

class MyScene(Scene):
    def construct(self):
        circle = Circle(color=BLUE)
        self.play(Create(circle))
        self.wait(1)
```

## Common Mobjects

### Text and Labels

```python
text = Text("Hello", font_size=48)
text = Text("Hello World", t2c={"Hello": RED, "World": BLUE})
label = Text("Label").next_to(circle, UP)
```

### Code Blocks (v0.19+)

```python
# IMPORTANT: Use code_string, NOT code parameter
code = Code(
    code_string="""function example() {
  return 42;
}""",
    language="javascript",
    background="rectangle",
    formatter_style="monokai",
)
```

### LaTeX

```python
tex = Tex(r"\LaTeX", font_size=144)
math = MathTex(r"E = mc^2")
equation = MathTex(r"f(x) &= x^2 \\ g(x) &= x^3")
```

### Shapes

```python
circle = Circle(radius=1, color=BLUE, fill_opacity=0.5)
square = Square(side_length=2, color=RED)
rect = Rectangle(width=3, height=1.5)
arrow = Arrow(LEFT, RIGHT)
line = Line(ORIGIN, UP * 2)
```

### Graphs and Axes

```python
axes = Axes(x_range=[-3, 3, 1], y_range=[-5, 5, 1], axis_config={"color": BLUE})
graph = axes.plot(lambda x: x**2, color=WHITE)
label = axes.get_graph_label(graph, label="x^2")
```

## Animation Patterns

### Basic Animations

```python
self.play(Create(circle))       # For shapes
self.play(Write(text))          # For Text/Tex/MathTex
self.play(FadeIn(mob))
self.play(FadeIn(mob, shift=UP))
self.play(FadeOut(mob))
self.play(GrowFromCenter(mob))
self.wait(1)
```

### The .animate Syntax

```python
self.play(circle.animate.shift(RIGHT * 2))
self.play(square.animate.scale(2))
self.play(text.animate.set_color(RED))
self.play(mob.animate.shift(UP).scale(0.5).set_color(BLUE))
```

### Transform Animations

```python
self.play(Transform(square, circle))
self.play(ReplacementTransform(old, new))
```

### Simultaneous Animations

```python
self.play(
    Create(circle),
    Write(text),
    FadeIn(arrow),
    run_time=2
)
```

## Positioning

```python
UP, DOWN, LEFT, RIGHT, ORIGIN
UL, UR, DL, DR

mob.move_to(ORIGIN)
mob.move_to(LEFT * 3 + UP * 2)
label.next_to(circle, UP, buff=0.5)
mob.shift(RIGHT * 2)
mob.align_to(other, UP)

group = VGroup(circle, square, text)
group.arrange(RIGHT, buff=0.5)
group.arrange(DOWN, aligned_edge=LEFT)
boxes = VGroup(*[Square() for _ in range(6)])
boxes.arrange_in_grid(rows=2, cols=3, buff=0.5)
```

## Colors

```python
RED, BLUE, GREEN, YELLOW, WHITE, BLACK, GRAY, ORANGE, PINK, PURPLE, TEAL, GOLD
BLUE_A, BLUE_B, BLUE_C, BLUE_D, BLUE_E
color = "#61DAFB"
from manim.utils.color import X11, XKCD
beige = X11.BEIGE
mango = XKCD.MANGO
```

## Rendering Commands

```bash
# Preview with low quality (fast)
manim -pql scene.py SceneName

# High quality render
manim -pqh scene.py SceneName

# Export as GIF
manim -qm --format=gif scene.py SceneName

# Quality flags
# -ql  480p15 (preview)
# -qm  720p30 (medium)
# -qh  1080p60 (high)
# -qk  4K60 (production)

# Debugging
manim -pql -s scene.py SceneName      # Last frame only
manim -pql -n 1,3 scene.py SceneName  # Animations 1-3 only
manim --dry_run scene.py SceneName    # Check errors only
```

### Jupyter Notebook

```python
%%manim -qm -v WARNING MyScene

class MyScene(Scene):
    def construct(self):
        circle = Circle()
        self.play(Create(circle))
```

## Reference Files

- **`references/mobjects.md`** - Complete Mobject reference
- **`references/animations.md`** - All animation types and timing
- **`references/advanced.md`** - Camera, 3D, ValueTracker, updaters
- **`references/blog-patterns.md`** - Patterns for technical blog animations

## Example Files

- **`examples/basic_scene.py`** - Minimal scene template
- **`examples/flowchart.py`** - Animated flowchart
- **`examples/state_diagram.py`** - State transition visualization
- **`examples/quicksort.py`** - Algorithm visualization

## External Resources

- **Official Docs:** https://docs.manim.community/en/stable/
- **Example Gallery:** https://docs.manim.community/en/stable/examples.html
- **GitHub:** https://github.com/ManimCommunity/manim
