## Lists and Emphasis

* A first-level item with *italic*, **bold** and a [link](https://mga.is)
* Real small caps: ^^oed^^, ^^INTJ^^ and ^^PROPN^^ tags, 1834 and 2026 in oldstyle figures
* An aside in the subtle colour: %%this is by the way%%
  * A second-level item
  * Another, long enough to wrap onto a second line so that the hanging indent and the tinted dash can both be judged at a glance
* Grammar: **<span class="subject">The Speaker</span> <span class="predicator">called</span> <span class="object">the House</span> <span class="complement">to order</span> <span class="adverbial">at noon</span>**

notes:
Speaker notes live here; press s to see them.

---

## A Numbered Argument

1. **First claim:** set as a numbered list, the numbers tinted like the dashes
2. **Second claim:** a longer item that wraps, to show how the text returns to its own indent rather than the number's
3. **Third claim:** short

--

## Paragraph and Source

'...an attempt was boldly made by a gentleman named Barrow, to produce a verbal report of the proceedings of Parliament. He succeeded and carried it on for several years; and, for those years, I do not hesitate to say, that Barrow's *Mirror of Parliament* is the primary record.'

<p class="md-source">W. E. Gladstone, HC Deb 20 April 1877, c1576–77</p>

--

## Table, Source and Following Text

| | 1834 | 1839 | 1840 |
| --- | --- | --- | --- |
| Speeches | 18,893 | 1,825 | 4,714 |
| Markers | 76 | 192 | 517 |
| Per speech | 0.004 | 0.105 | 0.110 |

<p class="md-source">Pilot corpus, 2026</p>

* Text after a table, to check the space beneath it

--

## A Dense Table in md-small

<div class="md-small">

| Speech | Reported duration | *Mirror* word count | Words/hour |
| --- | --- | --- | --- |
| Brougham on common law, 7 Feb 1828 | 6 hours 5 min | ~36,000 | ~5,900 |
| Hobhouse on Navarino, 14 Feb 1828 | 1 hour 45 min | ~13,000 | ~7,400 |
| Peel on Catholic Relief, 5 Mar 1829 | 4 hours 15 min | ~24,000 | ~5,600 |
| Lord Hawick, 8 Jun 1830 | 15 min | ~1,400 | ~5,600 |

</div>

<p class="md-source">Jupp 1998: 236</p>

--

## A Sidenote

* The *Mirror* reported debates verbatim, week by week
@note Barrow employed his own shorthand writers, among them the young Dickens.
* *Hansard* was compiled from newspapers and speakers' own copy
* Speakers routinely corrected their copy before publication
@note Gladstone recalled members correcting their speeches for the *Mirror*.

---

@section Part Two: Quotations and Contrast

---

@quote attrib="W. E. Gladstone, HC Deb 20 April 1877"
'...that Barrow's *Mirror of Parliament* is the primary record, and not *Hansard's Debates*, because of the greater fulness which Barrow aimed at and obtained.'

--

@quote attrib="W. E. Gladstone, HC Deb 20 April 1877" contrast
'...the primary record, and not *Hansard's Debates*.'

--

## An Inline Blockquote

Markdown's own quotation marker:

> We are duping the unborn generations. With open eyes we are sowing the seeds of dissension between historians of another age.

<p class="md-source">*Daily News*, 8 August 1853</p>

--

@slide contrast
## A Contrast Slide

* The theme's title ground carries the slide
* 1834, 1839, 1840

--

@slide centred plain
## Centred, No Heading Rule

A short statement, vertically centred.

---

@section Part Three: Images

---

## Image Left

@image-left ./img/youngdickens.png alt="A portrait of a young Charles Dickens" split=38
* The markdown after the directive becomes the text column
* `split=38` sets the image column's width

--

## Image Right, Captioned

@image-right ./img/tc-hansard.png alt="A portrait of Thomas Curson Hansard" caption="T. C. Hansard"
* The mirror image of image-left
* With a caption under the picture

--

@image ./img/speechlengthdistribution.png alt="Histogram of speech lengths in the Mirror and Hansard" caption="A full-bleed image with a caption"

--

@compare
  ./img/laughter.png alt="Chart of laughter markers" caption="Left"
  ./img/speechlengthdistribution.png alt="Histogram of speech lengths" caption="Right"

--

## Zoom

@zoom ./img/mirror1834-06-03close.png focus=40,40 scale=2.5 alt="A column of the Mirror of Parliament" caption-start="Before the zoom" caption="After the zoom"

--

@kenburns ./img/mirror1834-06-03close.png alt="A column of the Mirror of Parliament" pan=in dur=24s

---

@section Part Four: Stress Tests

---

## Paralinguistics

* A single long word as the heading: the Spine layout must shrink it into the band

--

## A Very Long Slide Heading That Runs Well Onto a Second Line

* Headings that wrap

--

## Overflow Handled by Autofit

* Vision language models make digitisation of historical text dramatically cheaper; the barrier to building decent, quick corpora from nineteenth-century print has dropped by orders of magnitude
* Not full of hesitation markers or phonetic detail, but near-complete 'tidied' transcription of what was *generally said*, confirmed by independent timing evidence
* Knowing where applause, laughter and cries of 'No, no!' fell in a debate lets us see more of the performative culture of the 1830s Commons and Lords
* One more point, to push the slide past the bottom of the stage so the text has to shrink to fit

--

## Overflow Beyond Autofit

* This slide is meant to be too long even at the smallest size, so that local preview shows its red dashed outline
* Line two of far too many
* Line three of far too many
* Line four of far too many
* Line five of far too many
* Line six of far too many
* Line seven of far too many
* Line eight of far too many
* Line nine of far too many
* Line ten of far too many
* Line eleven of far too many
* Line twelve of far too many
* Line thirteen of far too many
* Line fourteen of far too many
* Line fifteen of far too many
* Line sixteen of far too many
* Line seventeen of far too many
* Line eighteen of far too many

--

@slide smaller
## Smaller Text

* `@slide smaller` sets the slide at 85%; `@slide smallest` at 72%

--

## Code and Icons

<i class="fad fa-code"></i> An icon from the self-hosted set

```python
def markers_per_speech(markers, speeches):
    return markers / speeches
```

---

@refs title="References"
* Jupp, Peter. 1998. *British Politics on the Eve of Reform*. Basingstoke: Macmillan.
* Vice, John & Stephen Farrell. 2017. *The History of Hansard*. London: House of Lords Library.

---

@slide spare
## Spare: After the Closing Slide

* `@slide spare` moves this slide after the closing slide
* It is left out of the slide count and the progress bar, but you can still jump to it
