## A plain bulleted slide

* The text box default: 28 pt, Arial bullets on a hanging indent, 12 pt after each item
* A second point, long enough to wrap onto a second line so the hanging indent can be judged at a glance
  * A second level at 24 pt
* A third point

---

## The template’s content placeholder

@slide placeholder

* This slide uses the master’s body: 32 pt, 90% spacing
  * Level two, 28 pt, with an em dash
    * Level three, 24 pt
* A deck can make this its default in the corporate settings

---

## A lead, cards and a takeaway

Every course assesses its intended learning outcomes, and the grade states how well they were attained. A paragraph above cards is the lead, at 20 pt.

@cards
:: blue
### Glasgow Grading Scheme 1
Primary grades A to H, with secondary bands from A1 (22 grade points) to G2 (1) and H (0).

Judgement is made by direct reference to the primary verbal descriptors.
:: navy
### Glasgow Grading Scheme 2
Single grades A0 to H, each carrying a single grade point value for aggregation (A0 is 22, D0 is 11).
:: light-blue
### A light card
University Blue text on the light colours, as the brand requires.
@end

@note **The course specification is the authoritative source** for the components of assessment and their weights (§16.2(b)).
@note Consecutive notes are paragraphs of one panel.
@source AR §16.2, §16.22 to §16.23 · Guide section 4

---

## Cards that take the deck’s colours

@cards cols=5
::
### 1
What does a grade mean?
::
### 2
When has a student done enough?
::
### 3
What do we owe a student when life gets in the way?
::
### 4
What does a second chance do?
::
### 5
What does the degree outcome mean?
@end

@source A bare `::` takes the next colour of "cardColours"

---

## Subtitles, a wide card and a build

@cards
:: blue
### Configuration
#### Before marking starts
The convener and Assessment Officer confirm that the gradebook matches the course specification.
:: pink
### Exceptions
#### At course validation
Reviewers check every administrative grade and every fail.
:: light-grey wide build
**The wide card arrives on a click** (builds appear instantly in corporate decks).
@end

---

@section Part 1 :: blue
### What does a grade mean?
Assessment Regulations §16.22 to §16.31

---

## A worked example beside a card

The course grade is the weighted average of the component grade points.

@cards widths=62,38
:: light-grey
A student on a History of Examples course: examination 60% at B2 (16 grade points), essay 40% at C1 (14 grade points)

16 × 0.6 = 9.6

14 × 0.4 = 5.6

9.6 + 5.6 = 15.2, rounded to 15: B3
:: blue
### Rounding
Courses using Scheme 1 for 50% or more of the assessment: round half up to a whole number. The rounded value is final.
@end

@note Assessment worth 10% or less of a course affected by approved extenuating circumstances may be excluded from the course grade.
@source AR §16.29 to §16.31

---

## A flow of three cards

@cards arrows
:: purple
### The claim
Ross misses his examination through illness and submits a claim within five working days.
:: purple
### Stage 1: Student and Academic Services
Is the claim supported? How severe were the circumstances, and for how long?
:: purple
### Stage 2: the School
What happens to each affected component of assessment.
@end

@note Schools see the Stage 1 determination, not the evidence.

---

## A stack

The *Assessment Regulations* govern assessment on every taught programme.

@cards stack
:: navy
### Assessment Regulations
Grading, credit, GPAs, reassessment, extenuating circumstances, classification
:: blue
### Degree Regulations: UG, UG-Clin, PGT, PGR
What a degree is made of and how students move through it
:: light-blue
### Programme specifications
The detail for each programme, approved by a Board of Studies
@end

@source AR §16.1 to §16.5

---

## Statistics and a table

@stats
  96% :: Fewer files :: 83 files to 3
  93% :: Reduction in text :: about 9,800 words now
  4 :: Consolidated documents

@table head=navy band rowhead widths=30,25,25,20
| Code | Meaning | Effect | When |
|---|---|---|---|
| NS | Not submitted | Scores zero | Any assessment |
| EC | Extenuating circumstances | Session pending | Deferred assessment |
| CNY | Credit not yet awarded | Session pending | Additional requirement |

---

@set honours
  Year 1
  Year 2
  Junior Honours
  Senior Honours
  Award

## Honours entry

@menu honours 2>3

@cards
:: green
### The normal route
A GPA of at least 12.0 at the first attempt across the level 2 courses in the intended Honours subject.
:: purple
### If the gate is missed
The Head of School or nominee can admit a student whose performance suggests they can succeed.
@end

@source UG §9; AR §16.13(d)

---

## The SIW

@menu honours 4

@cards
:: green
### The requirement
A level 4 or 5 course of at least 20 credits, with a course code ending in P.
:: purple
### When it goes wrong
It is never covered by compensatory credit.
@end

---

## Grade strips

@cards style=strip widths=12,88
:: red
A3, B2, C1, D3
::
A student with these grades across 120 credits has a GPA of 15.3 and passes every course.
@end

@cards style=strip widths=12,88
:: orange
C2, C2, C3, C3, D3, D3
::
An orange strip with white grades (converted decks: the old light-yellow strips).
@end

---

## Bars and a ribbon heading

@cards style=bar
:: red
### Old
* Two documents, one for each level
* Exceptions held locally
:: green
### New
* One set of regulations
* Exceptions in the course specification
@end

---

## [[Delayed Assessment Permits]]{light-purple}

A heading that is one tag is the title on a coloured bar.

* University Blue on the light colours, white on the strong ones

---

## An image below the title

@image ../specimen/img/speechlengthdistribution.png alt="A chart of speech lengths in the Mirror of Parliament"

---

@image ../specimen/img/tc-hansard.png alt="A page of Hansard" fit=cover

---

## Image beside text

@image-left ../specimen/img/youngdickens.png alt="A portrait of the young Charles Dickens" split=38
* An image column with the body text beside it
* The image fills the body area below the title
