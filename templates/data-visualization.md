<!-- Data Visualization Context Template -->
<!-- Description: Charts, graphs, and statistical visualizations with clear interpretation -->
<!-- Usage: Presenting statistical results, showing trends, demonstrating correlations, supporting empirical claims -->

## Data Visualization: Chart with Annotation Callouts

### Growth in Corpus Sizes Over Time

![Line graph showing exponential growth of corpus sizes from 1960s to 2020s](./img/corpus-growth.png)

**Key observations:**
* **1960s-1980s:** Modest growth, limited by storage and processing (Brown Corpus: 1M words)
* **1990s-2000s:** Rapid expansion with web corpora (British National Corpus: 100M words)
* **2010s-present:** Massive scale, billions of tokens (Google Books: 500B+ words)

**Implications:**
* Enables new research questions at scale
* Raises sampling and representativeness issues
* Computational requirements increase exponentially

---

## Data Visualization: Before/After Comparison

### Intervention Effect on Reading Scores

<div class="container">
<div class="col">

#### Pre-Intervention

![Bar chart showing baseline reading scores across 5 schools](./img/baseline-scores.png)

**Mean:** 67.3 (SD = 12.4)
**Range:** 45-89
**Below proficiency:** 42%

</div>
<div class="col">

#### Post-Intervention (6 months)

![Bar chart showing post-intervention reading scores across same 5 schools](./img/post-scores.png)

**Mean:** 78.9 (SD = 10.1)
**Range:** 58-95
**Below proficiency:** 18%

</div>
</div>

**Statistical significance:** t(124) = 7.82, p < 0.001, Cohen's d = 1.02 (large effect)

**Interpretation:** Intervention produced substantial, statistically significant improvement across all schools

---

## Data Visualization: Multi-Panel Grid

### Language Proficiency Outcomes: Four Skill Areas

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1em; font-size: 0.85em;">

<div>

![Speaking proficiency scores](./img/speaking-chart.png)

**Speaking**
* Largest gains (d = 0.89)
* Interactive practice emphasized

</div>

<div>

![Listening proficiency scores](./img/listening-chart.png)

**Listening**
* Moderate gains (d = 0.54)
* Exposure-dependent

</div>

<div>

![Reading proficiency scores](./img/reading-chart.png)

**Reading**
* Strong gains (d = 0.71)
* Strategy instruction effective

</div>

<div>

![Writing proficiency scores](./img/writing-chart.png)

**Writing**
* Smallest gains (d = 0.38)
* Needs more explicit focus

</div>

</div>

**Overall pattern:** Productive skills benefit more from intervention than receptive skills; writing requires additional targeted instruction

---

## Data Visualization: Chart + Key Takeaways

### Sentiment Analysis of 10,000 Product Reviews

![Stacked bar chart showing distribution of positive, neutral, negative sentiment across product categories](./img/sentiment-distribution.png)

**Key Takeaways:**

1. **Electronics category most polarized** (45% very positive, 23% very negative)
   * High expectations drive extreme reactions

2. **Books show overwhelmingly positive sentiment** (78% positive, 8% negative)
   * Selection bias: people buy books they expect to like

3. **Neutral reviews correlate with technical products** (30% neutral for appliances)
   * Functional assessment vs. emotional response

4. **Negative reviews are longer and more detailed** (avg 147 words vs. 62 for positive)
   * Dissatisfaction motivates elaboration

**Implications for NLP:** Sentiment classification accuracy varies by domain; context-specific models needed

---

## Data Visualization: Progressive Reveal (Interactive)

### Regression Model Results: Predicting Language Achievement

![Scatter plot with regression line showing correlation between study hours and test scores](./img/regression-base.png)

**Step 1: Bivariate relationship**
<!-- .element: class="fragment" data-fragment-index="1" -->

* r = 0.68, p < 0.001
* More study hours → higher scores

--

![Same plot with additional color coding by motivation level](./img/regression-motivation.png)

**Step 2: Add moderator (motivation)**
<!-- .element: class="fragment" data-fragment-index="2" -->

* High motivation (blue): steeper slope
* Low motivation (red): flatter slope
* Interaction significant: F(1,246) = 12.3, p < 0.001

--

![Full model with 95% confidence intervals and outliers marked](./img/regression-full.png)

**Step 3: Full model diagnostics**
<!-- .element: class="fragment" data-fragment-index="3" -->

* R² = 0.58 (58% variance explained)
* Three outliers identified (marked red)
* Residuals normally distributed
* No multicollinearity issues

**Conclusion:** Study hours predict achievement, but motivation moderates this effect; high motivation learners benefit more from study time

---

## Data Visualization: Comparison Across Groups

### Cross-Linguistic Comparison: Reaction Times

![Box plot comparing reaction times across 4 language groups](./img/rt-comparison.png)

| Language Group | Median RT (ms) | IQR | Outliers |
|---------------|---------------|-----|----------|
| **English** | 487 | 445-532 | 3 |
| **Mandarin** | 512 | 471-558 | 2 |
| **Arabic** | 498 | 460-541 | 5 |
| **Spanish** | 476 | 438-519 | 1 |

**ANOVA:** F(3, 396) = 4.32, p = 0.005

**Post-hoc (Tukey):** Spanish significantly faster than Mandarin (p = 0.003); other pairwise differences n.s.

**Interpretation:** Language background affects processing speed, but effect size small (η² = 0.03); other factors more important

---

## Data Visualization: Longitudinal Trends

### Development of Syntactic Complexity Over One Academic Year

![Multi-line graph showing 4 complexity measures over 8 time points](./img/complexity-development.png)

**Four Measures Tracked:**

<div style="font-size: 0.85em;">

* **Mean Length of T-Unit (blue):** Steady linear growth (β = 0.43, p < 0.001)
* **Clauses per T-Unit (green):** Rapid initial growth, then plateau
* **Dependent Clause Ratio (orange):** Slow, gradual increase throughout
* **Lexical Density (red):** Minimal change, high variability

</div>

**Interpretation:**
* Syntactic complexity develops gradually and non-uniformly
* Different dimensions mature at different rates
* Pedagogical implication: multiple measures needed for comprehensive assessment

---

## Data Visualization: Network/Relationship Diagram

### Co-Occurrence Network: Key Terms in Climate Change Discourse

![Network visualization showing nodes (terms) connected by edges (co-occurrence strength)](./img/network-climate.png)

**Node size** = frequency | **Edge thickness** = co-occurrence strength | **Color** = cluster membership

**Clusters Identified:**

* **Red cluster:** Scientific terms (emissions, carbon, temperature, data)
* **Blue cluster:** Policy terms (regulation, agreement, investment, target)
* **Green cluster:** Impact terms (extreme, drought, sea-level, vulnerable)
* **Yellow cluster:** Action terms (renewable, transition, mitigation, adaptation)

**Bridge terms** connecting clusters: "economy," "energy," "global"

**Analysis:** Discourse integrates science, policy, impacts, and solutions; economic framing central to all discussions

---

## Data Visualization: Geographic/Spatial

### Regional Dialect Variation: Vowel Formants

![Map showing geographic distribution of vowel realizations across regions](./img/dialect-map.png)

<div class="container">
<div class="col">

**Northern Dialect (blue)**
* F1: 450-500 Hz
* F2: 1800-1950 Hz
* Characteristic: Raised vowel

**Southern Dialect (red)**
* F1: 550-620 Hz
* F2: 1650-1750 Hz
* Characteristic: Lowered, retracted

</div>
<div class="col">

**Transitional Zone (purple)**
* Mixed realizations
* Individual variation high
* Age-graded change detected

**Urban Centers (green)**
* Converging toward standard
* Social stratification evident
* Younger speakers leading change

</div>
</div>

**Insight:** Geographic patterns stable but urban centers show ongoing leveling; generational change accelerating in transitional zones

---

## Data Visualization: Distribution and Outliers

### Vocabulary Size Distribution in Learner Corpus

![Histogram with overlaid normal curve showing vocabulary size distribution](./img/vocab-distribution.png)

**Descriptive Statistics:**
* Mean: 4,237 words
* Median: 4,150 words
* SD: 1,032 words
* Skewness: 0.23 (slightly right-skewed)
* Kurtosis: -0.45 (slightly platykurtic)

**Notable Features:**
* Approximately normal distribution
* **Three clear outliers** (>7,000 words): Heritage speakers
* **Long tail on right:** Advanced learners with extensive reading
* **Modest tail on left:** True beginners or limited literacy L1

**Implications:** Relatively homogeneous proficiency; outliers represent distinct subpopulations requiring separate analysis

---

## Data Visualization: Experimental Results with Error Bars

### Effect of Presentation Modality on Recall

![Bar chart with error bars comparing recall scores across 4 presentation conditions](./img/recall-experiment.png)

| Condition | Mean | 95% CI | n |
|-----------|------|--------|---|
| **Text Only** | 6.4 | [5.8, 7.0] | 60 |
| **Audio Only** | 5.8 | [5.2, 6.4] | 60 |
| **Visual Only** | 7.2 | [6.5, 7.9] | 60 |
| **Multimodal** | 9.1 | [8.4, 9.8] | 60 |

**ANOVA:** F(3, 236) = 18.7, p < 0.001, η² = 0.19

**Pairwise comparisons (Bonferroni-corrected):**
* Multimodal > all others (all p < 0.001)
* Visual > Audio (p = 0.012)
* Text vs. Audio: n.s.

**Conclusion:** Multimodal presentation significantly enhances recall; visual modality most effective when unimodal

---

## Data Visualization: Correlation Matrix Heatmap

### Intercorrelations Among Language Proficiency Measures

![Heatmap showing correlation coefficients between 8 proficiency measures](./img/correlation-heatmap.png)

<div style="font-size: 0.75em;">

|  | Vocab | Grammar | Reading | Listening | Speaking | Writing | Fluency | Pronunciation |
|--|-------|---------|---------|-----------|----------|---------|---------|---------------|
| **Vocab** | 1.00 | 0.71** | 0.68** | 0.52** | 0.45** | 0.58** | 0.32* | 0.18 |
| **Grammar** |  | 1.00 | 0.79** | 0.61** | 0.48** | 0.72** | 0.29* | 0.21 |
| **Reading** |  |  | 1.00 | 0.66** | 0.41** | 0.69** | 0.25 | 0.15 |
| **Listening** |  |  |  | 1.00 | 0.58** | 0.47** | 0.35* | 0.42** |
| **Speaking** |  |  |  |  | 1.00 | 0.52** | 0.71** | 0.68** |
| **Writing** |  |  |  |  |  | 1.00 | 0.31* | 0.19 |
| **Fluency** |  |  |  |  |  |  | 1.00 | 0.54** |
| **Pronunciation** |  |  |  |  |  |  |  | 1.00 |

</div>

*p < 0.05, **p < 0.01

**Patterns:**
* Strong correlations among literacy skills (reading, writing, grammar)
* Moderate correlations among oral skills (speaking, fluency, pronunciation)
* Weaker correlations across modalities (e.g., pronunciation-grammar: r = 0.21)

**Implication:** Proficiency is multi-dimensional; single score inadequate; domain-specific assessment needed

---

<!-- Customization Notes -->
<!--
* Always include title, axis labels, legend on actual visualizations
* Use color-blind friendly palettes
* Provide textual summary alongside visual for accessibility
* Include statistical details (p-values, effect sizes, confidence intervals)
* Interpret, don't just describe: "so what?" is crucial
* Use progressive reveal (fragments) for complex visualizations built in layers
* Consider multiple representations of same data (table + chart)
* Annotate charts directly when possible (arrows, callout boxes)
* Ensure visualizations are readable at presentation size (large fonts, clear lines)
* Reference figure numbers for easy cross-referencing in notes
-->
