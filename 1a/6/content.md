## The Structure of Modern English

* **From *nothing* to words:** Take words, group them into similar families, give them names.
* **From words to phrases:** Combine words, acting as headwords or modifiers, into phrases. Group phrases into similar families, and give them names.
* **From phrases to clauses:** Say what these phrases are doing in relation to each other and group them.
* **From clauses to sentences:** Combine clauses into complex or compound sentences.
* **Look out:** for strangenesses and embedding!

---

@slide nohandout
## Today’s Sentences

@ex build
  In her lectures, students usually love everything.
  He does not answer his emails very quickly.
  He must have been reading some very angry emails earlier.
  Actually, he works at home very rarely these days.

---

## How to Parse – 1

* Do the easy parts of speech first
  * For example, obvious nouns and verbs, adverbs ending in -ly, prepositions like “to” and “in”, determiners like “the” and “a”...
* Count the main verbs to work out how many clauses
* Identify any phrases you can
  * For example, from a preposition to a noun is a noun phrase, a verb on its own with no auxiliaries is a verb phrase...
* Identify modifiers and headwords (and those which are neither)
  * You should have a clue from the types of phrases you identified before

--

## How to Parse – 2

* Go back and see if you can identify anything else
  * Try the substitution and coordination tests
* Do this until you have the parts of speech and phrases done
* Identify clause elements
  * For example, a VP is always the Predicator, a highly mobile unit (which adds to the meaning of the verb phrase) is an Adverbial, AvPs and PPs are Adverbials, AjPs are Complements, and then test for Subject and Object agreement
* Finally, identify clauses based on how many predicators you found

---

## Sentence 1

@card ex
* In her lectures, students usually love everything.
@end

--

## Sentence 1

@parse plain steps="class brackets mh form function"
  (^A_PP In^x_pr her^M_d lectures^H_N) (^S_NP students^H_N) (^A_AvP usually^H_Av) // (^P_VP love^H_V) (^O_NP everything^H_N)

---

## Sentence 2

@card ex
* He does not answer his emails very quickly.
@end

--

## Sentence 2

@parse plain steps="class brackets mh form function"
  (^S_NP He^H_pn) (^P_VP does^M_a not^x_n answer^H_V) (^O_NP his^M_d emails^H_N) // (^A_AvP very^M_Av quickly^H_Av)

---

## Sentence 3

@card ex
* He must have been reading some very angry emails earlier.
@end

--

## Sentence 3

@parse plain steps="class class2 brackets mh form function"
  (^S_NP He^H_pn) (^P_VP must^M_a@class2 have^M_a@class2 been^M_a@class2 reading^H_V) // (^O_NP some^M_d@class2 (^M@function_AjP very^M_Av angry^H_Aj) emails^H_N) (^A_AvP earlier^H_Av)

---

## Sentence 4

@card ex
* Actually, he works at home very rarely these days.
@end

--

## Sentence 4

@parse plain steps="class class2 brackets mh form function"
  (^A_AvP Actually^H_Av) (^S_NP he^H_pn) (^P_VP works^H_V) (^A_PP at^x_pr home^H_N@class2) // (^A_AvP very^M_Av@class2 rarely^H_Av) (^A_NP these^M_d days^H_N)

---

@slide nohandout
@image ./img/whos-awesome.jpg alt="A motivational poster: a beagle puppy winking and pointing a paw at the viewer, above the caption WHO'S AWESOME? and, smaller, You're awesome!"
