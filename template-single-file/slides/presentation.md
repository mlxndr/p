## Using a Single Markdown File

* All slides in one convenient file
* Separated by slide delimiters (---) 
* Easy to see the whole presentation flow
* Perfect for sequential content

---

## Slide Separators

Slides are separated by a triple dash with newlines:

```
Content for first slide

---

Content for next slide
```

You can also use vertical slides with a double dash (if configured):

```
Horizontal slide

--

Vertical slide
```

---

## Markdown Features

1. **Bold** and *italic* text
2. Lists (ordered and unordered)
3. [Links](https://revealjs.com)
4. Code blocks:
   ```javascript
   function example() {
       console.log("Hello, world!");
   }
   ```

---

## Fragments and Notes

<!-- .element: class="fragment" -->
This text will appear as a fragment

<!-- .element: class="fragment" -->
This will appear second

notes:
These are speaker notes.
Only visible in presenter view.

---

## HTML Inside Markdown

You can mix HTML with Markdown for special formatting:

<div style="color: #42affa; font-size: 1.4em;">
  Styled text using HTML
</div>

<div class="special-container">
  <span class="custom-class">Custom styling</span>
</div>

---

## Configuration Options

You can configure slide separators:

```javascript
Reveal.initialize({
    // ...
    markdown: {
        separator: '^\n---\n$',         // Horizontal slide separator
        verticalSeparator: '^\n--\n$',  // Vertical slide separator
        notesSeparator: '^notes:',      // Speaker notes separator
        // ...
    }
});
```

---

## Single File Benefits

* Easier to see the entire presentation flow
* Simple to reorder slides by moving content
* Better for sequential, related content
* Great for version control
* Presentation is just one file + HTML wrapper