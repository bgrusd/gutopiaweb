/* Editorial companion to the exact demo kernels. Every entry maps to a real direct handler. */
window.GutopiaCatalog = (() => {
  const supervised =
    "Predictor dates are paired with their exact future calendar endpoint. Roughly 80% of pairs form the earlier training period; a gap the size of the forecast horizon separates it from the last 20% holdout. Scaling and any PCA are fitted only on training predictors. Regression reports RMSE, R² and a training-mean baseline; classification reports accuracy, precision, recall and Brier score at a 0.5 decision threshold.";
  const descriptive =
    "This is a descriptive calculation on all 150 synthetic rows, not a supervised train/test accuracy experiment. Its numerical properties can be checked against known structures, but an attractive plot does not establish a meaningful health outcome.";
  const sources = {
    lasso: [
      "LASSO objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Lasso.html",
    ],
    elastic: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    logistic: [
      "Logistic regression",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html",
    ],
    pca: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    bayes: [
      "Naive Bayes families",
      "https://scikit-learn.org/stable/modules/naive_bayes.html",
    ],
    cluster: [
      "Clustering methods",
      "https://scikit-learn.org/stable/modules/clustering.html",
    ],
    dtw: [
      "DTW recurrence and use",
      "https://dtaidistance.readthedocs.io/en/latest/usage/dtw.html",
    ],
    correlation: [
      "Pearson correlation",
      "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html",
    ],
    ar: [
      "What an ARIMA model includes",
      "https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html",
    ],
  };
  const entry = (
    id,
    title,
    short,
    group,
    icon,
    handler,
    type,
    description,
    detail,
  ) => ({
    id,
    title,
    short,
    group,
    icon,
    handler,
    type,
    description,
    evaluation: supervised,
    ...detail,
  });
  return [
    entry(
      "lasso",
      "LASSO regression",
      "LASSO",
      "Regression",
      "∑",
      "runLasso",
      "regression",
      "A simple weighted sum, with a penalty that lets unnecessary inputs fall away.",
      {
        purpose:
          "Can a sparse linear model recover a planted relationship? LASSO predicts next-day simulated pain from six present-day inputs and uses L1 shrinkage to favor a smaller set of coefficients.",
        math: "min β,b  (1 / 2n) Σ(yᵢ − b − xᵢ·β)² + λ Σ|βⱼ|",
        mathNote:
          "The loss is half the mean squared error. The intercept b is not penalized; λ = 0.04. Inputs are standardized using training means and population standard deviations.",
        how: "The handwritten coordinate-descent solver updates one coefficient at a time with soft thresholding. It stops when the maximum change is below 1e−8 or after 300 sweeps. Zero-variance inputs use a scale of one. Returned coefficients refer to standardized input units.",
        why: "This is a compact demonstration of optimization, regularization and feature selection. The synthetic generator deliberately uses dairy, spicy, fiber and medication inputs, giving us a known mechanism to compare with the fit.",
        archive:
          "The coursework wrapper supported tag, medication and lag features and often targeted a composite health score. This direct demo instead uses a fixed six-feature snapshot and next-day simulated pain, with a separate chronological holdout.",
        limitations:
          "A nonzero coefficient is a model association, not a causal food trigger. Correlated predictors can trade coefficients. Recovering this generator says nothing about whether those relationships apply to a person.",
        steps: [
          ["Pair dates", "Today’s six inputs → tomorrow’s simulated pain."],
          ["Train + scale", "Earlier rows only; leave a one-day gap."],
          ["Shrink weights", "Coordinate descent with an L1 penalty."],
          ["Test later days", "Predict the holdout without refitting."],
        ],
        source: sources.lasso,
      },
    ),
    entry(
      "elastic-net",
      "ElasticNet regression",
      "ElasticNet",
      "Regression",
      "≈",
      "runElasticNet",
      "regression",
      "Sparse selection meets smoother shrinkage: a balance between L1 and L2.",
      {
        purpose:
          "Predict next-day simulated pain while balancing sparse selection with stability when features are correlated. ElasticNet keeps the same direct inputs as LASSO so their behavior can be compared.",
        math: "min β,b  MSE / 2 + λ [α Σ|βⱼ| + (1−α) Σβⱼ² / 2]",
        mathNote:
          "Here λ = 0.04 and α = l1Ratio = 0.5. LASSO is the α = 1 special case. These are the demo’s conventions, not interchangeable parameter names from every library.",
        how: "Coordinate descent applies a soft-threshold numerator for L1 and a shrinkage denominator for L2. Standardization is learned on training rows; the intercept is the training target mean. The solver is bounded to 300 sweeps with a 1e−8 coefficient-change tolerance.",
        why: "The pair of L1 and L2 penalties demonstrates a useful modeling tradeoff without needing a large orchestration engine. A held-out baseline makes the difference between fitting and learning visible.",
        archive:
          "The archive also used a handwritten ElasticNet solver, but with a broader feature extractor and inconsistent alpha naming across wrappers. The current objective is stated explicitly and the target is simulated pain.",
        limitations:
          "A regularized model can still be wrong. The penalty is a fixed demonstration setting, not a clinically tuned choice. Displayed coefficient magnitudes are in standardized units.",
        steps: [
          ["Pair dates", "Six inputs today, pain one day ahead."],
          ["Reserve holdout", "Chronological split and a one-day gap."],
          ["Balance penalties", "Half L1, half L2, with λ = 0.04."],
          ["Compare errors", "RMSE versus a constant training mean."],
        ],
        source: sources.elastic,
      },
    ),
    entry(
      "pca-lasso",
      "PCA + LASSO",
      "PCA + LASSO",
      "Regression",
      "↗",
      "runPcaLasso",
      "regression",
      "Compress the input space, then fit a sparse model on the components.",
      {
        purpose:
          "Show how unsupervised representation learning can feed supervised regression. The model predicts next-day simulated pain from principal-component scores rather than individual foods or energy values.",
        math: "Z = standardize(X) · V₄\nŷ = b + Z·β  with an L1 penalty on β",
        mathNote:
          "V₄ contains four training-fitted PCA directions. The regression solver standardizes those component inputs again before L1 fitting.",
        how: "Fit feature scaling and a Jacobi-eigenanalysis PCA only on training X. Reuse that exact transform for holdout and current inputs; fit coordinate-descent LASSO on the training component scores.",
        why: "This demonstrates model composition and leakage prevention. Compare its error with direct LASSO: compressing high variance is not guaranteed to preserve the useful predictive directions.",
        archive:
          "The archived wrapper had optional PCA and fallback branches. The direct handler explicitly uses four fitted components; the coefficients shown are PC weights, not raw food effects.",
        limitations:
          "A sparse component model does not select a sparse set of original foods. PCA may discard low-variance predictive structure; component loadings and regression weights answer different questions.",
        steps: [
          ["Scale training X", "Learn means and scales before projection."],
          ["Find four PCs", "Fit covariance eigenvectors on training only."],
          ["Fit LASSO", "Shrink weights in component space."],
          ["Project holdout", "Reuse the fitted transform for evaluation."],
        ],
        source: sources.pca,
      },
    ),
    entry(
      "logistic-lasso",
      "Logistic LASSO",
      "Logistic LASSO",
      "Classification",
      "σ",
      "runLogisticLasso",
      "classification",
      "Turn a linear score into a probability, while keeping the weights sparse.",
      {
        purpose:
          "Distinguish a numeric prediction from a binary class probability. The exact synthetic label is pain ≥ 5 one calendar day ahead. It is a threshold demonstration, not a clinical flare definition.",
        math: "p(y = 1 | x) = 1 / (1 + exp(−b − x·β))\nmin  mean binary cross-entropy + λ Σ|βⱼ|",
        mathNote:
          "Classification uses p ≥ 0.5. The workflow passes λ = 0.04; both training classes must be present.",
        how: "The pure JavaScript solver performs 400 proximal-gradient steps. A gradient step updates cross-entropy, then soft thresholding applies the L1 penalty; the intercept is unpenalized. Step size is 0.5 divided by feature count, with bounded sigmoid inputs.",
        why: "It makes probability, decision threshold, class balance and regularization tangible. The chart compares probabilities against the actual held-out synthetic class labels.",
        archive:
          "The original classifier also used handwritten proximal logistic LASSO, with different target mapping and trigger features. The replacement defines its binary target and reports held-out metrics explicitly.",
        limitations:
          "A sigmoid output is not automatically a calibrated probability. Accuracy alone can hide class imbalance. The pain threshold has no established clinical validity.",
        steps: [
          ["Define the label", "Next-day simulated pain ≥ 5."],
          ["Split in time", "Fit scaling on earlier inputs only."],
          ["Fit sigmoid + L1", "400 bounded proximal updates."],
          [
            "Evaluate probabilities",
            "Brier score and threshold-based metrics.",
          ],
        ],
        source: sources.logistic,
      },
    ),
    entry(
      "naive-bayes",
      "Bernoulli Naive Bayes",
      "Naive Bayes",
      "Classification",
      "P",
      "runNaiveBayes",
      "classification",
      "Combine simple feature likelihoods with a class prior in log space.",
      {
        purpose:
          "Offer a transparent probabilistic comparison with logistic regression. Six inputs are binarized relative to their training means, then used to classify the next-day synthetic pain threshold.",
        math: "P(c | x) ∝ P(c) ∏ⱼ P(xⱼ | c)\nP(xⱼ = 1 | c) = (onCount + 1) / (classCount + 2)",
        mathNote:
          "Class priors also use add-one smoothing. An input is “on” when it exceeds its training mean; inference sums log probabilities to avoid tiny products.",
        how: "Fit the six threshold values and each class’s smoothed on/off frequencies on training rows. Sum class log priors and conditional log likelihoods, then convert their difference into a two-class probability.",
        why: "This shows how a very small model can produce probabilistic outputs, and exposes the conditional-independence assumption rather than hiding it behind a complex pipeline.",
        archive:
          "The archived EnhancedNaiveBayes was a Bernoulli-style trigger-frequency classifier with five score bins. The direct demo keeps Bernoulli likelihoods but uses a binary pain target and training-derived thresholds. The optional Gaussian helper is not this menu entry.",
        limitations:
          "Features are rarely independent given the class. Binarization discards magnitude and the posterior can be overconfident. Neither smoothing nor a good simulated result establishes medical relevance.",
        steps: [
          ["Create threshold label", "Pain ≥ 5 one day ahead."],
          ["Binarize inputs", "Use training feature means as cutoffs."],
          ["Count + smooth", "Learn priors and on/off likelihoods."],
          ["Combine log scores", "Compute held-out class probabilities."],
        ],
        source: sources.bayes,
      },
    ),
    entry(
      "pca-logistic",
      "PCA + logistic LASSO",
      "PCA + logistic",
      "Classification",
      "σ",
      "runPcaLogistic",
      "classification",
      "Learn a binary decision from a smaller set of component directions.",
      {
        purpose:
          "Compare direct sparse classification with classification on a compressed representation. The target remains next-day simulated pain ≥ 5; PCA changes the representation, not the meaning of the label.",
        math: "Z = standardize(X) · V₄\np = sigmoid(b + Z·β), with L1 shrinkage",
        mathNote:
          "Scaling, four-component PCA and component standardization are fitted inside the training period. Class decisions use a 0.5 probability threshold.",
        how: "Compute a training-only PCA with covariance Jacobi rotations, project train/holdout/current inputs using the same fitted parameters, then train proximal-gradient logistic LASSO for 400 steps.",
        why: "This gives a concrete example of a multi-stage ML pipeline with no engine lifecycle. It also shows why unsupervised compression may help or hurt a classification task.",
        archive:
          "The historical PCALogisticLasso could skip PCA under some conditions and supported broader labels. The direct demonstration always projects this complete six-input fixture and reports component metadata.",
        limitations:
          "High variance need not mean useful discrimination. Component coefficients are not isolated food effects, and the sigmoid probabilities still require calibration evidence.",
        steps: [
          ["Fit training scaler", "Keep later observations out."],
          ["Project to four PCs", "Reuse the same fitted directions."],
          ["Fit sparse sigmoid", "L1-regularized binary model."],
          ["Score the holdout", "Probabilities and observed labels."],
        ],
        source: sources.pca,
      },
    ),
    entry(
      "three-day",
      "Three-day event classifier",
      "3-day classifier",
      "Classification",
      "3",
      "runFlareThreeDay",
      "classification",
      "An earlier variant, rebuilt with an explicit three-day endpoint label.",
      {
        variant: true,
        purpose:
          "Explore how changing the time horizon changes the prediction problem. This variant classifies whether simulated pain is ≥ 5 exactly three calendar days after the predictor date.",
        math: "yₜ = 1[pain(t + 3) ≥ 5]\npₜ = sigmoid(b + xₜ·β)",
        mathNote:
          "This is an endpoint event, not “any event during the next three days.” The holdout gap is three days; incomplete calendar pairs are excluded.",
        how: "Reuse the direct six-feature logistic-LASSO workflow with horizon = 3, λ = 0.04, chronological separation and training-only standardization. Both training classes are required.",
        why: "A short standalone workflow makes temporal target construction visible and preserves the earlier coursework variant as a selectable demonstration.",
        archive:
          "The earlier ThreeDayFlareLogisticLasso used a different three-tier target definition. The current variant deliberately uses one transparent binary endpoint rule; it is not a byte-for-byte restoration.",
        limitations:
          "The generator’s strongest planted exposure relationship is one day ahead, so longer horizons need not be predictable from today’s inputs. This threshold is not a validated flare event.",
        steps: [
          ["Pair t and t+3", "Require the exact calendar endpoint."],
          ["Build binary y", "Threshold simulated pain at five."],
          ["Train with a gap", "Exclude three pairs at the split."],
          ["Classify later dates", "Report held-out probabilities."],
        ],
        source: sources.logistic,
      },
    ),
    entry(
      "correlation",
      "Lagged correlation",
      "Correlation",
      "Patterns & structure",
      "ρ",
      "runCorrelation",
      "correlation",
      "Look for linear associations between today’s inputs and tomorrow’s outcome.",
      {
        purpose:
          "Make the planted one-day relationship visible before fitting a predictive model. Pearson correlations pair each current input with next-day simulated pain; a separate matrix shows correlations among inputs.",
        math: "r(x,y) = Σ(xᵢ−x̄)(yᵢ−ȳ) / √[Σ(xᵢ−x̄)² Σ(yᵢ−ȳ)²]",
        mathNote:
          "r lies between −1 and +1 for nonconstant complete vectors. A constant column returns an undefined/null association rather than a fabricated zero.",
        how: "Create exact date-aligned one-day supervised pairs, then compute Pearson correlations for each input against the outcome and each input pair. This handler performs no hypothesis test and returns no confidence interval.",
        why: "A clear descriptive baseline helps explain linear models and the dataset’s known mechanism. The heatmap makes redundant or independent inputs easy to inspect.",
        archive:
          "The archive explored broader symptom/trigger pairs and multiple lags. This streamlined handler has a stated one-day lag and a six-input matrix, with valid-pair counts.",
        limitations:
          "Correlation does not establish causation. Serial dependence and searching many features/lags complicate inference. The displayed coefficients are descriptive values, not statistically confirmed triggers.",
        evaluation:
          "There is no predictive holdout score here. The handler summarizes all exact one-day pairs in the supplied fixture, reports pair counts, and leaves constant-vector correlations undefined.",
        steps: [
          ["Match calendar dates", "Today’s inputs and tomorrow’s pain."],
          ["Center each series", "Subtract each vector’s mean."],
          ["Compute covariation", "Normalize by both vector lengths."],
          ["Inspect associations", "Compare the signs and input heatmap."],
        ],
        source: sources.correlation,
      },
    ),
    entry(
      "pca",
      "Principal component analysis",
      "PCA",
      "Patterns & structure",
      "⊕",
      "runPca",
      "scatter",
      "Six input dimensions become a few orthogonal directions of variation.",
      {
        purpose:
          "Summarize a multivariate dataset without using a target. PCA rotates standardized feature space; the first two component scores provide the plot, and three components are retained in the returned model.",
        math: "C = XᶜᵀXᶜ / (n−1)\nCvⱼ = λⱼvⱼ,   Z = XᶜV",
        mathNote:
          "C is the sample covariance matrix. Eigenvectors define directions; eigenvalues divided by total variance define explained-variance fractions. The six inputs are standardized first.",
        how: "The JavaScript kernel centers inputs, forms covariance and uses bounded Jacobi rotations until off-diagonal values are below 1e−10 or the rotation limit is reached. Components are sorted by descending eigenvalue.",
        why: "It shows dimensionality reduction as actual geometry. Component loadings reveal which inputs contribute to a direction; variance retention explains what compression keeps.",
        archive:
          "The coursework helper used power iteration with orthogonalization. The replacement uses Jacobi eigenanalysis. Both are PCA families, but the numerical method has changed deliberately.",
        limitations:
          "Explained variance is not predictive accuracy. Signs of components are arbitrary; nearly tied eigenvalues can rotate the displayed axes. A projection may hide important structure.",
        evaluation: descriptive,
        steps: [
          [
            "Standardize six inputs",
            "Put different units on comparable scales.",
          ],
          ["Form covariance", "Measure how inputs vary together."],
          [
            "Find principal directions",
            "Jacobi eigenanalysis, sorted by variance.",
          ],
          ["Project each day", "Display PC1 and PC2 scores."],
        ],
        source: sources.pca,
      },
    ),
    entry(
      "kmeans",
      "PCA + K-means",
      "K-means + PCA",
      "Patterns & structure",
      "◉",
      "runKMeans",
      "scatter",
      "Find three centroid groups in a two-dimensional view of the data.",
      {
        purpose:
          "Explore centroid-based clustering. Project six standardized inputs onto two principal components, then partition that plane into K = 3 groups using nearby centroids.",
        math: "min  Σₖ Σᵢ∈clusterₖ ||zᵢ − μₖ||²\nμₖ = mean(points assigned to cluster k)",
        mathNote:
          "Distance is Euclidean in the PC1/PC2 plane. K is fixed to three; seeded distance-weighted initialization makes a dataset/seed run reproducible.",
        how: "Reuse the descriptive PCA, initialize centers using a seeded K-means++-style distance-weighted procedure, then alternate nearest-centroid assignment and mean updates for at most 60 iterations. An empty group retains its previous center.",
        why: "It turns an unsupervised optimization into visible geometry. Compare the same projected data with DBSCAN to see how model assumptions change the grouping.",
        archive:
          "The archived workflow searched K using elbow/silhouette-style heuristics. This direct version fixes K = 3 and clusters the two-dimensional PCA scores rather than reproducing every mixed-feature selection step.",
        limitations:
          "Every point is assigned, even if it is an outlier. K-means favors compact centroid groups and depends on scaling, projection and K. A cluster is not a disease state.",
        evaluation:
          descriptive +
          " The displayed within-group sum of squares is a geometric fitting objective, not a health validation metric.",
        steps: [
          ["Scale + project", "Compress the six inputs to two PCs."],
          ["Seed three centers", "Reproducible distance-weighted choices."],
          ["Assign + update", "Nearest center, then group mean."],
          ["Inspect the partition", "Colors are geometric memberships."],
        ],
        source: sources.cluster,
      },
    ),
    entry(
      "dbscan",
      "PCA + DBSCAN",
      "DBSCAN + PCA",
      "Patterns & structure",
      "⠿",
      "runDbscan",
      "scatter",
      "Find dense neighborhoods and allow isolated observations to remain noise.",
      {
        purpose:
          "Contrast density clustering with forced centroid partitions. Points are grouped through connected dense neighborhoods in the two-component PCA plane, and isolated points are marked as noise.",
        math: "Nε(z) = {q : ||z−q|| ≤ ε}\ncore(z) when |Nε(z)| ≥ minPoints",
        mathNote:
          "Demo settings: ε = 0.7, minPoints = 4, Euclidean projected distance. Each point counts itself as a neighbor. Noise has label −1.",
        how: "Visit each projected point, collect radius neighbors, expand a new group from core points and attach reachable border points. Preserve the noise label rather than silently assigning every day.",
        why: "It illustrates a different unsupervised assumption: connected density rather than proximity to a fixed number of means. Noise handling is part of the result, not a calculation failure.",
        archive:
          "The archive advertised mixed-feature Gower distances, score bins and adaptive epsilon. This explicit PCA-space Euclidean variant is simpler and intentionally different.",
        limitations:
          "The choice of distance, projection and radius strongly changes the result. Some seeds produce one dense cluster or much noise; the page reports the actual outcome rather than manufacturing separated groups.",
        evaluation: descriptive,
        steps: [
          ["Project the inputs", "Same standardized PCA geometry."],
          ["Find radius neighbors", "Use ε = 0.7 in the PC plane."],
          ["Expand dense groups", "Core points need four neighbors."],
          ["Keep the noise", "Unreached points retain label −1."],
        ],
        source: sources.cluster,
      },
    ),
    entry(
      "dtw",
      "Dynamic time warping",
      "DTW pattern matching",
      "Patterns & structure",
      "≋",
      "runDtw",
      "dtw",
      "Match sequence shapes even when their changes happen at different speeds.",
      {
        purpose:
          "Search for recurring shapes in the simulated pain history. Compare distinct, non-overlapping seven-day windows and find the five nearest matches under constrained time warping.",
        math: "D(i,j) = (aᵢ−bⱼ)² + min[D(i−1,j), D(i,j−1), D(i−1,j−1)]\ndistance = √D(last,last)",
        mathNote:
          "A band of two restricts |i−j|. Costs use squared differences and are not divided by path length. Candidate starts advance by three rows; every window must have consecutive recorded dates.",
        how: "Build the dynamic-programming cost grid for each eligible pair, backtrack its alignment path, sort matches by distance and return the best five. The chart shows actual sequence values and the best pair’s correspondence path.",
        why: "DTW is a vivid demonstration of dynamic programming, sequence constraints and computational tradeoffs. The full-path and rolling-memory variants share the same exact distance recurrence.",
        archive:
          "The archived motif workflow had additional similarity filters, group construction and overlap suppression. This direct version uses stated windows, stride and band, without restoring every historical heuristic.",
        limitations:
          "A similar historical shape is not a recurrence forecast. Searching many windows creates chance matches, and the distance scale depends on cost and normalization choices.",
        evaluation:
          "DTW has no supervised target or forecast accuracy. Verify exact distances and path endpoints on known sequence pairs; compare the full and rolling variants to test the memory optimization.",
        steps: [
          ["Extract seven-day windows", "Consecutive dates, no pair overlap."],
          ["Build the cost grid", "Squared difference within band two."],
          ["Backtrack alignment", "Follow minimum-cost predecessors."],
          ["Rank nearest motifs", "Show the best of the actual comparisons."],
        ],
        source: sources.dtw,
      },
    ),
    entry(
      "dtw-rolling",
      "DTW with rolling memory",
      "DTW · rolling memory",
      "Patterns & structure",
      "≋",
      "runOptimizedDtw",
      "dtw",
      "The same exact constrained distances, with only two cost rows in memory.",
      {
        variant: true,
        purpose:
          "Show that a numerical optimization can preserve answers while changing memory use. This variant compares the same seven-day windows and band as full DTW, but retains rolling distance rows.",
        math: "current[j] = cost(i,j) + min(previous[j], current[j−1], previous[j−1])\nmemory: O(m), rather than O(n·m)",
        mathNote:
          "The final square-root distance equals the full-grid calculation for the same sequences and band. No complete alignment path is retained.",
        how: "Reuse the exact motif search, replacing the full matrix with previous/current arrays. Reset the working row for each sequence step; return an empty path intentionally and rank the resulting distances.",
        why: "The variant preserves the coursework’s interest in algorithmic optimization, while making the cost of losing backtracking information explicit.",
        archive:
          "The earlier optimized workflow included additional beam-search and lower-bound/caching techniques. This direct version demonstrates exact rolling memory, not every historical optimization.",
        limitations:
          "It saves cost-matrix memory but cannot draw a true alignment path without extra reconstruction. The chart therefore shows sequence comparisons only. Seven-day windows are small, so this is primarily an explanatory tradeoff.",
        evaluation:
          "Known-fixture tests compare full and rolling distances exactly, including unequal-length sequences. It remains a descriptive motif search, not a forecast.",
        steps: [
          ["Reuse identical windows", "Same stride, band and candidates."],
          ["Keep two cost rows", "Current and previous only."],
          ["Compute exact distance", "Same recurrence; no backtracking."],
          ["Compare memory choices", "See full DTW for the actual path."],
        ],
        source: sources.dtw,
      },
    ),
    entry(
      "elastic-horizons",
      "ElasticNet horizon forecasts",
      "ElasticNet · horizons",
      "Forecasting",
      "⌁",
      "runElasticNetForecast",
      "horizon",
      "Fit a separate direct model for each future calendar endpoint.",
      {
        purpose:
          "Predict simulated pain exactly 1, 7 and 14 days ahead using today’s six inputs. These are three separately trained direct-horizon models rather than one recursively fed model.",
        math: "ŷₜ₊ₕ = bₕ + xₜ·βₕ,  h ∈ {1,7,14}",
        mathNote:
          "Each horizon uses its own calendar-paired target, chronological split, h-sized gap and training-fitted scaler. λ = 0.04, L1 ratio = 0.5.",
        how: "Call the shared ElasticNet training/evaluation route once per horizon. Return each model’s current endpoint prediction, held-out series, coefficients and metrics; the chart summarizes those three endpoint estimates.",
        why: "It demonstrates temporal feature/target construction and direct multi-horizon forecasting with transparent sample sizes. The data’s planted one-day mechanism offers no promise of longer-horizon performance.",
        archive:
          "The archive used temporal-linkage matrices, database inference reads and optional sampling of missing inputs. The direct version reads only the immutable fixture and uses explicit 1/7/14-day horizons.",
        limitations:
          "Connecting the three endpoints in a plot is a visual guide, not a fitted daily trajectory or uncertainty band. Longer horizons can perform worse than a constant mean. No future food assumptions are fetched from real logs.",
        steps: [
          ["Choose 1/7/14 days", "Separate endpoint targets."],
          ["Pair exact dates", "Exclude unavailable future labels."],
          ["Fit three models", "Training-only scaling for each."],
          ["Compare each horizon", "Held-out errors and current estimates."],
        ],
        source: sources.elastic,
      },
    ),
    entry(
      "pca-horizons",
      "PCA + ElasticNet horizons",
      "PCA + ElasticNet · horizons",
      "Forecasting",
      "⌁",
      "runPcaElasticNet",
      "horizon",
      "Combine training-only dimension reduction with direct multi-horizon prediction.",
      {
        purpose:
          "Compare compressed and direct representations at 1-, 7- and 14-day endpoints. Each horizon learns its own PCA transform and ElasticNet model from earlier rows.",
        math: "Zₕ = standardize(Xₕ) · Vₕ,₄\nŷₜ₊ₕ = bₕ + Zₜ,ₕ·βₕ",
        mathNote:
          "Four PCA components per horizon; mixed L1/L2 penalty. Target and preprocessing fit periods are specific to each horizon.",
        how: "For each horizon, form calendar pairs, reserve a chronological holdout with a horizon-sized gap, fit scaler/PCA on the training period, then fit ElasticNet on projected scores. Reuse every fitted transformation for inference.",
        why: "This workflow demonstrates composing dimensionality reduction with multiple forecast tasks, while testing whether compression helps rather than assuming that it must.",
        archive:
          "The archived PcaElasticNet described same-day through seven-day models and could resample missing features during inference. This current handler uses 1/7/14-day endpoint models and a complete supplied snapshot.",
        limitations:
          "Variance compression can remove predictive information. Three endpoint estimates are not calibrated intervals or a continuous daily forecast, and a good one-day result does not validate the 14-day model.",
        steps: [
          ["Pair each horizon", "Explicit t+1, t+7 and t+14 targets."],
          ["Fit horizon PCA", "Training-only scaler and four directions."],
          ["Fit ElasticNet", "A separate model per horizon."],
          ["Reuse + evaluate", "Project holdout without leakage."],
        ],
        source: sources.pca,
      },
    ),
    entry(
      "event-horizons",
      "3 / 7 / 14-day event classifiers",
      "Event classifiers · horizons",
      "Forecasting",
      "σ",
      "runFlareWindows",
      "event-horizon",
      "Compare endpoint probabilities for one clearly defined synthetic event.",
      {
        purpose:
          "Demonstrate temporal binary classification at three endpoints. The event is simulated pain ≥ 5 exactly 3, 7 or 14 days ahead, not any event within a window and not a clinical flare.",
        math: "yₜ,ₕ = 1[pain(t+h) ≥ 5],  h ∈ {3,7,14}\npₜ,ₕ = sigmoid(bₕ + PCA(xₜ)·βₕ)",
        mathNote:
          "The present direct handler uses four training-fitted PCs before logistic LASSO. Each endpoint has its own model and h-sized evaluation gap.",
        how: "Fit training-only scaler/PCA and a sparse logistic model separately for each target horizon. Return current probabilities, held-out threshold metrics and Brier scores; the probability bars show actual computed current estimates.",
        why: "It preserves the multi-horizon classification demonstration while making the target, time horizon and evaluation provenance visible.",
        archive:
          "The latest archived flare workflow used direct features and scored its training rows; the current demonstration uses PCA and reports a separate holdout. Its endpoint labels deliberately differ from broader future-window descriptions.",
        limitations:
          "These endpoint probabilities do not mean “risk of a Crohn’s flare.” Fixed arbitrary labels, class imbalance, weak longer-horizon signal and probability calibration all limit interpretation.",
        steps: [
          ["Define endpoint labels", "Pain ≥ 5 at t+3, t+7, t+14."],
          ["Reserve later dates", "Horizon-sized gaps at each split."],
          ["PCA + logistic L1", "Fit each model separately."],
          [
            "Compare probabilities",
            "Endpoint estimates, no clinical risk claim.",
          ],
        ],
        source: sources.logistic,
      },
    ),
    entry(
      "autoregression",
      "Autoregressive forecast",
      "Autoregressive forecast",
      "Forecasting",
      "↝",
      "runAutoregressive",
      "recursive",
      "Use observed history, then feed predicted values into the next forecast.",
      {
        purpose:
          "Explore lagged time-series regression and the difference between one-step evaluation and multi-step recursion. Predict simulated pain from recent pain values, a trend and weekly features.",
        math: "ŷₜ = b + β₁yₜ₋₁ + β₂yₜ₋₂ + β₃yₜ₋₃ + β₇yₜ₋₇\n      + βtrend·t + βsin·sin(2πt/7) + βcos·cos(2πt/7)",
        mathNote:
          "ElasticNet fits these features. This is autoregressive regression, not ARIMA: there is no differencing or moving-average error term.",
        how: "Require consecutive pain observations, build lag features and use an 80/20 chronological one-step holdout. After recording those metrics, refit on all observed history and recursively forecast 14 days, bounding predictions to 0–10.",
        why: "It shows time-series feature engineering and accumulated prediction error. The future line uses previous predictions after observed history ends.",
        archive:
          "The archived file was named ArimaForecasting but implemented ElasticNet autoregression with weekly lags/trend and heuristic ranges. The direct version uses an accurate name, adds weekly sine/cosine features and avoids unsupported interval claims.",
        evaluation:
          "Held-out RMSE, R² and mean-baseline error evaluate one-step predictions using observed lag inputs. The 14-day recursive path is generated after a full-history refit and has not been separately evaluated as a multi-step trajectory.",
        limitations:
          "One-step holdout accuracy is not 14-step accuracy. Recursion compounds errors; bounding a number to 0–10 does not make it correct. The chart has no calibrated prediction interval.",
        steps: [
          ["Build lag features", "Pain lags 1, 2, 3 and 7 + seasonality."],
          ["Evaluate one step", "Holdout uses observed previous values."],
          ["Refit observed history", "Only after recording evaluation."],
          ["Recurse 14 steps", "Each prediction can become an input."],
        ],
        source: sources.ar,
      },
    ),
    entry(
      "pca-cascade",
      "PCA multivariate cascade",
      "PCA cascade",
      "Forecasting",
      "⇢",
      "runPcaCascade",
      "cascade",
      "A compressed state predicts the next state, repeatedly.",
      {
        variant: true,
        purpose:
          "Explore a multivariate recursive system. A state contains simulated pain and six inputs. Separate one-step models predict each field from a PCA representation of the previous state, then feed their output back.",
        math: "sₜ = [painₜ, six inputsₜ]\nŝₜ₊₁,j = fⱼ(PCA(sₜ));  ŝₜ₊₂ = f(PCA(ŝₜ₊₁))",
        mathNote:
          "Four training-fitted components and one ElasticNet model per state field. Seven recursive steps are bounded to each field’s observed range.",
        how: "Fit a scaler and PCA on the first 80% of adjacent states, learn seven one-step regressors and evaluate each on later observed predecessor states. Start the seven-step cascade at the last observed state using those fitted models.",
        why: "This makes composition and error propagation visible across multiple outputs. It is a transparent replacement for the earlier symptom-cascade variant.",
        archive:
          "The archived cascade used a broader eight-symptom representation and different score composition. The replacement explicitly uses pain plus six demo inputs; it does not restore every historical state field.",
        evaluation:
          "Each field has chronological one-step held-out error using observed predecessor states. Those metrics do not measure the full seven-step recursive trajectory. The chart displays the actual recursively generated pain and normalized feature values.",
        limitations:
          "Synthetic exposures are largely randomly generated, so their recursive predictions are model behavior, not known future choices. Clipping prevents numerical drift but does not validate the cascade.",
        steps: [
          ["Define a seven-field state", "Pain plus six synthetic inputs."],
          ["Fit training PCA", "Project earlier predecessor states."],
          ["Fit each next field", "One ElasticNet per output."],
          ["Feed predictions back", "Seven steps; errors can accumulate."],
        ],
        source: sources.pca,
      },
    ),
    entry(
      "score-cascade",
      "Autoregressive demo score cascade",
      "Demo score cascade",
      "Forecasting",
      "⇢",
      "runScoreCascade",
      "cascade",
      "A scalar view of the same recursive multivariate state system.",
      {
        variant: true,
        purpose:
          "Preserve the earlier score-cascade idea while being explicit about its target. This variant runs the same pain-plus-six-input recursive state family, but returns only pain as the scalar demo outcome.",
        math: "ŝₜ₊₁ = f(sₜ)\nDisplay ŝₜ₊ₕ,pain for h = 1…7",
        mathNote:
          "The “score” here is simulated pain, not a composite clinical health index. All seven fields are predicted internally without PCA.",
        how: "Train one standardized ElasticNet regressor per state field on earlier adjacent states, report later one-step metrics, and iterate the full predicted state seven times. Hide the other state fields in this variant’s result.",
        why: "A scalar output makes recursive dynamics easy to follow while retaining the coursework variant as a callable demonstration.",
        archive:
          "The old AR health-score cascade combined a historical HealthScoring composition. The direct score-only view deliberately replaces that with simulated pain and discloses that it shares the symptom-cascade mechanics.",
        evaluation:
          "One-step chronological evaluation is returned for each model. The scalar future path is recursive and is not separately held-out multi-step accuracy.",
        limitations:
          "This is an output-display variant, not a separate clinical scoring algorithm. Feeding predicted inputs back can create apparently smooth convergence even when future observations would differ.",
        steps: [
          ["Prepare observed states", "Pain and six demo inputs."],
          ["Fit field regressors", "Earlier adjacent-state pairs."],
          ["Recurse full state", "Bound each field to observed ranges."],
          ["Show scalar pain", "Keep the demo target explicit."],
        ],
        source: sources.elastic,
      },
    ),
    entry(
      "symptom-cascade",
      "Autoregressive symptom cascade",
      "Symptom cascade",
      "Forecasting",
      "⇢",
      "runSymptomCascade",
      "cascade",
      "Watch several predicted state fields evolve together over seven steps.",
      {
        variant: true,
        purpose:
          "Demonstrate multivariate autoregression without PCA. Seven one-step models learn the next state from the previous state, then generate a seven-day path through their own predicted inputs.",
        math: "ŝₜ₊₁,j = bⱼ + sₜ·βⱼ,  j = 1…7\nŝₜ₊₂ = f(ŝₜ₊₁)",
        mathNote:
          "Each field uses standardized ElasticNet. Predicted values are clipped to the respective observed fixture ranges after every step.",
        how: "Create consecutive adjacent states, use the earlier 80% for training and later 20% for one-step evaluation, then recursively apply the fitted models from the last state. The browser displays pain plus range-normalized features for comparison.",
        why: "It exposes a key difference from direct forecasts: later predictions use predicted states. Comparing it with PCA cascade shows the effect of changing the internal representation.",
        archive:
          "The earlier symptom variant predicted a broader symptom vector. The simplified direct version keeps a documented seven-field state and no hidden health-score calculation.",
        evaluation:
          "Metrics are one-step held-out errors on observed predecessor states. Later recursive steps are a demonstration of model dynamics, not measured seven-day accuracy.",
        limitations:
          "The chart normalizes feature lines to their observed ranges for display; it does not change the computed output. Random synthetic exposures are not accurately known future health inputs.",
        steps: [
          ["Form adjacent states", "Seven fields at t and t+1."],
          ["Fit one model per field", "No dimensionality reduction."],
          ["Check one-step holdout", "Use observed predecessor states."],
          ["Generate seven steps", "Feed the full predicted state back."],
        ],
        source: sources.elastic,
      },
    ),
    entry(
      "triggers",
      "Recorded trigger comparisons",
      "Trigger comparisons",
      "What-if & comparisons",
      "↔",
      "runTriggerAnalysis",
      "comparison",
      "Compare next-day means after simulated recorded exposures.",
      {
        purpose:
          "Offer an interpretable descriptive comparison before using a learned model. For dairy, spicy and caffeine indicators, compare mean next-day simulated pain after exposure versus no exposure.",
        math: "Δ = mean(painₜ₊₁ | exposureₜ > 0) − mean(painₜ₊₁ | exposureₜ = 0)",
        mathNote:
          "Exact one-day calendar pairs are used. Counts are distinct dated fixture rows; both exposed and comparison counts are reported.",
        how: "Build the complete one-day input/outcome pairs, partition them by each binary indicator, calculate each mean and return their difference. An empty group produces null, not a fabricated effect.",
        why: "The simple comparison connects the generator’s planted mechanism to model coefficients while showing why denominators and timing need to be visible.",
        archive:
          "The archive examined selected delays and more trigger types. This direct demo fixes a one-day delay and three clearly named indicators.",
        evaluation:
          "This is a descriptive group mean difference, with no predictive holdout or statistical interval. The chart separately labels exposed/comparison counts from the actual calculation.",
        limitations:
          "The word “trigger” is a historical workflow name. A mean difference does not identify a causal intervention; co-occurrence, recording patterns and random variation can change it.",
        steps: [
          ["Match next-day pain", "Keep complete calendar pairs."],
          ["Split exposure groups", "Indicator present versus absent."],
          ["Compare group means", "Exposed mean minus comparison mean."],
          ["Show both counts", "Denominators are part of the story."],
        ],
        source: sources.correlation,
      },
    ),
    entry(
      "scenario-generation",
      "Hypothetical scenario generation",
      "Generate scenarios",
      "What-if & comparisons",
      "◇",
      "runScenarioGeneration",
      "scenario-generation",
      "Turn the strongest recorded associations into explicit low/high input cases.",
      {
        purpose:
          "Demonstrate scenario construction as a separate step from prediction. Rank the six next-day correlations by absolute magnitude and select the top three inputs for low/high synthetic comparisons.",
        math: "Select top 3 inputs by |r(inputₜ, painₜ₊₁)|\nCreate low/high values for each selected input",
        mathNote:
          "Low = 0. High = 10 for energy and 1 for the other inputs. These are declared scenario values, not optimized recommendations.",
        how: "Reuse the exact lagged-correlation handler, filter undefined values, sort by absolute association and return three named cases with their bounds and recorded correlation.",
        why: "It separates deciding what to inspect from estimating the model response. The next workflow executes these cases with a fitted model.",
        archive:
          "Historical scenario generation created richer variations within the engine. This direct variant has a concise association-based selection rule and explicit fixed bounds.",
        evaluation:
          "This is deterministic scenario selection, not a supervised prediction or a causal experiment. The displayed bars are the actual correlations used to choose cases.",
        limitations:
          "Selecting large observed correlations can elevate chance patterns. The values may differ from a field’s full observed range. No treatment benefit or medical recommendation follows from inclusion.",
        steps: [
          ["Calculate associations", "Today’s inputs versus next-day pain."],
          ["Rank absolute magnitude", "Include either correlation sign."],
          ["Choose three inputs", "Keep names and correlations."],
          ["Declare low/high cases", "Inputs for a separate execution step."],
        ],
        source: sources.correlation,
      },
    ),
    entry(
      "scenario-execution",
      "Hypothetical scenario execution",
      "Execute scenarios",
      "What-if & comparisons",
      "◇",
      "runScenarioExecution",
      "scenario-execution",
      "Change one model input at a time and inspect how the prediction moves.",
      {
        purpose:
          "Explain a fitted model’s behavior with controlled hypothetical inputs. Use the latest fixture row as a base; change one selected feature to its low or high value while holding other features fixed.",
        math: "Δmodel = f(xbase with xⱼ = high) − f(xbase with xⱼ = low)",
        mathNote:
          "f is an ElasticNet model fitted to all complete one-day fixture pairs. Scenario values come from the separate association-based generator.",
        how: "Fit the direct regression model, copy the last row’s six inputs into low/high variants for each selected feature, compute both predictions and return their difference. No personal database or external prediction service is accessed.",
        why: "This is a small, inspectable example of model-based counterfactual input exploration. It shows why model behavior and causal impact are different ideas.",
        archive:
          "The coursework engine supported richer generated-scenario execution. The streamlined route uses one explicit baseline, one field changed at a time and directly returned numerical predictions.",
        evaluation:
          "The scenario model is fitted to all complete fixture pairs; these scenario comparisons have no separate holdout metric or causal validation. The chart shows model predictions, not observed intervention outcomes.",
        limitations:
          "Holding other inputs fixed can create unrealistic combinations. Linear model changes are not dietary or medication recommendations and do not estimate a real intervention effect.",
        steps: [
          ["Fit the demo model", "All complete one-day fixture pairs."],
          ["Copy the last input row", "Keep five other features fixed."],
          ["Apply low/high cases", "Change one selected feature at a time."],
          ["Compare predictions", "Model sensitivity, not treatment effect."],
        ],
        source: sources.elastic,
      },
    ),
  ].map((row, index) => ({ ...row, number: index + 1 }));
})();
