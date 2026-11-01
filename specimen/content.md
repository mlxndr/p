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

@quote attrib="W. E. Gladstone, HC Deb 20 April 1877" card
'...that Barrow's *Mirror of Parliament* is the primary record, and not *Hansard's Debates*.'

--

## A Card

The turned-corner card holds any markdown, here a transcript:

@card
@transcript
  a: Are you doing anything on Friday // evening?
  b: // Nothing much, why?
  (1.0)
  b: Well (0.5) I'd like to
@end

--

## Example Sentences

* A simple sentence has one Predicator; [Bill **is** happy.]{ex} is one.

@card ex
* He **awoke** in the night and **discovered** he **loved** grammar.
* I **loved** grammar when I first **read** about it.
  * A note on the card, in the body face.
* You **can kick** my dog, but you **can't insult** grammar.
@end

@note A reminder that floats at the foot of the slide. :: float

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

@section Part Five: Inline Marks

---

## Highlight, Colour, Small Caps

* The city was ==bombed== overnight
* He [defended]{red} every claim; she [attacked]{blue} his position: ==^^argument is war^^==
* [The army]{accent} takes the theme's accent; %%an aside takes the subtle colour%%
* Tags: [[AFTER]]{purple} [[GPA 9.0]]{grey} [[Draft]]{light-gold} and icons :fa-chalkboard-teacher: :fa-images:

--

## Grammar Marks

[S Tam] [P regards] [O me] [A with suspicion].

[S The army] [P seemed] [Cs tired].

[S She] [P gave] [Oi him] [Od the book] [cj and] [S they] [P elected] [Od her] [Co chair].

--

## The Palette

[[red]]{red} [[orange]]{orange} [[gold]]{gold} [[green]]{green} [[teal]]{teal} [[blue]]{blue} [[navy]]{navy} [[purple]]{purple} [[pink]]{pink} [[grey]]{grey}

[[light-red]]{light-red} [[light-orange]]{light-orange} [[light-gold]]{light-gold} [[light-green]]{light-green} [[light-teal]]{light-teal} [[light-blue]]{light-blue} [[light-navy]]{light-navy} [[light-purple]]{light-purple} [[light-pink]]{light-pink} [[light-grey]]{light-grey}

[red]{red} [orange]{orange} [gold]{gold} [green]{green} [teal]{teal} [blue]{blue} [navy]{navy} [purple]{purple} [pink]{pink} [grey]{grey}

--

## Marks on a Click

A strong {==collocate==}

{++dis++}graceful

br{--eakfast + l--}unch

We provide {~~comfort~>good things~~}

brunch: {answer breakfast + lunch}

---

@section Part Six: Slide Control

---

## Silly | from 'blessed' to 'foolish'

@note Each step is a sense attested in the *OED*. :: top
* Old English *sǣlig*: happy, blessed
* Middle English: innocent, deserving of pity
* Early Modern English: feeble; then foolish
@note A worked case of pejoration. :: build
@source *OED Online*, s.v. *silly*, adj.

--

@slide statement
'The limits of my language mean the limits of my world.'

@source Ludwig Wittgenstein, *Tractatus Logico-Philosophicus* 5.6

--

@slide activity
## In Pairs | five minutes

* List three words English has borrowed from French since 1900
* For each, say whether the spelling has changed

--

## Pause

The *Mirror of Parliament* reported debates at length.

@pause
* 1828 to 1841
* Edited by John Henry Barrow

@pause
Its reporters included the young Dickens.

--

@slide static
## A Static Slide

* `@slide static`: this list appears all at once
* Click marks still work: a {==highlight==} on the first click

--

@slide build=auto
## Builds Without Clicks

* `@slide build=auto` runs the slide's builds one after another
* No clicks are needed
* Leaving the slide stops them

--

@slide fade
## A Fade Into This Slide

* `@slide fade`; `@slide cut` gives no transition at all

--

@slide hidden
## A Hidden Slide

* `@slide hidden`: kept in the source, skipped in the show and the PDF

--

@slide nohandout
## Presenter Only

* `@slide nohandout`: shown when presenting, left out of the student version

---

@include included.md

---

@section Part Seven: Text Blocks

---

## Columns

@columns cols=3
### Before 1900
* Comparative philology
* The Neogrammarians
::
### Around 1900
* Saussure's *Cours*
* Langue and parole
:: accent
### After 1950
* Generative grammar
* Corpus linguistics
@end

--

## Cards

@cards
[[BEFORE]]{grey}
### Two documents
#### Regulations and guidance
* 109 separate documents
* Overlapping definitions
:: light-blue foot
[[AFTER]]{navy}
### One handbook
* 4 consolidated documents
* One definition per term

Navigability
:: navy icon=chalkboard-teacher
### Training
Sessions for advisers in every School
@end

--

## Header Bars and Widths

@cards style=bar widths=62,38
:: dark-red
### What changes
How credit is counted: course by course, then at session level
:: dark-red
### What does not change
Classification thresholds and GPA requirements
@end

@source Assessment Regulations §16.2

--

## Arrows, One Card per Click

@cards arrows build
### Draft
Written by the course team
::
### Review
Checked by the School
::
### Approval
Agreed at College level
@end

--

## A Stack

@cards stack arrows
:: light-gold
Word
:: light-green
Phrase
:: light-blue
Clause
:: light-purple
Sentence
@end

--

## Grade Strip

@cards style=strip
:: dark-red
A3, B2, C1, C1, C3, ~~D3~~ C3
::
### Six components
The course grade is the weighted mean of the component grades, rounded to the nearest whole grade point.
@end

--

## Flowing Columns

@columns cols=2
* *hovercraft*
* *brunch*
* *motel*
* *smog*
* *flu*
* *phone*
* *bus*
* *pram*
@end

---

## Terms Then Glosses

@terms sc build=columns answers
  hovercraft :: hover + craft
  brunch :: breakfast + lunch
  motel :: motor + hotel
  flu :: influenza

--

## Statistics

@stats
  96% :: Fewer files :: 83 files to 3
  [93%]{green} :: Reduction in text :: [[about 9,800 words now]]{green}
  12 :: Schools consulted

--

## Examples

@ex
  The dog eyed the birthday cake. :: canonical order
  *a five beautiful days :: numeral before determiner
  (b) There will be a sponsored *fast* tomorrow. :: (N)
  ?Colourless green ideas sleep furiously.

--

## A Formatted Table

@table head=navy band rowhead widths=22,26,26,26
| | Current state | Simplification | Outcome |
|---|---|---|---|
| Organisational | 109 documents | 4 consolidated documents | Navigability |
| Linguistic | 41 defined terms | 19 defined terms | Consistency |
| Procedural | 12 forms | 5 forms | Fewer errors |

--

## A Table with Bars

@table rowhead bars
| | 1775–1799 | 1875–1899 |
|---|---|---|
| 1 | French (33%) | Latin (40.5%) |
| 2 | Latin (30%) | German (18%) |
| 3 | German (5%) | French (15.5%) |

@source Durkin 2014, *Borrowed words*. (The bars show in forms that draw them, such as Plate and Key.)

---

## Concordance

@kwic build=context
  the hammer was used to | strike | the nail into the wall
  workers voted to | [strike]{red} | over pay and conditions
  a sudden thought would | strike | her as she walked
  the union called a national | strike | for the following week

--

@slide smaller
## Concordance as Prose and in a Window

@kwic prose
  ...the hammer was used to | strike | the nail into the wall, and...
  ...workers in three plants voted to | strike | over pay and conditions...

@kwic window=3
  the union called a national | strike | for the following week
  workers voted to | strike | over ==pay== and conditions

---

## A Brace Tree

@tree build=level
  FTA
    commit the FTA
      directly
        baldly %%(without redressive action)%%
        with politeness
      indirectly
    don't commit the FTA

--

## An Outline with Codes

@tree style=outline
  01 :: The world
    01.04 :: Physical sensibility
      01.04.09 :: Colour
        01.04.09.07 :: ==Named colours==
    01.05 :: Matter

---

## Transcript

@transcript
  a: Are you doing anything on Friday // evening?
  b: // Nothing much, why?
  (1.0)
  a: Can you come round for dinner?
  b: Well (0.5) I'd *really* like to, but I'm afraid I've already
  arranged to meet friends (0.5) but thanks for asking.

--

## Preference Organisation

* An invitation makes acceptance the preferred response
* Refusals are marked: delay, hedging, an account
* The next slides lay a transcript over this one

--

@transcript overlay
  a: Can you come round for dinner on Saturday?
  (1.0)
  b: Well (0.5) I'd really like to, but I'm afraid I've already

--

@transcript overlay
  a: Can you come round for dinner on Saturday?
  (1.0)
  b: Well (0.5) I'd really like to, but I'm afraid I've already
  arranged to meet friends on Saturday evening (0.5) but thanks for asking.

---

@section Part Eight: Sets, Motion and Images

---

@set criteria
  Orthographic :: green :: pen-nib
  Phonological :: teal :: volume
  Grammatical :: light-gold :: brackets-curly
  Semantic :: blue :: lightbulb

@set why
  Discovery :: green :: telescope
  Prestige :: light-gold :: crown
  Subjugation :: teal :: swords

@set neologisms
  Affixation :: red :: puzzle-piece
  Conversion :: pink :: exchange-alt
  Compounding :: gold :: cubes
  Blending :: green :: compress-alt
  Clipping :: teal :: cut
  Back-formation :: blue :: undo
  Abbreviation :: purple :: font-case

@set honours
  Year 1
  Year 2
  Junior Honours
  Senior Honours
  Year 5 MEng :: :: :: optional
  Award :: navy

@set languages text
  Latin :: blue
  French :: purple
  Greek, Hellenic :: green

---

## Tags from a Set

[[Orthographic]] [[Phonological]] [[Grammatical]] [[Semantic]]

*occupy*, from [[French]] *occuper*, from [[Latin]] *occupāre*; *phone*, from [[Greek]] *phōnē*

A tag outside any set: [[GPA 9.0]]{grey}; an optional stage: [[Year 5 MEng]]

--

@menu why all style=tabs centre

--

@slide morph
## [[Discovery]]

* A new thing or concept is met, and another language already has a word for it
* *tomato*, *hurricane*, *chocolate*

--

@menu neologisms all centre

--

@menu neologisms labels

--

@menu neologisms 1
## Affixation

* English affixes make new words from existing ones
* *graceful*, *disgraceful*

--

@menu neologisms 2
## Conversion

* A word form taken into another part of speech
* *access*, *email*, *fish*

--

@menu neologisms 6
## Back-formation

* A new word made by removing what looks like an affix
* *to burgle*, *to edit*

--

@menu honours 2>3
## Honours Entry

* The arrow between Year 2 and Junior Honours is lit
* The stages come from `@set honours`; Year 5 MEng is an optional stage

--

@menu honours 4
## Senior Honours

* One stage lit: the heading moves along under it

---

## A Morph of Pieces

The [[cat]] sat on the [[mat]].

--

@slide morph
## A Morph of Pieces

On the [[mat]] sat the [[cat]].

--

## Every Word a Piece

Colourless green ideas sleep furiously.

--

@slide morph words=loose
## Every Word a Piece

Furiously sleep colourless green ideas.

---

## Morpheme Words

@terms
  plain :: [un- + help + -ful + -ness]{plain}
  split :: [un- + help + -ful + -ness]{split}
  apart :: [un- + help + -ful + -ness]{apart}
  bases :: [un- + help + -ful + -ness]{bases}
  affixes :: [un- + help + -ful + -ness]{affixes}
  jigsaw :: [un- + help + -ful + -ness]{jigsaw}

--

@slide centred fade
## Taking Words to Pieces

[un- + help + -ful + -ness]{jigsaw}

--

@slide centred
## Taking Words to Pieces

[~un- + help + -ful + ~-ness]{jigsaw}

--

@slide centred morphemes=split
## Taking Words to Pieces

[un- + help + -ful + -ness]{plain}

---

## Marks on an Image

@marks ./img/mirror1834-06-03close.png alt="A column of the Mirror of Parliament, 1834, with the interruption 'Oh! Oh! Oh!'" caption="Mirror of Parliament, 1834"
  box 7.5,21 w=25 h=6.5 navy "Speaker" id=sp
  ring 33.5,45.5 r=8 green "Figures" pos=below
  dim y=68,81.5
  + ring 76,75.5 r=11 red "Interruption" pos=above
  box 8.5,79.5 w=27 h=7 id=sp
  label 50,6 "One debate, three voices" teal
  zoom 70,76 2.2

--

## Every Mark at Once

@marks ./img/mirror1834-06-03close.png alt="The same column, every mark shown at once" all
  box 7.5,21 w=25 h=6.5 navy "Speaker"
  ring 76,75.5 r=11 red "Interruption"
  label 4,62 "Several Honourable Members" purple rot=-90

---

@image ./img/mirror1834-06-03close.png fit=cover focus=50,60 alt="A column of the Mirror of Parliament" over=bottom band
The *Mirror of Parliament* printed the interruptions as well as the speeches

--

@image ./img/youngdickens.png alt="A portrait of a young Charles Dickens" over=right bubble build
### Charles Dickens
A reporter for the *Mirror of Parliament*
@end

--

@image ./img/speechlengthdistribution.png alt="Histogram of speech lengths in the Mirror and Hansard" over=centre dim build
### A Veil over the Chart
`dim` lays the paper colour over the image; `build` brings it in with the text

--

## Bleed

@image-left ./img/tc-hansard.png alt="A portrait of Thomas Curson Hansard" bleed split=36 focus=50,30
* `bleed` runs the image to the edge of the screen
* `focus=50,30` sets what the crop keeps

--

@image-seq
  ./img/speechlengthdistribution.png alt="Histogram of speech lengths" hold id=chart caption="hold id=chart"
  ./img/laughter.png alt="Chart of laughter markers" hold id=chart caption="The same id: the image moves into place"

--

## Video

@video ./media/specimen.mp4 poster=./img/specimen-video.png alt="A test pattern moving for four seconds" split=60
* A click plays the video once; it stops on its last frame
* The poster is what the PDF shows

--

@video ./media/specimen.mp4 poster=./img/specimen-video.png alt="A test pattern, looping" autoplay loop muted caption="autoplay loop muted"

---

@section Part Nine: Grammar

---

## Word Classes

@parse steps="class"
  Bob^_N has^_a taken^_V the^_d fluffy^_Aj // kittens^_N and^_c speaks^_V to^_pr them^_pn // like^_pr they^_pn were^_V his^_d children.^_N

--

## Notation

* Write the word class underneath the word
* Say if a word is a head (H), modifier (M), or neither (x) above it
* Put brackets around each phrase, with the phrase type underneath and to the left of the bracket

@parse steps="class mh brackets+form"
  (_NP the^M_d huge^M_Aj cake^H_N)

--

## Phrases inside Phrases

@parse
  (_NP The^M_d (^M_AjP really^M_Av bright^H_Aj) sun^H_N) (_VP is^M_a //
    shining^H_V) (_PP on^x_pr (^M_GP Ruth's^H_N) book.^H_N)

--

## Analysing a Clause, Step by Step

1. Label the words
2. Label heads and modifiers
3. Bracket the phrases
4. Label the phrases for form
5. Label the phrases for function
6. Label the clause

@parse steps="class mh brackets form function clauses" paired
  [MCl (^S_NP His^M_d family^H_N) (^P_VP bought^H_V) (^O_NP a^M_d house^H_N) (^A_AvP there.^H_Av)]

--

## Predicators

@parse steps="highlight"
  {Se [MCl (^S_NP He^H_pn) (^P_VP! felt^H_V) (^C_AjP dizzy^H_Aj) // [SCl when^x_c (^S_NP they^H_pn) (^P_VP! looked^H_V) (^A_PP in^x_pr his^M_d eyes.^H_N)]]}

--

## A Rank-Shifted Clause

@parse
  [MCl <^S [SCl That^x_cj (^S_NP the^M_d earth^H_N) (^P_VP is^H_V) (^C_AjP round^H_Aj)] and^x_cj //
    [SCl that^x_cj (^S_NP it^H_pn) (^P_VP can^M_a be^M_a circumnavigated^H_V)]> //
    (^P_VP was^M_a known^H_V) (^A_PP to^x_pr the^M_d ancient^M_Aj Greeks^H_N)]

--

## Subject and Predicator

@parse left steps="form function"
  (^S_NP The chickens) (^P_VP were chasing) me.
  (^S_NP I) (^P_VP was being chased) by the chickens.

--

## Brackets Only

@parse left
  (the house (on the corner))
  [that (the earth) (is) (round)]
  %%Bob%% has^_a taken^_V %%the kittens%%

--

## The Leech Layout

@parse layout=leech
  [MCl (^S_NP His^M_d family^H_N) (^P_VP bought^H_V) (^O_NP a^M_d house^H_N) (^A_AvP there.^H_Av)]

--

## Identifying Clause Elements

[P Predicators], [S Subjects], [O Objects], [C Complements], [A Adverbials]

@passage steps="P S O C A cj" find
[S Tam] [P regards] [O me] [A sardonically for a moment] [cj as] [S I] [P slam] [O the door], [cj but] [P remains] [C a very quiet fellow]. [S I] [P am becoming] [C very hungry]. [S Richie] [P is providing] [O the food] [A from the plastic lunch box], [cj and] [S he] [P gives] [Oi me] [Od a sandwich]. [S He] [P swigs] [O the Irn Bru] [cj and] [P hands] [O it] [A to Tam].

--

## Metaphor in a Passage

[^^argument is war^^]{gold}, [^^argument is dance^^]{green}

@passage steps="gold green"
He **[defended]{gold}** his position at first, but she **[attacked]{gold}** his main points. She found her **[rhythm]{green}**, and he **[followed her lead]{green}**.

---

@refs title="References"
* Jupp, Peter. 1998. *British Politics on the Eve of Reform*. Basingstoke: Macmillan.
* Vice, John & Stephen Farrell. 2017. *The History of Hansard*. London: House of Lords Library.

---

@slide spare
## Spare: After the Closing Slide

* `@slide spare` moves this slide after the closing slide
* It is left out of the slide count and the progress bar, but you can still jump to it
