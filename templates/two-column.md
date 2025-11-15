<!-- Two-Column Layout Template -->
<!-- Description: Side-by-side comparison or parallel content presentation -->
<!-- Usage: Comparing concepts, showing before/after, pros/cons, theory/practice -->

## Two-Column Comparison

<div class="container">
<div class="col">

### Left Column Title

* Point one
* Point two
* Point three
* Point four

</div>
<div class="col">

### Right Column Title

* Corresponding point
* Another point
* Related concept
* Final point

</div>
</div>

<!-- Customization: Adjust column widths with inline styles if needed -->
<!-- Example: <div class="col" style="width: 60%"> for asymmetric layout -->

---

## Two-Column: Text vs. Image

<div class="container">
<div class="col">

### Key Concept

This column contains explanatory text about the concept being illustrated.

You can use multiple paragraphs, lists, or other markdown elements.

* Bullet point one
* Bullet point two

</div>
<div class="col">

![Description of image](./img/placeholder.png)

</div>
</div>

---

## Two-Column: Code Example

<div class="container">
<div class="col">

### Before

```python
# Old approach
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item)
    return result
```

</div>
<div class="col">

### After

```python
# Improved approach
def process_data(data):
    return [item for item in data
            if item > 0]
```

</div>
</div>

<!-- Note: Ensure code blocks are properly indented within column divs -->
