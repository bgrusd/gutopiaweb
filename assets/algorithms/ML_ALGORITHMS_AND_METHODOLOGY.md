# Gutopia: ML algorithms, implementation history, and methodology

Reviewed October 6, 2026. This guide documents the coursework algorithms and the intended simpler way to keep them available **inside the same app, on demo data**.

**Implementation status:** historical code and the new direct package have been reviewed in source. All 23 workflow/variant handlers are present in demoAlgorithms/workflows.js and in the Demo Algorithms menu. The final automated suite passes **267 tests across 29 suites**, including actual execution and UI selection of all 23 handlers, numerical fixtures, SQLite integration, lifecycle and feature checks. The iOS JavaScript/Hermes export also succeeds. Native-device release verification remains pending. Descriptions labeled “archived implementation” describe Git history. The new package is a transparent, simplified set of demonstrations, not byte-for-byte restoration of the historical pipeline; section 10 lists its mapping and deliberate differences.

## 1. Purpose and boundaries

Gutopia serves two related purposes: a useful personal symptom/food/medication tracker, and a demonstration of the author's programming and machine-learning work. Preserving the coursework does not require using experimental model output to make personal health decisions.

The product direction is **one application**. Real-data tracking retains transparent logged observations. Demo Mode provides the complete algorithm collection, inspectable outputs and visual results; this guide supplies the technical explanations. Editable simulation controls can be added without changing the execution architecture. A demonstration can show an algorithm operating correctly on a simulated system without establishing that it predicts Crohn's disease activity.

Three questions must remain separate:

1. **Does the numerical implementation work?** For example, does PCA recover a known low-rank structure or does DTW align two warped sequences?
2. **Does this particular demo model generalize to held-out simulated observations?** This depends on targets, data generation, preprocessing, and evaluation.
3. **Does it predict a meaningful real-world health outcome?** This has not been established by the code review or by a successful demo.

The guide does not recommend medication changes or food restrictions. Terms such as “flare” and “health score” below refer to historical module names or explicitly simulated targets unless stated otherwise.

## 2. Historical sources and preservation

The complete main pipeline before its July removal is recoverable from revision **e248b0c7185ec9042163e6534587dba26bfedd45**. It was removed in **920b4166915b116bfeae52ca18ff27e3cadc2964**. The earlier cleanup removed additional variants; recover those from **51a0536fc09205cd24313390ac2aefd81f1af077**, the parent of **ed1aa9c**.

Revision **07035c6**, dated July 9, 2025 and titled “Complete analytics pipeline unit tests with 100% coverage,” is an additional useful coursework-era snapshot. A commit title is not proof that this was the class submission; the exact submitted revision still needs identifying.

To inspect original code without replacing current files:

~~~sh
git show e248b0c:analytics-pipeline/LassoRegression.js
git show e248b0c:analytics-pipeline/FlarePredictionLogisticLasso.js
git show 51a0536:analytics-pipeline/OptimizedDTWSlidingWindow.js
~~~

Local Git tags `ml-coursework-main-archive` and `ml-coursework-variants-archive` preserve the two reviewed historical snapshots. Retain a remote backup before further cleanup. Preserve historical algorithms as code and documentation, while replacing the orchestration around them. Files named _old, _backup, _v2, fixed_*, or alternative DTW implementations are versions to compare, not automatically distinct algorithms. A genuinely different optimization or target definition should be listed as a selectable variant rather than silently discarded.

## 3. Complete inventory

The last main engine registers **18 workflows**: 16 analytical workflows and two scenario workflows. Earlier code supplies five additional variants described in section 7. Infrastructure classes such as caches, preprocessors, workers, and window-quality evaluators are supporting tools rather than additional predictive algorithms.

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

The old documentation's “19 algorithms” count does not match these 18 registrations. “ElasticNet” in the source can mean the low-level regression solver, the direct forecasting workflow, or the PCA forecasting workflow; these are related but different demonstrations.

## 4. Shared data and numerical foundations

### 4.1 Rows, features, targets, and time

A row represents a dated simulated observation. A **feature** is an input such as pain, energy, a food-tag indicator, or a prior-day value. A **target** is the number or class being learned. The matrix X has one row per training sample and one column per feature; y contains the corresponding targets.

Archived preprocessing maps SQLite columns to names such as entryDate, painIntensity, moodValence, moodArousal, energyPhysical, energySocial, bowelFrequency, bowelBlood, healthScore, and compositeScore. It adds tagFeatures, medicationFeatures, and lagFeatures. Default lag periods are 1, 3, and 7 days. A replacement should keep a single documented mapping and feature order.

Forecasting uses X at time t with a target at time t+h. An event-window classifier uses a label defined over a specified future interval. These require date-aware pairing: an absent calendar day must not silently turn the next recorded row into “tomorrow.” Rows near the end of a fixture without a full future interval have unknown labels and must be excluded from that training target.

### 4.2 Missing values are information

Missing pain is not zero pain. Missing food records do not establish that a food was not eaten. Unknown medication status is not automatically a skipped dose. The adapter should retain missingness and either exclude incomplete samples for a stated calculation or use an explicit, documented imputation policy.

Demo fixtures may intentionally include generated values and synthetic targets; their provenance must remain visible. Any Monte Carlo sample or imputed value used to demonstrate uncertainty should remain separate from the observed/demo-source records. Do not save simulated predictions as personal symptom logs.

### 4.3 Scaling and preprocessing

Continuous inputs commonly need centering or standardization so units do not dominate distances or penalties. Binary indicators require deliberate handling; standardizing a rare indicator changes its interpretation. Scaling is a modeling choice, not proof of validity.

Fit means, variances, feature selection, and PCA on **training rows only**, then apply the fitted transformation unchanged to validation/test rows. Fitting preprocessing on the entire dataset allows evaluation information into the model. [scikit-learn's leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html)

### 4.4 Shared low-level routines

The archived solver files implement coordinate-descent LASSO/ElasticNet, proximal-gradient logistic LASSO, and power-iteration PCA in JavaScript. This explains why preserving the numerical work need not require restoring the large engine or every removed ml-* dependency.

The replacement package should document the objective's normalization convention, numerical tolerances, iteration limits, convergence status, zero-variance behavior, and random seed. A model object should retain feature names and fitted preprocessing parameters alongside coefficients. Predictions must fail visibly on incompatible feature dimensions.

## 5. The 18 main workflows

### 5.1 LASSO regression

**What it does.** Fits a continuous target using a weighted sum of inputs, with an L1 penalty that can set coefficients to zero. This demonstrates regression, regularization, and feature selection.

**Intended mathematics.** Minimize squared prediction error plus a penalty proportional to the sum of absolute coefficient values. The intercept is unpenalized. Coordinate descent updates one coefficient at a time, using soft thresholding. Exact penalty values depend on whether the error is summed or averaged. [LASSO objective](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Lasso.html)

**Archived implementation.** LassoRegression.execute inherits the standard wrapper, extracts tag/medication/lag features, and calls trainLasso. It generally defaults to healthScore; options can select a different continuous target. The workflow accepts very small datasets for demonstration and generates trigger-oriented prose.

**Outputs.** Intercept, coefficients, selected feature names, trigger-importance ranking, fit statistics, and explanatory data for the UI.

**Why it is useful in the demo.** A seeded sparse linear system can show known relevant inputs being recovered while irrelevant ones shrink.

**Limitations.** A selected coefficient is an association conditional on this feature set, not a causal trigger. Correlated inputs can trade coefficients between runs. Compare against a mean/persistence baseline and test recovery across seeds and held-out periods.

### 5.2 ElasticNet regression

**What it does.** Combines LASSO's L1 penalty with an L2 penalty that shrinks coefficients smoothly. It illustrates the tradeoff between sparse selection and stability with correlated inputs.

**Intended mathematics.** Add both absolute-value and squared-coefficient penalties to squared error. A mixing parameter controls their relative weight; the overall penalty controls shrinkage. [ElasticNet objective and parameter convention](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html)

**Archived implementation.** ElasticNet.execute calls the handwritten trainElasticNet routine after extracting trigger and lag features. The solver updates residuals in place and leaves the intercept unpenalized. Historical parameter naming is confusing: alpha in the low-level solver is the L1/L2 mixing fraction, whereas some wrappers use alpha differently. Preserve the equation, not just the parameter name.

**Outputs.** A fitted model, coefficient ranking, selected-feature counts, fit metrics, and explanation payloads.

**Why included.** Run it beside LASSO on correlated synthetic inputs to demonstrate different coefficient behavior.

**Limitations.** Regularization does not create missing information or validate a health outcome. Test the objective against a reference solver under an explicitly matched penalty convention.

### 5.3 Logistic LASSO regression

**What it does.** Predicts a binary class with a sigmoid of a linear score and an L1 penalty. Unlike linear regression, its output lies between zero and one.

**Intended mathematics.** Minimize binary cross-entropy plus L1 shrinkage. A gradient step updates the smooth loss; a proximal soft-threshold step applies the sparse penalty. Classification additionally requires a selected decision threshold. [Logistic regression reference](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)

**Archived implementation.** LogisticLassoRegression.execute extracts trigger features, defaults to painIntensity, converts the target to binary, requires both classes, and calls the proximal-gradient trainLogisticLasso helper. The intercept is unpenalized.

**Outputs.** Class probabilities, coefficient-based feature rankings, risk/protective-factor lists, classification metrics, and current-input explanations.

**Why included.** Shows the difference between a predicted number, a predicted class, and a probability. A planted binary simulation can expose decision-boundary and regularization effects.

**Limitations.** A sigmoid output is not automatically calibrated. A class created from an arbitrary pain threshold is that threshold's class, not a medical event. Report class prevalence, decision threshold, and held-out confusion matrix.

### 5.4 Correlation analysis

**What it does.** Summarizes how two measured quantities vary together, including selected calendar lags. It does not learn an intervention or a causal relationship.

**Intended mathematics.** Pearson correlation measures standardized linear covariation; rank correlation answers a different monotonic-association question. Constant columns have no defined Pearson correlation. Statistical intervals/tests depend on their assumptions. [SciPy Pearson correlation documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html)

**Archived implementation.** CorrelationAnalysis.execute extracts symptoms and binary trigger variables, calculates pairwise and lagged comparisons, and returns allCorrelations plus a correlationMatrix. Metadata says minSamples:2, while execution requires at least three entries. These permissive values are UI behavior, not universal evidence thresholds.

**Outputs.** Feature-pair names, correlation values, valid-pair counts, lag metadata, and, where implemented, significance estimates.

**Why included.** Provides an interpretable baseline and a way to visualize a planted simulated lag before fitting a model.

**Limitations.** Repeated testing across many features/lags can promote chance maxima. Report complete-pair counts, missingness, and the explored comparison set. Serially dependent rows complicate standard independent-sample inference.

### 5.5 Principal component analysis

**What it does.** Rotates a numeric feature space into orthogonal directions capturing variance. It is unsupervised: it can summarize structure without a target label.

**Intended mathematics.** Center the training matrix, find principal directions by eigenanalysis/SVD, and project onto selected components. Standardizing before PCA is a separate choice; variance captured is not predictive accuracy. [PCA reference](https://scikit-learn.org/stable/modules/decomposition.html#pca)

**Archived implementation.** PCAAnalysis.execute extracts a feature matrix and calls applyPCA. That helper uses power iteration with orthogonalization, starts from random vectors, and selects components by count or retained variance. It returns centered data Xc, projected data Z, means, component directions, and explained-variance fractions. The replacement kernel uses Jacobi eigenanalysis; that is a numerical-method change, not a claim of byte-for-byte equivalence. The focused numerical tests verify a known rank-one fixture and fitted projection; device visualization verification remains pending.

**Outputs.** Component loadings, projections, variance fractions, component count, and feature/pattern descriptions.

**Why included.** A low-rank synthetic fixture can visibly collapse many correlated inputs into two or three dimensions.

**Limitations.** A high-variance direction need not predict the target. Component signs are arbitrary, and nearly equal eigenvalues make individual directions unstable. Test the recovered subspace and reconstruction, not only exact vector signs.

### 5.6 Naive Bayes classification

**What it does.** Combines a class prior with feature likelihoods under a conditional-independence assumption.

**Intended mathematics.** Compute posterior class weights proportional to the prior times the product of feature likelihoods. Bernoulli likelihoods suit binary indicators; Gaussian likelihoods model continuous inputs. Log-space computation avoids multiplying many tiny values. [Naive Bayes variants](https://scikit-learn.org/stable/modules/naive_bayes.html)

**Archived implementation.** EnhancedNaiveBayes is primarily a **Bernoulli-style trigger-frequency classifier**, with Laplace-smoothed on/off probabilities. It bins healthScore into excellent/good/fair/poor/flare labels and classifies currentFeatures. Its score accessor uses truthiness fallback, so a valid zero can become 50. Feature extraction can drop rows independently of label extraction; an aligned replacement must keep them together.

**Outputs.** State priors, conditional trigger probabilities, class probabilities, predicted state, and trigger-oriented explanations.

**Why included.** Offers a simple probabilistic comparison with logistic regression.

**Restoration distinction.** The main replacement workflow uses Bernoulli likelihoods, with continuous inputs binarized at their training means. Its synthetic label is pain at a selected future horizon greater than or equal to 5, rather than the archive's five score-bin classes. The threshold vector is part of the numerical model. A Gaussian helper additionally exists for continuous-input comparisons; it is not a separate current menu item. Neither family makes arbitrarily binned scores clinically meaningful. The focused numerical tests verify finite smoothed Bernoulli probabilities; device verification remains pending.

### 5.7 DBSCAN with PCA visualization

**What it does.** Finds dense neighborhoods, expands connected dense regions, and can leave isolated points as noise. It need not assign every day to a cluster.

**Intended mathematics.** Choose a distance, neighborhood radius, and minimum-neighbor count. Core points expand clusters; border points may join them; remaining points are noise. Projection is optional and can serve visualization independently of clustering. [DBSCAN reference](https://scikit-learn.org/stable/modules/clustering.html#dbscan)

**Archived implementation.** DBSCANPCAClusteringAnalysis advertises mixed continuous/binary features and **Gower distance**, score binning, adaptive epsilon, and PCA visualization. Thus its name does not mean that all clustering is performed in a PCA plane. It also has tiny-data fallback outputs.

**Outputs.** Cluster memberships, noise points, representative descriptions, epsilon/distance metadata, and projected chart coordinates.

**Why included.** Demonstrates density clustering and outlier handling on a fixture with irregular groups and isolated days.

**Limitations.** Results depend on distance and radius. A PCA-space Euclidean replacement is a different variant from Gower-space clustering. A cluster is a geometric group, not a discovered disease state. Preserve noise labels and verify clustering separately from the plot.

### 5.8 K-means with PCA visualization

**What it does.** Divides points into K groups by repeatedly assigning them to nearby centroids and updating those centroids.

**Intended mathematics.** Minimize within-cluster squared Euclidean distance. Initialization, scaling, and K matter. Elbow and silhouette diagnostics support comparison but do not identify a uniquely true K. [K-means reference](https://scikit-learn.org/stable/modules/clustering.html#k-means)

**Archived implementation.** KMeansPCAClusteringAnalysis aggregates mixed features, searches possible K values using elbow/silhouette-style criteria, and returns PCA visualization data. Its metadata defaults to searching up to eight clusters and includes minimum-size safeguards.

**Outputs.** Assignments, centroids, selected K, within-group metrics, selection diagnostics, and projected points.

**Why included.** Compare it with DBSCAN: K-means favors compact centroid groups and assigns points, whereas DBSCAN can reject noise.

**Limitations.** Cluster labels can permute between runs. Verify pairwise membership or align labels before comparison. A good-looking two-dimensional projection does not prove that full-space groups are meaningful.

### 5.9 Dynamic time warping pattern matching

**What it does.** Aligns sequences that contain similar shapes at different speeds. It can detect a repeated motif even when one occurrence is stretched in time.

**Intended mathematics.** Dynamic programming accumulates local alignment costs along a permitted path through a sequence-pair grid. Path constraints prevent extreme warping. Distance normalization must be specified before comparing windows of different length. [DTW reference](https://dtaidistance.readthedocs.io/en/latest/usage/dtw.html)

**Archived implementation.** DTWPatternMatching.execute accepts an array or a preprocessing object containing entries/rawEntries. It discovers windows, compares their score trajectories, applies similarity filtering and overlap suppression, and creates pattern-group and alignment visualization payloads. Historical code uses a truthiness fallback for scores and can replace a valid zero with 50. The source's IoU suppression threshold is unusually low; it should be a visible documented option rather than an invisible rule.

**Outputs.** Matching windows, alignment paths/derived chart data, similarities, motif groups, and timeline lookup information.

**Why included.** It is a strong visual demonstration of sequence algorithms and computational optimization.

**Limitations.** Similarity is not a recurrence probability. Large searches create many opportunities for chance matches. Test exact cost/path cases and planted warped motifs, and show the chosen constraint and normalization.

### 5.10 PCA followed by LASSO

**What it does.** Fits sparse linear regression in a principal-component space rather than directly on every original feature.

**Archived implementation.** PCALassoRegression.execute extracts trigger/lag predictors, optionally applies PCA, then calls trainLasso on the projected matrix. Some branches skip PCA when it is inappropriate or no useful features exist. A successful empty-guidance result is not evidence that PCA and LASSO both ran.

**Correct intended flow.** Fit scaling/PCA on training X, project training and test rows using the same transform, fit LASSO on training component scores, and evaluate on the held-out target. Removing components can discard a low-variance predictive direction; compare against direct LASSO.

**Outputs.** PCA usage/reason, retained components, component coefficients, fit statistics, and projected/original-feature explanation data.

**Why included.** Demonstrates composition of unsupervised representation learning with supervised sparse regression.

**Interpretation.** A sparse component model does not necessarily select a sparse set of original foods. Original-space coefficients require multiplying through the PCA directions and reversing any scaling. Clearly distinguish a component loading from a regression coefficient.

### 5.11 PCA followed by ElasticNet multi-horizon forecasting

**What it does.** Fits forecast models at multiple horizons after reducing the input space with PCA.

**Archived implementation.** PCAElasticNet.execute trains specialized horizon models, historically described as t+0 through t+7, using PCA and ElasticNet. It returns training details and forecasts; its predictor queries the database again for features, uses currentDate, and can use Monte Carlo sampling for missing inputs. The tracked filename is PcaElasticNet.js despite an engine import spelled PCAElasticNet.js; normalize casing during restoration.

**Correct intended flow.** Pair each date's predictors with its explicit horizon target, keep preprocessing within the training period, fit each horizon separately, and retain the fitted transform for inference. t+0 is a same-day estimate, not a future forecast. Supply all predictor reads from the demo snapshot.

**Outputs.** Forecast date/horizon, point predictions, optional uncertainty summaries, component models, and per-horizon sample/fit metrics.

**Why included.** Demonstrates dimension reduction plus direct horizon modeling.

**Limitations.** Sampling assumed missing features explores assumptions; it does not automatically produce a calibrated predictive interval. Evaluate each horizon against a persistence baseline and clearly label t+0.

### 5.12 PCA followed by logistic LASSO

**What it does.** Learns a binary classifier on component scores, illustrating dimensionality reduction before classification.

**Archived implementation.** PCALogisticLasso.execute extracts trigger predictors, defaults to painIntensity, creates binary or specialized classification labels, applies PCA when appropriate, and fits logistic LASSO. It returns risk/protective factors and current-input classification explanations, with fallback branches where PCA is skipped.

**Correct intended flow.** Define the label first, fit the scaler/PCA only on training predictors, project held-out rows, and report held-out classification results. Record whether PCA actually ran.

**Outputs.** Component directions, logistic coefficients, class probabilities, factor/explanation payloads, and fit metrics.

**Why included.** Compare direct classification with a compressed representation on correlated synthetic inputs.

**Limitations.** A “risk component” is a mathematical direction, not an isolated food or medication effect. Retaining maximum variance can erase useful discrimination. Unsupervised PCA is not optimized for the classification label; demonstrate both improvement and failure cases rather than promising automatic benefit.

### 5.13 Direct ElasticNet forecasting

**What it does.** Forecasts future numeric targets using current/lagged inputs, without PCA.

**Archived implementation.** ElasticNetForecasting.execute uses temporal feature-linkage matrices, normalization parameters and direct ElasticNet models. It requires at least 20 entries at its wrapper, queries symptom/food/medication rows during inference, and can sample missing feature values. It defaults to healthScore and anchors prediction using currentDate or the wall clock.

**Correct intended flow.** Create explicit calendar-aligned horizon samples, train regularized linear models, and pass an immutable feature snapshot plus asOfDate. Future exposure features must either be known by design or be stated assumptions; they cannot be fetched from unavailable future personal logs.

**Outputs.** Forecast sequence, current/same-day estimate where applicable, coefficient tables, horizon training summaries, and optional uncertainty data.

**Why included.** Serves as the direct-feature comparison for PCAElasticNet and shows the cost of compressing predictors.

**Limitations.** More model machinery need not beat the last observed value. Track held-out errors by horizon and handle clamping explicitly; a bounded output is not evidence of accuracy.

### 5.14 Windowed “flare” logistic LASSO

**What it does.** Demonstrates classification of an event in a selected future interval rather than predicting a continuous number.

**Archived implementation.** FlarePredictionLogisticLasso.execute trains direct logistic-LASSO models for 3-, 7-, and 14-day windows. The latest metadata explicitly says it does **not** use PCA, despite stale engine prose describing PCA. Its default simulated event definition is compositeScore greater than 5. It uses normalized historical features, database lookups, and missing-feature sampling.

**Correct intended flow.** Define whether the label means an event at t+h, any event in the next h days, or another interval statistic. Preserve that definition in metadata. Exclude incomplete future windows and prevent the target or post-outcome variables from entering the predictors. Different window lengths have different prevalences.

**Outputs.** Window lengths, class probabilities, coefficients, training/evaluation summaries, and model explanations.

**Why included.** A rich demo of temporal labels, sparse classification, and multiple prediction horizons.

**Confirmed caveat.** The archived trainer fits on normalizedX/y and then computes accuracy/AUC on those same rows at lines 907–921. Those are training metrics. The arbitrary composite threshold has not been validated as a Crohn's outcome. The in-app demo must say “simulated event probability,” with the exact rule shown.

### 5.15 Historically named ARIMA forecasting

**What it does in the archive.** Builds lag1, lag2, lag3, lag7 and a trend feature, then fits ElasticNet and recursively forecasts a score series. It is an autoregressive regression demonstration with a weekly lag.

**What ARIMA normally means.** An ARIMA(p,d,q) model includes autoregressive terms, differencing, and moving-average error terms. Seasonal extensions add seasonal orders. The name should reflect which of those components are actually implemented. [ARIMA model specification](https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html)

**Archived implementation.** ArimaForecasting.execute trains on rows after the first seven lags, bridges a gap to today by prediction, and extends the series recursively. It returns a model type of “AR(3) with weekly seasonality.” Its plotted ranges use heuristic multiples of historical standard deviation; they are not validated prediction intervals. Some ranges even narrow with horizon.

**Outputs.** Historical series, AR coefficients, forecasts, training errors, and heuristic range/confidence labels.

**Why included.** Demonstrates autoregression, recursive forecasting and error propagation.

**Restoration choice.** Label the preserved behavior “Autoregressive forecast.” A true ARIMA implementation can be added as a distinct future variant; do not rename an AR implementation to claim missing math. Use an explicit demo date and held-out rolling evaluation.

### 5.16 Trigger effect analysis

**What it does.** Compares a numeric outcome around occurrences of a tagged exposure, including selected delays.

**Archived implementation.** TriggerAnalysis.execute sorts entries chronologically, builds a date lookup, computes baseline statistics and exposure-associated differences, and orders trigger results. Defaults include three occurrences and up to three effect days.

**Correct intended flow.** Define the exposure, comparison group, delay and complete-case rules. Count distinct dates rather than duplicate meal rows. Show both exposed and comparison sample sizes. A descriptive mean difference is an observation, not an estimated intervention effect without stronger assumptions.

**Outputs.** Trigger names, exposure counts, lagged mean differences, baseline values, and explanatory charts/tables.

**Why included.** Gives users and reviewers an understandable benchmark alongside complex fitted models. Synthetic planted effects can show whether lag alignment is correct.

**Limitations.** Confounding, selective logging, coincident exposures and missing data can dominate the observed difference. Do not suggest changing medication based on these comparisons. “Not logged” is not “not consumed”; demo fixtures should state completeness explicitly.

### 5.17 Scenario generation

**What it does.** Builds hypothetical modifications to an input vector, usually from previously calculated association/model rankings. It is workflow logic, not an independent learning algorithm.

**Archived implementation.** ScenarioGenerator.execute expects correlationResults and optionally naiveBayesResults in configuration. It constructs single-input and combined-change scenarios, returning names, changes, available triggers, and metadata. If prerequisite results are absent, it can return success with guidance and no scenarios.

**Correct intended flow.** Run prerequisite calculations directly, pass their outputs explicitly, and generate feasible modifications within the known simulated feature domain. Record the original vector, changed fields, rationale, and whether a scenario is inside the training range.

**Outputs.** A structured scenario list; it need not contain predictions until a separate executor evaluates it.

**Why included.** Demonstrates composition, model interpretation and interactive exploration.

**Limitations.** Correlation can suggest a candidate to inspect but does not establish that editing the corresponding real-world factor changes an outcome. In Demo Mode call these “input simulations,” avoid real medication directives, and require visible prerequisites rather than empty apparent success.

### 5.18 Scenario execution

**What it does.** Compares a fitted model's baseline prediction with its prediction after a specified input modification.

**Archived implementation.** ScenarioExecutor.execute supports both a scenario/currentFeatures API and a broader algorithmResults API that generates/evaluates scenario bundles. Result layouts differ: some data is nested, while the bundle path returns scenarios/recommendations at top level. Historical prose uses intervention/improvement language.

**Correct intended flow.** Freeze the fitted model and preprocessing, construct baseline and modified vectors with identical feature order, and calculate their prediction difference. Refit only when explicitly requested, not silently between the two comparisons.

**Outputs.** Baseline prediction, modified prediction, difference, changed fields, and model/domain warnings.

**Why included.** Makes model behavior tangible and shows how feature effects interact within a learned function.

**Limitations.** This computes a change in model output, not a causal treatment effect. Changing a feature while holding everything correlated with it fixed may create an impossible case. On the synthetic system, compare the model's response with the known generator's response; that tests the simulation without making a real-health claim.

## 6. Shared output contract

The old engine mixes nested data, top-level payloads, Maps, model functions, heuristic confidence labels, and successful empty fallback results. The replacement should expose a small serializable result shape while keeping algorithm-specific detail.

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

This is a proposed contract, not a promise that the current package already returns these exact fields. Accuracy, AUC, R-squared, sample coverage and convergence are different concepts and should not collapse into one “confidence” word.

## 7. Five earlier variants

These are recovered conceptually from revision **51a0536**. They should remain documented and selectable where restored, even when they reuse the shared numerical routines.

### 7.1 Standalone three-day FlareLogisticLasso

**Purpose.** A specialized binary classifier with a different event-labeling rule from the later 3/7/14-window workflow.

**Archived implementation.** FlareLogisticLasso.execute constructs a three-day lookahead label using three tests: future compositeScore above 6, a decline relative to historical score mean/standard deviation when recent scores are high, or an absolute healthScore below 35. It then trains logistic LASSO on mixed inputs. These are historical code rules, not validated clinical definitions. The helper uses full-series statistics and truthiness score defaults; a replacement must avoid evaluation-period statistics and preserve valid zero values.

**Inputs/outputs.** Dated canonical features and an explicitly complete future interval; event probabilities, sparse coefficients and classification details.

**Why preserve it.** It demonstrates how changing target construction changes the learning problem. The UI can compare its synthetic rule with the later composite-threshold rule.

**Validation.** Test label creation separately from model fitting, exclude incomplete future intervals, and test each trigger condition with a small hand-built fixture.

### 7.2 Optimized sliding-window DTW

**Purpose.** An optimization-oriented version of motif search, not a new clinical predictor.

**Archived implementation.** Instantiate OptimizedDTWSlidingWindow and call findPatterns(entries, config). The class includes window generation, lower-bound filters, downsampling, banded/rolling DTW, beam search, and cache handling. Some of these accelerate exact computation; others approximate or restrict search and can alter recall. [Author's LB_Keogh reference page](https://www.cs.ucr.edu/~eamonn/LB_Keogh.htm)

**Inputs/outputs.** An explicit dated demo sequence and search configuration; candidate/matching windows, distances, and computation diagnostics.

**Why preserve it.** Shows algorithm engineering: memory use, pruning, and speed/accuracy tradeoffs.

**Validation.** Compare each optimization with a small exact DTW reference. A valid lower bound must not exceed the matching distance under the same cost/window assumptions. Report whether search is exact, constrained or approximate. Preserve separate counts for considered, pruned and fully compared candidates.

### 7.3 PCA/ElasticNet symptom cascade

**Purpose.** Extends forecasts recursively by using predicted symptoms as later inputs.

**Archived implementation.** SymptomCascadeModels.trainCascadeModels(entries, rawEntries, targetVariable, normalizationParams) trains supporting symptom models. generateCascadePredictions(cascadeModels, dayPredictions, currentSymptoms) chains them beyond directly available horizons. It uses PCA and ElasticNet helpers.

**Inputs/outputs.** Historical symptom vectors, fitted preprocessing, direct-horizon predictions and current simulated symptoms; later-horizon symptom/score trajectories.

**Why preserve it.** Illustrates direct versus recursive forecasting and the effect of feeding a model its own previous predictions.

**Correct intended behavior.** Propagate the same feature definitions/scaling at every step, identify which inputs are observed versus simulated, and carry horizon provenance. A model trained on observed inputs can behave differently on its own predicted inputs.

**Validation.** Compare direct and recursive models on a seeded dynamical system, evaluate errors by horizon, and test boundedness and numerical stability. Cascading does not create new observations or increase the training sample size.

### 7.4 AR health-score cascade

**Purpose.** Continues a scalar score forecast after a PCA/ElasticNet horizon sequence.

**Archived implementation.** ArimaHealthScoreCascade.forecastHealthScores(historicalEntries, pcaPredictions, startHorizon, endHorizon) combines history with supplied predictions, interpolates gaps, and extends it using an ARIMA-style helper or fallback. It anchors dates to the wall clock and returns horizon, healthScore, confidence and method fields.

**Correct intended behavior.** Treat the joined direct predictions as simulated inputs, not measured history. Inject the date, specify the actual autoregressive/differencing/error model, and distinguish interpolation from forecast. The archived name alone does not establish a full ARIMA implementation.

**Why preserve it.** It demonstrates a fallback forecast chain and model-composition limitations.

**Validation.** Verify exact horizon boundaries, continuity between direct and extended predictions, and failure behavior when history is absent. A heuristic confidence label must remain heuristic. Evaluate compounded errors rather than counting the appended predictions as new evidence.

### 7.5 AR symptom cascade

**Purpose.** Forecasts each symptom separately and combines predicted symptoms into a simulated score.

**Archived implementation.** ArimaSymptomCascade.forecastSymptoms(symptomHistory, startHorizon, endHorizon, lastPrediction) loops over pain, bowel, blood, energy, appetite and mood fields. It uses time-series extrapolation where history exists, otherwise decay toward a baseline, then calls the historical HealthScoring helper.

**Inputs/outputs.** Per-symptom history, last simulated prediction and horizon range; symptom vectors and a derived demo score.

**Why preserve it.** Demonstrates multivariate output composition and missing-history fallbacks.

**Correct intended behavior.** Keep binary outcomes distinct from continuous values, constrain outputs according to the actual simulation domain, and state that the score is an explicit demo formula. Independent forecasts may produce jointly implausible vectors.

**Validation.** Test each symptom's range/type, lack-of-history fallback, score formula and horizon ordering. Compare the simulated joint trajectory with the generator; do not interpret the derived score as a validated personal-health measure.

## 8. One-app execution architecture

### 8.1 Direct calls instead of the old registered engine

Keep the regular tracker and place the full collection in a Demo Algorithms view. A button selects a named direct handler. That handler captures a demo snapshot, builds its required matrix/labels, calls numerical functions, and formats the result. Scenario prerequisites are ordinary explicit function calls.

~~~text
Demo Algorithms screen
  -> runLassoDemo(snapshot, options)
  -> prepareTrainingPairs(snapshot, target, lagOptions)
  -> fitElasticNet(Xtrain, ytrain, l1Ratio = 1)
  -> evaluate(model, Xtest, ytest)
  -> result + chart + explanation
~~~

A reusable solver is appropriate; restoring a registry, algorithm coordinator, multiple persistent caches and background cleanup machinery is not required to reuse that solver. Avoid running every algorithm automatically on startup or every log write. Run on demand, reuse a captured dataset within a comparison, and only add caching after measurements establish a need.

### 8.2 Enforce demo isolation

The archived ElasticNetForecasting, PCAElasticNet and FlarePredictionLogisticLasso modules query the live data layer during inference. Passing demo training rows alone does not prevent personal-data reads.

The new computation layer should receive its entire input and have no imports from SQLite, Supabase, React contexts or notification services. The UI-facing snapshot loader should select the demo database explicitly, rather than asking for whichever database is currently active. Capture the source revision once per request; switching modes invalidates that request's result.

Use an injected random generator and asOfDate. Re-running the same fixture, seed, parameters and implementation revision should produce repeatable results within numeric tolerance. The existing randomly generated preview is useful for browsing, but is not sufficient as the only correctness test dataset.

### 8.3 Demo scores and labels

Many historical workflows depend on healthScore/compositeScore. Current personal tracking deliberately removed the fabricated composite status. For the demo, define synthetic scores and event labels with visible formulas, ranges and planted dependencies. Store them in the simulated snapshot, with names/provenance that distinguish them from measured symptoms.

Example: a simulated outcome can depend on two planted exposures, a prior-day symptom and seeded noise. The explanation should disclose this generator, so recovering that relationship demonstrates implementation capability rather than implying clinical discovery.

### 8.4 Performance and lifecycle

Use bounded dataset/feature/window sizes and bounded optimizer iterations. Report convergence separately from successful execution. Long synchronous loops can block React Native's JavaScript thread; placing them in an async function does not move them to another thread, and racing a timeout does not stop synchronous computation.

Measure device execution. Use incremental yielding or an appropriate worker for genuinely expensive algorithms, especially all-pairs DTW. Stop/cancel obsolete work when the screen or data source changes. Results should show calculation status and allow retry without blocking app startup.

## 9. Validation methodology

### 9.1 Numerical correctness

Use small reference cases before rich simulations: a known linear system, an analytically checkable probability, a rank-one matrix, two clusters with noise, and a short DTW grid. Assert expected numerical properties, not just object keys or success flags.

Check finite values, feature/target alignment, dimensions, reproducibility, and input immutability. Handle zero variance, one class, empty matrices, invalid parameters, missing days and duplicate dates explicitly. Compare handwritten solvers with trusted reference implementations using equivalent objectives and tolerances.

### 9.2 Predictive evaluation

Use chronological training/validation/test periods for time-dependent demos. Tune parameters on validation only, and report a final held-out test once the design is chosen. Preprocessing and feature selection belong within each training fold. [Cross-validation guidance](https://scikit-learn.org/stable/modules/cross_validation.html)

For overlapping event windows, ensure a training label's future interval does not enter the held-out interval. Select an explicit date gap appropriate to label/feature overlap. Ordinary shuffled folds are not a faithful future-prediction test. [TimeSeriesSplit and gap parameter](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html)

Compare regression with the mean and persistence forecasts; compare classification with class-prevalence/majority baselines. Report error by horizon. A weak model should be allowed to lose to a baseline in the demo.

### 9.3 Metrics and interpretation

| Task | Useful recorded outputs | Avoid interpreting as |
|---|---|---|
| Continuous regression | Held-out MAE/RMSE, R-squared, residuals, baseline error | Guaranteed future accuracy |
| Binary classification | Confusion matrix, recall/precision, ROC/PR summaries where defined, Brier score | Calibrated clinical probability by default |
| PCA | Explained variance, reconstruction error, component/loadings stability | Predictive success |
| Clustering | Membership stability, distances, inertia/silhouette where defined | Disease subtypes |
| DTW | Cost, path, constraint, candidate count, retrieval against planted motifs | Recurrence probability |
| Scenarios | Baseline/modified model predictions, input-domain checks | Causal treatment benefit |

Choose metrics that match the task and class distribution; a high accuracy can merely reflect a dominant class. [Model evaluation reference](https://scikit-learn.org/stable/modules/model_evaluation.html)

### 9.4 Required integration checks

- Execute all 18 main workflows and five selected variants on deterministic fixtures through their real direct handlers.
- Require substantive result payloads and matching visualizations; an empty fallback cannot count as a completed demonstration.
- Verify no demo calculation reads or writes personal SQLite data, calls Supabase, changes notifications, or persists simulated values to personal logs.
- Verify switching Demo Mode during work cannot display an old result under the new data source.
- Verify algorithm failures produce visible local errors while the tracker remains usable.
- Verify persistence/export/import/medication/history behavior independently; mathematical tests do not cover app feature correctness.

No runtime server on port 8081 is required for this documentation or pure-function validation.

### 9.5 Historical claims that need correction

The archived FINAL_TEST_REPORT and TEST_COVERAGE_REPORT contain inconsistent historical pass totals and coverage claims. The archived algorithms-integration test mainly checks imports, and one test replaces ElasticNet execution with a mock. These files are development records, not proof of current end-to-end correctness.

The old flare trainer scores the training rows. The old AR range heuristic is not a validated interval. Metadata thresholds vary across wrapper and internal branches. Small minimum-N settings were product convenience rules, not universally defensible statistical cutoffs. Restore useful numerical work, and replace misleading claims with the actual verified evidence.

## 10. Current direct implementation mapping and release record

### 10.1 Files and execution route

The new source comprises:

- **demoAlgorithms/math.js:** seeded random generator, standardization, Pearson correlation, Jacobi PCA, coordinate-descent regression, proximal logistic regression, Bernoulli/Gaussian Naive Bayes, seeded K-means, DBSCAN, and banded full/rolling-memory DTW.
- **demoAlgorithms/dataset.js:** immutable explicit-demo snapshots, a reproducible coursework generator, and date-aligned supervised pairs.
- **demoAlgorithms/loadDemoSnapshot.js:** reads the demo database explicitly, then adapts its logs. It does not use the active/personal database accessor.
- **demoAlgorithms/seedDemoLogs.js:** transactionally replaces the demo database's records with 150 recent days derived from the same seeded coursework fixture, including complete simulated exposures, pain, energy and taken/skipped medication records.
- **demoAlgorithms/workflows.js:** 23 direct handlers, with shared preparation/evaluation helpers rather than an engine lifecycle.
- **components/analytics/DemoAlgorithmsPanel.js:** a fixed menu of direct handler calls, result rendering, PCA/cluster/series plots and complete-result inspection. It returns no UI outside Demo Mode.

Source review establishes these files and paths exist. The focused test evidence below additionally exercises the numerical/workflow paths and production SQL. Neither replaces device testing or release-build validation.

### 10.2 Handler map

All handler names below are exports of **demoAlgorithms/workflows.js**.

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

### 10.3 Deliberate differences from the coursework archive

The new implementation retains the algorithm families and demonstration entrypoints while reducing feature count, hidden defaults, infrastructure and medical-sounding outputs. That is different from reproducing every historical target/optimization:

1. **Targets:** personal pain is never read by the algorithms. The seeded demo uses simulated pain; the optional current-demo-log loader uses demo pain. Most new regressors predict that outcome instead of historical healthScore/compositeScore formulas.
2. **Endpoint versus window events:** the 3/7/14-day classifier checks pain at t+h. It does not label “any event within the next h days.” The standalone three-day handler uses the same endpoint definition rather than the earlier three-tier rule. These are new transparent target definitions.
3. **PCA event classification:** the current multi-horizon event handler applies PCA, unlike the latest archived direct-no-PCA flare workflow. Its output includes projection information. This is a named demonstration variant, not historical parity.
4. **Forecast horizons:** direct and PCA numeric forecasts use 1/7/14 days, rather than the archive's full same-day through seven-day sequence. Their current prediction is produced by the model fitted to the training period; the AR workflow separately refits after reporting its holdout evaluation.
5. **Clustering:** the new DBSCAN uses projected Euclidean geometry instead of the archive's mixed-feature Gower distance and score bins. New K-means uses a fixed K of three instead of searching K with elbow/silhouette heuristics.
6. **DTW:** the new optimized variant demonstrates rolling-memory exact distance for the selected band. It does not restore every historical beam-search, lower-bound-pruning or cache optimization. Its empty path reflects the memory choice, not a failed distance calculation.
7. **Cascades:** the new models predict a state consisting of pain and six demo inputs. They do not restore the original eight-symptom vector or HealthScoring composition. The score-only variant hides the other predicted state fields; it is not a separate clinical score model.
8. **Naive Bayes:** the new target is binary and continuous inputs are discretized using training means. The archive used score-bin classes and binary trigger frequencies. The optional Gaussian kernel is a separate likelihood-family demonstration.
9. **Coefficients:** the new regression kernels standardize their inputs. Displayed coefficients therefore refer to standardized feature units, or standardized PC units for projected workflows; they are not raw-unit causal effect sizes.

These differences should remain visible in the technical explanations. The UI's “23 workflows” count means 23 callable demonstrations, not 23 independent numerical solvers or proven clinical models.

### 10.4 Current numerical conventions

These conventions come from the new JavaScript source, rather than an assumption that historical defaults were preserved:

- **Scaling:** each feature is centered by its training mean and divided by its population standard deviation. A zero standard deviation uses a divisor of one. The fitted mean/scale are reused for inference.
- **Regression:** the coordinate updates correspond to one-half mean squared error plus lambda times the sum of an L1 term and one-half L2 term. The L1 fraction is l1Ratio. Defaults are lambda = 0.04 and l1Ratio = 0.5; LASSO sets l1Ratio = 1. Inputs are centered, so the intercept is mean(y). Updates stop when coefficient change is below 1e-8 or after 300 sweeps. Returned coefficients are in standardized units.
- **Logistic regression:** mean binary cross-entropy plus an L1 penalty, using a proximal update and an unpenalized intercept. The kernel defaults to lambda = 0.02, but supervised workflow calls currently pass lambda = 0.04. It performs 400 iterations with step size 0.5 divided by feature count. Both classes are required; sigmoid inputs are bounded for numerical stability.
- **PCA:** sample covariance after centering, Jacobi rotations, descending eigenvalue order and selected component count. Rotation termination uses an off-diagonal tolerance of 1e-10 with a bounded rotation count. A zero-variance input produces zero explained-variance fractions. The descriptive workflow standardizes its six inputs before decomposition; projected supervised workflows fit that preprocessing only on training rows.
- **Bernoulli NB:** input j is on when it exceeds its training mean. The class prior is (classCount + 1) / (trainingCount + 2); conditional on/off probabilities use add-one smoothing with denominator classCount + 2. Inference sums log likelihoods and converts the two-class score difference to a probability.
- **K-means:** seeded distance-weighted initialization, Euclidean assignment, centroid mean updates, at most 60 iterations. The workflow fixes K = 3. Empty clusters retain their previous center, so a constant fixture may yield fewer occupied groups than requested.
- **DBSCAN:** Euclidean distance in the two-component projection, epsilon = 0.7, minPoints = 4, counting the point itself in its neighborhood. Noise has label -1. These are demonstration defaults, not tuned health-data parameters.
- **DTW:** squared pointwise pain difference, recurrence using horizontal/vertical/diagonal predecessors, and a final square root of accumulated cost. This distance is not divided by path length. The workflow compares equal-length seven-day windows with band = 2. The rolling variant retains distance rows but no alignment path.

The current kernels bound work but do not return a comprehensive convergence diagnostic or parameter provenance record. That remains a limitation to address before interpreting a numerical result as fully validated. Source-defined iteration counts should not be confused with measured convergence.

### 10.5 Seeded fixture and current evaluation

The coursework generator defaults to seed 42 and 150 dated observations. Six inputs are dairy, spicy, caffeine, fiber, medicationTaken and energy. Simulated pain depends on the previous row's dairy/spicy/fiber/medication inputs, a periodic term and seeded noise, then is bounded to 0–10. Caffeine and energy have no planted direct coefficient in that generator. Recovering the known mechanism on held-out simulated observations demonstrates the implementation; it does not validate those coefficients for a person.

Settings' demo generation now calls **seedDemoLogs**, replacing the former placeholder path. The seeder takes an explicit demo-database handle, clears its prior records and inserts the new fixture in one transaction. The fixture's relative days are shifted to end at the requested date, defaulting to the current local calendar date. It inserts clearly named simulated food items, one simulated medication with no configured notification times, daily taken/skipped logs, pain and energy, and a note identifying the rows as simulated examples. Every day includes a plain meal carrying the generated fiber amount; selected extra foods supply dairy/spicy/caffeine tags. Thus loading these newly generated demo logs recreates complete input features rather than relying on absent-log defaults. This is a simulation and does not infer values for personal logs.

The snapshot limits calculations to the latest 180 rows. Supervised pairing requires exact calendar endpoints. Most supervised workflows use an 80/20 chronological holdout with a horizon-sized excluded gap and fit preprocessing on training rows. The PCA-only/cluster workflows are descriptive and use their full supplied feature snapshot.

AR and cascade holdout metrics evaluate **one-step predictions using observed lag/state inputs**. Their later recursive forecasts compound predicted inputs. Those metrics must not be presented as measured accuracy of the entire 7- or 14-step recursive trajectory. Scenario comparisons are model behavior, not separately validated intervention effects.

**Current-demo-log limitation:** the loader and snapshot adapter currently default unrecorded feature values to zero. This treats missing exposures/energy as values for demonstration; it does not establish absence. Seeded coursework data is complete by construction. Before interpreting current demo logs, disclose or replace this default with completeness/missingness rules.

### 10.6 Verification record

The implementation task reports this focused command passing on October 6, 2026:

~~~sh
npx jest __tests__/database.integration.test.js __tests__/demoAlgorithms.test.js --runInBand --silent
~~~

**Result: 41 tests passed, two suites passed.** The test sources were reviewed for the following coverage:

- **PCA:** known rank-one eigenvalue and direction, unit/orthogonal component vectors, explained variance and reuse of a fitted projection.
- **Regression/classification:** a known affine regression, sparse removal of an irrelevant constant feature, binary class separation, one-class rejection, and finite smoothed Bernoulli probabilities for unseen patterns.
- **Clustering/DTW:** separated groups for K-means and DBSCAN, explicit DBSCAN noise, exact full-versus-rolling DTW distance agreement for unequal sequences, and full-path endpoint assertions.
- **All 23 direct handlers:** actual deterministic execution, finite numeric outputs, substantive array payloads, rejection of explicit real-mode snapshots and rejection of empty demo snapshots. This checks the direct calculations; it does not count an import or mocked result as execution.
- **Temporal preparation:** missing calendar days/targets do not silently become complete supervised pairs. Perturbing held-out targets leaves fitted coefficients and PCA unchanged for tested regression workflows while changing held-out error.
- **Seeded behavior:** the direct ElasticNet demonstration beats a constant-mean baseline on the known complete simulated fixture; snapshots remain bounded/immutable, and missing pain stays missing.
- **Production SQL with in-memory SQLite:** foreign keys/orphan behavior, zero/null and partial symptom updates, concurrent saves, optional/legacy medication fields, active toggles and deletion, explicit demo loading/wiping, food-only analytics and explicit cache mode.

These tests establish useful numerical and integration evidence within their fixtures. They do not establish every possible input, historical byte-for-byte parity, a medically valid target, or device performance. The focused 41-test run is not a full-suite pass.

**Full-suite verification:** `npx jest --runInBand --silent` passed all **267 tests across 29 suites**, including selection/execution of every algorithm in the React Native demo panel. The transactional demo seeder recreates the complete fixture in SQLite, all 23 workflows run from those stored logs, and a simulated populate failure rolls back the replacement while preserving prior data.

**iOS bundle verification:** `CI=1 npx expo export --platform ios --output-dir .expo/verified-ios-export` succeeds and generates a 6.9 MB Hermes bundle. This is JavaScript/assets packaging, not an Xcode archive or TestFlight/device pass. No development server was left listening on port 8081.

**Additional feature coverage:** tests cover saved local-mode auth races, cloud signup form retry behavior, auth transport deadlines, concurrent daily reminder replacement without cancelling medication reminders, AI consent with no outbound request on decline, durable account-cleanup retries, symptom selection persistence, partial CSV/food edits preserving zero and existing data, date-only/calendar handling, midnight and foreground rollover, stale date/mode responses, write/batch refresh signals, History pagination/errors, expired SQLite caches, and validated personal-only backup/restore with media remapping and rollback/failure outcomes.

**Still pending:** native-device smoke testing and responsive execution measurements, reminder delivery on device, deployed account-deletion function/schema verification, Xcode/archive signing, TestFlight and final release checks. Successful tests and synthetic holdout scores do not establish clinical validity.

The demonstration's strongest portfolio story is the combination of implementation, visual explanation, measured evaluation and honest limitations. Keeping the full algorithm collection inside Demo Mode preserves that story while making the personal tracker more dependable.
