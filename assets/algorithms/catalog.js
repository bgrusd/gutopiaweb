/* Intuition-first explanations and exact technical metadata for every direct demo handler. */
window.GutopiaCatalog = [
  {
    id: "lasso",
    title: "LASSO regression",
    short: "LASSO",
    group: "Regression",
    icon: "∑",
    handler: "runLasso",
    type: "regression",
    description: "Predict a number, then let weak clues drop out of the model.",
    evaluation:
      "RMSE summarizes mistakes in simulated pain-scale points: lower is better, and large misses count more heavily. The mean-baseline RMSE comes from always guessing the learning period’s average pain. R² describes improvement over the test period’s average-based variation and can be negative. The plotted predictions are for saved test days, not the days used to learn.",
    purpose:
      "LASSO predicts a number from several clues, while trying to use only the most useful ones. It learns how strongly each clue should count, then pushes weak contributions toward zero. Here, the number is tomorrow’s simulated pain; the clues are today’s six generated inputs.",
    math: "min β,b  (1 / 2n) Σ(yᵢ − b − xᵢ·β)² + λ Σ|βⱼ|",
    mathNote:
      "β lists the learned weights, b is the starting value, and n is the number of learning examples. The first term measures prediction mistakes; λ adds a cost for using large weights. Here λ is 0.04, a fixed demo setting. We first center each input and divide by its spread so different units can be compared fairly. The starting value is not penalized.",
    how: "The code adjusts one weight at a time, checking what that change does to the remaining prediction error. A step called soft thresholding pushes small weights to zero. This is coordinate descent: repeatedly improving one coordinate of the solution. It stops when the largest weight change is below 1e−8, or after 300 passes. A constant input uses a divisor of one instead of dividing by zero. The weight bars therefore describe standardized inputs, not raw food units.",
    why: "It demonstrates how a model can stay useful while using fewer clues. The simulator has a known recipe, so we can see whether the model finds its deliberately planted inputs and whether its predictions beat a simple guess on later days.",
    archive:
      "The coursework version accepted a larger collection of food tags, medication records and previous-day measurements, and often predicted a combined health score. This direct demonstration uses six named inputs and next-day simulated pain. It also reserves later days as a separate test instead of treating the fit on learning days as the final evidence.",
    limitations:
      "A retained weight says that an input helps this model under its assumptions. It does not show that changing a real food causes a health change. Similar inputs can trade weight between themselves, and a fixed penalty can remove a useful but weak clue.",
    steps: [
      [
        "Match today to tomorrow",
        "Use today’s clues and the next calendar day’s simulated pain.",
      ],
      [
        "Save later days for a test",
        "Learn input scales on the earlier days only.",
      ],
      [
        "Adjust and trim the weights",
        "Repeatedly update one weight and remove weak contributions.",
      ],
      [
        "Compare later predictions",
        "Check the saved days against a simple average guess.",
      ],
    ],
    source: [
      "LASSO objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Lasso.html",
    ],
    number: 1,
    plainLanguage: {
      what: "LASSO predicts a number from several clues, while trying to use only the most useful ones. It learns how strongly each clue should count, then pushes weak contributions toward zero. Here, the number is tomorrow’s simulated pain; the clues are today’s six generated inputs.",
      analogy:
        "Think of packing a small suitcase. Every extra item has a cost, so you keep the things that help most. LASSO adds a similar cost for large model weights, which can leave some clues out entirely. The bars show what this fitted model kept.",
      uses: "Common uses: selecting variables, simplifying forecasts, and exploring high-dimensional measurements.",
    },
    methodology: [
      [
        "The question",
        "Can a small weighted combination of today’s six generated inputs estimate tomorrow’s simulated pain? The generator plants some inputs into its recipe and leaves others without a direct effect, giving the demonstration a known relationship to investigate.",
      ],
      [
        "How the model learns",
        "We match each input date to pain exactly one calendar day later. The first roughly 80% of pairs supply the learning period; the last 20% are saved for a fair test. One pair at the boundary is left out. Input means and spreads come only from the earlier period, and the L1 penalty can remove weak weights.",
      ],
      [
        "How to read the test",
        "RMSE summarizes mistakes in simulated pain-scale points: lower is better, and large misses count more heavily. The mean-baseline RMSE comes from always guessing the learning period’s average pain. R² describes improvement over the test period’s average-based variation and can be negative. The plotted predictions are for saved test days, not the days used to learn.",
      ],
      [
        "What that tells us",
        "A good result supports this implementation on this simulator. The coefficient bars show standardized contributions in the fitted model; they do not estimate dietary intervention effects. Different seeds can reveal how stable the selection is.",
      ],
    ],
  },
  {
    id: "elastic-net",
    title: "ElasticNet regression",
    short: "ElasticNet",
    group: "Regression",
    icon: "≈",
    handler: "runElasticNet",
    type: "regression",
    description:
      "Keep useful clues without letting overlapping inputs dominate the prediction.",
    evaluation:
      "The violet line contains predictions for the saved days; mint is the actual simulated pain. RMSE is a typical error summary in pain-scale points, with extra weight on large misses. Compare it with the mean-baseline RMSE, which always guesses the learning-period average. A negative R² means the model explains those test outcomes poorly.",
    purpose:
      "ElasticNet predicts a number while keeping the model’s learned contributions restrained. It combines two ways of doing that: one can remove weak clues, while the other gently reduces all weights. This balance can help when several inputs carry similar information and compete for attention.",
    math: "min β,b  MSE / 2 + λ [α Σ|βⱼ| + (1−α) Σβⱼ² / 2]",
    mathNote:
      "The error term rewards accurate predictions. λ sets the total cost of large weights, while α chooses the balance between removing weights and gently shrinking them. This demo uses λ = 0.04 and α = 0.5, so both penalties contribute equally. Those are demonstration settings, not an automatically selected best combination. The starting value b is left unpenalized.",
    how: "The solver updates one weight at a time. Its update first trims weak contributions with an L1 threshold, then scales the result down using the L2 term. Together these discourage an unnecessarily complicated fit. Inputs are centered and scaled using only learning days; the starting value is the average learning target. The code makes at most 300 passes and stops earlier if every weight changes by less than 1e−8.",
    why: "It gives a direct comparison with LASSO on the same inputs. Where clues overlap, keeping several smaller weights can be more stable than making one clue carry the whole explanation. The saved-day errors show whether that tradeoff helps this particular fixture.",
    archive:
      "The coursework also used a handwritten ElasticNet solver, but its wrappers could use alpha to mean different things. The direct demonstration states the objective and settings explicitly, uses a fixed six-input snapshot, and predicts simulated pain instead of a broader historical score.",
    limitations:
      "Shrinking weights can reduce overfitting, but cannot create information that is absent from the inputs. The fixed penalty may be too strong or too weak for another dataset. Weight magnitudes refer to scaled inputs, so they should not be read as changes per real-world food serving.",
    steps: [
      [
        "Match today to tomorrow",
        "Pair six inputs with pain exactly one day later.",
      ],
      [
        "Keep a separate test period",
        "Use earlier days to learn the input scales.",
      ],
      [
        "Balance two weight costs",
        "Trim weak clues while keeping other weights modest.",
      ],
      [
        "Compare prediction mistakes",
        "Ask whether the model beats the learning-period mean.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 2,
    plainLanguage: {
      what: "ElasticNet predicts a number while keeping the model’s learned contributions restrained. It combines two ways of doing that: one can remove weak clues, while the other gently reduces all weights. This balance can help when several inputs carry similar information and compete for attention.",
      analogy:
        "Imagine packing related items for a trip. Rather than choosing just one useful item and throwing out its close companions, you can keep a modest set without overloading the bag. Here, today’s generated inputs produce tomorrow’s simulated pain estimate, and the chart checks later days.",
      uses: "Common uses: forecasting, correlated measurements, and models with many overlapping predictors.",
    },
    methodology: [
      [
        "The question",
        "Can a model balance simplicity and stability while predicting next-day simulated pain? ElasticNet uses the same six inputs as LASSO, so differences come from the weight penalty rather than a different dataset or target.",
      ],
      [
        "How the model learns",
        "Exact one-day date pairs are divided into an earlier learning period and a later test period, roughly 80% and 20%. A one-day gap separates them. We learn input means and spreads from the earlier period, then fit a model with equal L1 and L2 contributions and a total penalty of 0.04.",
      ],
      [
        "How to read the test",
        "The violet line contains predictions for the saved days; mint is the actual simulated pain. RMSE is a typical error summary in pain-scale points, with extra weight on large misses. Compare it with the mean-baseline RMSE, which always guesses the learning-period average. A negative R² means the model explains those test outcomes poorly.",
      ],
      [
        "What that tells us",
        "Better test performance than the simple mean shows useful signal on this generator. It does not identify a medically appropriate predictor or prove that a model weight is causal. Compare several seeds and direct LASSO before concluding that the mixed penalty helps.",
      ],
    ],
  },
  {
    id: "pca-lasso",
    title: "PCA + LASSO",
    short: "PCA + LASSO",
    group: "Regression",
    icon: "↗",
    handler: "runPcaLasso",
    type: "regression",
    description:
      "Summarize many clues into shared patterns, then predict with the useful patterns.",
    evaluation:
      "The chart compares saved-day predictions with actual simulated pain. RMSE measures error in pain-scale points; compare it with the error from always predicting the earlier period’s mean. The coefficient bars are PC weights, meaning contributions from combined patterns. They are not food-specific effects or PCA’s own direction weights.",
    purpose:
      "This combines two ideas: summarize several clues into a few shared patterns, then predict a number using only the patterns that help. The first step is PCA, a way of changing the viewpoint. The second is LASSO, which can remove weak pattern contributions.",
    math: "Z = standardize(X) · V₄\nŷ = b + Z·β  with an L1 penalty on β",
    mathNote:
      "V₄ contains four directions learned by PCA; multiplying the scaled inputs by those directions gives the combined coordinates Z. LASSO then learns how much each coordinate contributes to the prediction. Its penalty acts on these component weights. The regression solver also rescales the component coordinates before fitting, so a PC weight is not an original-food weight.",
    how: "First use only learning days to put the six input units on comparable scales. PCA then finds four directions in which those inputs vary together, using the covariance matrix and Jacobi rotations. Apply that same saved transformation to later test days. Finally fit LASSO to the earlier component coordinates, with λ = 0.04, and reuse the fitted model for predictions. The transformation is never relearned from the test days.",
    why: "This shows how two algorithms can form a small, understandable pipeline. It also provides a useful counterexample to “compression always helps”: a direction with little overall variation can still contain information needed for the outcome.",
    archive:
      "The historical wrapper could skip PCA and use other fallback paths. This direct entry explicitly uses four components on the complete six-input fixture, then fits sparse regression. Its displayed weights belong to combined directions rather than individual original inputs.",
    limitations:
      "Removing a weak component weight does not necessarily remove an original food from the model, because each component mixes inputs. PCA chooses directions by input variation, not by their usefulness for predicting pain, so compression can lose a useful clue.",
    steps: [
      [
        "Put input units on equal footing",
        "Learn means and spreads from earlier days.",
      ],
      [
        "Find four shared directions",
        "Summarize how the learning inputs vary together.",
      ],
      [
        "Fit and trim pattern weights",
        "Apply LASSO to the combined coordinates.",
      ],
      [
        "Reuse the same viewpoint",
        "Project saved days without relearning PCA.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 3,
    plainLanguage: {
      what: "This combines two ideas: summarize several clues into a few shared patterns, then predict a number using only the patterns that help. The first step is PCA, a way of changing the viewpoint. The second is LASSO, which can remove weak pattern contributions.",
      analogy:
        "Think of summarizing a long shopping list into a few categories, then deciding which categories matter for your budget. The categories mix original items; a weight on one category is not a weight on one food. Here, four learned patterns predict next-day simulated pain.",
      uses: "Common uses: compressed regression, correlated sensor inputs, and comparisons with direct-feature models.",
    },
    methodology: [
      [
        "The question",
        "Does compressing today’s clues before fitting LASSO help or hurt next-day prediction? This workflow answers the same simulated-pain question as direct LASSO, but uses four combined input directions rather than the original six fields.",
      ],
      [
        "How the model learns",
        "We form exact next-day pairs, reserve roughly the last 20% for testing, and leave a one-day boundary gap. Scaling and PCA are learned only from the earlier inputs. Four directions are retained, and a sparse regression model learns weights on those component coordinates. Later inputs pass through the saved transformation unchanged.",
      ],
      [
        "How to read the test",
        "The chart compares saved-day predictions with actual simulated pain. RMSE measures error in pain-scale points; compare it with the error from always predicting the earlier period’s mean. The coefficient bars are PC weights, meaning contributions from combined patterns. They are not food-specific effects or PCA’s own direction weights.",
      ],
      [
        "What that tells us",
        "Compare these errors with direct LASSO on the same seed. Lower error would support this compression choice for this fixture; higher error can expose lost predictive information. Capturing input variation alone never guarantees an accurate target prediction.",
      ],
    ],
  },
  {
    id: "logistic-lasso",
    title: "Logistic LASSO",
    short: "Logistic LASSO",
    group: "Classification",
    icon: "σ",
    handler: "runLogisticLasso",
    type: "classification",
    description:
      "Learn the probability of a clearly defined yes-or-no outcome.",
    evaluation:
      "Accuracy is the fraction of correct yes/no decisions, but can hide an uneven class balance. Precision asks how many positive predictions were right; recall asks how many actual positives were found. Brier score measures squared probability mistakes: a confident wrong probability costs more, and lower is better. Mint dots show labels, while the violet line shows probabilities.",
    purpose:
      "Logistic LASSO learns to distinguish two possibilities and gives a probability rather than an unrestricted number. It also tries to keep only useful clues. Our two classes mean whether tomorrow’s simulated pain reaches five; the probability is about that precise rule, not a clinical flare.",
    math: "p(y = 1 | x) = 1 / (1 + exp(−b − x·β))\nmin  mean binary cross-entropy + λ Σ|βⱼ|",
    mathNote:
      "The sigmoid turns a weighted score into a value between zero and one. The fitting loss rewards probabilities that agree with observed yes/no labels; λ adds a cost for large weights and can remove weak clues. This workflow uses λ = 0.04 and calls a probability of at least 0.5 a positive class. Both classes must appear in the learning examples.",
    how: "The code takes a small step that improves the probability-fitting loss, then trims small weights toward zero. This combination is called a proximal-gradient update. It performs 400 such steps, with a step size of 0.5 divided by the input count. The starting score is not penalized, and sigmoid inputs are bounded to avoid numerical overflow. Means and spreads are learned from earlier days only.",
    why: "It lets you see the difference between a probability and the yes/no decision made from it. The saved-day dots provide concrete answers against which the model’s probabilities can be checked, and the weights show which scaled inputs it used.",
    archive:
      "The coursework also used handwritten sparse logistic regression, but had different target mappings and input extraction. This direct version says exactly what the binary label means and distinguishes performance on saved later days from performance on its own learning examples.",
    limitations:
      "A number between zero and one is not automatically a well-calibrated probability. Accuracy can look good when one class is much more common. The pain threshold is a synthetic demonstration rule, not a validated definition of a Crohn’s flare.",
    steps: [
      ["Define the yes/no outcome", "Does next-day simulated pain reach five?"],
      [
        "Save later days for checking",
        "Learn input scales from earlier examples.",
      ],
      [
        "Learn probabilities with few clues",
        "Improve the fit, then trim weak weights.",
      ],
      [
        "Compare probabilities and labels",
        "Check both probability error and class decisions.",
      ],
    ],
    source: [
      "Logistic regression",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html",
    ],
    number: 4,
    plainLanguage: {
      what: "Logistic LASSO learns to distinguish two possibilities and gives a probability rather than an unrestricted number. It also tries to keep only useful clues. Our two classes mean whether tomorrow’s simulated pain reaches five; the probability is about that precise rule, not a clinical flare.",
      analogy:
        "Think of sorting incoming messages into spam or ordinary mail. Several clues contribute to a score, which becomes a probability; a chosen cutoff makes the final decision. Here, the line shows probabilities and the dots show which synthetic class actually occurred on later days.",
      uses: "Common uses: binary pattern recognition, sparse classification, and probability-based decisions.",
    },
    methodology: [
      [
        "The question",
        "How well can today’s six generated clues distinguish whether tomorrow’s simulated pain will be at least five? We turn that exact rule into yes/no labels before learning a model. A “yes” is a demo class, not a medical event.",
      ],
      [
        "How the model learns",
        "Inputs and labels are paired one calendar day apart. Roughly the first 80% teach the model and the last 20% check it, with a one-day boundary gap. Input scaling comes from earlier days only. The sparse logistic model learns a probability for each later example, then uses 0.5 as its decision cutoff.",
      ],
      [
        "How to read the test",
        "Accuracy is the fraction of correct yes/no decisions, but can hide an uneven class balance. Precision asks how many positive predictions were right; recall asks how many actual positives were found. Brier score measures squared probability mistakes: a confident wrong probability costs more, and lower is better. Mint dots show labels, while the violet line shows probabilities.",
      ],
      [
        "What that tells us",
        "These checks describe a classifier on this simulator. They do not establish clinical risk or guarantee calibrated probabilities. A model can make the same class decision as another while assigning quite different probabilities.",
      ],
    ],
  },
  {
    id: "naive-bayes",
    title: "Bernoulli Naive Bayes",
    short: "Naive Bayes",
    group: "Classification",
    icon: "P",
    handler: "runNaiveBayes",
    type: "classification",
    description:
      "Combine simple clues into a probability using learned on/off frequencies.",
    evaluation:
      "The violet line is the computed probability and mint dots are actual later labels. Accuracy checks decisions at a 0.5 cutoff; precision and recall describe positive decisions. Brier score checks the probabilities themselves, penalizing confident mistakes more strongly. Lower Brier is better; high accuracy alone may simply reflect a common class.",
    purpose:
      "Naive Bayes combines how common a class is with how often each clue appears in that class. It makes a simplifying assumption that the clues contribute independently once the class is known. This version turns inputs into on/off clues and estimates tomorrow’s simulated pain class.",
    math: "P(c | x) ∝ P(c) ∏ⱼ P(xⱼ | c)\nP(xⱼ = 1 | c) = (onCount + 1) / (classCount + 2)",
    mathNote:
      "The posterior is the updated class probability after seeing the inputs. It combines the class’s overall frequency with each clue’s likelihood in that class. Counts get one extra imaginary example, called add-one smoothing, so an unseen pattern never forces a zero probability. The code adds logarithms of probabilities rather than multiplying many tiny values.",
    how: "Each input is treated as “on” when it exceeds that input’s learning-period mean. The model counts on/off occurrences within each class and saves those thresholds and frequencies. It smooths both class priors and conditional frequencies with one added count. For a later row, it adds the evidence for each class and converts their log-score difference into a two-class probability. Nothing is re-counted from the saved test examples.",
    why: "The model is easy to inspect: you can understand a prediction through frequencies rather than a large engine. Comparing it with logistic LASSO shows how different assumptions about clues lead to different probabilities for the same examples.",
    archive:
      "The old EnhancedNaiveBayes also used on/off trigger frequencies, but predicted five bins of a historical score. This direct demonstration instead predicts the next-day binary pain threshold and learns input cutoffs from the earlier period. The separate Gaussian helper models continuous values and is not this selected entry.",
    limitations:
      "The simplifying independence assumption is often wrong when clues overlap. Turning continuous values into on/off indicators loses detail. Smoothing prevents zero-count failures, but does not prove that the resulting probabilities match real event frequencies.",
    steps: [
      [
        "Define tomorrow’s class",
        "Turn the pain threshold into a yes/no label.",
      ],
      [
        "Make clues on or off",
        "Use each earlier input’s average as its cutoff.",
      ],
      [
        "Count evidence in each class",
        "Add one count so unseen patterns remain possible.",
      ],
      ["Combine the evidence", "Calculate probabilities for saved later days."],
    ],
    source: [
      "Naive Bayes families",
      "https://scikit-learn.org/stable/modules/naive_bayes.html",
    ],
    number: 5,
    plainLanguage: {
      what: "Naive Bayes combines how common a class is with how often each clue appears in that class. It makes a simplifying assumption that the clues contribute independently once the class is known. This version turns inputs into on/off clues and estimates tomorrow’s simulated pain class.",
      analogy:
        "Imagine judging whether a message is spam by counting how often its words occur in spam and ordinary mail. Each clue adds evidence to either side. The method keeps a small allowance for patterns it has never seen, so an unfamiliar combination does not break the calculation.",
      uses: "Common uses: text classification, simple probabilistic baselines, and binary-feature pattern recognition.",
    },
    methodology: [
      [
        "The question",
        "Can a small frequency-based classifier recognize tomorrow’s synthetic pain threshold? This entry uses Bernoulli Naive Bayes: its clues are on/off indicators, even when the original input such as energy is a continuous number.",
      ],
      [
        "How the model learns",
        "We pair today’s inputs with pain exactly one day later. Earlier pairs supply roughly 80% of the data; later pairs are saved as a test, with a one-day gap. Each input’s cutoff is its earlier-period mean. Within each class we count on/off clues and add one imaginary count, avoiding impossible probabilities for unseen combinations.",
      ],
      [
        "How to read the test",
        "The violet line is the computed probability and mint dots are actual later labels. Accuracy checks decisions at a 0.5 cutoff; precision and recall describe positive decisions. Brier score checks the probabilities themselves, penalizing confident mistakes more strongly. Lower Brier is better; high accuracy alone may simply reflect a common class.",
      ],
      [
        "What that tells us",
        "This is a transparent baseline for comparison with logistic regression. Its independence assumption and binary cutoffs can discard or double-count information. A strong result on the generated examples does not make the threshold a meaningful health diagnosis.",
      ],
    ],
  },
  {
    id: "pca-logistic",
    title: "PCA + logistic LASSO",
    short: "PCA + logistic",
    group: "Classification",
    icon: "σ",
    handler: "runPcaLogistic",
    type: "classification",
    description:
      "Combine overlapping clues, then learn a yes-or-no probability from those patterns.",
    evaluation:
      "Accuracy checks yes/no choices at probability 0.5; recall asks whether actual positives were found, and precision asks whether predicted positives were right. Brier score checks the probability values, with lower scores better. Component coefficient bars show which combined patterns the classifier uses; they are distinct from the PCA loadings that define each pattern.",
    purpose:
      "This first replaces overlapping clues with a smaller set of combined patterns, then learns a probability for one of two classes. PCA performs the summarizing; logistic LASSO performs the classification. The class here is whether simulated pain reaches five at tomorrow’s exact calendar endpoint.",
    math: "Z = standardize(X) · V₄\np = sigmoid(b + Z·β), with L1 shrinkage",
    mathNote:
      "Z contains four combined input coordinates learned by PCA, and the sigmoid converts their weighted sum into a probability. The L1 cost can remove weak component weights. Both the input scaling and the component scaling are learned before the test period. The 0.5 cutoff makes the final class decision; it does not change the probability itself.",
    how: "First center and scale the earlier six-input rows. Fit four PCA directions using covariance and Jacobi rotations, then project earlier and later rows with those same directions. A 400-step proximal logistic fit learns sparse component weights with λ = 0.04. This keeps the summary and classifier inside the learning period, rather than letting the later test examples influence the viewpoint.",
    why: "It tests whether a smaller representation can preserve the clues needed for classification. Comparing it with direct logistic LASSO makes both the benefit of combining inputs and the possible cost of lost detail visible.",
    archive:
      "The historical PCA/logistic wrapper supported broader label rules and could skip PCA in some branches. This direct version always uses the stated four-component representation of the complete fixture and returns the fitted projection along with the classifier results.",
    limitations:
      "A direction that captures much input variation might do little to separate the classes. Component weights are contributions from mixed input patterns, not single food effects. Compressing first does not guarantee better probabilities or calibrated predictions.",
    steps: [
      [
        "Learn a comparable input scale",
        "Use earlier days to fit means and spreads.",
      ],
      [
        "Summarize into four patterns",
        "Keep the same PCA directions for every later row.",
      ],
      [
        "Fit the probability model",
        "Trim weak component contributions with L1.",
      ],
      [
        "Check the saved labels",
        "Compare probabilities with later yes/no outcomes.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 6,
    plainLanguage: {
      what: "This first replaces overlapping clues with a smaller set of combined patterns, then learns a probability for one of two classes. PCA performs the summarizing; logistic LASSO performs the classification. The class here is whether simulated pain reaches five at tomorrow’s exact calendar endpoint.",
      analogy:
        "Imagine reducing many weather measurements to a few broad weather patterns, then judging whether a particular condition is likely. Compression makes the input smaller, but can lose a subtle useful clue. The chart checks whether this compressed model recognizes the later synthetic labels.",
      uses: "Common uses: classification with correlated measurements, compressed inputs, and pipeline comparisons.",
    },
    methodology: [
      [
        "The question",
        "Does summarizing six clues into four shared patterns help classify tomorrow’s simulated pain threshold? This is the same one-day yes/no task as direct logistic LASSO, but the classifier sees combined coordinates instead of the original inputs.",
      ],
      [
        "How the model learns",
        "We reserve roughly the last 20% of date-paired examples and leave a one-day gap. The earlier period supplies input scales, PCA directions and classifier fitting. This matters because even an unsupervised summary can leak information if it learns from later test rows. The saved transform is reused for those rows without changes.",
      ],
      [
        "How to read the test",
        "Accuracy checks yes/no choices at probability 0.5; recall asks whether actual positives were found, and precision asks whether predicted positives were right. Brier score checks the probability values, with lower scores better. Component coefficient bars show which combined patterns the classifier uses; they are distinct from the PCA loadings that define each pattern.",
      ],
      [
        "What that tells us",
        "Compare the saved-day scores with direct logistic LASSO on the same seed. PCA chooses broad variation, not the best class separator, so a smaller model can lose useful discrimination. No demo threshold establishes a medical event probability.",
      ],
    ],
  },
  {
    id: "three-day",
    title: "Three-day event classifier",
    short: "3-day classifier",
    group: "Classification",
    icon: "3",
    handler: "runFlareThreeDay",
    type: "classification",
    description:
      "Ask the same yes-or-no question at an exact three-day endpoint.",
    evaluation:
      "Probabilities describe the declared three-day label. At a 0.5 cutoff, accuracy checks class decisions, precision checks positive predictions, and recall checks whether actual positives were found. Brier score checks probability mistakes, with confident wrong answers costing more. A weak result is informative: the simulator’s strongest planted relationship is one day ahead, not necessarily three.",
    variant: true,
    purpose:
      "This classifier asks a specific timing question: will simulated pain reach five exactly three days from now? It learns from today’s generated clues and past examples with that precise endpoint. Changing the date being predicted changes the task; it is not just another label on tomorrow’s model.",
    math: "yₜ = 1[pain(t + 3) ≥ 5]\npₜ = sigmoid(b + xₜ·β)",
    mathNote:
      "The label is one when simulated pain at t+3 is at least five, otherwise zero. The sigmoid maps today’s weighted input score to that label’s probability. “Exactly three days ahead” is different from “at any point during the next three days.” Examples without that calendar endpoint cannot supply a learning label.",
    how: "Call the direct six-input logistic-LASSO workflow with a three-day horizon and λ = 0.04. Learn input scaling on the earlier period, require both classes there, and leave three pairs out at the split before checking later days. The numerical solver uses the same 400 proximal steps as the one-day classifier; the date matching and target timing are what make this a different task.",
    why: "It preserves a distinct earlier coursework entry while making time-dependent label construction visible. The generator plants its strongest direct exposure relationship one day ahead, so this variant also shows why a longer horizon should not inherit tomorrow’s accuracy.",
    archive:
      "The older three-day flare module used a different three-tier rule. The replacement deliberately uses one transparent binary endpoint threshold, with direct inputs and a separate test period. It keeps the temporal classification idea without claiming to reproduce the earlier label definition.",
    limitations:
      "Today’s clues may contain little information about the exact outcome three days later. The arbitrary threshold is not a validated flare definition. Correctly computing a three-day probability does not show that the probabilities are calibrated or useful for a real person.",
    steps: [
      [
        "Match dates three days apart",
        "Require the exact future calendar date.",
      ],
      ["Define the yes/no answer", "Use simulated pain of at least five."],
      [
        "Leave a three-day test gap",
        "Learn scales and weights on earlier pairs only.",
      ],
      [
        "Check later endpoints",
        "Report probability errors as well as class decisions.",
      ],
    ],
    source: [
      "Logistic regression",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html",
    ],
    number: 7,
    plainLanguage: {
      what: "This classifier asks a specific timing question: will simulated pain reach five exactly three days from now? It learns from today’s generated clues and past examples with that precise endpoint. Changing the date being predicted changes the task; it is not just another label on tomorrow’s model.",
      analogy:
        "Think of estimating whether a delivery will arrive on Friday rather than tomorrow. You need examples tied to Friday’s outcome. This variant uses the original six inputs without PCA and leaves a three-day gap between learning examples and later test examples.",
      uses: "Common uses: fixed-horizon event classification and comparing short-term prediction tasks.",
    },
    methodology: [
      [
        "The question",
        "Will simulated pain be at least five exactly three days after today’s inputs? This standalone variant uses direct features and a fixed endpoint. It does not ask whether the threshold is crossed anywhere inside a three-day window.",
      ],
      [
        "How the model learns",
        "We match every input date with the exact t+3 pain observation. Incomplete date pairs are excluded. Roughly the first 80% teach the model, the last 20% are saved, and three pairs at the boundary are left out. Input scales and sparse logistic weights come only from the earlier period.",
      ],
      [
        "How to read the test",
        "Probabilities describe the declared three-day label. At a 0.5 cutoff, accuracy checks class decisions, precision checks positive predictions, and recall checks whether actual positives were found. Brier score checks probability mistakes, with confident wrong answers costing more. A weak result is informative: the simulator’s strongest planted relationship is one day ahead, not necessarily three.",
      ],
      [
        "What that tells us",
        "Changing the horizon changes which outcomes the model must learn, even though its solver is unchanged. This is a timing experiment on synthetic data, not a longer-range clinical risk forecast. Compare it with the one-day classifier on the same seed.",
      ],
    ],
  },
  {
    id: "correlation",
    title: "Lagged correlation",
    short: "Correlation",
    group: "Patterns & structure",
    icon: "ρ",
    handler: "runCorrelation",
    type: "correlation",
    description:
      "See which quantities tend to move together, before fitting a prediction model.",
    evaluation:
      "A positive Pearson r means higher input values tend to go with higher next-day pain; a negative value means the opposite. Larger absolute values indicate a stronger straight-line relationship. Values near zero do not rule out nonlinear relationships. A constant quantity has an undefined correlation, which is kept as missing rather than a made-up zero.",
    purpose:
      "Correlation describes whether two quantities tend to move together. Positive values mean they tend to rise together; negative values mean one tends to fall as the other rises. This page compares today’s generated clues with tomorrow’s simulated pain, and also compares the clues with each other.",
    math: "r(x,y) = Σ(xᵢ−x̄)(yᵢ−ȳ) / √[Σ(xᵢ−x̄)² Σ(yᵢ−ȳ)²]",
    mathNote:
      "Subtracting each average measures deviations from normal. Pearson r compares the paired deviations and divides by both series’ spread, placing the result between −1 and +1. A constant series has no defined correlation because its spread is zero. The result describes a straight-line relationship, not a cause.",
    how: "Pair each generated input row with pain exactly one calendar day later. Compute Pearson r for every input against that target, and for every pair of inputs in the feature matrix. The code returns the number of complete pairs but does not calculate a significance test or confidence interval. An undefined correlation stays null instead of being presented as an observed zero.",
    why: "It is a useful first look at the simulator’s planted one-day relationship and at overlap among inputs. Seeing these associations before fitting a model makes later coefficient signs and possible redundancy easier to understand.",
    archive:
      "The original workflow explored more symptom and trigger pairs, multiple lags and additional output metadata. This direct version fixes one stated one-day delay and shows all six input comparisons plus their input-to-input matrix.",
    limitations:
      "An association can reflect shared causes, timing, co-occurrence or chance. Testing many inputs and delays can make chance peaks look interesting. These bars do not include statistical significance or adjust for repeated, related observations over time.",
    steps: [
      [
        "Match today with tomorrow",
        "Keep exact input and next-day outcome dates.",
      ],
      [
        "Measure deviations from average",
        "Compare each quantity’s ups and downs.",
      ],
      [
        "Put the association on one scale",
        "Normalize the paired variation to Pearson r.",
      ],
      [
        "Inspect all six comparisons",
        "Use the input grid to spot overlapping clues.",
      ],
    ],
    source: [
      "Pearson correlation",
      "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html",
    ],
    number: 8,
    plainLanguage: {
      what: "Correlation describes whether two quantities tend to move together. Positive values mean they tend to rise together; negative values mean one tends to fall as the other rises. This page compares today’s generated clues with tomorrow’s simulated pain, and also compares the clues with each other.",
      analogy:
        "Think of comparing umbrella sightings with rainfall. They may move together without umbrellas causing rain. Here, the bar lengths show the strength of straight-line associations, while the colored grid shows relationships among inputs. No predictive model or cause-and-effect claim is needed for that summary.",
      uses: "Common uses: exploring datasets, spotting redundancy, and checking possible lagged relationships.",
    },
    methodology: [
      [
        "The question",
        "Which of today’s generated inputs tends to rise or fall with tomorrow’s simulated pain? We also ask whether the six inputs overlap with one another. This is an exploration of recorded co-variation, not a trained prediction model.",
      ],
      [
        "What data is used",
        "All complete one-day calendar pairs from the 150-day fixture are used. There is no separate learning/test split because we are summarizing these records. Every input-to-outcome comparison shows its valid pair count, and the grid compares inputs on the same paired rows.",
      ],
      [
        "How to read the result",
        "A positive Pearson r means higher input values tend to go with higher next-day pain; a negative value means the opposite. Larger absolute values indicate a stronger straight-line relationship. Values near zero do not rule out nonlinear relationships. A constant quantity has an undefined correlation, which is kept as missing rather than a made-up zero.",
      ],
      [
        "What that tells us",
        "The simulator gives us a known invented mechanism to inspect, but correlation alone cannot distinguish cause from co-occurrence. No significance test or confidence interval is claimed here. Searching extra features and lags would create more opportunities for chance associations, so the complete comparison set should stay visible.",
      ],
    ],
  },
  {
    id: "pca",
    title: "Principal component analysis",
    short: "PCA",
    group: "Patterns & structure",
    icon: "⊕",
    handler: "runPca",
    type: "scatter",
    description:
      "Turn the viewpoint to reveal shared variation in many measurements.",
    evaluation:
      "Each dot is one generated date in the new coordinates. Points close together share similar projected inputs. Explained variance tells you how much of the standardized input spread a direction or plane retains; it is not prediction accuracy. The loadings describe how original inputs combine to define each direction, rather than contributions to a pain prediction.",
    purpose:
      "Principal component analysis, or PCA, finds new viewing directions that capture the most variation in a dataset. It turns many measurements into fewer combined coordinates. Here, six generated inputs become three retained directions; the picture shows the first two, without using pain as a target.",
    math: "C = XᶜᵀXᶜ / (n−1)\nCvⱼ = λⱼvⱼ,   Z = XᶜV",
    mathNote:
      "C summarizes how pairs of centered inputs vary together. Each eigenvector v defines a viewing direction; its eigenvalue λ measures variation along that direction. Projecting rows onto the chosen directions gives coordinates Z. Dividing each eigenvalue by total variation gives its explained-variance fraction. Here, input units are made comparable before that calculation.",
    how: "Scale the six generated inputs, center the scaled matrix, and form its sample covariance using n−1. The kernel uses Jacobi rotations to reduce off-diagonal covariance terms, stopping below 1e−10 or at its bounded rotation limit. It sorts directions by decreasing eigenvalue and retains three. The scatter plot uses the first two coordinates; the returned data also includes direction weights, called loadings.",
    why: "PCA lets you see a many-input dataset without choosing a target to predict. Its geometric summary supports both visualization and later compressed models, while the variance percentages state how much of the input spread that viewpoint retains.",
    archive:
      "The coursework PCA helper found directions by power iteration and orthogonalization. The replacement uses Jacobi eigenanalysis instead. Both calculate principal directions, but the numerical procedure has changed and is documented rather than treated as an identical restoration.",
    limitations:
      "A high-variation direction is not necessarily useful for predicting an outcome. Direction signs can flip without changing the geometry. When two directions have almost equal variance, their individual orientations can also change substantially while describing the same broad subspace.",
    steps: [
      [
        "Make the units comparable",
        "Center each input and divide by its spread.",
      ],
      ["Summarize shared variation", "Build the covariance matrix."],
      [
        "Find the widest directions",
        "Sort PCA directions by retained variation.",
      ],
      ["View each generated day", "Plot the first two combined coordinates."],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 9,
    plainLanguage: {
      what: "Principal component analysis, or PCA, finds new viewing directions that capture the most variation in a dataset. It turns many measurements into fewer combined coordinates. Here, six generated inputs become three retained directions; the picture shows the first two, without using pain as a target.",
      analogy:
        "Imagine turning a camera around a cloud of objects until you can see its widest spread. A different angle reveals different structure. PCA chooses those angles mathematically. The percentages tell you how much spread the view retains, not how accurately it predicts something.",
      uses: "Common uses: visualizing many measurements, compression, and finding shared patterns in correlated data.",
    },
    methodology: [
      [
        "The question",
        "What does the six-input dataset look like from a viewpoint that preserves as much variation as possible? PCA does not use simulated pain as an answer to learn. It describes the arrangement of the input measurements themselves.",
      ],
      [
        "What data is used",
        "All 150 synthetic input rows contribute to this descriptive projection. Each input is centered and divided by its spread so energy units do not dominate a binary food indicator simply because their numbers are larger. We retain three principal directions, and display the first two.",
      ],
      [
        "How to read the result",
        "Each dot is one generated date in the new coordinates. Points close together share similar projected inputs. Explained variance tells you how much of the standardized input spread a direction or plane retains; it is not prediction accuracy. The loadings describe how original inputs combine to define each direction, rather than contributions to a pain prediction.",
      ],
      [
        "What that tells us",
        "A useful view can reveal structure worth examining, but may hide differences outside the displayed plane. There is no saved-future accuracy score for this descriptive task. Known-structure tests check the numerical directions and fitted projection; clinical meaning is a different question.",
      ],
    ],
  },
  {
    id: "kmeans",
    title: "PCA + K-means",
    short: "K-means + PCA",
    group: "Patterns & structure",
    icon: "◉",
    handler: "runKMeans",
    type: "scatter",
    description:
      "Find three meeting points for the data, then group each day by its closest point.",
    evaluation:
      "A colored dot belongs to the nearest learned center; each cross marks a center. The within-group squared error adds all squared distances to assigned centers. Lower means a tighter partition for this fixed view and group count; it is not medical accuracy. Every point is assigned, so an unusual day still receives a color.",
    purpose:
      "K-means groups points around a chosen number of centers. It repeatedly assigns each point to its nearest center, then moves each center to the average of its group. Here, the generated inputs are first projected into a PCA picture, and the requested number of groups is three.",
    math: "min  Σₖ Σᵢ∈clusterₖ ||zᵢ − μₖ||²\nμₖ = mean(points assigned to cluster k)",
    mathNote:
      "The objective adds the squared distance of every projected point from its assigned group center. A center μ is the average of its members. Smaller total distance means a tighter partition under this geometry. We request three groups and use the dataset seed to reproduce the starting centers.",
    how: "First reuse the PCA view of all six scaled inputs, keeping two coordinates for clustering. Choose three starting centers with a seeded, distance-weighted method. Repeatedly assign points to the nearest center and replace each center with its group mean, up to 60 iterations. If a center has no members, it stays where it was. Returned labels color the dots and learned centers appear as crosses.",
    why: "It makes a simple iterative grouping rule visible. Comparing it with DBSCAN on the same PCA plane shows the difference between requiring three centroid groups and allowing the data’s density to determine groups and noise.",
    archive:
      "The coursework workflow tried different group counts with elbow/silhouette-style selection and had broader feature handling. This demonstration deliberately requests K = 3 and groups only the first two PCA coordinates. It is a stated geometric variant rather than a copy of every earlier selection heuristic.",
    limitations:
      "K-means must assign every point, including outliers, and favors compact groups around means. The chosen K, input scaling and projection affect the answer. Group numbers are arbitrary identifiers and can change order; none of them identifies a disease state.",
    steps: [
      [
        "Build the two-dimensional view",
        "Project six comparable inputs with PCA.",
      ],
      [
        "Place three starting centers",
        "Use the seed for repeatable initialization.",
      ],
      [
        "Assign people to meeting spots",
        "Move each center toward its assigned points.",
      ],
      [
        "Inspect the final grouping",
        "Colors are memberships; crosses are learned centers.",
      ],
    ],
    source: [
      "Clustering methods",
      "https://scikit-learn.org/stable/modules/clustering.html",
    ],
    number: 10,
    plainLanguage: {
      what: "K-means groups points around a chosen number of centers. It repeatedly assigns each point to its nearest center, then moves each center to the average of its group. Here, the generated inputs are first projected into a PCA picture, and the requested number of groups is three.",
      analogy:
        "Imagine placing three meeting spots for a scattered crowd. People choose the nearest spot; you move each spot toward its assigned people and repeat. Colored dots show the resulting memberships, and crosses show centers. Every point joins a group, including unusual ones.",
      uses: "Common uses: customer segmentation, grouping measurements, and organizing similar items by distance.",
    },
    methodology: [
      [
        "The question",
        "How would these generated days divide into three compact groups in the PCA plane? K-means answers a geometric question: it tries to make each group close to its own average point, rather than predicting pain or discovering named health states.",
      ],
      [
        "What data is used",
        "All 150 input rows are standardized and projected onto two PCA directions. The dataset seed chooses reproducible distance-weighted starting centers. The algorithm alternates assignments and center updates for at most 60 rounds, retaining an empty center rather than inventing extra points.",
      ],
      [
        "How to read the result",
        "A colored dot belongs to the nearest learned center; each cross marks a center. The within-group squared error adds all squared distances to assigned centers. Lower means a tighter partition for this fixed view and group count; it is not medical accuracy. Every point is assigned, so an unusual day still receives a color.",
      ],
      [
        "What that tells us",
        "There is no future-day test for this descriptive clustering. Compare memberships, occupied groups and geometry across seeds or against DBSCAN. Group labels can swap numbers between runs, so stable grouping matters more than a particular color or number.",
      ],
    ],
  },
  {
    id: "dbscan",
    title: "PCA + DBSCAN",
    short: "DBSCAN + PCA",
    group: "Patterns & structure",
    icon: "⠿",
    handler: "runDbscan",
    type: "scatter",
    description:
      "Find connected crowds in the data, and leave isolated points ungrouped.",
    evaluation:
      "Colors identify actual connected groups and gray marks noise with label −1. A core point has enough neighbors to expand a group; a border point may belong without meeting that core rule. The group and noise counts summarize the returned assignments. They are descriptive counts, not sensitivity, accuracy or clinical state estimates.",
    purpose:
      "DBSCAN finds groups where points form connected dense neighborhoods. It does not require a fixed number of groups, and can leave isolated points as noise. This version applies the rule to the PCA picture, using a stated neighborhood radius and at least four neighbors per dense point.",
    math: "Nε(z) = {q : ||z−q|| ≤ ε}\ncore(z) when |Nε(z)| ≥ minPoints",
    mathNote:
      "A neighborhood contains points within the radius ε of a point. A point becomes a dense core when its neighborhood reaches minPoints. Here ε = 0.7 in the PCA plane and minPoints = 4, counting the point itself. Connected dense neighborhoods create groups; unreached points keep the noise label −1.",
    how: "Project the six scaled inputs onto two PCA directions. Visit each projected point and count nearby points using Euclidean distance. A dense core can start or expand a group; reachable border points can join it. Points not reached by any expanding group remain noise. The radius and minimum count are fixed demonstration settings, and the chart preserves actual group and noise labels.",
    why: "This illustrates grouping without requiring a fixed number of clusters. It is especially useful beside K-means, because the same points can be organized differently when connected density replaces nearest-center assignment.",
    archive:
      "The archived DBSCAN workflow described mixed-input Gower distances, score bins and adaptive radius selection. This direct version uses an explicit Euclidean radius in the two-component PCA plane. The simpler distance and fixed settings are deliberate changes.",
    limitations:
      "Changing the radius, scaling or projection can join groups, split them, or turn many points into noise. One dense group is a valid output. A geometric density group should not be given a disease interpretation simply because it has a clear color in the chart.",
    steps: [
      ["View the comparable inputs", "Use the first two PCA coordinates."],
      ["Count each point’s neighbors", "Look within a radius of 0.7."],
      [
        "Connect crowded neighborhoods",
        "A core needs at least four points, including itself.",
      ],
      [
        "Keep isolated points as noise",
        "Gray means label −1, not a failed calculation.",
      ],
    ],
    source: [
      "Clustering methods",
      "https://scikit-learn.org/stable/modules/clustering.html",
    ],
    number: 11,
    plainLanguage: {
      what: "DBSCAN finds groups where points form connected dense neighborhoods. It does not require a fixed number of groups, and can leave isolated points as noise. This version applies the rule to the PCA picture, using a stated neighborhood radius and at least four neighbors per dense point.",
      analogy:
        "Imagine finding crowds at a festival. A person with enough nearby neighbors anchors a crowd, which expands through other crowded spots. Someone standing alone need not belong to any crowd. Here, gray dots are noise and colors are actual density groups, which can vary with the seed.",
      uses: "Common uses: spatial grouping, irregular clusters, and finding isolated observations.",
    },
    methodology: [
      [
        "The question",
        "Which generated days form connected dense neighborhoods, and which stand apart? DBSCAN lets density decide how many groups appear. Its rule can produce a single group or many noise points without needing to force a more dramatic picture.",
      ],
      [
        "What data is used",
        "All 150 standardized input rows are projected onto the first two PCA directions. We use a Euclidean neighborhood radius of 0.7 and a minimum of four neighboring points, including the point itself. These settings define this demonstration’s geometry; they were not tuned to a health outcome.",
      ],
      [
        "How to read the result",
        "Colors identify actual connected groups and gray marks noise with label −1. A core point has enough neighbors to expand a group; a border point may belong without meeting that core rule. The group and noise counts summarize the returned assignments. They are descriptive counts, not sensitivity, accuracy or clinical state estimates.",
      ],
      [
        "What that tells us",
        "There is no future-target test in this clustering task. Compare the same seed with K-means and ask which grouping assumptions each imposes. A clear PCA view can still conceal distinctions outside its two displayed directions, and a different radius can materially change memberships.",
      ],
    ],
  },
  {
    id: "dtw",
    title: "Dynamic time warping",
    short: "DTW pattern matching",
    group: "Patterns & structure",
    icon: "≋",
    handler: "runDtw",
    type: "dtw",
    description:
      "Match similar sequence shapes even when their timing is stretched.",
    evaluation:
      "The two curves are actual generated values. Faint connections are the cheapest returned alignment path, which can match one position more than once. Lower distance means closer under this specific cost and timing rule. The comparison count shows how many candidate pairs were searched, and the other listed matches are actual ranked distances.",
    purpose:
      "DTW finds similar shapes in timelines even when their timing is stretched or compressed. Here, a window means a short clip of seven consecutive days. Its start moves through the history in three-row steps, and separate clips are compared to find the closest matches.",
    math: "D(i,j) = (aᵢ−bⱼ)² + min[D(i−1,j), D(i,j−1), D(i−1,j−1)]\ndistance = √D(last,last)",
    mathNote:
      "The grid cell D(i,j) stores the cheapest cost of matching up to two sequence positions. Each step adds their squared value difference and chooses the cheapest allowed previous cell. The final distance is the square root of total cost, without dividing by path length. A band of two limits how far positions can stretch apart.",
    how: "Take separate seven-day windows with complete consecutive pain observations, advancing possible start dates by three rows. For each non-overlapping pair, fill a dynamic-programming grid within band two and trace its cheapest path backward. Rank pairs by distance and keep the best five. The chart draws the returned path, rather than inventing links from visual similarity.",
    why: "It makes sequence alignment and dynamic programming tangible. The connection lines show why two similar curves can correspond even when their changes occur at slightly different moments; the rolling-memory version shows what can be saved when only distance is needed.",
    archive:
      "The archived motif finder added similarity filtering, pattern groups and overlap suppression. This direct search uses stated seven-day windows, three-row start steps and a timing band of two. It retains exact distances and paths without reproducing every historical grouping heuristic.",
    limitations:
      "A close historical match is not a forecast that the shape will repeat. Comparing many windows creates opportunities for coincidental matches. Distances also depend on the chosen value scale, timing band and normalization, so those choices must accompany the number.",
    steps: [
      [
        "Choose separate seven-day clips",
        "Keep consecutive recorded dates and no overlap.",
      ],
      [
        "Price possible note matches",
        "Use squared differences with limited timing stretch.",
      ],
      [
        "Trace the cheapest ordered path",
        "Follow the minimum-cost predecessor cells.",
      ],
      [
        "Compare the closest clips",
        "Rank actual distances and display the best match.",
      ],
    ],
    source: [
      "DTW recurrence and use",
      "https://dtaidistance.readthedocs.io/en/latest/usage/dtw.html",
    ],
    number: 12,
    plainLanguage: {
      what: "DTW finds similar shapes in timelines even when their timing is stretched or compressed. Here, a window means a short clip of seven consecutive days. Its start moves through the history in three-row steps, and separate clips are compared to find the closest matches.",
      analogy:
        "Think of two people singing the same melody at different speeds. A peak on day two can match one on day three. DTW keeps matches in order and chooses the cheapest allowed path; our two-position limit prevents unlimited stretching. The links show the actual matching path.",
      uses: "Common uses: speech, movement and sensor-sequence comparisons, and repeated time-series patterns.",
    },
    methodology: [
      [
        "The question",
        "Which two separate seven-day simulated pain clips have the closest shapes when small timing differences are allowed? DTW preserves the order of observations, while letting one point correspond to a nearby earlier or later position in the other clip.",
      ],
      [
        "What data is used",
        "A window is a short clip taken from the longer timeline. Ours contains seven consecutive pain dates. Its start moves forward three recorded rows at a time, letting the search inspect different parts of the history. We compare separate, non-overlapping clips. A timing band of two limits how far their positions can stretch apart. Squared value differences supply the local costs; the final distance is the square root of total path cost, not an average per link.",
      ],
      [
        "How to read the result",
        "The two curves are actual generated values. Faint connections are the cheapest returned alignment path, which can match one position more than once. Lower distance means closer under this specific cost and timing rule. The comparison count shows how many candidate pairs were searched, and the other listed matches are actual ranked distances.",
      ],
      [
        "What that tells us",
        "Known examples can verify the recurrence, path endpoints and distance calculation. There is no prediction of future days here. Similar shapes do not reveal their cause or establish recurrence probability, especially after searching many possible clips.",
      ],
    ],
    walkthrough:
      "Imagine a seven-day clip whose main rise happens on day two, and another whose similar rise happens on day three. Comparing only day two with day two would miss that shifted shape. DTW can pair nearby positions instead, while keeping the order of the timeline. Our sliding window takes seven recorded days at a time and moves its starting point forward three rows to search the longer history. Each pair must be separate and consecutive; the best five are ranked by their matching cost.",
  },
  {
    id: "dtw-rolling",
    title: "DTW with rolling memory",
    short: "DTW · rolling memory",
    group: "Patterns & structure",
    icon: "≋",
    handler: "runOptimizedDtw",
    type: "dtw",
    description:
      "Calculate the same sequence distance while saving only two rows of working costs.",
    evaluation:
      "The two curves show the best-matched generated clips, but there are no correspondence links because the backtracking path was not saved. Lower distance still means a closer constrained match. Compare the full entry on the same seed: its distance should agree, while it can also display the stored path.",
    variant: true,
    purpose:
      "This is the same constrained sequence comparison as full DTW, with a different memory strategy. To calculate the distance, it keeps only the current and previous rows of matching costs. It produces the same answer for the same windows, while deliberately giving up the stored alignment path.",
    math: "current[j] = cost(i,j) + min(previous[j], current[j−1], previous[j−1])\nmemory: O(m), rather than O(n·m)",
    mathNote:
      "Each current cost uses the previous row and the neighboring current cell, so the whole grid is unnecessary if we only want the final distance. Memory grows with one sequence length, O(m), rather than with every pair of positions, O(n·m). This saves storage but removes the full backtracking path.",
    how: "Run the same seven-day window search with the same start stride, band and squared-value costs as full DTW. The kernel overwrites working rows as it moves through the grid, preserving the exact final distance. It intentionally returns no alignment path. The plot therefore shows the matched sequence values without correspondence links; those links are available in the full-grid entry.",
    why: "It demonstrates an optimization that changes resource use while keeping the numerical answer. Separating “distance needed” from “path needed” is a practical algorithm-design decision, not merely a faster-looking animation.",
    archive:
      "The earlier optimized DTW included additional beam-search, lower-bound and caching ideas. This direct variant focuses on exact rolling-memory distance within the chosen band. It does not claim to restore every historical optimization or a missing alignment path.",
    limitations:
      "The cost grid is not kept, so this version cannot simply trace the alignment backward. The seven-day demo is small enough that memory savings are mainly educational; larger sequence searches make the tradeoff more consequential. It remains motif comparison, not a recurrence forecast.",
    steps: [
      ["Use the same clip pairs", "Keep full DTW’s windows and timing band."],
      [
        "Retain only two cost rows",
        "Overwrite working memory as the grid advances.",
      ],
      [
        "Keep the exact final distance",
        "Use the same minimum-cost recurrence.",
      ],
      [
        "Choose distance or path detail",
        "Open full DTW when you need alignment links.",
      ],
    ],
    source: [
      "DTW recurrence and use",
      "https://dtaidistance.readthedocs.io/en/latest/usage/dtw.html",
    ],
    number: 13,
    plainLanguage: {
      what: "This is the same constrained sequence comparison as full DTW, with a different memory strategy. To calculate the distance, it keeps only the current and previous rows of matching costs. It produces the same answer for the same windows, while deliberately giving up the stored alignment path.",
      analogy:
        "Imagine adding a long column of numbers while keeping just a running total instead of saving every intermediate worksheet. You can know the final answer without reconstructing all your steps. This variant shows the matched curves and distance; open full DTW to see their correspondence links.",
      uses: "Common uses: distance-only sequence searches and memory-efficient repeated comparisons.",
    },
    methodology: [
      [
        "The question",
        "Can we obtain the same closest-window distances without retaining the entire alignment grid? This variant changes how the calculation uses memory, not which seven-day clips it compares or what “close” means.",
      ],
      [
        "What data is used",
        "The candidate pairs, three-row start steps, timing band of two, squared local costs and final square root are identical to full DTW. We keep only a current and previous cost row for each pair. The top five matches are ranked by those actual distances.",
      ],
      [
        "How to read the result",
        "The two curves show the best-matched generated clips, but there are no correspondence links because the backtracking path was not saved. Lower distance still means a closer constrained match. Compare the full entry on the same seed: its distance should agree, while it can also display the stored path.",
      ],
      [
        "What that tells us",
        "Known-fixture checks compare full and rolling distances exactly, including sequences of different lengths. This supports the memory optimization for its stated recurrence. It does not preserve every optimization from the coursework archive, test future prediction, or show that a repeated shape has a particular cause.",
      ],
    ],
    walkthrough:
      "Use the same sliding seven-day clips as full DTW: move the start through the recorded history in three-row steps and compare separate consecutive clips. The matching rules stay the same. The difference is what is saved while calculating: only the current and previous rows of costs. That keeps the final distance available, but not all the information needed to trace the alignment backward. The two curves therefore have no connecting path in this view.",
  },
  {
    id: "elastic-horizons",
    title: "ElasticNet horizon forecasts",
    short: "ElasticNet · horizons",
    group: "Forecasting",
    icon: "⌁",
    handler: "runElasticNetForecast",
    type: "horizon",
    description:
      "Make three separate estimates for tomorrow, next week and two weeks ahead.",
    evaluation:
      "The bars are current-input endpoint estimates from the earlier-period fitted models. The table evaluates each model on its own saved days. RMSE is error in simulated pain-scale points, with big misses counting more; compare it with always guessing that model’s earlier target mean. Different row counts and errors across horizons are expected.",
    purpose:
      "This builds a separate prediction model for each future date: one, seven and fourteen days ahead. Each model learns which present-day clues help estimate its own endpoint. They share a method, but do not simply repeat the same prediction or use one forecast as the next input.",
    math: "ŷₜ₊ₕ = bₕ + xₜ·βₕ,  h ∈ {1,7,14}",
    mathNote:
      "h means the number of days ahead. Each horizon gets its own starting value bₕ and weight list βₕ, learned from the examples for that future date. Here h is 1, 7 or 14. The input clue stays at the original date; the future target changes. Each model uses the same fixed ElasticNet cost, λ = 0.04 with equal L1/L2 contributions.",
    how: "For each future date, pair the current inputs with simulated pain exactly that many calendar days later. Make an earlier learning period, a later saved test period and a gap the size of the horizon. Fit input scales and an ElasticNet model separately for each horizon, then reuse that model for the latest input row. Return its endpoint estimate, saved-day predictions, weights and test scores. No estimate is fed into another horizon model.",
    why: "Different planning dates can need different models and have different error sizes. Keeping them separate shows whether today’s clues actually contain information about each future endpoint, instead of presenting a single curve as equally reliable everywhere.",
    archive:
      "The old forecasting wrapper used larger temporal feature matrices, database reads during prediction and optional sampling of missing inputs. This direct version takes one supplied snapshot and uses explicit 1/7/14-day endpoints. Its current estimates use the earlier-period fitted models rather than a hidden inference-time database lookup.",
    limitations:
      "The three endpoints do not form a fitted day-by-day trajectory, and connecting them does not create an uncertainty interval. Today’s generated exposure clues have a planted one-day relationship, so they need not predict outcomes a week or two later.",
    steps: [
      [
        "Choose three future dates",
        "Ask separate questions at +1, +7 and +14 days.",
      ],
      [
        "Match each date’s examples",
        "Keep exact future targets and exclude missing endpoints.",
      ],
      [
        "Fit a model for each question",
        "Learn its scales and weights from earlier examples.",
      ],
      [
        "Check every horizon separately",
        "Compare saved-day errors and current endpoint estimates.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 14,
    plainLanguage: {
      what: "This builds a separate prediction model for each future date: one, seven and fourteen days ahead. Each model learns which present-day clues help estimate its own endpoint. They share a method, but do not simply repeat the same prediction or use one forecast as the next input.",
      analogy:
        "Think of three different planning questions: tomorrow’s demand, next week’s demand and demand two weeks away. Each needs examples from its own timing. The bars show the three computed endpoint estimates; the table checks each model on later examples, where a longer horizon may be harder.",
      uses: "Common uses: demand planning, resource forecasts, and comparing errors across future horizons.",
    },
    methodology: [
      [
        "The question",
        "Can today’s generated inputs estimate simulated pain one, seven or fourteen days later? We fit three models because each endpoint is a different question. This is direct forecasting: today’s row predicts each endpoint without feeding earlier predictions into later ones.",
      ],
      [
        "How the models learn",
        "For each horizon we build exact calendar pairs. Roughly 80% of those pairs teach the model, 20% are saved as later tests, and a horizon-sized gap separates the periods. Input scales and ElasticNet weights are learned separately for each task. Unavailable future labels are left out rather than guessed.",
      ],
      [
        "How to read the result",
        "The bars are current-input endpoint estimates from the earlier-period fitted models. The table evaluates each model on its own saved days. RMSE is error in simulated pain-scale points, with big misses counting more; compare it with always guessing that model’s earlier target mean. Different row counts and errors across horizons are expected.",
      ],
      [
        "What that tells us",
        "A low one-day error does not validate the longer models. The generator has strong one-day exposure signal, not a promise of long-range signal. These are three point estimates, not daily observations, causal predictions or calibrated ranges.",
      ],
    ],
  },
  {
    id: "pca-horizons",
    title: "PCA + ElasticNet horizons",
    short: "PCA + ElasticNet · horizons",
    group: "Forecasting",
    icon: "⌁",
    handler: "runPcaElasticNet",
    type: "horizon",
    description:
      "Summarize today’s clues before making separate estimates for three future dates.",
    evaluation:
      "The bars show three current-input point estimates, while the table measures each model’s saved-day errors. RMSE is a pain-scale error summary; the mean baseline is the simpler earlier-average guess to compare with. The models have their own sample sizes and fitted views, so a score at one endpoint should not stand in for another.",
    purpose:
      "This also builds separate models for one, seven and fourteen days ahead, but first summarizes the inputs into combined patterns. Each future date gets its own learned summary and prediction model. It helps demonstrate whether fewer coordinates preserve useful information for each timing question.",
    math: "Zₕ = standardize(Xₕ) · Vₕ,₄\nŷₜ₊ₕ = bₕ + Zₜ,ₕ·βₕ",
    mathNote:
      "Each horizon h gets four PCA directions Vₕ,₄ and its own regression weights βₕ. Zₕ is the earlier input data seen through that learned viewpoint. The model predicts that horizon’s pain endpoint from those combined coordinates. Scaling and PCA belong to the same learning period as the model, not the whole history.",
    how: "Repeat a complete preparation-and-fit route for +1, +7 and +14 days. Pair exact dates, save the last roughly 20% and leave a horizon-sized gap. On the earlier inputs, learn comparable scales and four PCA directions, then fit ElasticNet to their coordinates. Project later and latest inputs through the saved scaler and directions before predicting. Each horizon has its own projection, model and measured test error.",
    why: "It lets you compare compact pattern inputs with direct original inputs at the same future dates. A compressed view may reduce redundancy, but a useful clue can also be hidden in a direction that PCA gives less priority.",
    archive:
      "The coursework version described same-day through seven-day forecasting, used database inference reads and could sample missing inputs. This entry instead uses fixed +1/+7/+14 endpoints and a complete immutable fixture. It documents its representation and dates instead of claiming every historical horizon was restored.",
    limitations:
      "PCA keeps large input variation, not necessarily the information each future target needs. The three estimates are separate endpoints, not a continuous daily forecast. A favorable compressed model at one horizon does not prove compression helps every horizon.",
    steps: [
      ["Create each date-pair task", "Use exact +1, +7 and +14-day outcomes."],
      [
        "Find four patterns per task",
        "Fit the input scale and PCA on earlier days only.",
      ],
      [
        "Learn one model per horizon",
        "Predict pain from the combined coordinates.",
      ],
      [
        "Reuse and compare the models",
        "Check saved-day errors without changing the projections.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 15,
    plainLanguage: {
      what: "This also builds separate models for one, seven and fourteen days ahead, but first summarizes the inputs into combined patterns. Each future date gets its own learned summary and prediction model. It helps demonstrate whether fewer coordinates preserve useful information for each timing question.",
      analogy:
        "Imagine making tomorrow’s, next week’s and next month’s plans from a compact dashboard rather than every raw measurement. A summary can make planning simpler, but might hide a small important clue. These endpoint bars come from distinct models, with their own later-period errors shown underneath.",
      uses: "Common uses: compressed forecasting, correlated sensor inputs, and horizon-by-horizon model comparisons.",
    },
    methodology: [
      [
        "The question",
        "Does a smaller summary of today’s inputs help predict three future pain endpoints? This workflow asks the same +1/+7/+14-day questions as direct ElasticNet forecasting, but each model sees four combined patterns rather than six original clues.",
      ],
      [
        "How the models learn",
        "Each horizon has exact input/target date pairs, an earlier roughly 80% learning period, a later 20% test and a gap matching its horizon. Scaling and PCA are fitted inside that earlier period. Its four directions summarize those learning inputs; the separate ElasticNet model then learns a pain estimate from their coordinates.",
      ],
      [
        "How to read the result",
        "The bars show three current-input point estimates, while the table measures each model’s saved-day errors. RMSE is a pain-scale error summary; the mean baseline is the simpler earlier-average guess to compare with. The models have their own sample sizes and fitted views, so a score at one endpoint should not stand in for another.",
      ],
      [
        "What that tells us",
        "Compare each horizon with direct ElasticNet on the same seed. A compressed representation can help, do nothing or lose signal. The connecting presentation does not supply daily estimates between endpoints or a validated uncertainty range.",
      ],
    ],
  },
  {
    id: "event-horizons",
    title: "3 / 7 / 14-day event classifiers",
    short: "Event classifiers · horizons",
    group: "Forecasting",
    icon: "σ",
    handler: "runFlareWindows",
    type: "event-horizon",
    description:
      "Compare the chance of a stated yes-or-no outcome on three particular future dates.",
    evaluation:
      "The bars are probabilities for the latest input row. The table checks each model on different later examples. Accuracy measures yes/no choices at 0.5; Brier score measures probability error, with confident wrong answers costing more. Precision and recall are in the downloadable results. A common class can make accuracy look good even when probability quality is weak.",
    purpose:
      "These models estimate the probability of a precisely defined event at three future dates. Here, the event is simulated pain reaching five exactly three, seven or fourteen days ahead. Each date has a separate classifier; this is not the probability of any event during the whole interval.",
    math: "yₜ,ₕ = 1[pain(t+h) ≥ 5],  h ∈ {3,7,14}\npₜ,ₕ = sigmoid(bₕ + PCA(xₜ)·βₕ)",
    mathNote:
      "For each h of 3, 7 or 14, the label is one when pain exactly at t+h reaches five. The sigmoid turns a weighted PCA score into that label’s probability. “At that endpoint” is different from “any time before that endpoint.” Four components and the classifier are fitted separately for each horizon.",
    how: "Create an exact calendar-paired binary task for each future endpoint. Save later days, leave a horizon-sized boundary gap, and fit the input scale and four PCA directions on earlier rows only. Learn a logistic model with an L1 weight cost of 0.04, then return current probabilities plus saved-day scores for each task. The class decision uses 0.5; the probability bars remain the actual model estimates.",
    why: "It shows why time horizons and event definitions need to be stated before evaluating a probability model. The same input row can receive different probabilities for three different questions, and each needs its own fair test.",
    archive:
      "The last archived flare workflow used direct inputs and evaluated its fit on learning rows. This direct demonstration uses PCA, exact endpoint labels and separate later tests. These choices are explicit changes, rather than a claim that the historical model already had valid clinical or saved-day performance.",
    limitations:
      "The arbitrary pain threshold is a simulated class, not a validated Crohn’s flare event. A probability can be poorly calibrated even when class decisions look reasonable. Uneven classes and limited longer-horizon input signal can also make comparisons misleading.",
    steps: [
      [
        "State three exact outcomes",
        "Pain reaches five at +3, +7 or +14 days.",
      ],
      ["Keep later examples separate", "Leave a gap matching each horizon."],
      [
        "Summarize, then classify",
        "Fit four PCA patterns and a sparse probability model.",
      ],
      [
        "Check each question’s answers",
        "Compare endpoint probabilities and saved-day scores.",
      ],
    ],
    source: [
      "Logistic regression",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html",
    ],
    number: 16,
    plainLanguage: {
      what: "These models estimate the probability of a precisely defined event at three future dates. Here, the event is simulated pain reaching five exactly three, seven or fourteen days ahead. Each date has a separate classifier; this is not the probability of any event during the whole interval.",
      analogy:
        "Think of asking whether a machine will be above a threshold on three particular inspection dates. The questions share clues but have different future answers. This version summarizes the inputs with PCA before learning each probability, and checks the models against later synthetic labels.",
      uses: "Common uses: scheduled threshold checks, endpoint classification, and comparing prediction horizons.",
    },
    methodology: [
      [
        "The question",
        "What is the model’s probability that simulated pain reaches five exactly three, seven or fourteen days later? Each endpoint has its own yes/no labels. These are not “any event in the next window” labels and are not clinical flare-risk definitions.",
      ],
      [
        "How the models learn",
        "We form exact calendar pairs for each endpoint and exclude incomplete future labels. Earlier pairs provide roughly 80% of the examples; later pairs are saved, with a gap equal to the horizon. Each learning period supplies its own input scale, four PCA directions and sparse logistic model.",
      ],
      [
        "How to read the result",
        "The bars are probabilities for the latest input row. The table checks each model on different later examples. Accuracy measures yes/no choices at 0.5; Brier score measures probability error, with confident wrong answers costing more. Precision and recall are in the downloadable results. A common class can make accuracy look good even when probability quality is weak.",
      ],
      [
        "What that tells us",
        "The horizons are separate tasks, so one cannot borrow another’s accuracy. Clear timing and a separate test make the demo interpretable, but do not establish calibrated medical probabilities or prove usefulness outside the simulator.",
      ],
    ],
  },
  {
    id: "autoregression",
    title: "Autoregressive forecast",
    short: "Autoregressive forecast",
    group: "Forecasting",
    icon: "↝",
    handler: "runAutoregressive",
    type: "recursive",
    description:
      "Use recent history to continue a series, then see what happens when guesses become inputs.",
    evaluation:
      "The reported RMSE, R² and mean-baseline error belong to the one-step saved-day test. RMSE is in pain-scale points, with lower better. The chart instead shows 28 observed synthetic days followed by the final model’s 14 recursive future steps. After observations end, guessed values enter later lag rows, and outputs are bounded to 0–10.",
    purpose:
      "An autoregressive forecast predicts a series from its own previous values. This model uses recent days, a weekly lag, a trend and repeating weekly features. After the observed history ends, each predicted value can help produce the next one, creating a fourteen-day simulated future path.",
    math: "ŷₜ = b + β₁yₜ₋₁ + β₂yₜ₋₂ + β₃yₜ₋₃ + β₇yₜ₋₇\n      + βtrend·t + βsin·sin(2πt/7) + βcos·cos(2πt/7)",
    mathNote:
      "The model combines pain from 1, 2, 3 and 7 days earlier with a time trend and sine/cosine terms for a weekly rhythm. The weights are fitted by ElasticNet. Unlike a full ARIMA model, it has no differencing step or moving-average error term; “autoregressive” accurately describes its use of previous values.",
    how: "Require consecutive pain observations and turn each day into a row of lagged clues. Fit an ElasticNet model on the first 80% and test one-step predictions on the last 20%, using observed previous pain. After saving those scores, refit on all observed rows. Starting at the last date, produce 14 future steps, feeding predictions back as needed and bounding each to 0–10. The future path and earlier test therefore have different roles.",
    why: "It demonstrates a common time-series idea: the history of a quantity can help predict its next value. Recursion makes its limits visible because later steps rely increasingly on earlier guesses rather than fresh observations.",
    archive:
      "The old file was named ArimaForecasting, but actually fitted autoregressive ElasticNet features and added heuristic ranges. The direct version uses an accurate name, adds explicit weekly sine/cosine clues, and does not display those heuristic ranges as proven prediction intervals.",
    limitations:
      "One-step error measured with real observed lags does not measure a whole 14-step recursive path. Mistakes can compound, and clamping predictions to 0–10 only limits the values; it does not establish their accuracy or provide uncertainty.",
    steps: [
      [
        "Turn history into clues",
        "Use pain lags 1, 2, 3 and 7 plus weekly timing.",
      ],
      [
        "Check one step at a time",
        "Predict saved days from observed earlier values.",
      ],
      [
        "Refit using observed history",
        "Do this only after recording the separate test scores.",
      ],
      [
        "Pass guesses forward",
        "Generate 14 future steps using predicted lags.",
      ],
    ],
    source: [
      "What an ARIMA model includes",
      "https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html",
    ],
    number: 17,
    plainLanguage: {
      what: "An autoregressive forecast predicts a series from its own previous values. This model uses recent days, a weekly lag, a trend and repeating weekly features. After the observed history ends, each predicted value can help produce the next one, creating a fourteen-day simulated future path.",
      analogy:
        "Think of continuing a melody by listening to the notes just played. Once you start inventing notes, those invented notes guide what comes next. Mistakes can accumulate. The mint line is observed synthetic history; violet is the recursively generated future, not newly observed data.",
      uses: "Common uses: time-series forecasting, demand or sensor history, and studying recursive error.",
    },
    methodology: [
      [
        "The question",
        "Can earlier pain values help estimate the next value, and what happens if the model continues beyond the observed history? This is autoregressive regression with recent and weekly lags, a trend and a repeating weekly pattern, not a full ARIMA fit.",
      ],
      [
        "How the model learns",
        "Consecutive observations create lag rows after the first seven days. Earlier 80% rows teach ElasticNet; later 20% are saved for one-step tests. For every test row, the lag clues are observed history. Once these test scores are recorded, a separate final model is fitted to all observed lag rows.",
      ],
      [
        "How to read the result",
        "The reported RMSE, R² and mean-baseline error belong to the one-step saved-day test. RMSE is in pain-scale points, with lower better. The chart instead shows 28 observed synthetic days followed by the final model’s 14 recursive future steps. After observations end, guessed values enter later lag rows, and outputs are bounded to 0–10.",
      ],
      [
        "What that tells us",
        "The one-step score cannot be presented as measured accuracy of the entire future path. A smooth continuation may simply reflect the model’s own dynamics. No calibrated prediction range is claimed, and a bound on values is not a bound on error.",
      ],
    ],
  },
  {
    id: "pca-cascade",
    title: "PCA multivariate cascade",
    short: "PCA cascade",
    group: "Forecasting",
    icon: "⇢",
    handler: "runPcaCascade",
    type: "cascade",
    description:
      "Summarize a whole simulated state, predict the next one, and pass that state forward.",
    evaluation:
      "The table reports one-step RMSE for each field, compared with its earlier-period mean guess. Pain error is in pain-scale units; other errors use their own raw units. The chart shows recursively generated pain and rescales each feature trace to 0–10 using its observed range, allowing shapes to be compared. Downloaded values remain unscaled.",
    variant: true,
    purpose:
      "A cascade predicts several connected quantities, then passes those predictions forward together. This one first summarizes the previous state with PCA, and predicts the next simulated pain plus six inputs. Repeating that process creates seven future steps from a compact representation of the whole state.",
    math: "sₜ = [painₜ, six inputsₜ]\nŝₜ₊₁,j = fⱼ(PCA(sₜ));  ŝₜ₊₂ = f(PCA(ŝₜ₊₁))",
    mathNote:
      "A state s contains pain and six generated inputs. PCA compresses the previous state to four coordinates, and a separate model fⱼ predicts each next field. On later recursive steps the input is the previously predicted state, not another observed day. That is how uncertainty and mistakes can spread across the cascade.",
    how: "Build consecutive pairs of seven-field states. Fit means, spreads and four PCA directions using the earlier 80% of predecessor states. Train seven ElasticNet models, one per next field, and check them on later pairs using observed predecessors. Then start at the last observed state and apply the same models seven times, clipping each field to its observed range after every step. The chart normalizes input traces only for display.",
    why: "It shows how a compressed representation can drive a multivariate simulation. Comparing this with the direct symptom cascade separates two choices: what the state contains and whether a smaller representation is used to predict it.",
    archive:
      "The archived PCA cascade used a larger eight-symptom representation and different score composition. This direct variant states a seven-field state of pain plus six demo inputs. It preserves the recursive multivariate idea while making the simpler state and numerical route explicit.",
    limitations:
      "Future exposure clues are model-generated, not known future behavior. Many fixture inputs are random, so predicting them recursively can settle into smooth but unrealistic paths. Observed-range clipping helps control drift without validating the simulation.",
    steps: [
      ["Describe the whole state", "Include pain and six generated inputs."],
      [
        "Find four shared state patterns",
        "Learn scaling and PCA on earlier predecessor states.",
      ],
      [
        "Predict each next field",
        "Fit and check one model for every state quantity.",
      ],
      [
        "Pass the predicted state forward",
        "Repeat seven times, with bounds on each field.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 18,
    plainLanguage: {
      what: "A cascade predicts several connected quantities, then passes those predictions forward together. This one first summarizes the previous state with PCA, and predicts the next simulated pain plus six inputs. Repeating that process creates seven future steps from a compact representation of the whole state.",
      analogy:
        "Imagine a relay team passing a sketch of the situation between runners. Each runner draws the next sketch from the one received; small inaccuracies can grow. The chart shows predicted state trajectories, with input lines rescaled for comparison. PCA changes the sketch’s representation, not the future’s certainty.",
      uses: "Common uses: multivariate simulation, compressed state prediction, and exploring interacting forecast errors.",
    },
    methodology: [
      [
        "The question",
        "Can a compact summary of today’s entire simulated state predict tomorrow’s state, and what trajectory appears when predicted states are passed forward? The seven fields are pain plus six generated inputs, not a larger clinical symptom vector.",
      ],
      [
        "How the models learn",
        "Consecutive adjacent states create predecessor/next-state examples. The first 80% supply scaling, four PCA directions and seven ElasticNet models, one for each next field. The last 20% are saved for one-step tests using their observed predecessor state. The seven-step future starts from the final observed state using those fitted models.",
      ],
      [
        "How to read the result",
        "The table reports one-step RMSE for each field, compared with its earlier-period mean guess. Pain error is in pain-scale units; other errors use their own raw units. The chart shows recursively generated pain and rescales each feature trace to 0–10 using its observed range, allowing shapes to be compared. Downloaded values remain unscaled.",
      ],
      [
        "What that tells us",
        "One-step checks do not measure the whole seven-step trajectory. Inputs predicted on earlier steps can propagate mistakes, and observed-range clipping can make an unstable guess look orderly. These are simulated state dynamics, not known future exposures.",
      ],
    ],
  },
  {
    id: "score-cascade",
    title: "Autoregressive demo score cascade",
    short: "Demo score cascade",
    group: "Forecasting",
    icon: "⇢",
    handler: "runScoreCascade",
    type: "cascade",
    description:
      "Follow one displayed outcome from a model that predicts a larger state behind it.",
    evaluation:
      "The visible line is simulated pain, not a composite medical score. The returned evaluation table still includes one-step errors for every internal field. RMSE describes misses in each field’s units, and the baseline is always predicting that field’s earlier mean. Those checks use observed predecessor states, while the future line uses increasingly predicted states.",
    variant: true,
    purpose:
      "This is a simplified view of a multivariate cascade: several quantities are predicted internally, but only the simulated pain outcome is displayed. The full predicted state still becomes the input for the next step. The word score here names that single output, not a clinical health formula.",
    math: "ŝₜ₊₁ = f(sₜ)\nDisplay ŝₜ₊ₕ,pain for h = 1…7",
    mathNote:
      "The model still predicts all seven state fields. This variant displays only the pain coordinate at steps 1 through 7; “score” is a historical name for that scalar demo view. It is not a different clinical scoring formula. The next state comes from ElasticNet models on the original state fields, without PCA.",
    how: "Use earlier adjacent-state pairs to fit one standardized ElasticNet model per field. Check each model on later observed predecessor states, then begin recursion from the final state. Every predicted state is clipped to its fields’ observed ranges and fed into the next step. This handler omits the six feature trajectories from its returned future rows, while retaining the same internal dynamics as the symptom cascade.",
    why: "A single line can make recursive behavior easier to follow than seven simultaneous traces. Keeping this variant selectable preserves the coursework’s scalar-output idea while being honest that it shares its underlying state models with another entry.",
    archive:
      "The earlier health-score cascade relied on a historical HealthScoring composition. This direct demonstration replaces that with explicitly simulated pain and hides the other predicted fields in its output view. It does not claim to restore a separate validated health-score algorithm.",
    limitations:
      "A simpler display does not make the internal system simpler or more accurate. Hidden input predictions still affect later pain guesses. The line can converge smoothly because of the model and clipping, even when actual future observations would not follow it.",
    steps: [
      [
        "Build seven-field examples",
        "Use observed adjacent states as learning pairs.",
      ],
      [
        "Learn each field’s next value",
        "Fit models directly, without a PCA summary.",
      ],
      [
        "Pass the full state forward",
        "Predict and bound every internal field each step.",
      ],
      [
        "Display the pain line only",
        "Keep one readable output without changing the mechanics.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 19,
    plainLanguage: {
      what: "This is a simplified view of a multivariate cascade: several quantities are predicted internally, but only the simulated pain outcome is displayed. The full predicted state still becomes the input for the next step. The word score here names that single output, not a clinical health formula.",
      analogy:
        "Think of a game simulation that tracks many moving pieces while showing one score on screen. Hidden state still affects the next turn. This variant helps you follow one recursive line without the other traces, while preserving the same seven-field mechanics as the symptom cascade.",
      uses: "Common uses: simplified simulation dashboards, scalar views of multivariate models, and recursive forecasting.",
    },
    methodology: [
      [
        "The question",
        "What does the recursive system look like when we show only its pain output? This is a scalar view of the same seven-field direct cascade used by the symptom variant. Its hidden field predictions still matter at every later step.",
      ],
      [
        "How the models learn",
        "The earlier 80% of adjacent-state pairs teach one ElasticNet regressor per field; the later 20% test one-step predictions from observed predecessors. No PCA is used. Starting from the last observed state, the fitted models predict and bound all seven quantities repeatedly, but this result returns only pain along the seven-step future path.",
      ],
      [
        "How to read the result",
        "The visible line is simulated pain, not a composite medical score. The returned evaluation table still includes one-step errors for every internal field. RMSE describes misses in each field’s units, and the baseline is always predicting that field’s earlier mean. Those checks use observed predecessor states, while the future line uses increasingly predicted states.",
      ],
      [
        "What that tells us",
        "Displaying fewer quantities improves readability, not validation. Compare with the symptom cascade on the same seed to see the shared mechanics. One-step error does not establish the full future path’s accuracy or remove error propagation from hidden fields.",
      ],
    ],
  },
  {
    id: "symptom-cascade",
    title: "Autoregressive symptom cascade",
    short: "Symptom cascade",
    group: "Forecasting",
    icon: "⇢",
    handler: "runSymptomCascade",
    type: "cascade",
    description:
      "Predict several quantities together, then let each guessed state guide the next step.",
    evaluation:
      "Violet represents simulated pain. Other traces are each rescaled to 0–10 from their observed ranges solely to compare motion; the downloaded feature values stay in their original units. The table’s RMSE values also retain original units and compare with simple earlier-period means. They evaluate one-step predictions, not the seven-step plotted path.",
    variant: true,
    purpose:
      "This cascade predicts an entire next state directly from the current state: simulated pain and six generated inputs. It fits a separate model for every field, without PCA, then feeds the predicted state back seven times. It lets you compare direct state modeling with the compressed PCA variant.",
    math: "ŝₜ₊₁,j = bⱼ + sₜ·βⱼ,  j = 1…7\nŝₜ₊₂ = f(ŝₜ₊₁)",
    mathNote:
      "Each next field j has its own weighted model of the previous seven-field state. The second future step uses the first predicted state, and so on. Unlike the PCA variant, the models receive the original state fields directly. Standardizing those fields makes their units comparable without replacing them with combined directions.",
    how: "Pair consecutive states containing pain and six generated inputs. Fit one ElasticNet regressor per next field on the earlier 80% of pairs and evaluate on the later 20% using observed predecessor states. From the last state, apply all fitted models seven times; after each step, clamp every field to its observed range. The plot uses a common 0–10 visual scale for feature traces, but returned features keep their raw values.",
    why: "It makes coupled recursive prediction visible without a dimension-reduction stage. Comparing its trajectory and one-step errors with the PCA cascade helps isolate what changes when we compress the previous state first.",
    archive:
      "The older symptom-cascade variant used a wider symptom vector. This direct version documents its seven state fields and performs no hidden composite-health-score calculation. Its direct state representation differs from the retained PCA cascade variant.",
    limitations:
      "Later steps inherit guesses for every field, including largely random synthetic exposures. A good one-step pain score can coexist with weak input predictions and a poor multi-step trajectory. Display normalization is only a chart aid, not a numerical accuracy adjustment.",
    steps: [
      [
        "Pair today’s state with tomorrow’s",
        "Use pain plus the six generated inputs.",
      ],
      [
        "Learn one model for each quantity",
        "Keep the original state fields, with comparable scales.",
      ],
      [
        "Check each next-step prediction",
        "Use later examples with observed predecessor states.",
      ],
      [
        "Run the state forward seven times",
        "Feed each bounded predicted state into the next step.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 20,
    plainLanguage: {
      what: "This cascade predicts an entire next state directly from the current state: simulated pain and six generated inputs. It fits a separate model for every field, without PCA, then feeds the predicted state back seven times. It lets you compare direct state modeling with the compressed PCA variant.",
      analogy:
        "Imagine moving a board game forward by estimating every piece’s next position, then using that guessed board for the following turn. An early mistake can affect several later moves. The lines show those model dynamics; feature traces are rescaled only so their shapes fit the same chart.",
      uses: "Common uses: multivariate simulations, coupled forecasts, and comparing compressed versus direct state models.",
    },
    methodology: [
      [
        "The question",
        "How does a directly modeled seven-field state evolve when predictions become the next inputs? Unlike PCA cascade, this entry uses the original pain and feature fields rather than four combined patterns, letting you compare the effect of compression.",
      ],
      [
        "How the models learn",
        "Each consecutive day supplies a predecessor state and next state. The earlier 80% of pairs teach seven standardized ElasticNet models, one per output field. The later 20% provide one-step tests using observed predecessor states. From the final observed state, the same fitted models create seven future states, each bounded to observed field ranges.",
      ],
      [
        "How to read the result",
        "Violet represents simulated pain. Other traces are each rescaled to 0–10 from their observed ranges solely to compare motion; the downloaded feature values stay in their original units. The table’s RMSE values also retain original units and compare with simple earlier-period means. They evaluate one-step predictions, not the seven-step plotted path.",
      ],
      [
        "What that tells us",
        "Every field can contribute error to later states, so the smoothness of a line is not evidence of future accuracy. The random exposure inputs are especially uncertain. Compare the same seed with PCA cascade and the score-only display to understand representation and presentation choices.",
      ],
    ],
  },
  {
    id: "triggers",
    title: "Recorded trigger comparisons",
    short: "Trigger comparisons",
    group: "What-if & comparisons",
    icon: "↔",
    handler: "runTriggerAnalysis",
    type: "comparison",
    description:
      "Compare tomorrow’s average after days with a recorded clue and days without it.",
    evaluation:
      "A positive bar means the exposed group had higher mean pain the next day; a negative bar means lower mean pain. The number is a difference in simulated pain-scale points. It has no predictive test score, statistical interval or adjustment for other simultaneous inputs. Read the exposed and comparison counts alongside the magnitude.",
    purpose:
      "This compares average outcomes after days with a recorded exposure and days without it. It is a simple descriptive calculation rather than a trained predictor. Here, three generated indicators divide the exact next-day simulated pain observations into exposed and comparison groups, with both group sizes shown.",
    math: "Δ = mean(painₜ₊₁ | exposureₜ > 0) − mean(painₜ₊₁ | exposureₜ = 0)",
    mathNote:
      "Δ is the exposed group’s next-day average pain minus the unexposed comparison group’s next-day average. The groups are defined by whether today’s indicator is above zero. A positive difference means a higher exposed average in these records. It is a descriptive difference, not an isolated causal effect.",
    how: "Build exact one-day input/pain pairs. For dairy, spicy and caffeine, divide pairs into indicator-present and indicator-absent groups. Count both groups and subtract their average next-day pain values. If either group has no observations, the comparison stays null. Each row represents a dated fixture day, so duplicate meals do not create extra observations in this calculation.",
    why: "The result is easy to inspect without a fitted model: a clear difference with visible denominators. It helps connect the known simulator recipe with later model behavior, while keeping group comparisons distinct from learned coefficients.",
    archive:
      "The original trigger analysis explored more exposure types and several delays. This direct demonstration uses three stated binary indicators and a fixed next-calendar-day delay. It labels both group sizes instead of treating any small difference as a proven trigger effect.",
    limitations:
      "The groups can differ in other ways, so their average difference need not come from that indicator alone. Recording patterns, co-occurring inputs and chance can all matter. The historical word “trigger” does not turn the comparison into an intervention estimate.",
    steps: [
      ["Match inputs with next-day pain", "Use exact complete calendar pairs."],
      [
        "Separate present and absent days",
        "Make two groups for each indicator.",
      ],
      [
        "Compare their averages",
        "Subtract the comparison mean from the exposed mean.",
      ],
      [
        "Read the group sizes too",
        "A difference needs its denominators for context.",
      ],
    ],
    source: [
      "Pearson correlation",
      "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html",
    ],
    number: 21,
    plainLanguage: {
      what: "This compares average outcomes after days with a recorded exposure and days without it. It is a simple descriptive calculation rather than a trained predictor. Here, three generated indicators divide the exact next-day simulated pain observations into exposed and comparison groups, with both group sizes shown.",
      analogy:
        "Think of comparing average queue length on days with and without a special promotion. A difference is worth inspecting, but other things might also differ between those days. The bars show the exposed mean minus the comparison mean; they do not isolate a real intervention’s effect.",
      uses: "Common uses: exploratory group comparisons, checking recorded associations, and understanding model inputs.",
    },
    methodology: [
      [
        "The question",
        "Is average next-day simulated pain different after generated days with dairy, spicy or caffeine indicators? This asks about recorded group averages. No weight-fitting solver is involved, and the historical trigger name should not be mistaken for a causal conclusion.",
      ],
      [
        "What data is used",
        "All complete exact one-day pairs in the fixture are considered. For each indicator, today’s row is put into either the present or absent group. Counts refer to dated rows, not individual food items. Both group sizes are returned, and an empty group leaves the difference undefined.",
      ],
      [
        "How to read the result",
        "A positive bar means the exposed group had higher mean pain the next day; a negative bar means lower mean pain. The number is a difference in simulated pain-scale points. It has no predictive test score, statistical interval or adjustment for other simultaneous inputs. Read the exposed and comparison counts alongside the magnitude.",
      ],
      [
        "What that tells us",
        "This is an understandable descriptive baseline for the simulator. Other inputs and timing could explain a real-world group difference, so the chart does not identify a dietary or medication intervention effect. Compare it with model coefficients as a different kind of summary, not interchangeable evidence.",
      ],
    ],
  },
  {
    id: "scenario-generation",
    title: "Hypothetical scenario generation",
    short: "Generate scenarios",
    group: "What-if & comparisons",
    icon: "◇",
    handler: "runScenarioGeneration",
    type: "scenario-generation",
    description:
      "Choose a shortlist of what-if input changes before calculating their outcomes.",
    evaluation:
      "The bars are the actual recorded correlations used in selection, not predicted pain changes. The table states each case’s input bounds. Positive and negative associations can both enter the shortlist because the rule uses strength regardless of sign. No classifier, forecast score or held-out causal experiment is attached to this selection.",
    purpose:
      "Scenario generation chooses which hypothetical input changes to inspect before a model calculates their outcomes. This version ranks the recorded next-day associations, takes the three strongest by magnitude, and declares a low and high value for each selected input. It creates cases, not recommendations or predictions.",
    math: "Select top 3 inputs by |r(inputₜ, painₜ₊₁)|\nCreate low/high values for each selected input",
    mathNote:
      "The selection rule ranks absolute Pearson correlations, so either a positive or negative recorded association can be chosen. It takes the top three and declares low = 0. High is 10 for energy and 1 for other inputs. These bounds are stated example settings, not optimized recommendations or full observed-range summaries.",
    how: "Run the exact one-day correlation comparison for all six inputs. Leave out undefined correlations, sort the remaining ones by absolute size, and select three. For each, return its name, recorded association and declared low/high values. No regression model is fitted or scenario outcome predicted here; the separate execution handler takes these cases further.",
    why: "It makes scenario setup inspectable rather than hiding which inputs were changed. Separating setup from execution is useful when comparing models: the same explicit cases can be applied without silently changing the questions between runs.",
    archive:
      "The engine-era generator could produce a richer collection of scenario variations. This direct demonstration uses one concise rule for choosing three inputs and states every case’s bounds. It preserves hypothetical-case construction without the surrounding engine lifecycle.",
    limitations:
      "Choosing the largest recorded associations can favor chance patterns. Fixed bounds can explore values that do not represent realistic combined behavior. Selecting a feature for inspection does not recommend changing it or estimate any causal benefit.",
    steps: [
      [
        "Compare recorded associations",
        "Match today’s inputs with next-day pain.",
      ],
      [
        "Rank both positive and negative clues",
        "Use the absolute size of each correlation.",
      ],
      [
        "Choose three controls to inspect",
        "Keep each input name and recorded association.",
      ],
      [
        "Declare two settings per control",
        "Create low/high cases for the execution workflow.",
      ],
    ],
    source: [
      "Pearson correlation",
      "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html",
    ],
    number: 22,
    plainLanguage: {
      what: "Scenario generation chooses which hypothetical input changes to inspect before a model calculates their outcomes. This version ranks the recorded next-day associations, takes the three strongest by magnitude, and declares a low and high value for each selected input. It creates cases, not recommendations or predictions.",
      analogy:
        "Imagine making a shortlist of knobs to try on a sound mixer. You choose the interesting controls and mark two settings, but have not yet listened to the result. This workflow prepares those settings; the separate execution workflow applies them to a fitted prediction model.",
      uses: "Common uses: simulation setup, sensitivity exploration, and making model comparisons reproducible.",
    },
    methodology: [
      [
        "The question",
        "Which three inputs should a small what-if demonstration inspect, and what values should it try? This is preparation for a model comparison, not the comparison’s predicted answer. Keeping the two steps separate makes the hypothetical questions visible.",
      ],
      [
        "How cases are chosen",
        "Use all complete one-day pairs to calculate each input’s Pearson association with next-day simulated pain. Remove undefined values and rank the rest by absolute magnitude, retaining the top three. Each chosen field gets low zero and a declared high: ten for energy, one for the other inputs.",
      ],
      [
        "How to read the result",
        "The bars are the actual recorded correlations used in selection, not predicted pain changes. The table states each case’s input bounds. Positive and negative associations can both enter the shortlist because the rule uses strength regardless of sign. No classifier, forecast score or held-out causal experiment is attached to this selection.",
      ],
      [
        "What that tells us",
        "The cases are a reproducible way to probe a model, not evidence that those changes should be made in life. Open execution on the same seed to see their separately calculated outcomes. Selection based on large observed associations can also elevate coincidental patterns.",
      ],
    ],
  },
  {
    id: "scenario-execution",
    title: "Hypothetical scenario execution",
    short: "Execute scenarios",
    group: "What-if & comparisons",
    icon: "◇",
    handler: "runScenarioExecution",
    type: "scenario-execution",
    description:
      "Change one model input at a time and compare the answers it produces.",
    evaluation:
      "Mint and violet bars are the low-input and high-input predictions. Their difference shows how this particular fitted model responds under those fixed conditions. Unlike the main regression demos, these comparisons do not have a reserved scenario test period; the model uses all available pairs. The input bounds and prediction differences stay visible in the table.",
    purpose:
      "Scenario execution applies declared hypothetical cases to a fitted model and compares its answers. Here, it copies the latest input row, changes one chosen clue to its low or high setting, and holds the other clues fixed. The paired bars show actual computed model predictions for those copies.",
    math: "Δmodel = f(xbase with xⱼ = high) − f(xbase with xⱼ = low)",
    mathNote:
      "f is the fitted ElasticNet prediction function. Make two copies of the same latest input row, put one selected input at its declared low or high value, and subtract the predictions. This measures model sensitivity while five other fields stay fixed. It is not an observed effect of changing a real behavior.",
    how: "Fit ElasticNet using all complete one-day input/pain pairs, rather than reserving a separate scenario test. Reuse the three cases from scenario generation. For each selected field, copy the last fixture row twice, change only that field to low/high, and predict both rows. Return those estimates and their difference with the exact case settings. The original snapshot is unchanged.",
    why: "It offers a controlled way to inspect what a model does with its inputs. Paired predictions can explain sensitivity more directly than a single current prediction, while the fixed baseline makes the comparison repeatable.",
    archive:
      "The historical engine supported richer generated-scenario execution. This direct route uses one explicit latest-row baseline and one changed field at a time. It returns numerical model responses directly and does not treat them as observed outcomes from an experiment.",
    limitations:
      "Holding other clues fixed can create combinations that never occur naturally. A fitted association does not estimate the result of a real food or medication intervention. These hypothetical comparisons have no separate scenario holdout or causal validation.",
    steps: [
      ["Fit a next-day demo model", "Use all complete input/target pairs."],
      ["Copy the latest input row", "Keep one explicit starting point."],
      [
        "Change one control at a time",
        "Compare low and high while other fields stay fixed.",
      ],
      [
        "Inspect the paired answers",
        "Read model response, not an intervention outcome.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 23,
    plainLanguage: {
      what: "Scenario execution applies declared hypothetical cases to a fitted model and compares its answers. Here, it copies the latest input row, changes one chosen clue to its low or high setting, and holds the other clues fixed. The paired bars show actual computed model predictions for those copies.",
      analogy:
        "Think of changing one knob on a sound mixer while leaving every other knob alone, then comparing the outputs. This reveals how that particular model responds. It does not prove that changing the corresponding real-world behavior would produce the predicted outcome, especially for unrealistic input combinations.",
      uses: "Common uses: sensitivity analysis, model explanation, and controlled what-if simulation.",
    },
    methodology: [
      [
        "The question",
        "How does this fitted model’s next-day answer change when one declared input changes and the other five stay fixed? This is a sensitivity experiment on a model, not a randomized experiment on a person or a new set of observed outcomes.",
      ],
      [
        "How comparisons are built",
        "Fit one ElasticNet regressor on all complete one-day fixture pairs. Use the latest generated row as the common starting point. The separate scenario generator picks three inputs and declares their low/high values. For each case, copy that row twice, change just the selected field, and calculate both predictions without altering the source data.",
      ],
      [
        "How to read the result",
        "Mint and violet bars are the low-input and high-input predictions. Their difference shows how this particular fitted model responds under those fixed conditions. Unlike the main regression demos, these comparisons do not have a reserved scenario test period; the model uses all available pairs. The input bounds and prediction differences stay visible in the table.",
      ],
      [
        "What that tells us",
        "This can explain model behavior and expose assumptions. It does not establish what would happen after a real intervention, especially when the copied input combination is unrealistic. Association, model sensitivity and causal effect are different questions.",
      ],
    ],
  },
];
