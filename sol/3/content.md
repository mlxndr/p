@image-right ./img/pug-cake.jpg alt="A pug sitting at a table beside a birthday cake with a number 3 candle, licking its nose" split=35 bleed
## A short story

“The dog eyed the birthday cake on the counter. Temptation was calling to him. ‘Stay down,’ he had been told, but the frosting beckoned irresistibly. When nobody was looking, opportunity struck. By the time we returned, guilt was written all over his face. The evidence had been eaten.”

--

@slide hidden centred plain
%%A prompt to a large language model, with the passage pasted in:%%

## “Who ate the cake, and why is this passage funny?”

--

## A route through twentieth-century linguistics

@cards cols=3
### %%I%% The Scientific Turn
* Saussure (1900s): a system of differences
* Chomsky (1950s–60s): mental computation
* Halliday (1960s): a functional resource
* Hymes (1960s–): communicative competence
::
### %%II%% The Cognitive Turn
* Lakoff (1980s): conceptual metaphor
* Langacker (1980s): construal
* Kuno (1970s): empathy
* Goldberg (1990s): constructions
:: accent
### [III]{accent} The Machine Turn
* Shannon %%(1951): prediction%%
* Firth and Harris %%(1950s): distribution%%
* Word vectors %%(2013–)%%
* Transformers %%(2017–)%%
@end

---

## What is the next word?

“She takes her coffee with milk and \_\_\_”

“The ceremony was held at the local parish \_\_\_”

[“The evidence had been \_\_\_”]{gold}

--

## Claude Shannon | ‘Prediction and entropy of printed English’ (1951)

@cards cols=2
### The experiment
* A human subject guesses a text letter by letter
* After each wrong guess, the subject guesses again
* The number of guesses needed measures how predictable English is
::
### Key concepts
* Entropy: the average information per symbol, in bits
* Redundancy: the part of a text predictable from what came before
* Result: about 1 bit per letter with long contexts, against 4.7 bits for 27 equally likely symbols
@end

--

## What the next word depends on

[“The evidence had been \_\_\_”]{gold}

@table widths=22,78
| Knowledge | Constraint on the gap |
|---|---|
| Syntax | “had been” requires a past participle or an adjective |
| Semantics | evidence can be gathered, destroyed or eaten, but not frightened |
| The story | the cake has gone, and the dog was alone with it |
| Register | “evidence” sets up the mock-forensic frame of a crime report |

---

## Distributional meaning | from Lecture I

> “…difference of meaning correlates with difference of distribution.”

@source Harris, ‘Distributional structure’ (1954: 156)

> “You shall know a word by the company it keeps!”

@source Firth, ‘A synopsis of linguistic theory, 1930–1955’ (1957: 11)

* Distributional hypothesis: words that occur in similar contexts tend to have similar meanings

--

## Collocation | counting the company

@cards cols=2
### Key concepts
* Collocation: words that co-occur more often than chance predicts
* Pointwise mutual information (PMI): how much more often two words occur together than if they were independent
* Church & Hanks (1990): mutual information as a lexicographer's tool
::
### Halliday’s example (1966)
strong tea · ?powerful tea

powerful car · ?strong car

%%Near-synonyms with different company%%
@end

%%PMI(x, y) = log₂ [ P(x, y) ÷ ( P(x) × P(y) ) ]%%

--

## From concordance to vector

@video ./media/company-to-vector.mp4 poster=./img/company-to-vector.jpg alt="Animation: six concordance lines for frosting from English Wikipedia; the words five either side are counted into columns, rows are added for icing, guilt and remorse, and each long row of counts is compressed into a strip of 50 coloured cells, its GloVe vector; frosting and icing score 0.70, guilt and remorse 0.79" split=73
### Data
* Corpus: English Wikipedia, about 900 million words
* Window: five words either side
* Occurrences: frosting 132; icing 842; guilt 5,918; remorse 1,311
* Cosine similarity: frosting–icing 0.70; guilt–remorse 0.79; frosting–guilt 0.02

--

## Latent Semantic Analysis and the TOEFL | Landauer & Dumais 1997

@stats
  [64.4%]{gold} :: LSA: a word-by-document co-occurrence matrix, compressed to about 300 dimensions
  64.5% :: average score of applicants to US colleges from non-English-speaking countries

Test: 80 synonym items from the Test of English as a Foreign Language

--

## Word vectors | word2vec (Mikolov et al. 2013)

@cards cols=2
### Key concepts
* Word vector (embedding): a list of a few hundred numbers representing a word
* Training: predict the words around each word, over billions of words of text
* Words used in similar contexts end up with similar vectors
::
### The vectors in today's demonstrations
* GloVe (Pennington et al. 2014): vectors from global co-occurrence counts
* 50 numbers per word
* Trained on Wikipedia and the Gigaword news corpus, 6 billion words
@end

--

## The semantic differential | Osgood et al. 1957

@cards cols=2
### The method
* Ratings: a word is rated on seven-point scales between opposite adjectives
* Factors: evaluation (good–bad), potency (strong–weak) and activity (active–passive)
* Result: each word is a point in a three-dimensional space
::
### Rate these words, 1 to 7
@table
| Scale | dog | cake |
|---|---|---|
| good – bad | | |
| strong – weak | | |
| active – passive | | |
@end

--

## From features to word vectors

@video ./media/features-to-vectors.mp4 poster=./img/features-to-vectors.png alt="Animation: a componential-analysis table of plus and minus features (human, male, adult, royal) for man, woman, boy, girl, king and queen becomes rows of +1 and −1 drawn as gold and red cells; king − man + woman gives the queen row; then the same sum on the words' real 50-number GloVe vectors lands next to queen, at a cosine of 0.85" split=73
### Two kinds of feature
* Componential analysis: features chosen by a linguist, such as ^^human, male, adult^^ (Katz & Fodor 1963)
* GloVe: 50 unnamed features per word, learned from co-occurrence counts
* king − man + woman: nearest word queen, cosine 0.85

--

## GloVe word vectors in two dimensions

@image ./img/glove-2d.svg hold id=glove alt="Scatter plot of GloVe word vectors projected to two dimensions: the colour terms (blue, red, purple, yellow, green, crimson, scarlet) cluster at the top, the cake words (cake, custard, meringue, frosting, ganache, buttercream) at the lower left, and the crime words (evidence, innocence, remorse, culpability, confess, guilt) at the lower right"

--

## Directions in the vector space

@video ./media/directions.mp4 poster=./img/directions.png alt="Animation: two maps of word vectors; arrows from man to woman, boy to girl and uncle to aunt run nearly parallel, and the man-to-woman arrow copied onto king lands beside queen; arrows from countries to their capitals point the same way, and France-to-Paris copied onto Scotland lands among glasgow (0.850), dublin (0.849) and edinburgh (0.827)" split=73
### Calculations
* king − man + woman: queen 0.85
* paris − france + scotland: glasgow 0.850, dublin 0.849, edinburgh 0.827
* The maps: flat views through the 50-dimensional space; nearest words are computed in all 50

--

@slide hidden
## Arithmetic with word vectors

@table widths=46,27,27
| Calculation | Nearest word | Similarity (cosine) |
|---|---|---|
| king − man + woman | [queen]{gold} | 0.85 |
| paris − france + scotland | [glasgow]{gold} | 0.85 |
| your suggestions | ? | ? |

* Cosine similarity: 1 for vectors pointing the same way, 0 for unrelated directions
* Runners-up for the Paris calculation: dublin (0.85), edinburgh (0.83)

--

## Nearest neighbours of the passage's words

@table widths=22,78
| Word | Five nearest words in GloVe, closest first |
|---|---|
| [frosting]{gold} | ganache, meringue, custard, caramel, buttercream |
| [guilt]{gold} | remorse, innocence, betrayal, truth, culpability |
| [temptation]{gold} | resist, inevitably, vengeance, provoke, tempted |
| [evidence]{gold} | findings, reveal, case, testimony, revealed |

--

@slide hidden
## The analogy method | excluding the input words (Nissim et al. 2020)

@table widths=50,25,25
| king − man + woman | Nearest | Second |
|---|---|---|
| input words excluded (standard method) | [queen 0.85]{gold} | throne 0.77 |
| input words included | [king 0.89]{gold} | queen 0.86 |

* The standard method does not allow king, man or woman as an answer
* With them allowed, the nearest vector to the result is king itself

--

## Word vectors and collocation | Levy & Goldberg 2014

@cards cols=3
### 1 · counts
how often each word occurs near each other word
::
### 2 · association
a word-by-context table of PMI scores
:: accent
### 3 · compression
[a few hundred numbers per word]{gold}
@end

* Result: word2vec's skip-gram training implicitly factorises a word–context matrix of PMI values, shifted by a constant
* The analogies appear at step 3: compression keeps the structure the words share

--

## Saussure’s *value* and the vector space

@cards cols=2
### Saussure (1916)
* Value: a sign's meaning comes from its differences from other signs in the system
* The Russian blues: синий and голубой divide the space that English “blue” covers
:: accent
### Word vectors (2013–)
* A vector's individual numbers mean nothing on their own
* Rotate the whole space and every distance and direction is unchanged
* Only the relations between vectors carry information
@end

> “…in language there are only differences without positive terms.”

@source Saussure, *Course in general linguistics* (1959 [1916]: 120)

--

## Semantic change in vector space | Hamilton et al. 2016

@table widths=20,40,40
| Word | Neighbours, earlier decades | Neighbours, 1990s |
|---|---|---|
| [gay]{gold} | cheerful, frolicsome, witty | homosexual, lesbian, bisexual |
| [broadcast]{gold} | sow, seed, circulated | television, radio, bbc |
| [awful]{gold} | solemn, majestic, dread | weird, horrible, terrible |

* Method: separate vectors for each decade, 1800–1990, aligned across decades
* Law of conformity: frequent words change meaning more slowly
* Law of innovation: more polysemous words change meaning faster

--

## Bias in word vectors

@cards cols=2
### Bolukbasi et al. (2016)
[man : computer programmer :: woman : homemaker]{gold}

* An analogy produced by word2vec vectors trained on Google News text
::
### Caliskan et al. (2017)
* Implicit Association Test results replicated in GloVe vectors
* Flowers with pleasant words, insects with unpleasant
* Female names with family, male names with career
* European-American names with pleasant words, African-American names with unpleasant
@end

--

## One vector per word

@table widths=22,78
| Word | Five nearest words in GloVe |
|---|---|
| [counter]{gold} | anti, crack, tactics, aimed, action |
| [bank]{gold} | banks, securities, banking, investment, exchange |

* Similarity of counter to attack: 0.65; to kitchen: 0.31
* Type: the word in the dictionary, one vector for all its uses
* Token: the word in a particular sentence, where context selects the sense

---

## From tokens to vectors | the embedding table

@video ./media/embedding-table.mp4 poster=./img/embedding-table.png alt="Animation: the sentence The dog eyed the birthday cake on the counter is split into ten tokens, each with its id in GPT-2's vocabulary (The 464, dog 3290, the 262, counter 3753), and each id looks up its row of 768 numbers in the embedding table, drawn as a fine coloured strip" split=73
### GPT-2 small
* Vocabulary: 50,257 tokens, words and word-pieces
* Token id: the token's row in the table; dog is 3290, counter 3753
* Embedding: 768 numbers per token, the same row in every sentence

--

@slide centred
## What does “it” refer to?

“The dog wanted the cake because [it]{gold} was hungry.”

“The dog wanted the cake because [it]{gold} was delicious.”

--

## The transformer | ‘Attention is all you need’ (Vaswani et al. 2017)

@cards cols=2
### Key concepts
* Attention: each token's vector draws information from other tokens’ vectors and is updated
* Attention weight: how much one token draws on another; each token's weights sum to 1
* Head: one attention pattern, learned in training
::
### GPT-2 small (Radford et al. 2019)
* 12 layers × 12 heads = 144 attention heads
* 124 million parameters
* Each token attends only to itself and earlier tokens
* (This is the little local model I used for this lecture’s animations and figures, and is incredibly small compared to modern LLMs; I would estimate 80+ layers × 128 heads for 10k+ heads across 1 trillion parameters)
@end

--

## Attention on the passage | layer 2, head 7

@video ./media/attention.mp4 poster=./img/attention.jpg alt="Animation: the passage's tokens in a column, each with its vector drawn as a strip; arcs whose width is the attention weight run from him back to dog (0.30), from counter to cake (0.39) and from ation to empt (0.83), grey arcs carry weight to the first token, and after each the attended vectors flow into the attending row and its strip changes" split=73
### Attention weights
* him → dog: 0.30
* counter → cake: 0.39
* ation → empt: 0.83, within “Temptation”
* Grey arcs: weight on the first token
* Arc width: the weight; each token's weights sum to 1

--

@image-right ./img/attention-heatmap.png alt="Heatmap of attention weights for the first two sentences of the passage, rows the attending token and columns the token attended to, in a lower triangle; the cell where him attends to dog is outlined and labelled ‘him’ looks at ‘dog’: 0.30" split=58
## One attention head on the passage

* GPT-2 small, layer 2, head 7
* Rows: the attending token
* Columns: the token attended to
* [him → dog:]{gold} 0.30
* Tokens: “Temptation” is split into T + empt + ation

--

## One word, two referents | GPT-2 layer 6, head 11

@table widths=64,18,18
| Sentence | to “dog” | to “cake” |
|---|---|---|
| “…because it was hungry.” | [0.34]{gold} | %%0.10%% |
| “…because it was delicious.” | %%0.06%% | [0.41]{gold} |

* Attention measured from the adjective, since everything before it is identical in the two sentences
* The clearest of GPT-2's 144 heads, found by inspecting them all

--

## One word, many tokens | counter in GPT-2

@video ./media/counter-senses.mp4 poster=./img/counter-senses.png alt="Animation: fifteen tokens of counter from fifteen sentences, one point each on a map; at the lookup all fifteen are one point, then layer by layer they separate into three groups, the kitchen counter, the Geiger counter and to counter the attack, with the dog's counter among the kitchen counters; by layer 12 the two noun senses have moved closer" split=73
### Fifteen sentences
* Senses: a surface, a device and the verb, five sentences each
* Lookup: one identical vector for every token
* Layers 4–9: three separate groups
* Layer 12: the two noun senses move closer
* Map: two of 768 dimensions, about 60% of the variation

--

## “The evidence had been \_\_\_” | GPT-2's next-word probabilities

@image ./img/next-word.svg hold id=next-word alt="Two bar charts of GPT-2's most probable next words. The sentence alone: gathered 6.6%, collected 5.2%, presented 3.7%, made 1.7%, found 1.5%, provided 1.2%; eaten: rank 1,183 (0.006%). After the whole passage: gathered 2.8%, destroyed 2.5%, collected 2.3%, there 1.9%, lost 1.7%, taken 1.6%; eaten: rank 302 (0.055%)"

--

## Generating text

@cards cols=3
### 1 · predict
a probability for every possible next token
::
### 2 · sample
choose one token, weighted by probability
:: accent
### 3 · append and repeat
[the text so far, plus the new token]{gold}
@end

* Temperature: a setting that sharpens or flattens the probabilities before sampling
* Temperature 0: always the most probable token, so GPT-2 continues “The evidence had been gathered”
* Higher temperatures: less probable tokens are chosen more often
* Chat models: the same loop, after further training on instructions and human feedback

--

@slide hidden
## The scale of training

@stats
  [100,000,000+ years]{gold} :: the time needed to do all the calculations involved in training the largest language models, at one billion additions and multiplications per second

@source Sanderson (2024), 3Blue1Brown

---

## What would each of them say about a language model?

@cards cols=4
### Saussure
a system of differences
::
### Chomsky
an innate grammar
::
### Halliday
language in social context
::
### Hymes
communicative competence
::
### Lakoff
metaphor grounded in the body
::
### Langacker
construal and vantage point
::
### Kuno
empathy and the camera
::
### Goldberg
constructions learned from use
@end

--

## Chomsky and the machine | grammar and probability

> “…in any statistical model for grammaticalness, these sentences will be ruled out on identical grounds as equally ‘remote’ from English.”

@source Chomsky, *Syntactic structures* (1957: 16), on “Colorless green ideas sleep furiously” and “Furiously sleep ideas green colorless”

@stats
  [≈ 200,000×]{gold} :: Pereira (2000): a simple statistical model trained on newspaper text rates the grammatical order about 200,000 times more probable than the reverse

--

## Chomsky and the machine | the poverty of the stimulus

> “The rise and success of large language models undermines virtually every strong claim for the innateness of language that has been proposed by generative linguistics.”

@source Piantadosi, ‘Modern language models refute Chomsky's approach to language’ (2024)

> “…these programs learn humanly possible and humanly impossible languages with equal facility.”

@source Chomsky, Roberts & Watumull, *The New York Times* (8 March 2023)

--

## Chomsky and the machine | impossible languages (Kallini et al. 2024)

@cards cols=2
### The experiment
* GPT-2 models trained on English and on altered versions of English
* Word order shuffled at random
* Sentences reversed
* Grammatical markers placed by counting words, a rule no human language uses
::
### The result
* The models learned the impossible languages less well than English
* The more unnatural the language, the worse the learning
* Best paper award, ACL 2024
@end

--

## Halliday and the machine | register

@table widths=14,40,46
| Variable | Definition | Supplied in the prompt |
|---|---|---|
| Field | what is going on | [“the dog and the birthday cake”]{gold} |
| Tenor | who is taking part, and their relationship | [“from the vet to the owner”]{gold} |
| Mode | the part language plays | [“a written incident report”]{gold} |

Ask an LLM for the passage as a vet’s incident report, then as a WhatsApp message, then as a Shakespearean sonnet, etc. This is the 2023 party trick.

--

## Hymes and the machine | speech acts

[A model writes: “I promise to remind you tomorrow.”]{gold}

@table widths=22,78
| Condition | For a promise (Searle 1969) |
|---|---|
| Preparatory | the hearer wants it done; it would not happen anyway |
| Sincerity | the speaker intends to do it |
| Essential | saying it places the speaker under an obligation |

Communicative competence: knowing what is appropriate, to whom, when, and with what standing (Hymes 1972)

--

## Lakoff and the machine | embodiment

@cards cols=2
### The claim (Lakoff & Johnson 1980)
* Basic metaphors come from correlations in bodily experience

[^^more is up^^]{gold}<br>%%piles grow taller as quantity increases%%

[^^happy is up^^]{gold}<br>%%posture: drooping with sadness, upright with joy%%
:: accent
### The training data
* GPT-2: text only, about 8 million web pages (40 GB)
* Current frontier models: text, images and audio
* No model has a body or a posture
* All of them use and explain these metaphors
@end

--

## Langacker, Kuno and the machine | viewpoint on request

@table widths=50,50
| Request to a model | The theory's terms |
|---|---|
| [“Tell it from the humans' point of view”]{gold} | Kuno: camera with the humans |
| [“Tell it from the cake's point of view”]{gold} | Kuno: camera with an inanimate object |
| [“Take the narrator out of the story”]{gold} | Langacker: objective construal, no “we” on stage |

--

## Goldberg and the machine | learning a rare construction

[“a beautiful five days”]{gold} &emsp; %%“\*a five beautiful days”%%

* The AANN construction: article + adjective + numeral + plural noun
* Training: 100 million words, with every AANN example removed
* Result: models still preferred the AANN to corrupted versions
* Learned from: “a few days”, “five miles is a long way”

@source Misra & Mahowald (2024); Mahowald (2023)

--

## Eight approaches and the language model

@table widths=16,34,50
| Approach | Core claim | Evidence from language models |
|---|---|---|
| Saussure | value from differences | [meaning as relative position in a vector space]{gold} |
| Chomsky | grammar is not learnable from statistics | [Pereira's 200,000×; impossible languages learned less well]{gold} |
| Halliday | register: field, tenor, mode | [any register, with the situation supplied by the prompt]{gold} |
| Hymes | appropriateness and standing | [appropriate-sounding text; felicity conditions in question]{gold} |
| Lakoff | metaphor from bodily experience | [embodied metaphors used fluently, without a body]{gold} |
| Langacker | construal and vantage point | [any vantage point on request]{gold} |
| Kuno | empathy and the camera | [any camera angle on request]{gold} |
| Goldberg | constructions learned from input | [a rare construction learned from related ones]{gold} |

--

## Work for linguists

@cards cols=3
### Most of language
* About 7,000 living languages
* Most have little or no text online
* Documentation, description and revitalisation
::
### Whose English?
* Training text over-represents some varieties of English
* Auditing models across varieties, registers and dialects
:: accent
### [New fieldwork]{gold}
* Interpretability: finding out what models have learned about language
* Models as objects of linguistic study
@end

---

## From GPT-2 to the frontier, 2019–2026

@cards cols=2
### GPT-2 (OpenAI, 2019)
* Every demonstration in today's lecture
* 124 million parameters (small) to 1.5 billion (largest)
* Open: anyone can inspect its weights and attention
* Ranks “eaten” 302nd after the whole passage
:: accent
### Frontier models (2026)
* The models you may be most likely to use, if you choose to use AI models
* Sizes mostly undisclosed, parameters likely in the 1 trillion range
* Pass professional examinations; converse across many languages
* Explain who ate the cake, and why the passage is funny
@end

--

## Emotion concepts in a language model | 2026

@cards cols=2
:: accent
### The finding
* Model studied: Claude Sonnet 4.5
* Patterns for 171 emotion concepts; similar emotions, similar patterns
* “Desperate” rises as the model fails a task
* Boosting it raises cheating and blackmail
::
### The term
* Functional emotion: shapes behaviour as an emotion would
* Steering: artificially boosting a pattern to test it
* No trace: boosted desperation can drive cheating in calm-sounding text
@end

> “Note that none of this tells us whether language models actually feel anything or have subjective experiences.”

@source Anthropic, ‘Emotion concepts and their function in a large language model’ (2 April 2026)

--

## The sceptics | form without meaning

> “…an LM is a system for haphazardly stitching together sequences of linguistic forms it has observed in its vast training data, according to probabilistic information about how they combine, but without any reference to meaning: a stochastic parrot.”

@source Bender, Gebru, McMillan-Major & Shmitchell (2021: 616–617)

> “…a system trained only on form has a priori no way to learn meaning.”

@source Bender & Koller (2020: 5185)

Meaning: for Bender & Koller, the relation between a form and something outside language, such as the world or a speaker's intent

--

@slide hidden
## Kant on cruelty to animals

> “He who is cruel to animals becomes hard also in his dealings with men.”

@source Kant, *Lectures on ethics*, trans. Infield (1963: 240)

* Indirect duty: for Kant, cruelty to animals is wrong because of its effect on our duties to other people
* Kuno: grammar positions our sympathy
* Hymes: ways of addressing others are learned social practice

---

@image-right ./img/pug-cake.jpg alt="A pug sitting at a table beside a birthday cake with a number 3 candle, licking its nose" split=35 bleed
## The passage, one last time

“The dog eyed the birthday cake on the counter. Temptation was calling to him. ‘Stay down,’ he had been told, but the frosting beckoned irresistibly. When nobody was looking, opportunity struck. By the time we returned, guilt was written all over his face. The evidence had been eaten.”

--

## A century of linguistics | objects of study

@table widths=52,48
| Approach | Object of study |
|---|---|
| Saussure (1916) | the language system |
| Chomsky (1957–) | the speaker's mental grammar |
| Halliday, Hymes (1960s–70s) | language in social context |
| Lakoff, Langacker, Kuno, Goldberg (1970s–90s) | thought, perspective and learning |
| [Language models (2013–)]{gold} | [distribution at scale]{gold} |

---

## Credits

@columns cols=2
### Animations
* Made for this lecture with `manimgl`, Grant Sanderson's open-source animation library (see 3Blue1Brown)
* Vectors drawn as colour strips, after Alammar (2019)
* Values computed from GloVe vectors, Wikipedia counts, GPT-2 weights and states
::
### Data
* Word vectors: GloVe, glove-wiki-gigaword-50 (Pennington et al. 2014)
* Attention and probabilities: GPT-2 small (Radford et al. 2019)
* Concordances and counts: English Wikipedia, November 2023, about 900 million words
@end

--

@refs title="References: Alammar to Caliskan"
* Alammar, Jay. 2019. The illustrated word2vec. https://jalammar.github.io/illustrated-word2vec/
* Anthropic. 2026. A global workspace in language models. https://www.anthropic.com/research/global-workspace (6 July 2026).
* Baars, Bernard J. 1988. *A cognitive theory of consciousness*. Cambridge: Cambridge University Press.
* Bender, Emily M., Timnit Gebru, Angelina McMillan-Major & Shmargaret Shmitchell. 2021. On the dangers of stochastic parrots: Can language models be too big? In *Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency*, 610–623. New York: ACM.
* Bender, Emily M. & Alexander Koller. 2020. Climbing towards NLU: On meaning, form, and understanding in the age of data. In *Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics*, 5185–5198.
* Bolukbasi, Tolga, Kai-Wei Chang, James Zou, Venkatesh Saligrama & Adam Kalai. 2016. Man is to computer programmer as woman is to homemaker? Debiasing word embeddings. In *Advances in Neural Information Processing Systems 29*, 4349–4357.
* Caliskan, Aylin, Joanna J. Bryson & Arvind Narayanan. 2017. Semantics derived automatically from language corpora contain human-like biases. *Science* 356(6334). 183–186.

--

@refs title="References: Chomsky to Harris"
* Chomsky, Noam. 1957. *Syntactic structures*. The Hague: Mouton.
* Chomsky, Noam, Ian Roberts & Jeffrey Watumull. 2023. The false promise of ChatGPT. *The New York Times*, 8 March 2023.
* Church, Kenneth Ward & Patrick Hanks. 1990. Word association norms, mutual information, and lexicography. *Computational Linguistics* 16(1). 22–29.
* Firth, J. R. 1957. A synopsis of linguistic theory, 1930–1955. In *Studies in linguistic analysis*, 1–32. Oxford: Blackwell.
* Halliday, M. A. K. 1966. Lexis as a linguistic level. In C. E. Bazell, J. C. Catford, M. A. K. Halliday & R. H. Robins (eds.), *In memory of J. R. Firth*, 148–162. London: Longman.
* Hamilton, William L., Jure Leskovec & Dan Jurafsky. 2016. Diachronic word embeddings reveal statistical laws of semantic change. In *Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics*, 1489–1501.
* Harris, Zellig S. 1954. Distributional structure. *Word* 10(2–3). 146–162.

--

@refs title="References: Hymes to Levy"
* Hymes, Dell. 1972. On communicative competence. In J. B. Pride & Janet Holmes (eds.), *Sociolinguistics*, 269–293. Harmondsworth: Penguin.
* Kallini, Julie, Isabel Papadimitriou, Richard Futrell, Kyle Mahowald & Christopher Potts. 2024. Mission: Impossible language models. In *Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics*, 14691–14714.
* Kant, Immanuel. 1963. *Lectures on ethics*. Trans. by Louis Infield. New York: Harper & Row.
* Katz, Jerrold J. & Jerry A. Fodor. 1963. The structure of a semantic theory. *Language* 39(2). 170–210.
* Lakoff, George & Mark Johnson. 1980. *Metaphors we live by*. Chicago: University of Chicago Press.
* Landauer, Thomas K. & Susan T. Dumais. 1997. A solution to Plato's problem: The latent semantic analysis theory of acquisition, induction, and representation of knowledge. *Psychological Review* 104(2). 211–240.
* Levy, Omer & Yoav Goldberg. 2014. Neural word embedding as implicit matrix factorization. In *Advances in Neural Information Processing Systems 27*, 2177–2185.

--

@refs title="References: Mahowald to Pereira"
* Mahowald, Kyle. 2023. A discerning several thousand judgments: GPT-3 rates the article + adjective + numeral + noun construction. In *Proceedings of the 17th Conference of the European Chapter of the Association for Computational Linguistics*, 265–273.
* Mikolov, Tomas, Kai Chen, Greg Corrado & Jeffrey Dean. 2013. Efficient estimation of word representations in vector space. arXiv:1301.3781.
* Misra, Kanishka & Kyle Mahowald. 2024. Language models learn rare phenomena from less rare phenomena: The case of the missing AANNs. In *Proceedings of the 2024 Conference on Empirical Methods in Natural Language Processing*, 913–929.
* Nissim, Malvina, Rik van Noord & Rob van der Goot. 2020. Fair is better than sensational: Man is to doctor as woman is to doctor. *Computational Linguistics* 46(2). 487–497.
* Osgood, Charles E., George J. Suci & Percy H. Tannenbaum. 1957. *The measurement of meaning*. Urbana: University of Illinois Press.
* Pennington, Jeffrey, Richard Socher & Christopher D. Manning. 2014. GloVe: Global vectors for word representation. In *Proceedings of the 2014 Conference on Empirical Methods in Natural Language Processing*, 1532–1543.
* Pereira, Fernando. 2000. Formal grammar and information theory: Together again? *Philosophical Transactions of the Royal Society of London, Series A* 358(1769). 1239–1253.

--

@refs title="References: Piantadosi to Vaswani"
* Piantadosi, Steven T. 2024. Modern language models refute Chomsky's approach to language. In Edward Gibson & Moshe Poliak (eds.), *From fieldwork to linguistic theory: A tribute to Dan Everett*, 353–414. Berlin: Language Science Press.
* Radford, Alec, Jeffrey Wu, Rewon Child, David Luan, Dario Amodei & Ilya Sutskever. 2019. Language models are unsupervised multitask learners. OpenAI technical report.
* Sanderson, Grant. 2024. Large language models explained briefly. 3Blue1Brown. https://www.3blue1brown.com/lessons/mini-llm
* Saussure, Ferdinand de. 1959 [1916]. *Course in general linguistics*. Trans. by Wade Baskin. New York: Philosophical Library.
* Searle, John R. 1969. *Speech acts: An essay in the philosophy of language*. Cambridge: Cambridge University Press.
* Shannon, Claude E. 1951. Prediction and entropy of printed English. *Bell System Technical Journal* 30(1). 50–64.
* Vaswani, Ashish, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser & Illia Polosukhin. 2017. Attention is all you need. In *Advances in Neural Information Processing Systems 30*, 5998–6008.
