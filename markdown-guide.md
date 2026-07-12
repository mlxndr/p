# Slide Markdown Guide

An aide memoire for writing `content.md` and `meta.json`. Everything here
is expanded in the browser; there is no build step.

## Slides and notes

A blank line then `---` starts a new slide; `--` starts a vertical slide
beneath the current one. A line starting `notes:` begins speaker notes
for the slide (press `s` to see them). Lists animate in as fragments.

## Text

| Write | Get |
| --- | --- |
| `*italic*` and `**bold**` | italic and bold |
| `^^oed^^` | real small caps (for acronyms and terms of art) |
| `%%an aside%%` | the theme's subtle text colour |
| `<div class="md-small">…</div>` | 70% text, for dense tables |
| `<p class="md-source">Gladstone 1877</p>` | right-aligned source line |

## Slide modifiers

One line anywhere in the slide; flags combine (`@slide smaller centred`):

```
@slide smaller       85% text          @slide centred   vertically centre
@slide smallest      72% text          @slide plain     no heading rule
@slide contrast      the theme's title ground carries the slide
@slide bg=#183153    arbitrary background colour (prefer contrast)
```

## Whole-slide directives

```
@section Part Two: The Corpus
```
A part-divider: one centred display heading, nothing else.

```
@quote attrib="W. E. Gladstone, HC Deb 20 April 1877, c1576-77"
'...that Barrow's *Mirror of Parliament* is the primary record...'
```
A displayed quotation; everything after the directive is the quote
(markdown works inside it). Add the `contrast` flag for the full-colour
version — good for the one quotation the talk turns on. For long
quotations (a testimony, a full paragraph), add `smaller` or `smallest`
to scale them to fit; with a heading on the slide, the quote flows
beneath it rather than centring.

```
@refs title="References"
* Knight, C. (1865) *Passages of a Working Life*. London.
* ...
```
Hanging indents, smaller text, items never animate. `title=` is optional.

## Images

Always include `alt="…"` (a red ribbon nags until you do). Every image
slide gets a deep-link id from its filename; override with `id=`.

```
@image ./img/chart.png alt="…" caption="…"          full-bleed, never crops
@image ./img/photo.jpg alt="…" fit=cover focus=30,60    cover, focal point

@image-seq                                          a run of full-bleed slides
    ./img/one.png alt="…" caption="…"
    ./img/two.png alt="…" caption="…"

@image-left ./img/portrait.png alt="…" split=38     image + text columns
* the markdown after the directive
* becomes the text column                           (@image-right mirrors it;
                                                     `fragment` reveals on click)

@compare                                            two images side by side
    ./img/before.png alt="…" caption="Before"
    ./img/after.png alt="…" caption="After"

@image-left ./img/scan.png hold id=ocr alt="…"      same directive + id on two
                                                    adjacent slides: the image
                                                    holds while the text swaps

@zoom ./img/page.png focus=24.5,83.7 scale=5.2 to=./img/crop.png
    alt="…" caption-start="…"                       zoom from the full image
                                                    into a detail; focus is the
                                                    point (% across, % down)
                                                    that ends centred; to= lands
                                                    on a sharper pre-cropped file

@kenburns ./img/photo.jpg alt="…" pan=in dur=24s    slow background pan; use
                                                    sparingly, never under text
```

Escape a literal line-initial `@` with `@@`. Raw HTML and
`<!-- .slide: … -->` comments still work as an escape hatch. A malformed
directive renders a self-describing red error slide rather than failing
silently.

## meta.json

The single source for the title slide, closing slide (with QR from the
folder URL), browser-tab title, and the landing page. Per-field merge
over `inc/site.json` (author, affiliation, email, baseUrl defaults);
logos are always declared per deck.

```json
{
  "title": "The Fairest in the Land?",
  "subtitle": "Verbatim Transcriptions | in the *Mirror of Parliament Corpus*",
  "date": "May 2026",
  "event": "ICAME47",
  "location": "Koblenz",
  "logos": ["leverhulme", "uog"]
}
```

`*…*` italicises and `|` forces a line break in title/subtitle;
`^^ICAME47^^` sets an acronym event name in small caps. A deck with
exactly ONE logo takes a more restrained title design automatically:
sentence-case title, the event and date as the subtle line beneath the
names, the logo alone on the right. For a co-authored deck, replace
`author` with:

```json
"authors": [
  { "name": "Marc Alexander", "affiliation": "University of Glasgow",
    "email": "marc.alexander@glasgow.ac.uk" },
  { "name": "James Balfour", "affiliation": "University of Glasgow" }
]
```

Add `"closing": false` to suppress the generated closing slide. A deck
wanting a bespoke opening keeps a `title.md` section in its index.html
instead of the `data-meta="title"` placeholder.

## New deck in three steps

Copy `icame47`, edit `meta.json`, write `content.md`. Nothing else needs
touching.
