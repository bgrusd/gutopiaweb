# Gutopia: understanding the ML algorithms and how they were built

Reviewed October 6; verification and deployment status updated October 7, 2026. This guide explains the coursework algorithms in everyday language, then shows the mathematics, implementation choices and evidence behind them. All demonstrations belong **inside the same app, on demo data**.

**Current status:** all **23 demonstrations** are available through direct functions in `demoAlgorithms/workflows.js` and the Demo Algorithms menu. The automated app suite passes **317 tests across 32 suites**. Those tests include real numerical calculations, selection of all 23 demonstrations in the UI, SQLite integration, lifecycle behavior and feature checks. The final iOS JavaScript/Hermes export and a Debug simulator build succeeded; simulator startup logs also verified JavaScript execution and fresh database initialization. Manual screen navigation and native-device release checks remain pending.

There are two implementations to understand. **Archived implementation** means the original coursework code preserved in Git. **Current demo** means the simpler implementation now in the app. The current version keeps the algorithm families and their educational value, with explicit changes to some targets, data preparation and numerical methods. It does not reproduce every historical behavior byte for byte. Section 10 explains the differences.

## 1. What this guide is for

Gutopia grew from a machine-learning class project into a personal symptom, food and medication tracker. Both purposes can live in one app. The tracker records what happened; Demo Mode lets you explore what the algorithms do on a simulated dataset whose rules we know.

You do not need to understand every equation before trying a demonstration. Start with **what it does**, look at **how the current demo works**, and use **how to read the result** to interpret the output. The mathematical detail is there when you want to inspect how the code reaches its answer. Future editable simulation controls can use the same direct execution route.

Keep three different questions in mind:

1. **Is the calculation correct?** For example, can a regression recover weights we deliberately put into simulated data? Can DTW correctly align two short sequences?
2. **Does the fitted model predict new simulated examples?** A model can memorize its training data and still perform badly on observations it has not seen.
3. **Does it predict a meaningful real health outcome?** The code review and demo tests do not establish this. Successful simulation results cannot answer it on their own.

The demonstrations show programming, mathematics, evaluation and clear explanations. They do not recommend medication changes or food restrictions. Historical words such as “flare” and “health score” refer to old module names or explicitly simulated rules. A model-generated number is not a diagnosis or an observation to save in personal logs.

## 2. Where the original work is preserved

The complete main pipeline before its July removal is available at Git revision **e248b0c7185ec9042163e6534587dba26bfedd45**. Removal happened in **920b4166915b116bfeae52ca18ff27e3cadc2964**. Five earlier variants can be inspected at **51a0536fc09205cd24313390ac2aefd81f1af077**, the parent of cleanup commit **ed1aa9c**.

An additional coursework-era snapshot is **07035c6**, dated July 9, 2025, with the title “Complete analytics pipeline unit tests with 100% coverage.” That title is a historical record, not confirmation of which revision was submitted to the class. The exact submission revision still needs identifying.

The following commands read an archived file without replacing any current app files:

~~~sh
git show e248b0c:analytics-pipeline/LassoRegression.js
git show e248b0c:analytics-pipeline/FlarePredictionLogisticLasso.js
git show 51a0536:analytics-pipeline/OptimizedDTWSlidingWindow.js
~~~

Local Git tags `ml-coursework-main-archive` and `ml-coursework-variants-archive` preserve the two reviewed snapshots. A remote backup should also be retained before further cleanup. This means simplifying the app does not require losing the original numerical work.

Files with names such as `_old`, `_backup`, `_v2` or `fixed_*` are usually revisions of an existing idea. They should be compared before being counted as extra algorithms. When a version introduces a genuinely different method or target rule, it deserves an explained variant of its own.

## 3. The complete collection

The last main engine registered **18 workflows**: 16 analytical workflows and two scenario workflows. Section 7 covers five earlier variants, bringing the current menu to **23 callable demonstrations**. Several reuse the same underlying numerical routine. A workflow is the whole demonstration—preparing data, fitting or comparing, evaluating and displaying—not necessarily a completely separate solver.

The historical filenames and IDs below make it possible to locate the original source. “Regression” means predicting a number; “classification” means predicting a category; “clustering” means grouping similar observations without predefined labels.

| # | Historical ID | Source file at e248b0c | Category |
|---|---|---|---|
| 1 | lasso_regression | LassoRegression.js | Sparse linear regression |
| 2 | elastic_net_regression | ElasticNetRegression.js | Mixed-penalty linear regression |
| 3 | logistic_lasso_regression | LogisticLassoRegression.js | Sparse binary classification |
| 4 | correlation_analysis | CorrelationAnalysis.js | Descriptive association |
| 5 | pca_analysis | PcaAnalysis.js | Dimensionality reduction |
| 6 | naive_bayes | EnhancedNaiveBayes.js | Probabilistic classification |
| 7 | dbscan_pca_clustering | DbscanPcaClustering.js | Density clustering with projection |
| 8 | kmeans_pca_clustering | KmeansPcaClustering.js | Centroid clustering with projection |
| 9 | dtw_pattern_matching | DtwPatternMatching.js | Sequence alignment and motif discovery |
| 10 | pca_lasso_regression | PcaLassoRegression.js | PCA followed by sparse regression |
| 11 | pca_elastic_net | PcaElasticNet.js | PCA followed by multi-horizon regression |
| 12 | pca_logistic_lasso | PcaLogisticLasso.js | PCA followed by binary classification |
| 13 | elasticnet_forecasting | ElasticNetForecasting.js | Direct multi-horizon regression |
| 14 | flare_prediction_logistic_lasso | FlarePredictionLogisticLasso.js | Windowed event classification |
| 15 | arima_forecasting | ArimaForecasting.js | Historically named ARIMA; actual AR features |
| 16 | trigger_analysis | TriggerAnalysis.js | Lagged exposure comparisons |
| 17 | scenario_generator | ScenarioGenerator.js | Hypothetical scenario construction |
| 18 | scenario_executor | ScenarioExecutor.js | Model-based scenario simulation |

The old “19 algorithms” description does not match the 18 main registrations. Names can also hide important distinctions: `ElasticNet` can refer to the low-level fitting routine, a direct forecasting workflow or a forecasting workflow that first uses PCA. The explanations below keep those uses separate. Caches, workers and preprocessors support the demonstrations; they are not extra predictive algorithms.

## 4. The ideas shared by the demonstrations

### 4.1 Inputs, answers and calendar dates

Imagine a spreadsheet with one dated observation per row. A **feature** is a value the model can use as an input, such as energy or a simulated food indicator. A **target** is the answer we want it to learn, such as tomorrow's simulated pain. In the mathematics, `X` is the input table and `y` is the matching list of answers. Each row of `X` must line up with the correct entry in `y`.

The archived adapter translated SQLite columns into fields such as `entryDate`, `painIntensity`, `moodValence`, `moodArousal`, `energyPhysical`, `energySocial`, `bowelFrequency`, `bowelBlood`, `healthScore` and `compositeScore`. It added `tagFeatures`, `medicationFeatures` and `lagFeatures`. A **lag** is an earlier value: the archived default lags were 1, 3 and 7 days. The current demo uses a smaller, explicit feature list described in section 10.

A **horizon** is how far ahead a prediction looks. Pairing inputs at day `t` with an answer at `t+h` predicts an endpoint. Asking whether anything happened during the next `h` days is a different target. If Tuesday is missing, Wednesday must not become Monday's “tomorrow.” If a required future day or interval is unavailable, its answer is unknown and that sample cannot train that target.

### 4.2 Missing does not mean zero

An empty pain field is not a pain score of zero. No recorded food does not prove the food was absent. No medication record does not establish a skipped dose. **Imputation** means filling a missing value with an assumption; it needs to be visible because it changes the data used by the model.

The current demo-log adapter fills missing feature values with zero. That limitation is disclosed in the app and in section 10. Missing pain stays missing. The complete seeded fixture avoids absent-feature ambiguity because all its inputs are generated deliberately. Any future missing-value sampling should remain marked as simulation and separate from the original records. Predictions must never become personal symptom observations.

### 4.3 Putting different units on a comparable scale

Energy, binary indicators and other inputs can have different ranges. **Standardization** subtracts a column's average and divides by its standard deviation: `z = (x - mean) / standardDeviation`. This prevents a large numeric range from automatically dominating a distance or coefficient penalty. A binary column may also be standardized; when an indicator is rare, that changes what a one-unit coefficient means.

For predictive evaluation, calculate the averages, scales and PCA directions using the **training rows only**. Reuse those values unchanged on held-out rows. Otherwise the model gets a preview of the examples intended to test it. This is called **data leakage**. It can make a result look better than an honest future-prediction test. [scikit-learn's leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html)

### 4.4 Fitting routines, penalties and stopping rules

The archive contains handwritten JavaScript routines for LASSO/ElasticNet, logistic LASSO and PCA. Keeping these mathematical ideas does not require recovering the entire engine or every removed `ml-*` dependency. The current package uses reusable numerical functions called by small, named workflows.

A fitting routine tries to minimize an **objective**: a number measuring prediction error plus any coefficient penalty. An **iteration** is one round of its updates. A tolerance says how small a change should become before stopping. Reaching an iteration limit is not proof that the best solution was reached; **convergence** means the updates have settled according to a stated rule.

To reproduce a fitted model, keep its feature order, means/scales, coefficients, parameters and, where randomness is used, its seed. A seed makes the same pseudo-random sequence available again. A wrong feature count should produce a clear error rather than a plausible-looking answer. Section 10 records the current stopping rules and the remaining lack of complete convergence diagnostics.

## 5. The 18 main workflows

### 5.1 LASSO regression: a weighted recipe with fewer ingredients

**What it is and where it is used.** LASSO predicts a number from a weighted sum of inputs. It is useful when many candidate inputs exist and you want a model that can leave some out. Think of a recipe whose less useful ingredient weights can shrink all the way to zero.

**How it works.** The prediction is `ŷ = intercept + Σ(weight_j × input_j)`. Fitting balances squared prediction error against an **L1 penalty**, the sum of the absolute weights. The current objective is `mean((y - ŷ)²)/2 + λ Σ|weight_j|`; `λ` controls the penalty. The intercept is unpenalized. **Coordinate descent** updates one weight at a time. **Soft thresholding** subtracts a penalty-sized amount and sets sufficiently small weights to zero. [LASSO objective](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Lasso.html)

**Archived implementation.** `LassoRegression.execute` used the standard wrapper, extracted tag, medication and lag features, and called `trainLasso`. It generally predicted `healthScore`, with other continuous targets selectable through options. Its minimum of three samples was a demo convenience, and its prose framed selected inputs as triggers.

**Current demo and outputs.** `runLasso` predicts one-day-ahead simulated pain. It returns predictions, standardized-feature coefficients and training/held-out evaluation results. The underlying fitted model also has an intercept; the current workflow does not expose it separately. The archive returned selected feature names, rankings and fit/explanation payloads. Compare the current weights with the inputs deliberately planted in the fixture. A zero coefficient means the fitted model has left that input out under the selected penalty.

**How to read it.** Lower held-out error means better prediction on the unseen simulated period. A large weight describes this model's association, not a causal food effect. Correlated inputs can share or exchange weights. Compare against a constant mean and the last observed value, and check more than one seed before claiming reliable recovery.

### 5.2 ElasticNet: a gentler way to shrink related inputs

**What it is and where it is used.** ElasticNet is a weighted-sum predictor that combines LASSO's ability to remove inputs with a second penalty that smoothly reduces large weights. It is often useful when inputs overlap or move together, because pure LASSO may choose one and discard the others.

**How it works.** The objective is `mean((y - ŷ)²)/2 + λ[α Σ|weight_j| + (1-α) Σweight_j²/2]`. The absolute-value part is L1; the squared-weight part is L2. `λ` controls total shrinkage and `α` controls the mix. The current code calls that mixing fraction `l1Ratio`. Like LASSO, the solver updates one coefficient at a time and leaves the intercept unpenalized. [ElasticNet objective and parameter convention](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html)

**Archived implementation.** `ElasticNet.execute` extracted trigger and lag features and called the handwritten `trainElasticNet`. The helper updated residual errors in place. Historical names were confusing: its `alpha` meant the L1/L2 mix, while some wrappers used that name differently. Comparing equations is safer than assuming matching names mean matching behavior.

**Current demo and outputs.** `runElasticNet` predicts one-day-ahead simulated pain and shows coefficients, predictions and training/holdout metrics. The archive additionally returned coefficient rankings, selected-feature counts and explanation payloads. Run it beside LASSO to see how the two penalties change the weights.

**How to read it.** A smaller or more stable coefficient is a modeling result, not new evidence about health. Regularization can restrain a model; it cannot supply information absent from the data. Reference-solver comparisons must match the objective's averaging and penalty conventions.

### 5.3 Logistic LASSO: a weighted yes-or-no classifier

**What it is and where it is used.** Logistic regression predicts which of two classes an example belongs to. Common demonstrations include yes/no labels and detection problems. Here, the question is whether simulated pain at the target date reaches a visible threshold. LASSO adds sparse input selection.

**How it works.** First compute a weighted score `s = intercept + Σ(weight_j × input_j)`. The **sigmoid**, `p = 1/(1 + exp(-s))`, maps that score between zero and one. Fitting minimizes **binary cross-entropy**—a loss that penalizes confident wrong answers—plus an L1 penalty. A gradient update reduces the smooth loss; a **proximal** soft-threshold step shrinks weights. A separate decision threshold turns `p` into a class. [Logistic regression reference](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)

**Archived implementation.** `LogisticLassoRegression.execute` extracted trigger features, usually chose `painIntensity`, converted targets into two classes and called `trainLogisticLasso`. It required both classes and did not penalize the intercept.

**Current demo and outputs.** `runLogisticLasso` predicts whether next-day simulated pain is **at least 5**. It shows model probabilities, predictions, standardized coefficients and classification results. The label rule is part of the model, not a medical definition.

**How to read it.** A probability-shaped output is not automatically a calibrated probability: predictions near 0.8 would need to be correct about 80% of the time to deserve that interpretation. Inspect class frequency, the decision threshold and the held-out confusion matrix. An apparently high accuracy can come from always choosing the more common class.

### 5.4 Correlation: do two things rise and fall together?

**What it is and where it is used.** Correlation is a descriptive summary of how two quantities move together. It is useful for exploring data before fitting a model and for spotting deliberately planted relationships. It does not tell us which quantity caused the other.

**How it works.** Pearson correlation is `r = Σ[(x-mean(x))(y-mean(y))] / sqrt(Σ(x-mean(x))² × Σ(y-mean(y))²)`. Values near +1 mean a strong rising straight-line pattern, near -1 a falling pattern, and near zero little linear association. Rank correlation asks a different question about ordering. Pearson correlation is undefined for a constant column; a reported fallback zero should not be read as evidence of independence. [SciPy Pearson correlation documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html)

**Archived implementation.** `CorrelationAnalysis.execute` compared symptoms and binary trigger variables, including lagged pairs, and returned `allCorrelations` and a `correlationMatrix`. Metadata allowed two samples but execution required three. Neither threshold establishes that a result is statistically persuasive.

**Current demo and outputs.** `runCorrelation` compares each of the six current inputs with next-day simulated pain and also shows an input-to-input correlation matrix. Historical outputs additionally included valid-pair counts, lag details and significance estimates where implemented.

**How to read it.** Compare the sign and size with the known simulation rules. Searching many features and lags can produce a large value by chance. Missing pairs and repeating time patterns matter; standard tests that assume independent rows may be inappropriate for a daily series. Record which comparisons were explored rather than showing only the largest one.

### 5.5 PCA: finding the main directions in a cloud of points

**What it is and where it is used.** Principal component analysis, or PCA, compresses several related numeric columns into fewer summary coordinates. It is used for visualizing many-dimensional data and reducing redundant inputs. Imagine turning a camera around a cloud of points until the directions with the most spread become visible.

**How it works.** Center the input table, calculate directions that capture variance, then project each row onto those directions. A direction is a **component**; its weights on the original inputs are **loadings**; a row's location along it is its component **score**. In symbols, `Z = (X - trainingMeans) × components`. The directions are orthogonal, meaning perpendicular. Explained variance measures captured spread, not prediction accuracy. Scaling before PCA is a separate choice. [PCA reference](https://scikit-learn.org/stable/modules/decomposition.html#pca)

**Archived implementation.** `PCAAnalysis.execute` called `applyPCA`, which used random starting vectors, power iteration and orthogonalization. It returned centered data `Xc`, projected data `Z`, means, directions and explained-variance fractions, with component count or retained variance controlling compression.

**Current demo and outputs.** `runPca` standardizes the six demo inputs and shows three components, loadings, projected points and variance fractions. The current kernel uses **Jacobi eigenanalysis**, which removes covariance off-diagonal terms through rotations. This is a different numerical method from the archive. Tests check a known rank-one fixture, orthogonal/unit directions, an eigenvalue and reuse of the fitted transform.

**How to read it.** A component can summarize several inputs without predicting pain. Reversing a component's sign leaves its meaning unchanged; nearly tied variances can also rotate directions. Judge the recovered space and reconstruction, rather than demanding identical signs. Device visualization remains to be checked.

### 5.6 Naive Bayes: combining simple pieces of evidence

**What it is and where it is used.** Naive Bayes estimates a class by combining how common that class is with how typical the inputs are within it. It is commonly demonstrated with simple classification tasks such as document categories or on/off features. “Naive” describes its simplifying assumption: inputs are treated as independent once the class is known.

**How it works.** Bayes' rule gives `classWeight ∝ prior(class) × product of featureLikelihoods`. A **prior** is the class frequency before considering inputs. A **likelihood** describes how often an input occurs within that class. Bernoulli Naive Bayes uses on/off inputs; Gaussian Naive Bayes assumes continuous inputs follow bell-shaped distributions. Adding small counts, called **Laplace smoothing**, prevents an unseen combination from receiving a forced zero. Adding log likelihoods avoids multiplying many tiny numbers. [Naive Bayes variants](https://scikit-learn.org/stable/modules/naive_bayes.html)

**Archived implementation.** `EnhancedNaiveBayes` was mainly a Bernoulli trigger-frequency classifier with smoothed on/off probabilities. It grouped `healthScore` into excellent (at least 80), good (60), fair (40), poor (20) and otherwise flare. Its truthiness fallback could replace a valid zero score with 50. Separate dropping of feature rows and label rows also risked misalignment.

**Current demo and outputs.** `runNaiveBayes` uses a binary label: simulated pain at the selected future endpoint is **at least 5**. An input is “on” when it is greater than that input's **training mean**. Those thresholds are fitted model values, not arbitrary health limits. Outputs describe class probabilities and the fitted model. An optional Gaussian helper exists in the math package but is not another menu item.

**How to read it.** Compare this simple probability model with logistic regression. Correlated inputs can double-count evidence under the independence assumption. Finite, smoothed probabilities are tested; neither the old score bins nor the new binary threshold have acquired clinical meaning through those tests.

### 5.7 DBSCAN with PCA: finding dense groups and leaving outliers alone

**What it is and where it is used.** DBSCAN groups points that have enough nearby neighbors. It is useful for irregularly shaped groups and for identifying isolated points. Unlike methods that force every observation into a group, it can call a point **noise**.

**How it works.** Choose a distance, a neighborhood radius called `epsilon`, and a minimum point count. A **core point** has enough neighbors; connected core points grow a cluster. Nearby border points can join; other points remain noise. PCA can provide coordinates for plotting or can define the space where distances are measured—those are different choices. [DBSCAN reference](https://scikit-learn.org/stable/modules/clustering.html#dbscan)

**Archived implementation.** `DBSCANPCAClusteringAnalysis` advertised **Gower distance**, which combines mixed continuous/binary comparisons, along with score bins, adaptive epsilon and PCA visualization. The historical name did not imply that clustering itself happened in the PCA plot. Tiny datasets also had fallback outputs.

**Current demo and outputs.** `runDbscan` standardizes inputs, keeps the first two PCA coordinates, then uses ordinary Euclidean distance in that plane. Defaults are epsilon 0.7 and at least four neighbors, counting the point itself. It returns memberships and projected points; noise has label -1. Historical outputs included representative descriptions and distance settings.

**How to read it.** The groups answer a geometric question under these settings. Changing scale or radius can change them substantially. A group is not a discovered disease state. Current PCA-space clustering is deliberately different from archived Gower-space clustering; confirm memberships independently of how attractive the plot looks.

### 5.8 K-means with PCA: sorting points around three centers

**What it is and where it is used.** K-means sorts points into a chosen number of groups, each represented by its average location or **centroid**. It is useful for compact groups and for showing how an iterative algorithm improves its assignments.

**How it works.** Pick starting centers, assign each point to its nearest center, move centers to their assigned points' averages, and repeat. The objective is the sum of squared distances to assigned centers, often called **inertia**. The number of groups `K`, the scaling and the starting centers all matter. Elbow and silhouette comparisons help inspect choices; neither identifies a uniquely true number of groups. [K-means reference](https://scikit-learn.org/stable/modules/clustering.html#k-means)

**Archived implementation.** `KMeansPCAClusteringAnalysis` aggregated mixed features, searched possible K values using elbow/silhouette-style criteria, and supplied PCA plotting data. Metadata defaulted to searching up to eight groups and included minimum-size safeguards.

**Current demo and outputs.** `runKMeans` uses a reproducible, distance-weighted initialization and fixes **K = 3** in the first two PCA coordinates. Outputs include assignments, centers and projected data. The routine makes at most 60 iterations; an empty group keeps its previous center, so constant data may occupy fewer than three groups.

**How to read it.** Compare it with DBSCAN: K-means assigns points to centers, while DBSCAN can leave noise unassigned. Group numbers are arbitrary and can swap between runs, so compare who is grouped together rather than exact numeric labels. A neat plot does not prove meaningful full-data groups.

### 5.9 Dynamic time warping: comparing shapes that run at different speeds

**What it is and where it is used.** Dynamic time warping, or DTW, compares sequences whose similar shapes happen at different speeds. It is useful for time-series matching and repeated-pattern demonstrations. Imagine two curves that both rise, peak and fall, but one reaches its peak a day later and takes longer to fall. Comparing Monday with Monday would call them different. DTW can stretch or compress their local time alignment so the rise matches the rise and the peak matches the peak. It changes which positions are compared; it does not change or invent the recorded pain values.

**How it works.** Build a grid comparing each point in one sequence with each point in the other. Dynamic programming finds a low-cost path through allowed neighboring cells. Here, local cost is squared pain difference, and `D(i,j) = localCost + min(D(i-1,j), D(i,j-1), D(i-1,j-1))`. The final distance is the square root of accumulated cost. A band limits how far alignment can stray. This distance is **not divided by path length**. [DTW reference](https://dtaidistance.readthedocs.io/en/latest/usage/dtw.html)

**Archived implementation.** `DTWPatternMatching.execute` accepted entries or an object containing `entries/rawEntries`, built windows, filtered similarities and suppressed overlapping matches. It produced pattern groups and alignment data. A truthiness fallback could replace score zero with 50. The overlap-suppression IoU threshold of 0.01 was unusually strict and should not become an unexplained hidden rule.

**Our sliding-window approach.** A **window** is a short, contiguous slice of the timeline: here, seven consecutive calendar days with pain recorded. The search takes one seven-day slice, compares it with later seven-day slices that do not overlap it, then moves the starting position forward by three rows and repeats. Both slices are checked for consecutive dates, so the search skips candidates with missing days rather than squeezing a gap into a week. This is a sampled search across possible weeks, not every possible daily starting position.

**Current demo and outputs.** `runDtw` scores each valid pair using DTW with band 2, allowing up to two positions of local time displacement in these equal-length windows. It ranks pairs by increasing distance and keeps the **best five matches**. The output includes both start dates, the two sets of pain values, the distance and a full alignment path, plus how many pairs were compared. The path shows which points were paired; lower distance means less mismatch under this specific rule. Two reported matches may reuse a window—the non-overlap rule applies to the two windows inside a pair, not to the whole list of results.

**How to read it.** A match means “these two simulated weeks have similar shapes after the allowed time alignment.” It does not mean the weeks are correlated in the statistical sense, share a cause or predict a recurrence. Searching many windows creates opportunities for chance resemblance. Test short exact paths and deliberately stretched/compressed patterns; do not compare different lengths without stating the normalization rule.

### 5.10 PCA followed by LASSO: predicting from compressed inputs

**What it is and where it is used.** This combines two familiar steps: PCA compresses related columns, then LASSO predicts a number from the compressed coordinates. It is useful for exploring whether a smaller representation helps a sparse predictor.

**How it works.** Split data by time; fit scaling and PCA on training inputs; project training and held-out inputs with that fitted transform; then fit LASSO on the training component scores. Evaluate against the held-out answers. In the current demo, four retained components feed a one-day-ahead pain model.

**Archived implementation.** `PCALassoRegression.execute` extracted trigger/lag inputs, optionally applied PCA and called `trainLasso`. Some branches skipped PCA or returned empty guidance when useful features were unavailable. A success flag in those branches did not establish that both calculations had run.

**Current demo and outputs.** `runPcaLasso` returns fitted projection information, component coefficients, predictions and evaluation. Historical outputs also tracked whether PCA ran and why, with explanations in component and original-feature terms.

**How to read it.** A zero component coefficient removes a combined direction, not necessarily one original food indicator. To express weights in original coordinates, multiply through the PCA loadings and undo the scaling. A loading describes a component; a regression coefficient describes its contribution to a prediction. Compression can discard a small-variance direction that is highly predictive, so compare with direct LASSO rather than assuming improvement.

### 5.11 PCA followed by ElasticNet: separate forecasts for different dates

**What it is and where it is used.** This compresses inputs with PCA, then fits an ElasticNet model for each forecast horizon. It demonstrates **direct forecasting**: the seven-day model learns seven-day answers directly instead of repeatedly stepping a one-day model forward.

**How it works.** For each horizon, pair today's inputs with the exact future day's target, make a chronological split with a gap, fit scaling/PCA only on training inputs, and fit the regression. Keep that transform with the model. The current demo retains four components and predicts simulated pain at **1, 7 and 14 days**.

**Archived implementation.** `PCAElasticNet.execute` trained models described as t+0 through t+7. Its inference code queried the database again, used `currentDate` and could sample missing features. The file was `PcaElasticNet.js`, while an engine import used `PCAElasticNet.js`, creating a casing hazard on case-sensitive systems. A t+0 estimate is same-day, not a future forecast.

**Current demo and outputs.** `runPcaElasticNet` supplies dates/horizons, point predictions, component models and per-horizon evaluation. Historical outputs additionally contained sampling-based uncertainty summaries. All current input reads come from the captured demo snapshot.

**How to read it.** Inspect each horizon's held-out error separately. Sampling assumed missing inputs explores those assumptions; it does not automatically create a statistically calibrated prediction interval. Compare each forecast with leaving the most recent pain value unchanged.

### 5.12 PCA followed by logistic LASSO: classifying compressed inputs

**What it is and where it is used.** This uses PCA's summary coordinates as inputs to a yes/no classifier. It is a useful comparison with direct logistic regression when several original inputs carry similar information.

**How it works.** Define the binary answer, fit the scaler and PCA on training inputs, project each input with the same fitted transform, then fit logistic LASSO on training component scores. `runPcaLogistic` retains **four training-fitted components** and classifies next-day simulated pain **at least 5**.

**Archived implementation.** `PCALogisticLasso.execute` extracted trigger inputs, usually began with `painIntensity`, created binary or specialized labels and used PCA when appropriate before fitting logistic LASSO. Some branches skipped PCA. Historical output described risk/protective factors and current-input explanations.

**Current demo and outputs.** The direct handler returns component directions, fitted coefficients, probabilities and held-out classification results. The projection belongs to the fitted model, so held-out rows cannot silently acquire a newly fitted PCA transform.

**How to read it.** A component combines inputs; calling it a “risk component” does not isolate a real-world cause. PCA preserves variation without looking at the target, so it can remove the very information useful for classification. Demonstrate both success and failure cases and compare the confusion matrix with the direct classifier.

### 5.13 Direct ElasticNet forecasting: keeping the original inputs

**What it is and where it is used.** This fits separate numeric forecasts without first compressing the inputs. It is useful for comparing direct-feature prediction with PCA forecasting and for seeing which standardized inputs the model uses.

**How it works.** Create exact-calendar training pairs for each horizon, standardize using only its training period, then fit one ElasticNet model per horizon. `runElasticNetForecast` predicts simulated pain at **1, 7 and 14 days**. Each prediction uses an explicit snapshot and date; a future input must be known or clearly stated as an assumption.

**Archived implementation.** `ElasticNetForecasting.execute` used temporal feature-linkage tables, normalization and direct ElasticNet models. Its wrapper required 20 entries, defaulted to `healthScore`, read symptom/food/medication rows again during inference and could sample missing features. Dates could come from `currentDate` or the clock. The 20-entry rule was wrapper behavior, not a universal adequacy threshold.

**Current demo and outputs.** The handler shows forecast dates, values, coefficient information and evaluation for each horizon. Historical output also included same-day estimates and optional uncertainty data. The direct model remains fitted to its training period when producing its current forecast.

**How to read it.** Compare the same horizons with the PCA version and a persistence baseline. More machinery does not guarantee lower error. Clamping a prediction to a reasonable range makes it bounded, not accurate. Future personal logs must never be fetched as if they had been available when a prediction was made.

### 5.14 The historical “flare” workflow: defining the yes-or-no question precisely

**What it is and where it is used.** A future-event classifier asks whether a defined rule will be satisfied at a later date or within an interval. It demonstrates how changing the target definition changes what a model learns. The word “flare” is preserved as historical context; the current target is explicitly simulated.

**Archived implementation.** `FlarePredictionLogisticLasso.execute` fitted direct logistic-LASSO models for 3-, 7- and 14-day windows, using a default rule of `compositeScore > 5`. Latest module metadata explicitly said **no PCA**, despite stale engine text claiming PCA. Inference used normalized features, database lookups and missing-feature sampling.

**Current demo and outputs.** `runFlareWindows` asks whether simulated pain is **at least 5 at the exact 3-, 7- or 14-day endpoint**. It uses **four training-fitted PCA components** before logistic fitting. It does not ask whether any event occurred anywhere inside those intervals. It shows endpoint labels, probabilities, projection/model details and held-out classification results. Both the PCA use and endpoint rule are deliberate differences from the archive.

**How to evaluate it.** Exclude unavailable future endpoints. For a true interval label, exclude incomplete future intervals. Neither the answer itself nor later information can enter the inputs. Class frequencies can differ by horizon, so inspect each model separately.

**Confirmed historical issue.** The old trainer fitted on `normalizedX/y` and then calculated accuracy/AUC on those same rows at lines 907–921. Those are training scores, not evidence of predicting unseen examples. The old threshold was not a validated Crohn's outcome. Current probability labels must keep the exact simulated rule visible.

### 5.15 Autoregressive forecasting: letting earlier values predict later ones

**What it is and where it is used.** An autoregressive model predicts a time series from earlier values of that series. It is used to demonstrate repeating patterns, persistence and recursive forecasting. Think of using recent parts of a curve to extend it one step, then using that extension to take the next step.

**How it works here.** `runAutoregressive` uses pain lags **1, 2, 3 and 7**, a trend and weekly sine/cosine terms in an ElasticNet regression. After reporting holdout results, it refits on all available observations and recursively predicts **14 days**. A predicted value becomes an input to later steps.

**Why the old ARIMA name needs care.** Full ARIMA(p,d,q) includes autoregression, differencing and moving-average error terms. Seasonal ARIMA adds seasonal orders. The archive's name did not establish all those operations; its actual feature model was described as “AR(3) with weekly seasonality.” [ARIMA model specification](https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html)

**Archived implementation and outputs.** `ArimaForecasting.execute` used lags 1/2/3/7 plus trend, bridged missing time to today with predictions and then extended the series. It returned history, coefficients, forecasts and training errors. Its plotted ranges were heuristic multiples of past standard deviation; some narrowed with horizon. They were not validated prediction intervals.

**How to read it.** Current holdout metrics test **one-step predictions using observed lag inputs**. They do not measure accuracy of the entire recursively predicted 14-day path. Recursive errors can compound. Label this demonstration “Autoregressive forecast”; a true ARIMA model would be a separately implemented variant.

### 5.16 Trigger comparisons: a transparent difference between two averages

**What it is and where it is used.** This compares an outcome after dates with a recorded exposure against dates without that exposure. It is a descriptive analysis, useful as a simple benchmark before interpreting a complicated model.

**How it works.** Define the exposure, delay and comparison dates, align calendar endpoints, then calculate `difference = mean(outcome after exposure) - mean(outcome after comparison)`. Count distinct dates rather than repeated meals on one date. Show both groups' sizes; a difference supported by few examples is fragile.

**Archived implementation.** `TriggerAnalysis.execute` sorted entries, created date lookups, calculated baseline and delayed differences, and ranked exposures. Defaults required three occurrences and examined up to three effect days. These were demonstration settings, not general statistical standards.

**Current demo and outputs.** `runTriggerAnalysis` compares next-day simulated pain after dairy, spicy and caffeine indicators and returns the difference between the two means plus both sample counts. The individual means are calculated internally but are not separate current output fields. The known generator makes this useful for checking whether the next-day alignment is correct. Historical output also supplied baseline values and explanatory charts.

**How to read it.** A positive difference says these simulated rows had higher subsequent pain on average. It does not show that changing a real exposure would change pain. Other exposures may coincide, logging may be selective, and missing records may change the comparison. The seeded fixture is complete; “not logged” in another dataset must not silently become “not consumed.”

### 5.17 Scenario generation: choosing inputs to experiment with

**What it is and where it is used.** Scenario generation prepares hypothetical input changes for a model. It is workflow logic rather than a separate learning algorithm. It is useful for interactive explanations: what would this model output if one simulated input were different?

**How it works.** Calculate relevant associations, select inputs to explore, copy the original input vector and change selected fields within the simulated domain. Keep a record of what changed and why. Generating a scenario does not itself produce a prediction; the executor does that next.

**Archived implementation.** `ScenarioGenerator.execute` expected `correlationResults` and optionally `naiveBayesResults`. It created individual and combined changes with names and metadata. Missing prerequisites could produce a success response containing guidance but no scenarios.

**Current demo and outputs.** `runScenarioGeneration` directly calculates the prerequisites and chooses the **three largest absolute feature correlations** for low/high comparisons. It returns named scenarios and changed inputs. These should be understood as inspection candidates, not ranked intervention advice.

**How to read it.** An input can be strongly associated with an answer without causing it. A scenario can also fall outside patterns present in training. Keep changes feasible and their assumptions visible. Explicit prerequisite calls and substantive scenario output are clearer than an empty apparent success.

### 5.18 Scenario execution: asking a fitted model “what if?”

**What it is and where it is used.** The executor evaluates the scenarios prepared above. It compares one model's prediction for the original input with its prediction for a modified input. It is useful for explaining the function the model has learned.

**How it works.** Freeze the fitted model, feature order and preprocessing. Compute the baseline output; change specified inputs while holding the others fixed; compute the modified output. The result is `modelDifference = prediction(modifiedInput) - prediction(originalInput)`. Refitting between the two calculations would make this a different comparison.

**Archived implementation.** `ScenarioExecutor.execute` accepted both an individual scenario/current-features API and an `algorithmResults` bundle API. They produced different layouts: some nested data and some top-level scenarios/recommendations. Historical text described interventions or improvements more strongly than this calculation supports.

**Current demo and outputs.** `runScenarioExecution` fits a direct model, copies the latest input vector, and creates low/high versions for each selected input while holding other fields fixed. It returns the low prediction, high prediction and `highPrediction - lowPrediction`, along with the changed feature and its settings. It does not currently return a separate prediction for the unmodified input. The archived API included baseline/modified comparisons. With simulated data, the current low/high response can be compared with the known generator's behavior.

**How to read it.** This is a change in model output, not a measured treatment effect. Changing one input while freezing correlated inputs can create a case that never occurs in reality. The demonstration explains a fitted model; it does not establish what would happen to a person.

## 6. Making results easy to inspect

The old engine used several output layouts: nested data, top-level fields, Maps, functions and successful empty fallbacks. A small common result structure would make it easier to see what actually ran, which dataset was used and how the calculation was evaluated, while retaining each algorithm's useful details.

The following is a **proposed future contract**, not the exact shape every current handler returns. Its names illustrate the information worth keeping:

~~~js
{
  algorithm: 'lasso',
  variant: 'direct',
  status: 'ready', // or 'insufficient-data' / 'error'
  source: 'demo',
  datasetRevision: '...',
  seed: 123,
  asOfDate: 'YYYY-MM-DD',
  parameters: {},
  sampleCounts: { training: 0, validation: 0, test: 0 },
  summary: '...',
  data: {},
  metrics: { training: {}, heldOut: {} },
  diagnostics: { converged: true, warnings: [] }
}
~~~

`source`, `seed` and `asOfDate` explain where the example came from. `sampleCounts` separates rows used for learning from rows used for checking. `metrics` separates training performance from held-out performance. `diagnostics` would explain whether fitting settled and which warnings remain.

Avoid one vague “confidence” number. Accuracy describes correct classes, R-squared describes regression performance relative to a mean, coverage describes available data, and convergence describes fitting behavior. None can substitute for the others. The current kernels do not yet provide all the diagnostics shown in this illustrative object.

## 7. The five earlier variants

These variants are preserved in revision **51a0536**. They show additional ideas even when they share fitting routines with the main collection. Each has a callable current demonstration, but the simpler direct version does not reproduce every historical target or optimization.

### 7.1 Standalone three-day classifier: changing the definition of the answer

**What it is and where it is used.** This is a specialized logistic-LASSO classifier. Its educational value is target construction: the same model family learns a different problem when you change the yes/no rule.

**Archived implementation.** `FlareLogisticLasso.execute` looked three days ahead and used three tests: future `compositeScore > 6`; a decline relative to historical health-score mean/standard deviation when recent scores were high; or future `healthScore < 35`. The decline condition used recent average above 60 and future score below historical mean minus standard deviation. These were code rules, not clinical definitions. Full-series summary statistics leaked evaluation-period information into the rule, and truthiness defaults risked losing valid zeros.

**Current demo and outputs.** `runFlareThreeDay` is deliberately simpler: direct-feature logistic LASSO predicts whether simulated pain is **at least 5 at the three-day endpoint**. It does not use the old three-part target and does not use PCA. It returns probabilities, coefficients and classification evaluation from exact-date pairs.

**How to read and test it.** Explain a target rule before interpreting its score. Label construction needs its own tests, independently of model fitting. Restoring the original rule would require training-only historical statistics, tests for all three conditions and exclusion of incomplete future intervals. The current endpoint variant demonstrates classification without implying equivalence to those old rules.

### 7.2 Optimized DTW: keeping the distance while using less memory

**What it is and where it is used.** This explores engineering tradeoffs in sequence matching. The current variant gets the same constrained DTW distance while storing fewer intermediate cells. It is useful for comparing an algorithm's mathematical answer with its memory requirements.

**Archived implementation.** `OptimizedDTWSlidingWindow.findPatterns(entries, config)` included window generation, lower-bound filters, downsampling, banded/rolling DTW, beam search and caching. A lower bound can cheaply reject a candidate that cannot beat a chosen distance. Downsampling or limiting search can change which matches are found. [Author's LB_Keogh reference page](https://www.cs.ucr.edu/~eamonn/LB_Keogh.htm)

**Current demo and outputs.** `runOptimizedDtw` uses rolling rows to calculate the **same distance for the selected band** as full DTW. It returns distance comparisons without a full alignment path. That missing path is an intentional memory tradeoff, not failure. It does not restore the archive's lower-bound pruning, beam search or caches.

**How to read and test it.** Compare full and rolling distances on exact small cases, including unequal sequence lengths. A lower bound is valid only if it does not exceed the corresponding exact distance under matching assumptions. Distinguish exact computation, constrained computation and approximate candidate search; report candidates considered, pruned and fully compared if those optimizations are added.

### 7.3 PCA/ElasticNet cascade: feeding forecasts into later forecasts

**What it is and where it is used.** A cascade predicts a new state and uses that predicted state as input to the next step. It demonstrates recursive multivariable forecasting. Think of extending several linked curves together rather than extending only one.

**Archived implementation.** `SymptomCascadeModels.trainCascadeModels(entries, rawEntries, targetVariable, normalizationParams)` fitted supporting PCA/ElasticNet symptom models. `generateCascadePredictions(cascadeModels, dayPredictions, currentSymptoms)` chained predictions beyond directly available horizons. Inputs included historical symptom vectors, fitted transformations, direct forecasts and the current state.

**Current demo and outputs.** `runPcaCascade` fits one-step models using **four training-fitted components** and predicts a state containing pain plus the six demo inputs. It then feeds its predicted state forward for a seven-step trajectory. It displays the resulting values and one-step evaluation. The six inputs are dairy, spicy, caffeine, fiber, medicationTaken and energy; they are not the archive's full symptom vector.

**How to read and test it.** Keep observed inputs distinct from predicted inputs. A model trained on real simulated observations can behave differently when fed its own estimates. The current holdout uses observed previous states, so it tests one step, not the whole recursive trajectory. Compare multi-step errors and numerical stability on a known dynamical fixture before claiming long-horizon performance. Appended predictions do not become new training observations.

### 7.4 Scalar score cascade: displaying one part of a predicted state

**What it is and where it is used.** Historically this continued a scalar score after another forecast sequence. It is useful for demonstrating how model outputs can be chained and how a simpler display can hide internal state.

**Archived implementation.** `ArimaHealthScoreCascade.forecastHealthScores(historicalEntries, pcaPredictions, startHorizon, endHorizon)` joined history with supplied predictions, interpolated gaps and extended the series with an ARIMA-style helper or fallback. It used the wall clock and returned horizon, `healthScore`, confidence and method fields. The name alone did not establish a full ARIMA model.

**Current demo and outputs.** `runScoreCascade` uses the **same recursive state-model family** as the current cascades but displays predicted pain as its scalar demo outcome. Other state fields still influence subsequent steps. It is not a separately validated health-score model and does not restore the historical HealthScoring formula or AR continuation.

**How to read and test it.** Supplied predictions are simulated inputs, not measured history. Distinguish filling a gap by interpolation from predicting a future value. Check horizon boundaries, continuity and absent-history errors. Current one-step holdout results do not validate the full seven-step continuation; heuristic confidence wording would need to remain explicitly heuristic.

### 7.5 Symptom cascade: exposing the full simulated state

**What it is and where it is used.** A multivariable cascade displays several predicted quantities together. It is useful for exploring how independent fitted outputs behave when chained and whether the resulting combinations make sense.

**Archived implementation.** `ArimaSymptomCascade.forecastSymptoms(symptomHistory, startHorizon, endHorizon, lastPrediction)` iterated over eight fields covering pain, bowel, blood, energy, appetite and mood. It extrapolated available series, otherwise decayed toward a baseline, and combined predictions through `HealthScoring` into a demo score.

**Current demo and outputs.** `runSymptomCascade` exposes the current recursive state: pain and the six demo inputs. It does **not** restore those eight symptom fields, the old per-symptom AR fallbacks or their derived score. It displays a seven-step state trajectory; one-step evaluation uses observed previous states. Values are kept within the observed ranges, a stability choice rather than evidence of accuracy.

**How to read and test it.** Several individually plausible predictions can form an implausible combination. Binary fields and continuous values need different interpretations; fractional predicted indicators are simulated values, not medication actions. Check ranges, types, horizon order and missing-history behavior. Compare joint trajectories with the known generator. A calculated demo score, if added, needs an explicit formula and cannot silently become a personal-health measure.

## 8. One app, with a simpler route from button to result

### 8.1 Call the demonstration directly

The regular tracker stays in the same app. In Demo Algorithms, a button chooses a named function. That function receives a demo snapshot, prepares its inputs and targets, calls the needed numerical routines, evaluates the answer and formats the result. Scenario prerequisites are explicit function calls rather than hidden engine dependencies.

This illustrative flow shows the responsibilities; the sample function names are explanatory, not a claim about exact current export names:

~~~text
Demo Algorithms screen
  -> runLassoDemo(snapshot, options)
  -> prepareTrainingPairs(snapshot, target, lagOptions)
  -> fitElasticNet(Xtrain, ytrain, l1Ratio = 1)
  -> evaluate(model, Xtest, ytest)
  -> result + chart + explanation
~~~

Reusable mathematics is useful. A registry, coordinator, several permanent caches and background cleanup machinery are not prerequisites for calling it. Running demonstrations on demand also keeps them out of startup and ordinary log saves. A comparison can reuse one captured dataset so both models see the same examples. Add caching only after measurement shows a benefit.

### 8.2 Make demo-only input a property of the code

In the archive, `ElasticNetForecasting`, `PCAElasticNet` and `FlarePredictionLogisticLasso` fetched database features again while predicting. Giving those modules demo training rows would not, by itself, prevent a later personal-data read.

The current numerical layer receives its whole dataset and does not import SQLite, Supabase, React contexts or notification services. The loader explicitly selects the **demo database**, not whichever database happens to be active. Snapshot mode is checked, and real-mode snapshots are rejected. The UI hides this collection outside Demo Mode and invalidates work when its source changes.

An explicit date and random seed make comparisons repeatable. Given the same fixture, seed, parameters and code revision, results should agree within floating-point tolerance. A random preview is useful for browsing; fixed reference fixtures are still needed to verify correctness.

### 8.3 Make the simulated rules visible

Historical `healthScore` and `compositeScore` fields combined observations into invented summaries. The personal tracker removed the fabricated composite status. A demonstration can still use a generated target if its formula, range and dependencies are clearly explained.

The current fixture deliberately plants a next-day relationship between some simulated exposures and pain, with a repeating pattern and seeded noise. A model recovering that rule demonstrates implementation and evaluation. It is not discovering those relationships in a person's health data. Section 10 shows the generator and which inputs have no planted direct effect.

### 8.4 Keep calculations bounded and the tracker responsive

Limit row counts, feature counts, windows and optimizer iterations. A successful return means the routine finished; it does not prove convergence. In React Native, a long synchronous JavaScript loop can block the UI. Wrapping it in `async` or racing a timeout does not move it to another thread or interrupt it.

Measure on a device before choosing a worker or incremental yielding for expensive calculations such as all-pairs DTW. Obsolete work should not display after a mode/screen change. Local calculation status and retry controls keep an algorithm error from blocking the tracker. Bounded work is helpful, but device responsiveness remains a measured release check.

## 9. How to tell whether a demonstration is working

### 9.1 First check the mathematics on examples with known answers

Start small: a line with known weights, a probability calculable by hand, a rank-one matrix, separated groups with an outlier, or a tiny DTW grid. Check the expected answer or mathematical property. Testing only whether an object exists or says `success` does not establish a correct calculation.

Also check row alignment, dimensions, finite outputs, repeatability and unchanged inputs. Explicitly handle constant columns, one-class targets, empty inputs, invalid settings, missing days and duplicate dates. When comparing handwritten routines with a trusted solver, match the objective and numeric tolerance; different penalty conventions can produce different correct answers.

### 9.2 Then test predictions on later examples the model did not see

For a time-dependent demo, train on earlier rows and test on later rows. If choosing settings, use a separate validation period for those decisions and keep the final test period aside. Any scaling, PCA or feature selection belongs inside the training period of each split. [Cross-validation guidance](https://scikit-learn.org/stable/modules/cross_validation.html)

When labels reach into the future, leave an appropriate gap between training and test inputs so a training answer does not use the test period. Randomly shuffling daily rows can hide this overlap and the difficulty of future prediction. [TimeSeriesSplit and gap parameter](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html)

Use simple competitors. A **mean baseline** always predicts the training average; **persistence** predicts that the last observed value continues. A classification baseline always chooses the common class or its frequency. Report each horizon separately. A demonstration is more informative when a model is allowed to lose to these baselines than when it must always look impressive.

### 9.3 What the metrics actually mean

For regression, **MAE** is the average absolute miss in target units; **RMSE** squares errors before averaging and taking a square root, so larger misses matter more. Lower is better for both. **R-squared** compares squared error with using a mean; it can be negative when that comparison is worse. A **residual** is an observed answer minus its prediction.

For classification, a **confusion matrix** counts correct and mistaken classes. **Recall** asks how many positive examples were found; **precision** asks how many positive predictions were right. ROC/PR summaries examine decision thresholds, and a **Brier score** averages squared probability error. Some metrics are undefined without both classes. A high accuracy alone can reflect a dominant class. [Model evaluation reference](https://scikit-learn.org/stable/modules/model_evaluation.html)

For PCA, explained variance describes retained spread. For clustering, inertia measures within-group spread and silhouette compares separation with within-group distances. For DTW, the distance depends on cost and allowed paths. Each answers a different question:

| Task | Useful recorded outputs | Avoid interpreting as |
|---|---|---|
| Continuous regression | Held-out MAE/RMSE, R-squared, residuals, baseline error | Guaranteed future accuracy |
| Binary classification | Confusion matrix, recall/precision, ROC/PR summaries where defined, Brier score | Calibrated clinical probability by default |
| PCA | Explained variance, reconstruction error, component/loadings stability | Predictive success |
| Clustering | Membership stability, distances, inertia/silhouette where defined | Disease subtypes |
| DTW | Cost, path, constraint, candidate count, retrieval against planted motifs | Recurrence probability |
| Scenarios | Baseline/modified model predictions, input-domain checks | Causal treatment benefit |

These are useful reporting choices, not a claim that every current handler returns every metric in this table. Read the actual displayed or inspected result, its target and its evaluated horizon together.

### 9.4 Check the whole route through the app

- Run all 18 main workflows and five variants on deterministic data through their actual handlers.
- Require useful values and matching displays. An empty fallback is not a completed demonstration.
- Verify calculations do not read/write personal SQLite records, call Supabase, alter notifications or save predicted values as personal logs.
- Switch modes during work and verify an older result cannot appear as a result for the new source.
- Force an algorithm error and check that its error is visible while the tracker remains usable.
- Test history, medication, persistence, exports and restores separately. Correct mathematics does not prove correct app features.

These checks do not require a development server on port 8081. Pure-function, mocked UI and SQLite integration tests exercise their own boundaries.

### 9.5 Read historical test reports as historical records

Archived `FINAL_TEST_REPORT` and `TEST_COVERAGE_REPORT` files contain inconsistent totals and coverage claims. The old algorithms-integration test mostly checked imports, and one test mocked ElasticNet execution. That is useful development history, but it is not current proof that all algorithms actually run.

The old flare model scored its training rows; the old autoregressive ranges were heuristics. Minimum sample settings also varied between metadata and code. A tiny minimum might keep a demo button usable, but it is not a universal statistical guarantee. Preserve the numerical work and describe exactly what current tests have established.

## 10. What the current implementation does

### 10.1 Files and responsibilities

The source now separates inputs, mathematics, workflow steps and presentation:

- **`demoAlgorithms/math.js`:** reusable calculations—seeded randomness, standardization, Pearson correlation, Jacobi PCA, coordinate-descent regression, proximal logistic regression, Bernoulli/Gaussian Naive Bayes, K-means, DBSCAN and full/rolling DTW.
- **`demoAlgorithms/dataset.js`:** makes immutable, explicitly demo-only snapshots; generates reproducible coursework data; and aligns input dates with exact target dates.
- **`demoAlgorithms/loadDemoSnapshot.js`:** reads the demo database explicitly and adapts its logs. It does not ask for the active or personal database.
- **`demoAlgorithms/seedDemoLogs.js`:** replaces demo records atomically with 150 recent days from the coursework fixture, including simulated exposures, pain, energy and medication taken/skipped logs.
- **`demoAlgorithms/workflows.js`:** the 23 named direct handlers, with shared preparation and evaluation helpers.
- **`components/analytics/DemoAlgorithmsPanel.js`:** the fixed menu, results, plots and full-result inspection. It renders no UI outside Demo Mode.

Source inspection verifies these responsibilities, and the tests below exercise actual numerical paths, UI choices and production SQL. They do not substitute for a native device or signed release build.

### 10.2 Which function runs each demonstration

All names in the middle column are exports of **`demoAlgorithms/workflows.js`**. This table connects the explanations above to the current code:

| Documented workflow/variant | Direct handler | New behavior |
|---|---|---|
| LASSO | runLasso | One-day-ahead demo pain; L1-only regression |
| ElasticNet regression | runElasticNet | One-day-ahead demo pain; mixed L1/L2 |
| Logistic LASSO | runLogisticLasso | Binary demo pain threshold at one-day horizon |
| Correlation | runCorrelation | Current features versus next-day pain, plus input correlation matrix |
| PCA | runPca | Standardized six-feature projection; three components |
| Naive Bayes | runNaiveBayes | Binary Bernoulli classifier with training-derived input thresholds |
| DBSCAN/PCA | runDbscan | Euclidean DBSCAN in the first two PCA coordinates |
| K-means/PCA | runKMeans | Seeded K-means, fixed K = 3, in the first two PCA coordinates |
| DTW | runDtw | Non-overlapping seven-day pain windows, band = 2, best five matches |
| PCA/LASSO | runPcaLasso | Training-only PCA then L1 regression |
| PCA/ElasticNet horizons | runPcaElasticNet | Separate continuous-target models at 1/7/14 days |
| PCA/logistic LASSO | runPcaLogistic | Training-only PCA then threshold classification |
| ElasticNet horizons | runElasticNetForecast | Separate direct-feature models at 1/7/14 days |
| Event horizon classifier | runFlareWindows | Threshold classification at 3/7/14-day endpoints |
| Autoregressive forecast | runAutoregressive | Lags 1/2/3/7, trend and weekly sine/cosine; recursive 14-day pain forecast |
| Trigger comparisons | runTriggerAnalysis | Next-day pain means after logged dairy/spicy/caffeine indicators |
| Generate scenarios | runScenarioGeneration | Select three largest absolute feature correlations for low/high comparisons |
| Execute scenarios | runScenarioExecution | Fit a direct model, hold other inputs fixed, compare modified predictions |
| Earlier three-day classifier | runFlareThreeDay | Direct binary classifier at the three-day endpoint |
| Optimized DTW variant | runOptimizedDtw | Same banded distances with rolling memory; distance-only, no full path |
| PCA cascade | runPcaCascade | PCA-based multivariate one-step models fed their own predicted states |
| Demo score cascade | runScoreCascade | Same recursive state family, displaying pain as the scalar demo outcome |
| Symptom cascade | runSymptomCascade | Recursive pain-plus-feature state models |

### 10.3 Changes from the original coursework, explained plainly

The simpler package keeps the families and all 23 menu entries while reducing hidden defaults and dependencies. The differences matter when describing what has been restored:

1. **A visible simulated target.** Algorithms never read personal pain. They predict generated pain or pain from explicitly demo-only logs, rather than the old composite health-score formulas.
2. **An endpoint is not a whole window.** The 3/7/14-day classifier checks pain at `t+h`, not whether anything happened between now and then. The standalone three-day classifier also uses this endpoint rule instead of its earlier three-part rule.
3. **Four PCA components in the current multi-horizon classifier.** The latest archived flare model used direct inputs without PCA. The current `runFlareWindows` uses a training-fitted four-component projection and exposes that information. This is a deliberate variant.
4. **Different numeric forecast horizons.** Direct and PCA forecasts use 1/7/14 days instead of the old t+0 through t+7 sequence. Their current predictions come from models fitted to the training period. The autoregressive workflow separately refits after its holdout evaluation.
5. **Different clustering geometry.** Current DBSCAN measures ordinary Euclidean distance in the PCA plane, not mixed-feature Gower distance with score bins. Current K-means fixes three centers instead of selecting K with elbow/silhouette comparisons.
6. **A narrower DTW optimization.** Rolling memory preserves the chosen band's distance while omitting the full path. It does not recover every old pruning, beam-search or cache feature.
7. **A smaller cascade state.** Current cascades predict pain plus six demo inputs, not the original eight symptom fields or `HealthScoring` output. The score variant displays only pain while retaining the same internal state family.
8. **A binary Naive Bayes task.** Current inputs become on/off at their training means, and the target is binary. The archive used score-bin classes and binary trigger frequencies. A Gaussian helper is available as a different likelihood family, not another current menu demonstration.
9. **Weights use standardized units.** A displayed coefficient describes a one-standard-deviation input change, or a standardized component change for PCA workflows. It is not a raw-unit effect of a food or medication and is not causal.

“23 workflows” therefore means 23 callable educational demonstrations, not 23 unrelated numerical solvers or 23 validated clinical models. The original source remains available when exact historical behavior is of interest.

### 10.4 The numerical choices in the JavaScript

These details explain how to reproduce the current answers and compare the code with another implementation. They come from source review rather than assumptions about old defaults.

**Scaling.** Subtract each training column's mean and divide by its **population standard deviation**. A constant column uses divisor 1, avoiding division by zero. Retain and reuse that fitted mean/scale for prediction.

**LASSO/ElasticNet.** Minimize `mean((y - ŷ)²)/2 + λ[α Σ|β| + (1-α) Σβ²/2]`. Here `β` is the coefficient vector, `λ` is `lambda`, and `α` is `l1Ratio`. Defaults are `lambda = 0.04`, `l1Ratio = 0.5`; LASSO sets the ratio to 1. Centered inputs allow intercept `mean(y)`. Coordinate updates stop after coefficient changes fall below `1e-8` or after 300 complete sweeps. Returned weights use standardized units, so compare them only after matching preprocessing and objective normalization.

**Logistic LASSO.** Minimize mean binary cross-entropy plus an L1 penalty. The intercept is unpenalized. The math helper defaults to `lambda = 0.02`, while current supervised workflow calls use `0.04`. The helper performs 400 proximal-gradient iterations with step `0.5 / featureCount`. Sigmoid scores are bounded to `[-35, 35]` for numerical stability. Both classes are required. A fixed iteration count bounds work but is not a full convergence test.

**PCA.** After centering, use **sample covariance**, dividing by `n-1`, then Jacobi rotations and descending eigenvalue order. Rotations stop at an off-diagonal tolerance of `1e-10` or a limit of `100 × featureCount²`. A zero-variance matrix produces zero explained-variance fractions. Descriptive PCA uses its full snapshot; supervised PCA learns from training rows only and retains four components. This differs from both the archive's power-iteration method and the population-standard-deviation convention used for initial scaling.

**Bernoulli Naive Bayes.** Input `j` is on when it **exceeds its training mean**. For class count `c` among `n` training rows, the smoothed prior is `(c+1)/(n+2)`. On/off likelihoods add one to their counts and use denominator `c+2`. Inference adds log likelihoods and maps the difference between the two class scores to a probability. The mean thresholds travel with the fitted model.

**K-means.** Starting centers are seeded and distance-weighted. Assign by Euclidean distance, move centers to group means, and repeat for at most 60 iterations. The workflow uses `K = 3`; empty groups keep their previous center. Three requested centers do not guarantee three occupied groups on constant data.

**DBSCAN.** Use Euclidean distance in two PCA coordinates, `epsilon = 0.7` and `minPoints = 4`, including the point itself. Noise is `-1`. These are demonstration settings, not tuned health-data parameters.

**DTW.** Use squared point differences, the three-predecessor recurrence in section 5.9, and the square root of final cost. Do **not** divide by path length. Current windows are seven days with band 2; rolling memory keeps distance rows without the full alignment path. For equal settings, full and rolling kernels should agree on distance even though their returned paths differ.

The routines bound work but do not yet return a comprehensive convergence and parameter-provenance record. This is a real limitation: a finite answer after a fixed number of updates should not be described as fully optimized without further diagnostics.

### 10.5 Where the demo data comes from and how it is evaluated

The generator defaults to **seed 42 and 150 days**. The six inputs are dairy, spicy, caffeine, fiber, medicationTaken and energy. Its simulated pain rule is:

`pain[i] = clamp(3 + 2 × dairy[i-1] + 1.4 × spicy[i-1] - 0.6 × fiber[i-1] - 0.8 × medicationTaken[i-1] + sin(i × π/7) + (random - 0.5) × 0.4, 0, 10)`

`clamp` keeps the number between 0 and 10. On the first generated day, when no prior day exists, the generator uses that day's inputs as its starting values. Thereafter the prior-day inputs create a deliberately learnable next-day relationship. The sine term adds a repeating pattern, and seeded noise makes it imperfect. Caffeine and energy have no planted direct coefficient. These are **simulation design choices**, not estimates about a person. Finding the known rule in held-out simulation is evidence that a model can work on this designed system.

Settings now calls **`seedDemoLogs`** rather than the old placeholder. Given an explicit demo-database handle, it clears and inserts records in one transaction. This means a failed replacement can roll back instead of leaving half a dataset. Relative fixture dates end at the requested date, defaulting to the current local calendar date.

The seeder writes clearly named simulated foods, one simulated medication with no notification times, daily taken/skipped logs, pain, energy and a note marking the rows as examples. Each day has a plain meal carrying its generated fiber amount; extra foods supply selected dairy/spicy/caffeine tags. Loading these seeded logs therefore rebuilds complete features without assuming that absent logs mean zero. It does not read personal records or fill gaps in personal data.

Calculations retain at most the latest **180 rows**. Supervised samples require exact calendar target dates. Most supervised workflows use an **80/20 chronological holdout**, excluding a horizon-sized number of candidate pairs before the split and fitting scaling/PCA on training rows. On the complete fixture this is a corresponding calendar gap. Missing dates can additionally remove pairs, so the current pairing rules are intentionally stricter than simply accepting the next recorded row. PCA-only and clustering demonstrations describe the supplied dataset rather than predicting future answers, so they can use the whole snapshot.

The AR workflow and cascades report **one-step holdout errors with observed lag/state inputs**. Their later steps use their own predictions, a harder problem whose errors can accumulate. Those scores do not measure the complete seven- or fourteen-step forecast. Scenario differences likewise describe model behavior, not independently measured intervention outcomes.

**Current-demo-log limitation:** the adapter fills unrecorded features—including exposures and energy—with zero. That is an imputation assumption, not proof of absence. Seeded coursework data is complete by construction; other demo logs need a visible completeness policy before their patterns are interpreted. Missing pain remains missing rather than becoming zero.

### 10.6 What has actually been verified

This focused command passed on October 6, 2026:

~~~sh
npx jest __tests__/database.integration.test.js __tests__/demoAlgorithms.test.js --runInBand --silent
~~~

**Result: 41 tests passed in two suites.** Source review confirms the checks below exercise actual behavior rather than just imports:

- **PCA:** a known rank-one eigenvalue/direction, unit and orthogonal directions, explained variance, and reuse of a fitted projection.
- **Regression and classification:** a known affine relationship, removal of an irrelevant constant input, binary class separation, rejection of one-class training, and finite smoothed Bernoulli probabilities for unseen patterns.
- **Clustering and DTW:** separated groups, explicit noise, full-versus-rolling distance agreement on unequal sequences, and full-path endpoints.
- **All 23 handlers:** deterministic execution with finite numbers and substantive arrays; explicit real-mode and empty demo snapshots are rejected. No import-only or mocked return counts as execution.
- **Time alignment and leakage:** missing days/targets cannot become fabricated supervised pairs. Changing held-out targets changes their error but leaves fitted regression coefficients and PCA unchanged in the tested workflows.
- **The planted system:** direct ElasticNet beats a constant-mean baseline on the complete fixture. Snapshots stay bounded and immutable; missing pain stays missing.
- **Production SQL in in-memory SQLite:** foreign keys/orphans, zero/null and partial symptom updates, concurrent saves, optional/legacy medication fields, active toggles/deletion, explicit demo loading/wiping, food-only analytics and explicit cache mode.

These are meaningful checks on stated fixtures. They do not establish every possible input, exact historical parity, clinical validity or device speed. The focused 41-test command is separate from the full-suite record.

**Full app suite:** `npx jest --runInBand` passed **317 tests across 32 suites**, including choosing and executing every demonstration through the React Native panel. Tests also seed the complete fixture into SQLite, run all 23 workflows from those stored logs, and force a populate failure to verify rollback preserves prior demo data.

**iOS JavaScript bundle:** the final offline iOS export succeeded with a 6.9 MB Hermes bundle and 88 assets. The verified export route is `CI=1 npx expo export --platform ios --output-dir .expo/verified-ios-export`. It checks JavaScript and asset packaging. It is not an Xcode archive, signed TestFlight build or native-device pass. No development server was left listening on port 8081.

**Other app features:** tests also cover all food-AI entry points using the consent-protected proxy, nullable nutrition displayed and stored separately from zero, grouped nutrition with missing inputs, captured-database food writes and cache invalidation. Twenty-seven separate Deno tests verify the low-cost multimodal proxy, user-session enforcement and compatibility food endpoint. The functions were deployed on October 7; 12 live synthetic checks passed, including text/image AI using Gemini 3.1 Flash-Lite, signed-in nutrition and suggestions, local-mode USDA lookup and rejection of AI calls without a user. These endpoint checks do not establish installed-device UI behavior or email delivery. The app tests cover saved local-mode auth races, signup retry behavior and redirect options, auth deadlines, concurrent daily-reminder replacement without cancelling medication reminders, declining AI consent with no outbound request, durable account-cleanup retries, symptom-selection persistence, partial CSV/food edits that retain zero/existing data, calendar/date-only handling, midnight and foreground rollover, stale date/mode responses, write/batch refresh signals, History pagination/errors, expired SQLite caches, and personal-only backup/restore with media remapping and rollback/failure outcomes.

**Native release:** on October 7, Xcode 27 successfully archived Gutopia 1.0.3 (build 3), exported an App Store-signed IPA and uploaded it to the existing App Store Connect app. Apple reported upload success and package processing. The package uses SDK `iphoneos27.0`, contains the current Supabase URL and updated privacy disclosures, and has the correct Store provisioning profile with debugging disabled. The upload warned about a missing Hermes framework dSYM; this may limit crash-report detail. Completed Apple processing and TestFlight installation are not yet verified.

**Still pending:** native-device smoke tests, responsiveness measurements, reminder delivery on device, disposable-account deletion and cleanup, hosted email/DNS/SMTP/template/redirect configuration, provider-retention privacy review, TestFlight and final release checks. The October 7 simulator window and selection worked, but clicking embedded controls failed, so manual feature navigation remains unverified. None of the automated or simulated results establishes clinical validity.

The portfolio value comes from seeing the algorithms run, understanding their mathematics, checking their answers and being precise about their limits. The full collection remains available in Demo Mode while the personal tracker focuses on dependable logging.
