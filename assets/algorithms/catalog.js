/* Technical definitions, concrete examples and exact implementation metadata for all 23 demo handlers. */
window.GutopiaCatalog = [
  {
    id: "lasso",
    title: "LASSO regression",
    short: "LASSO",
    group: "Regression",
    icon: "∑",
    handler: "runLasso",
    type: "regression",
    description:
      "Fit a linear prediction model with an L1 penalty that can set input coefficients to zero.",
    evaluation:
      "RMSE summarizes mistakes in simulated pain-scale points: lower is better, and large misses count more heavily. The mean-baseline RMSE comes from always predicting the training period’s average pain. R² describes improvement over the test period’s average-based variation and can be negative. The plotted predictions are for held-out test days, not the days used to learn.",
    purpose:
      "LASSO is a form of linear regression: it predicts a numeric outcome by adding an intercept to a weighted sum of input variables. The learned weights are called coefficients. Unlike ordinary least-squares regression, LASSO adds a cost for the absolute sizes of those coefficients. This L1 penalty can make some coefficients exactly zero, leaving a smaller set of inputs in the fitted model. It is useful for variable selection and regression problems with many candidate predictors, although correlated variables can compete for the same contribution.\n\nOur demonstration uses six simulated inputs—dairy, spicy, caffeine, fiber, medicationTaken and energy—to predict pain exactly one calendar day later. Earlier date pairs train the model; later pairs evaluate it, with one pair excluded at the split. Training-only standardization makes input units comparable. The output includes coefficients, a current prediction, training and held-out metrics, and a dated prediction series. The purpose is to check sparse fitting against a known simulated relationship, not infer real dietary causes.",
    math: "min β,b  (1 / 2n) Σ(yᵢ − b − xᵢ·β)² + λ Σ|βⱼ|",
    mathNote:
      "The expression minimizes an objective, a number measuring prediction error plus coefficient cost. n is the number of training pairs; yᵢ is their actual target; xᵢ is a standardized input row; β contains its coefficients; and b is the intercept. The squared-error term is averaged and divided by two. λ multiplies the sum of absolute coefficient values, the L1 penalty. This demo fixes λ at 0.04. b is unpenalized. A zero βⱼ removes that input from this fitted prediction function.",
    how: "The workflow first matches each input date with pain on the next calendar date. It reserves roughly the last 20% of valid pairs for evaluation and excludes one boundary pair. The solver subtracts each training input's mean and divides by its population standard deviation, reusing those values for every prediction. A constant input uses a divisor of one.\n\nFitting uses coordinate descent: repeatedly updating one coefficient while retaining the others. Each update measures its relationship with the remaining prediction error, then applies soft thresholding, which reduces the coefficient magnitude and sets small contributions to zero. The penalty is λ = 0.04. Updates stop when the largest coefficient change is below 1e−8 or after 300 passes. The intercept is the training target mean and is not penalized. Returned coefficients refer to standardized inputs; the workflow does not separately expose the intercept.",
    why: "LASSO demonstrates regularization—restricting a model's coefficients to discourage unnecessarily complex fitting—and automatic variable selection. The seeded data contains known contributing inputs and inputs with no planted direct contribution. That lets us compare coefficient selection with the generator and held-out errors with a training-mean baseline. Choosing fewer inputs is a tradeoff: excessive shrinkage can also discard useful information.",
    archive:
      "The coursework version accepted a larger collection of food tags, medication records and previous-day measurements, and often predicted a combined health score. This direct demonstration uses six named inputs and next-day simulated pain. It also reserves later days as a separate test instead of treating the fit on learning days as the final evidence.",
    limitations:
      "A retained weight says that an input helps this model under its assumptions. It does not show that changing a real food causes a health change. Similar inputs can trade weight between themselves, and a fixed penalty can remove a useful but weak feature.",
    steps: [
      [
        "Form next-day training pairs",
        "Match each six-input row to pain exactly one calendar day later; exclude missing endpoints.",
      ],
      [
        "Separate training and evaluation",
        "Reserve the later 20% of pairs and exclude one boundary pair; calculate input means/scales on training rows only.",
      ],
      [
        "Fit sparse linear coefficients",
        "Use coordinate descent with λ = 0.04 and an L1 penalty; small coefficients can become zero.",
      ],
      [
        "Evaluate held-out predictions",
        "Compare predicted pain with later observations using RMSE, R² and the training-mean baseline.",
      ],
    ],
    source: [
      "LASSO objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Lasso.html",
    ],
    number: 1,
    plainLanguage: {
      what: "LASSO is a form of linear regression: it predicts a numeric outcome by adding an intercept to a weighted sum of input variables. The learned weights are called coefficients. Unlike ordinary least-squares regression, LASSO adds a cost for the absolute sizes of those coefficients. This L1 penalty can make some coefficients exactly zero, leaving a smaller set of inputs in the fitted model. It is useful for variable selection and regression problems with many candidate predictors, although correlated variables can compete for the same contribution.\n\nOur demonstration uses six simulated inputs—dairy, spicy, caffeine, fiber, medicationTaken and energy—to predict pain exactly one calendar day later. Earlier date pairs train the model; later pairs evaluate it, with one pair excluded at the split. Training-only standardization makes input units comparable. The output includes coefficients, a current prediction, training and held-out metrics, and a dated prediction series. The purpose is to check sparse fitting against a known simulated relationship, not infer real dietary causes.",
      uses: "Common uses: selecting variables, simplifying forecasts, and exploring high-dimensional measurements.",
    },
    methodology: [
      [
        "The question",
        "Can a small weighted combination of today’s six generated inputs estimate tomorrow’s simulated pain? The simulated formula gives some inputs nonzero contributions and others no direct contribution, so coefficient selection can be checked against a known mechanism.",
      ],
      [
        "How the model learns",
        "We match each input date to pain exactly one calendar day later. The first roughly 80% of pairs supply the training period; the last 20% are reserved for held-out evaluation. One pair at the boundary is left out. Input means and spreads come only from the earlier period, and the L1 penalty can remove weak weights.",
      ],
      [
        "How to read the test",
        "RMSE summarizes mistakes in simulated pain-scale points: lower is better, and large misses count more heavily. The mean-baseline RMSE comes from always predicting the training period’s average pain. R² describes improvement over the test period’s average-based variation and can be negative. The plotted predictions are for held-out test days, not the days used to learn.",
      ],
      [
        "What that tells us",
        "A good result supports this implementation on this simulator. The coefficient bars show standardized contributions in the fitted model; they do not estimate dietary intervention effects. Different seeds can reveal how stable the selection is.",
      ],
    ],
    example:
      "Illustrative arithmetic, not this seed's fitted result: suppose the intercept is 3.2 and three standardized inputs have coefficients 0.9, −0.4 and 0. For a row with standardized values 1, 0.5 and 2, the prediction is 3.2 + 0.9×1 − 0.4×0.5 + 0×2 = 3.9. The third input has no contribution because its coefficient is zero. If the actual next-day target is 4.5, the prediction error is 0.6 pain-scale points. Repeating that comparison across held-out dates produces the error metrics; it does not turn the retained coefficients into causal effects.",
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
      "Fit a linear prediction model combining coefficient selection with smooth coefficient shrinkage.",
    evaluation:
      "The violet line contains predictions for the held-out days; mint is the actual simulated pain. RMSE is a typical error summary in pain-scale points, with extra weight on large misses. Compare it with the mean-baseline RMSE, which always predictions the learning-period average. A negative R² means the model explains those test outcomes poorly.",
    purpose:
      "ElasticNet is linear regression with two coefficient penalties. Its L1 term adds the absolute coefficient sizes and can set some weights to zero. Its L2 term adds squared coefficient sizes and shrinks weights smoothly. Combining them is useful when predictors are correlated: several related variables may retain smaller coefficients instead of one variable receiving most of the contribution. The overall penalty controls shrinkage, while a mixing fraction controls how much each penalty contributes. These settings affect both model simplicity and prediction error.\n\nOur demonstration predicts next-day simulated pain from the same six inputs and date pairs used by LASSO. It uses λ = 0.04 and an L1 mixing fraction of 0.5. Scaling and coefficient fitting use earlier rows; the last roughly 20% of pairs are held out after a one-pair gap. Results include standardized coefficients, a current prediction, dated held-out predictions, RMSE, R² and baseline error. Comparing it with LASSO isolates the effect of the penalty choice.",
    math: "min β,b  MSE / 2 + λ [α Σ|βⱼ| + (1−α) Σβⱼ² / 2]",
    mathNote:
      "MSE is the mean squared prediction error; β is the coefficient vector and b is the intercept. λ controls the total regularization strength. α, called l1Ratio in code, sets the L1/L2 mixture: 1 gives pure LASSO and 0 gives an L2-only penalty. Here λ = 0.04 and α = 0.5. The squared-coefficient term includes a factor of one-half, as shown. Matching these conventions matters when comparing another solver's parameters. Coefficients use standardized input units, and b is unpenalized.",
    how: "Create exact one-day input/target pairs, split them chronologically and exclude one pair before the holdout boundary. Standardize the six inputs using the training means and population standard deviations. The fitted model keeps these values so held-out rows use identical scaling. The intercept is the average training target and remains unpenalized.\n\nThe handwritten solver updates one coefficient at a time. It applies an L1 soft threshold to the coefficient's residual association, then divides by a term incorporating the L2 penalty. After each update it adjusts the stored residual errors, avoiding a complete recomputation. This is coordinate descent. The workflow uses λ = 0.04 and l1Ratio = 0.5, stopping below a largest coefficient change of 1e−8 or after 300 passes. Predictions are evaluated on later rows the coefficients did not use for fitting.",
    why: "This provides a controlled comparison with LASSO: the data and next-day target stay the same while the coefficient penalty changes. Combining selection with L2 shrinkage can make coefficients less dependent on choosing one of several correlated inputs. It can also retain more nonzero terms. Held-out error determines whether that tradeoff helps this fixture; neither penalty guarantees a better model or supplies information missing from the inputs.",
    archive:
      "The coursework also used a handwritten ElasticNet solver, but its wrappers could use alpha to mean different things. The direct demonstration states the objective and settings explicitly, uses a fixed six-input snapshot, and predicts simulated pain instead of a broader historical score.",
    limitations:
      "Shrinking weights can reduce overfitting, but cannot create information that is absent from the inputs. The fixed penalty may be too strong or too weak for another dataset. Weight magnitudes refer to scaled inputs, so they should not be read as changes per real-world food serving.",
    steps: [
      [
        "Align inputs and targets",
        "Use the six inputs at one date and pain at the exact next-day endpoint.",
      ],
      [
        "Fit training-only scaling",
        "Reserve later pairs, exclude one boundary pair and retain the earlier period’s means and standard deviations.",
      ],
      [
        "Apply the mixed penalty",
        "Update coefficients with L1 thresholding and L2 shrinkage using λ = 0.04 and l1Ratio = 0.5.",
      ],
      [
        "Compare with direct LASSO",
        "Inspect standardized coefficients and held-out RMSE/R² on the same seed and dates.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 2,
    plainLanguage: {
      what: "ElasticNet is linear regression with two coefficient penalties. Its L1 term adds the absolute coefficient sizes and can set some weights to zero. Its L2 term adds squared coefficient sizes and shrinks weights smoothly. Combining them is useful when predictors are correlated: several related variables may retain smaller coefficients instead of one variable receiving most of the contribution. The overall penalty controls shrinkage, while a mixing fraction controls how much each penalty contributes. These settings affect both model simplicity and prediction error.\n\nOur demonstration predicts next-day simulated pain from the same six inputs and date pairs used by LASSO. It uses λ = 0.04 and an L1 mixing fraction of 0.5. Scaling and coefficient fitting use earlier rows; the last roughly 20% of pairs are held out after a one-pair gap. Results include standardized coefficients, a current prediction, dated held-out predictions, RMSE, R² and baseline error. Comparing it with LASSO isolates the effect of the penalty choice.",
      uses: "Common uses: forecasting, correlated measurements, and models with many overlapping predictors.",
    },
    methodology: [
      [
        "The question",
        "Can a model balance simplicity and stability while predicting next-day simulated pain? ElasticNet uses the same six inputs as LASSO, so differences come from the weight penalty rather than a different dataset or target.",
      ],
      [
        "How the model learns",
        "Exact one-day date pairs are divided into an earlier training period and a later test period, roughly 80% and 20%. A one-day gap separates them. We learn input means and spreads from the earlier period, then fit a model with equal L1 and L2 contributions and a total penalty of 0.04.",
      ],
      [
        "How to read the test",
        "The violet line contains predictions for the held-out days; mint is the actual simulated pain. RMSE is a typical error summary in pain-scale points, with extra weight on large misses. Compare it with the mean-baseline RMSE, which always predictions the learning-period average. A negative R² means the model explains those test outcomes poorly.",
      ],
      [
        "What that tells us",
        "Better test performance than the simple mean shows useful signal on this generator. It does not identify a medically appropriate predictor or prove that a model weight is causal. Compare several seeds and direct LASSO before concluding that the mixed penalty helps.",
      ],
    ],
    example:
      "Illustrative coefficients, not this seed's result: suppose two correlated standardized inputs receive weights 0.45 and 0.40 instead of one receiving 0.85 and the other zero. If both input values are 1, their combined prediction contribution is 0.85 in either case. ElasticNet can prefer distributing weight because its L2 term penalizes one large coefficient more than two smaller ones: 0.85² is 0.7225, while 0.45² + 0.40² is 0.3625. The full objective still includes prediction error and L1 cost. Later observations must determine whether this distribution actually improves prediction.",
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
      "Project six inputs onto four principal components, then fit an L1-penalized regression to predict next-day pain.",
    evaluation:
      "The chart compares held-out predictions with actual simulated pain. RMSE measures error in pain-scale points; compare it with the error from always predicting the earlier period’s mean. The coefficient bars are PC weights, meaning contributions from principal components. They are not food-specific effects or PCA loadings, which define the component directions.",
    purpose:
      "PCA plus LASSO combines dimensionality reduction with sparse regression. Principal component analysis, or PCA, creates new coordinates from weighted combinations of the original variables. It orders those coordinates by how much input variation they capture. LASSO then predicts a numeric target from those component coordinates, applying an L1 penalty that can remove component coefficients. This combination is useful for testing whether a compressed representation of correlated measurements improves regression. PCA itself does not look at the target and therefore can discard a low-variance direction that predicts it well.\n\nOur workflow starts with six simulated inputs and next-day pain. It learns input scaling and four PCA directions from the earlier training rows only, then fits LASSO on their component scores. Held-out and current inputs reuse that transform. Outputs include the fitted PCA loadings and variance fractions, component coefficients, predictions and evaluation metrics. The coefficient bars refer to standardized principal components, not separate food or medication effects.",
    math: "Z = standardize(X) · V₄\nŷ = b + Z·β  with an L1 penalty on β",
    mathNote:
      "X is the six-column input matrix. V₄ contains four PCA directions fitted on standardized training inputs. Multiplication gives Z, the component scores for those rows. β contains regression weights and b is the regression intercept. The displayed expression summarizes the two-stage pipeline: in the actual solver, Z is additionally centered and standardized before its weighted sum is fitted. Consequently, returned β values use standardized component units. The L1 penalty is applied to regression coefficients, not to PCA loadings or individual original inputs.",
    how: "Form exact next-day pairs, reserve the later evaluation period and exclude one boundary pair. Standardize the training inputs. Build their covariance matrix, which records how columns vary together, and use Jacobi eigenanalysis to find PCA directions ordered by decreasing variance. Retain four directions and project the training rows onto them; the resulting coordinates are component scores.\n\nLASSO standardizes those component scores again before fitting an L1-penalized linear model with λ = 0.04. Later rows first use the original training scaler and PCA directions, then the regression's fitted component scaler. Nothing is refitted from the held-out inputs or targets. The workflow returns projection information, standardized component coefficients and dated actual/predicted outcomes. Evaluate these against direct LASSO to see whether losing two input directions helped or harmed prediction.",
    why: "The purpose is to evaluate a composed model against a direct-input model on the same prediction task. PCA may remove redundant variation; LASSO may remove component contributions that do not justify their coefficient cost. This does not necessarily select a smaller set of original variables, because each component can combine all six. Compression is worthwhile only if the resulting evaluation and interpretability suit the task.",
    archive:
      "The historical wrapper could skip PCA and use other fallback paths. This direct entry explicitly uses four components on the complete six-input fixture, then fits sparse regression. Its displayed weights belong to combined directions rather than individual original inputs.",
    limitations:
      "Removing a weak component weight does not necessarily remove an original food from the model, because each component mixes inputs. PCA chooses directions by input variation, not by their usefulness for predicting pain, so compression can lose a useful feature.",
    steps: [
      [
        "Prepare next-day pairs and holdout",
        "Use exact endpoint dates, reserve later rows and exclude one pair before the split.",
      ],
      [
        "Fit four training PCA components",
        "Standardize training inputs, decompose their covariance and retain four directions.",
      ],
      [
        "Fit LASSO on component scores",
        "Standardize the component coordinates and use an L1 penalty with λ = 0.04.",
      ],
      [
        "Reuse transforms and evaluate",
        "Project later/current rows with the fitted scalers and PCA; compare held-out error with direct LASSO.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 3,
    plainLanguage: {
      what: "PCA plus LASSO combines dimensionality reduction with sparse regression. Principal component analysis, or PCA, creates new coordinates from weighted combinations of the original variables. It orders those coordinates by how much input variation they capture. LASSO then predicts a numeric target from those component coordinates, applying an L1 penalty that can remove component coefficients. This combination is useful for testing whether a compressed representation of correlated measurements improves regression. PCA itself does not look at the target and therefore can discard a low-variance direction that predicts it well.\n\nOur workflow starts with six simulated inputs and next-day pain. It learns input scaling and four PCA directions from the earlier training rows only, then fits LASSO on their component scores. Held-out and current inputs reuse that transform. Outputs include the fitted PCA loadings and variance fractions, component coefficients, predictions and evaluation metrics. The coefficient bars refer to standardized principal components, not separate food or medication effects.",
      uses: "Common uses: compressed regression, correlated sensor inputs, and comparisons with direct-feature models.",
    },
    methodology: [
      [
        "The question",
        "Does compressing today’s inputs before fitting LASSO help or hurt next-day prediction? This workflow answers the same simulated-pain question as direct LASSO, but uses four principal-component directions rather than the original six fields.",
      ],
      [
        "How the model learns",
        "We form exact next-day pairs, reserve roughly the last 20% for testing, and leave a one-day boundary gap. Scaling and PCA are learned only from the earlier inputs. Four directions are retained, and a sparse regression model learns weights on those component coordinates. Later inputs pass through the saved transformation unchanged.",
      ],
      [
        "How to read the test",
        "The chart compares held-out predictions with actual simulated pain. RMSE measures error in pain-scale points; compare it with the error from always predicting the earlier period’s mean. The coefficient bars are PC weights, meaning contributions from principal components. They are not food-specific effects or PCA loadings, which define the component directions.",
      ],
      [
        "What that tells us",
        "Compare these errors with direct LASSO on the same seed. Lower error would support this compression choice for this fixture; higher error can expose lost predictive information. Capturing input variation alone never guarantees an accurate target prediction.",
      ],
    ],
    example:
      "Illustrative values, not the current fitted result: suppose a standardized row projects to component scores 1.2, −0.5, 0.1 and 0.8. After the regression's component scaling, imagine the same values for simplicity. With intercept 3 and weights 0.7, 0, −0.2 and 0, the prediction is 3 + 0.7×1.2 − 0.2×0.1 = 3.82. LASSO has removed two component contributions. It has not necessarily removed two original variables: each remaining component may combine several inputs. The PCA loadings describe those combinations; the regression coefficients describe their contribution to this prediction.",
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
      "Fit a sparse logistic classifier for whether simulated pain reaches five at the next-day endpoint.",
    evaluation:
      "Accuracy is the fraction of correct yes/no decisions, but can hide an uneven class balance. Precision asks how many positive predictions were right; recall asks how many actual positives were found. Brier score measures squared probability mistakes: a confident wrong probability costs more, and lower is better. Mint dots show labels, while the violet line shows probabilities.",
    purpose:
      "Logistic regression predicts a binary outcome, meaning one of two classes. It combines input values into a linear score and applies the sigmoid function, converting that score into a number between zero and one. Training seeks probabilities consistent with the observed labels. Logistic LASSO adds an L1 coefficient penalty, so some inputs may receive zero coefficients. It is useful for classification tasks where a linear decision boundary and a smaller input set are appropriate. A probability-shaped output still requires calibration testing before its numeric value is treated as a reliable event frequency.\n\nOur outcome is explicit: next-day simulated pain at least 5 is class 1; lower pain is class 0. Six inputs from today predict that exact tomorrow label. Earlier pairs supply scaling and fitting, while later pairs test the model after a one-pair gap. Results include coefficients, held-out probabilities and labels, a current probability, accuracy, precision, recall and Brier score. Probability 0.5 is the decision cutoff; it is distinct from the pain threshold of 5.",
    math: "p(y = 1 | x) = 1 / (1 + exp(−b − x·β))\nmin  mean binary cross-entropy + λ Σ|βⱼ|",
    mathNote:
      "x is a standardized input row, β its learned coefficients and b the intercept. Their sum is the linear score. exp is the exponential function; applying the sigmoid maps that score to p, the model's class-1 probability. Binary cross-entropy is the mean negative log probability assigned to the correct labels. λΣ|βⱼ| adds the L1 cost; this workflow uses λ = 0.04. The outcome rule is next-day pain ≥ 5. The separate probability threshold of 0.5 converts predictions into class decisions.",
    how: "Match each input row with the exact next calendar day's pain, then convert targets to labels using pain ≥ 5. Make a chronological 80/20 split, excluding one boundary pair. Training must contain both classes. Input means and population standard deviations come from training rows and are retained for later predictions.\n\nThe solver minimizes mean binary cross-entropy, which penalizes probabilities inconsistent with the labels, plus an L1 coefficient penalty of λ = 0.04. It uses proximal gradient descent: a gradient update reduces the smooth probability loss, then soft thresholding applies L1 shrinkage. The intercept updates without a penalty. It performs 400 iterations with step size 0.5 divided by six inputs. Sigmoid scores are clamped between −35 and 35 for numerical stability. Held-out classification uses probability ≥ 0.5, while Brier score evaluates the probabilities themselves.",
    why: "This demonstrates the difference between predicting a pain value, estimating a binary probability and deciding a class. L1 regularization also makes the coefficient-selection comparison with numeric LASSO possible. Precision, recall and probability error reveal failures hidden by accuracy alone. The fixed simulated label makes the learning problem inspectable; it does not define a clinical event or establish calibrated health risk.",
    archive:
      "The coursework also used handwritten sparse logistic regression, but had different target mappings and input extraction. This direct version says exactly what the binary label means and distinguishes performance on saved later days from performance on its own training examples.",
    limitations:
      "A number between zero and one is not automatically a well-calibrated probability. Accuracy can look good when one class is much more common. The pain threshold is a synthetic demonstration rule, not a validated definition of a Crohn’s flare.",
    steps: [
      [
        "Define the next-day labels",
        "Pain at the exact next-day endpoint is class 1 when it is at least 5, otherwise class 0.",
      ],
      [
        "Reserve later rows and scale inputs",
        "Exclude one boundary pair; fit means/scales from training only and require both training classes.",
      ],
      [
        "Fit sparse probabilities",
        "Apply 400 proximal-gradient updates to cross-entropy plus λ = 0.04 L1 regularization.",
      ],
      [
        "Evaluate decisions and probabilities",
        "Use a 0.5 decision cutoff; inspect accuracy, precision, recall, Brier score and the held-out series.",
      ],
    ],
    source: [
      "Logistic regression",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html",
    ],
    number: 4,
    plainLanguage: {
      what: "Logistic regression predicts a binary outcome, meaning one of two classes. It combines input values into a linear score and applies the sigmoid function, converting that score into a number between zero and one. Training seeks probabilities consistent with the observed labels. Logistic LASSO adds an L1 coefficient penalty, so some inputs may receive zero coefficients. It is useful for classification tasks where a linear decision boundary and a smaller input set are appropriate. A probability-shaped output still requires calibration testing before its numeric value is treated as a reliable event frequency.\n\nOur outcome is explicit: next-day simulated pain at least 5 is class 1; lower pain is class 0. Six inputs from today predict that exact tomorrow label. Earlier pairs supply scaling and fitting, while later pairs test the model after a one-pair gap. Results include coefficients, held-out probabilities and labels, a current probability, accuracy, precision, recall and Brier score. Probability 0.5 is the decision cutoff; it is distinct from the pain threshold of 5.",
      uses: "Common uses: binary pattern recognition, sparse classification, and probability-based decisions.",
    },
    methodology: [
      [
        "The question",
        "How well can today’s six generated inputs distinguish whether tomorrow’s simulated pain will be at least five? We turn that exact rule into yes/no labels before learning a model. A “yes” is a demo class, not a medical event.",
      ],
      [
        "How the model learns",
        "Inputs and labels are paired one calendar day apart. Roughly the first 80% train the model and the last 20% check it, with a one-day boundary gap. Input scaling comes from earlier days only. The sparse logistic model fits a probability function for each later example, then uses 0.5 as its decision cutoff.",
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
    example:
      "Illustrative prediction, not this seed's output: suppose a standardized row has linear score 1. The sigmoid gives 1/(1+exp(−1)), approximately 0.731. At the 0.5 cutoff the predicted class is 1. If next-day simulated pain is 6, the observed label is also 1; if it is 4, the label is 0. The same probability has Brier error about 0.072 in the first case and 0.534 in the second, because that metric squares probability minus label. This explains why a confident wrong answer matters even when only a yes/no decision is displayed.",
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
      "Classify the next-day pain threshold by combining smoothed frequencies of six binary input indicators.",
    evaluation:
      "The violet line is the computed probability and mint dots are actual later labels. Accuracy checks decisions at a 0.5 cutoff; precision and recall describe positive decisions. Brier score checks the probabilities themselves, penalizing confident mistakes more strongly. Lower Brier is better; high accuracy alone may simply reflect a common class.",
    purpose:
      "Naive Bayes is a probabilistic classifier based on Bayes' rule. It combines a class prior—the class frequency before considering inputs—with likelihoods describing how typical each input is within that class. Its defining simplification is conditional independence: inputs are treated as independent once the class is specified. Bernoulli Naive Bayes uses binary on/off inputs. This makes it a transparent baseline for classification, with few fitted counts rather than an iterative regression optimizer. Correlated inputs can violate its assumption and contribute overlapping evidence.\n\nOur workflow predicts whether next-day simulated pain is at least 5. Each of the six inputs is converted to “on” when it exceeds its training-period mean, including continuous fiber and energy. The earlier date pairs supply those thresholds, class counts and conditional frequencies; later pairs evaluate predictions after a one-pair gap. Add-one smoothing prevents unseen on/off values from receiving zero likelihood. Outputs include class parameters, probabilities, classification metrics and the held-out series. The workflow does not expose the fitted threshold vector as a separate output field.",
    math: "P(c | x) ∝ P(c) ∏ⱼ P(xⱼ | c)\nP(xⱼ = 1 | c) = (onCount + 1) / (classCount + 2)",
    mathNote:
      "c is a class and x is its binary input vector. The proportionality sign means prior times likelihoods produces unnormalized class weights; dividing by the sum of weights gives posterior probabilities. The product treats each input as conditionally independent. onCount is the number of training examples in class c with an input above its fitted mean; classCount counts all examples in that class. Adding one in the numerator and two in the denominator smooths both on and off possibilities. Class priors are smoothed separately.",
    how: "Create exact next-day pairs and binary pain ≥ 5 labels, reserve the final roughly 20% for evaluation and exclude one boundary pair. Both classes must occur in training. For each input, calculate its training mean and classify values strictly greater than that mean as on. Count each indicator's on/off occurrences within each class.\n\nThe class prior uses (classCount + 1)/(trainingCount + 2). Conditional on probabilities use (onCount + 1)/(classCount + 2); off probabilities are their complements. These added counts are Laplace smoothing, which keeps probabilities nonzero when a pattern was not observed. Prediction adds the log prior and six log likelihoods for each class, then normalizes the two log scores into a class probability. This log-space calculation avoids multiplying many small numbers. Held-out data does not alter thresholds or counts.",
    why: "This supplies a frequency-based comparison with logistic LASSO on the same one-day label. Its parameters are directly interpretable as class-specific input probabilities, and it needs no iterative coefficient optimization. The tradeoff is strong independence assumptions and information loss from turning continuous values into binary indicators. Useful classification on the simulator establishes neither independence in personal data nor a clinically meaningful threshold.",
    archive:
      "The old EnhancedNaiveBayes also used on/off trigger frequencies, but predicted five bins of a historical score. This direct demonstration instead predicts the next-day binary pain threshold and learns input cutoffs from the earlier period. The separate Gaussian helper models continuous values and is not this selected entry.",
    limitations:
      "The simplifying independence assumption is often wrong when features overlap. Turning continuous values into on/off indicators loses detail. Smoothing prevents zero-count failures, but does not prove that the resulting probabilities match real event frequencies.",
    steps: [
      [
        "Pair dates and define classes",
        "Use today’s inputs with next-day pain; class 1 means pain ≥ 5.",
      ],
      [
        "Fit six binary thresholds",
        "An input is on only when it exceeds its mean across training rows.",
      ],
      [
        "Count and smooth class evidence",
        "Estimate priors and conditional on/off likelihoods with add-one smoothing.",
      ],
      [
        "Normalize and evaluate probabilities",
        "Combine log likelihoods for held-out rows, then inspect decisions and Brier probability error.",
      ],
    ],
    source: [
      "Naive Bayes families",
      "https://scikit-learn.org/stable/modules/naive_bayes.html",
    ],
    number: 5,
    plainLanguage: {
      what: "Naive Bayes is a probabilistic classifier based on Bayes' rule. It combines a class prior—the class frequency before considering inputs—with likelihoods describing how typical each input is within that class. Its defining simplification is conditional independence: inputs are treated as independent once the class is specified. Bernoulli Naive Bayes uses binary on/off inputs. This makes it a transparent baseline for classification, with few fitted counts rather than an iterative regression optimizer. Correlated inputs can violate its assumption and contribute overlapping evidence.\n\nOur workflow predicts whether next-day simulated pain is at least 5. Each of the six inputs is converted to “on” when it exceeds its training-period mean, including continuous fiber and energy. The earlier date pairs supply those thresholds, class counts and conditional frequencies; later pairs evaluate predictions after a one-pair gap. Add-one smoothing prevents unseen on/off values from receiving zero likelihood. Outputs include class parameters, probabilities, classification metrics and the held-out series. The workflow does not expose the fitted threshold vector as a separate output field.",
      uses: "Common uses: text classification, simple probabilistic baselines, and binary-feature pattern recognition.",
    },
    methodology: [
      [
        "The question",
        "Can a small frequency-based classifier recognize tomorrow’s synthetic pain threshold? This entry uses Bernoulli Naive Bayes: its inputs are on/off indicators, even when the original input such as energy is a continuous number.",
      ],
      [
        "How the model learns",
        "We pair today’s inputs with pain exactly one day later. Earlier pairs supply roughly 80% of the data; later pairs are saved as a test, with a one-day gap. Each input’s cutoff is its earlier-period mean. Within each class we count on/off inputs and apply add-one smoothing to the estimated counts, avoiding impossible probabilities for unseen combinations.",
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
    example:
      "Illustrative one-input calculation, not the six-input seed result: suppose 4 of 10 training examples are positive. The smoothed positive prior is 5/12; the negative prior is 7/12. If dairy is on in 3 positive and 1 negative examples, its on likelihoods are 4/6 and 2/8. For a dairy-on row, unnormalized class weights are about 0.278 and 0.146. Normalizing gives a positive probability near 0.656. The actual workflow includes all six likelihoods, which can change that answer. Correlated indicators may reinforce the same information despite the independence assumption.",
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
      "Fit a sparse next-day threshold classifier on four training-fitted principal components.",
    evaluation:
      "Accuracy checks yes/no choices at probability 0.5; recall asks whether actual positives were found, and precision asks whether predicted positives were right. Brier score checks the probability values, with lower scores better. Component coefficient bars show which principal components the classifier uses; they are distinct from the PCA loadings that define each pattern.",
    purpose:
      "PCA plus logistic LASSO first converts input variables into principal-component coordinates, then fits a binary classifier on those coordinates. PCA is unsupervised: it uses variation in the inputs without looking at the labels. Logistic regression learns which weighted combination of those components distinguishes the classes; its L1 penalty can set component coefficients to zero. This combination is useful for comparing classification with a compressed representation against classification on the original measurements. Compression can remove redundancy, but it can also remove a small-variance direction essential for distinguishing classes.\n\nOur target is next-day simulated pain at least 5. Earlier six-input rows supply the input scaler, four PCA directions and the logistic fit. Later rows reuse all fitted transformations after a one-pair boundary gap. Outputs include component coefficients, PCA loadings and variance fractions, probabilities, a dated held-out series and classification metrics. A component coefficient describes a combined input direction, not the isolated contribution of one food. Direct logistic LASSO provides the comparison with original features.",
    math: "Z = standardize(X) · V₄\np = sigmoid(b + Z·β), with L1 shrinkage",
    mathNote:
      "X contains six original inputs; V₄ contains four fitted PCA directions, and Z denotes the component coordinates. The actual classifier further standardizes those coordinates before applying β and intercept b. The sigmoid maps their weighted score to the class-1 probability. L1 shrinkage penalizes β, not the PCA loadings. Input scaling, PCA directions and component scaling are all learned from training rows. The pain threshold creates labels; the probability threshold 0.5 creates decisions. Neither threshold changes how PCA selects directions.",
    how: "Build exact next-day pairs and convert pain to class 1 for values ≥ 5. Reserve roughly the last 20% of pairs and exclude one boundary pair. Fit the input means/scales and PCA only on training inputs. The covariance eigensolver retains four principal directions, and each row becomes four component scores. Later rows reuse these original directions without refitting.\n\nThe logistic solver additionally standardizes the component scores using their training means/scales. It fits cross-entropy plus an L1 penalty with λ = 0.04 through 400 proximal-gradient iterations; its step is 0.5 divided by the four component inputs. Both training classes are required. The intercept is unpenalized. Held-out outputs include probabilities and decisions at 0.5, evaluated through accuracy, precision, recall and Brier score. PCA loadings and classification coefficients remain distinct quantities.",
    why: "The experiment asks whether reducing six input dimensions to four helps the same classifier task. It illustrates how an unsupervised transform can be included without leaking held-out rows into training. It also separates two kinds of interpretation: PCA loadings define directions, while logistic coefficients determine prediction contributions. Compare classification metrics with direct logistic LASSO; preserving input variance does not guarantee preserving class information.",
    archive:
      "The historical PCA/logistic wrapper supported broader label rules and could skip PCA in some branches. This direct version always uses the stated four-component representation of the complete fixture and returns the fitted projection along with the classifier results.",
    limitations:
      "A direction that captures much input variation might do little to separate the classes. Component weights are contributions from mixed input patterns, not single food effects. Compressing first does not guarantee better probabilities or calibrated predictions.",
    steps: [
      [
        "Create endpoint labels and holdout",
        "Pair today with tomorrow’s pain ≥ 5 label, reserve later pairs and exclude one boundary pair.",
      ],
      [
        "Fit the four-component transform",
        "Standardize training inputs and learn PCA directions from those rows only.",
      ],
      [
        "Fit component-based logistic LASSO",
        "Standardize component scores and apply λ = 0.04 L1 regularization over 400 updates.",
      ],
      [
        "Evaluate the unchanged pipeline",
        "Use fitted transformations on held-out rows and compare with the direct classifier.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 6,
    plainLanguage: {
      what: "PCA plus logistic LASSO first converts input variables into principal-component coordinates, then fits a binary classifier on those coordinates. PCA is unsupervised: it uses variation in the inputs without looking at the labels. Logistic regression learns which weighted combination of those components distinguishes the classes; its L1 penalty can set component coefficients to zero. This combination is useful for comparing classification with a compressed representation against classification on the original measurements. Compression can remove redundancy, but it can also remove a small-variance direction essential for distinguishing classes.\n\nOur target is next-day simulated pain at least 5. Earlier six-input rows supply the input scaler, four PCA directions and the logistic fit. Later rows reuse all fitted transformations after a one-pair boundary gap. Outputs include component coefficients, PCA loadings and variance fractions, probabilities, a dated held-out series and classification metrics. A component coefficient describes a combined input direction, not the isolated contribution of one food. Direct logistic LASSO provides the comparison with original features.",
      uses: "Common uses: classification with correlated measurements, compressed inputs, and pipeline comparisons.",
    },
    methodology: [
      [
        "The question",
        "Does summarizing six inputs into four principal-component coordinates help classify tomorrow’s simulated pain threshold? This is the same one-day yes/no task as direct logistic LASSO, but the classifier sees combined coordinates instead of the original inputs.",
      ],
      [
        "How the model learns",
        "We reserve roughly the last 20% of date-paired examples and leave a one-day gap. The earlier period supplies input scales, PCA directions and classifier fitting. This matters because even an unsupervised summary can leak information if it learns from later test rows. The saved transform is reused for those rows without changes.",
      ],
      [
        "How to read the test",
        "Accuracy checks yes/no choices at probability 0.5; recall asks whether actual positives were found, and precision asks whether predicted positives were right. Brier score checks the probability values, with lower scores better. Component coefficient bars show which principal components the classifier uses; they are distinct from the PCA loadings that define each pattern.",
      ],
      [
        "What that tells us",
        "Compare the held-out scores with direct logistic LASSO on the same seed. PCA chooses broad variation, not the best class separator, so a smaller model can lose useful discrimination. No demo threshold establishes a medical event probability.",
      ],
    ],
    example:
      "Illustrative component calculation, not this seed's output: suppose a row's standardized component scores are 1, −0.5, 0.2 and 0. With intercept −0.2 and logistic coefficients 0.8, 0.4, 0 and 0, the linear score is −0.2 + 0.8×1 + 0.4×(−0.5) = 0.4. The sigmoid gives approximately 0.599, so the class decision is positive at 0.5. Two component coefficients are zero. This does not mean two original foods were removed; the retained components still combine inputs according to their loadings. Compare that probability with the exact next-day label.",
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
      "Use direct logistic LASSO to classify pain at the exact three-day endpoint.",
    evaluation:
      "Probabilities describe the declared three-day label. At a 0.5 cutoff, accuracy checks class decisions, precision checks positive predictions, and recall checks whether actual positives were found. Brier score checks probability mistakes, with confident wrong answers costing more. A weak result is informative: the simulator’s strongest planted relationship is one day ahead, not necessarily three.",
    variant: true,
    purpose:
      "This is the same sparse logistic model family as the one-day classifier, with a different target date. A logistic model maps a weighted input score to a probability; its L1 penalty can remove coefficient contributions. Changing the forecast horizon changes which answers the model must learn, even when its numerical optimizer remains identical. Endpoint classification is useful for investigating how much predictive information remains at a specified delay. It is different from classifying whether an event occurs anywhere inside a future interval.\n\nOur workflow pairs today's six simulated inputs with pain exactly three calendar days later. Pain at least 5 defines class 1. It fits input scaling and direct logistic coefficients on earlier pairs, reserves later pairs, and excludes three candidate pairs before the split. It uses no PCA. Outputs include standardized coefficients, probabilities, the declared horizon, held-out labels and classification metrics. The earlier archived three-day module used a more elaborate score-based target; this direct demonstration intentionally uses the simpler, visible endpoint definition.",
    math: "yₜ = 1[pain(t + 3) ≥ 5]\npₜ = sigmoid(b + xₜ·β)",
    mathNote:
      "t identifies the input date. The indicator notation 1[condition] produces label 1 when pain at t+3 is at least 5 and label 0 otherwise. xₜ is today's standardized input vector, β its coefficients and b the intercept; the sigmoid converts their score into probability pₜ. The probability concerns that exact endpoint label. The model is fitted with cross-entropy plus an L1 penalty, although this compact displayed equation emphasizes target timing and prediction. A missing t+3 outcome remains unknown, not a negative label.",
    how: "For each dated input row, require a matching observation exactly three calendar days ahead. Missing endpoints cannot provide training labels. Convert target pain to 1 for values ≥ 5 and 0 otherwise. Make a chronological roughly 80/20 split and exclude three candidate pairs before the holdout boundary. Both classes must occur in training.\n\nFit means and population standard deviations from the earlier six-input rows, then train the same direct logistic-LASSO routine used by the one-day entry. It performs 400 proximal-gradient updates with λ = 0.04 and step 0.5 divided by six inputs. The intercept is unpenalized, and later rows reuse fitted scaling. Evaluate probabilities against three-day endpoint labels, using probability 0.5 for class decisions. The code does not search for any threshold crossing during days one through three.",
    why: "This preserves a distinct callable classification variant and makes horizon selection an inspectable experiment. Its strongest comparison is with the one-day direct classifier on the same fixture. The generator deliberately links inputs to next-day pain, so three-day prediction can be weaker without indicating a broken optimizer. The simplified target also avoids claiming that the archive's score rules are validated medical definitions.",
    archive:
      "The older three-day flare module used a different three-tier rule. The replacement deliberately uses one transparent binary endpoint threshold, with direct inputs and a separate test period. It keeps the temporal classification idea without claiming to reproduce the earlier label definition.",
    limitations:
      "Today’s features may contain little information about the exact outcome three days later. The arbitrary threshold is not a validated flare definition. Correctly computing a three-day probability does not show that the probabilities are calibrated or useful for a real person.",
    steps: [
      [
        "Match the three-day endpoint",
        "Require an observation on the exact calendar date t+3 rather than the next available row.",
      ],
      [
        "Create binary pain labels",
        "Use pain ≥ 5 for class 1 and lower pain for class 0; exclude unknown targets.",
      ],
      [
        "Train direct logistic LASSO",
        "Reserve later pairs, exclude three boundary pairs, and fit scaling/coefficients on earlier data.",
      ],
      [
        "Evaluate that specific horizon",
        "Inspect probabilities and class metrics for t+3; compare with the one-day model.",
      ],
    ],
    source: [
      "Logistic regression",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html",
    ],
    number: 7,
    plainLanguage: {
      what: "This is the same sparse logistic model family as the one-day classifier, with a different target date. A logistic model maps a weighted input score to a probability; its L1 penalty can remove coefficient contributions. Changing the forecast horizon changes which answers the model must learn, even when its numerical optimizer remains identical. Endpoint classification is useful for investigating how much predictive information remains at a specified delay. It is different from classifying whether an event occurs anywhere inside a future interval.\n\nOur workflow pairs today's six simulated inputs with pain exactly three calendar days later. Pain at least 5 defines class 1. It fits input scaling and direct logistic coefficients on earlier pairs, reserves later pairs, and excludes three candidate pairs before the split. It uses no PCA. Outputs include standardized coefficients, probabilities, the declared horizon, held-out labels and classification metrics. The earlier archived three-day module used a more elaborate score-based target; this direct demonstration intentionally uses the simpler, visible endpoint definition.",
      uses: "Common uses: fixed-horizon event classification and comparing short-term prediction tasks.",
    },
    methodology: [
      [
        "The question",
        "Will simulated pain be at least five exactly three days after today’s inputs? This standalone variant uses direct features and a fixed endpoint. It does not ask whether the threshold is crossed anywhere inside a three-day window.",
      ],
      [
        "How the model learns",
        "We match every input date with the exact t+3 pain observation. Incomplete date pairs are excluded. Roughly the first 80% train the model, the last 20% are saved, and three pairs at the boundary are left out. Input scales and sparse logistic weights come only from the earlier period.",
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
    example:
      "Illustrative date pair, not this seed's result: an input row on June 1 must be paired with June 4 pain. If June 4 pain is 5.6, its training label is 1. Pain of 6 on June 2 or June 3 does not determine this endpoint label. If June 4 is missing, June 5 must not substitute for it. Suppose the fitted model predicts probability 0.42 for the June 1 inputs: its decision is class 0 at the 0.5 cutoff, which is incorrect for the observed June 4 label. That is a three-day classification error, not an interval-event error.",
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
      "Measure linear association between each input and next-day pain, alongside correlations among inputs.",
    evaluation:
      "A positive Pearson r means higher input values tend to go with higher next-day pain; a negative value means the opposite. Larger absolute values indicate a stronger straight-line relationship. Values near zero do not rule out nonlinear relationships. A constant quantity has an undefined correlation, which is kept as missing rather than a made-up zero.",
    purpose:
      "Pearson correlation measures the direction and strength of linear association between two numeric variables. It compares paired deviations from their means and normalizes by their variation, producing a coefficient between −1 and +1. A positive value means larger values tend to occur together; a negative value means one tends to increase as the other decreases. Near zero means little linear association, which does not exclude nonlinear relationships. Correlation is commonly used for exploratory analysis and identifying overlapping measurements. It does not fit a prediction model or identify causal effects.\n\nOur workflow aligns the six simulated inputs with pain exactly one day later. It calculates one input-to-pain correlation for each feature and a six-by-six input correlation matrix using the same complete pairs. Outputs include coefficients and observation counts; constant columns return null because their correlation is undefined. All complete pairs describe the supplied dataset—there is no prediction holdout. The generator provides known relationships against which to inspect the summary, without a claimed significance test or confidence interval.",
    math: "r(x,y) = Σ(xᵢ−x̄)(yᵢ−ȳ) / √[Σ(xᵢ−x̄)² Σ(yᵢ−ȳ)²]",
    mathNote:
      "xᵢ and yᵢ are values from the same valid pair; x̄ and ȳ are their means. The numerator sums their joint deviations, while the denominator removes the effect of their individual scales. The result is dimensionless. r = +1 or −1 describes an exact linear relationship; r near zero describes little linear association. A constant series makes the denominator zero, so r is undefined. Here y is next-day pain for input comparisons; for the matrix, both quantities are input columns.",
    how: "Build exact one-day input/target pairs and use all valid pairs for this descriptive calculation. For each input, subtract its paired-row mean and subtract the next-day pain mean. Sum the products of those deviations. Divide by the square root of the product of the two sums of squared deviations. This normalization gives Pearson r between −1 and +1 without fitting coefficients.\n\nRepeat the calculation for every input against pain and for each pair of input columns. The resulting matrix shows whether inputs themselves carry overlapping linear information. The output reports the valid observation count for input-to-target pairs. If either variable has zero variation, the denominator is zero and the kernel returns null, not zero. It does not compute p-values, uncertainty intervals or an adjustment for examining several associations at once.",
    why: "Correlation supplies a transparent descriptive comparison before introducing fitted models. It checks whether the simulator's planted next-day relationships appear in the recorded sample and whether candidate predictors overlap. Using complete date pairs makes the lag explicit. Its simplicity is also its limit: it ignores interactions, nonlinear structure and confounding, and cannot establish that editing an input would change an outcome.",
    archive:
      "The original workflow explored more symptom and trigger pairs, multiple lags and additional output metadata. This direct version fixes one stated one-day delay and shows all six input comparisons plus their input-to-input matrix.",
    limitations:
      "An association can reflect shared causes, timing, co-occurrence or chance. Testing many inputs and delays can make chance peaks look interesting. These bars do not include statistical significance or adjust for repeated, related observations over time.",
    steps: [
      [
        "Align one-day observation pairs",
        "Keep input dates with the exact next-day pain endpoint available.",
      ],
      [
        "Calculate centered deviations",
        "Subtract each variable’s mean across those valid pairs.",
      ],
      [
        "Normalize the joint variation",
        "Divide the sum of paired products by both variables’ combined spread to obtain Pearson r.",
      ],
      [
        "Inspect associations and overlap",
        "Read all six target correlations, their counts and the six-by-six input matrix; preserve undefined values.",
      ],
    ],
    source: [
      "Pearson correlation",
      "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html",
    ],
    number: 8,
    plainLanguage: {
      what: "Pearson correlation measures the direction and strength of linear association between two numeric variables. It compares paired deviations from their means and normalizes by their variation, producing a coefficient between −1 and +1. A positive value means larger values tend to occur together; a negative value means one tends to increase as the other decreases. Near zero means little linear association, which does not exclude nonlinear relationships. Correlation is commonly used for exploratory analysis and identifying overlapping measurements. It does not fit a prediction model or identify causal effects.\n\nOur workflow aligns the six simulated inputs with pain exactly one day later. It calculates one input-to-pain correlation for each feature and a six-by-six input correlation matrix using the same complete pairs. Outputs include coefficients and observation counts; constant columns return null because their correlation is undefined. All complete pairs describe the supplied dataset—there is no prediction holdout. The generator provides known relationships against which to inspect the summary, without a claimed significance test or confidence interval.",
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
        "The simulator gives us a known simulated mechanism to inspect, but correlation alone cannot distinguish cause from co-occurrence. No significance test or confidence interval is claimed here. Searching extra features and lags would create more opportunities for chance associations, so the complete comparison set should stay visible.",
      ],
    ],
    example:
      "Illustrative three-row calculation, not this seed's result: take x values 0, 1 and 2, paired with y values 2, 4 and 6. Their means are 1 and 4. The paired deviations are (−1,−2), (0,0) and (1,2); the product sum is 4. The denominator is √[(1+0+1)×(4+0+4)] = 4, so r = 1. Replacing y with a constant makes the denominator zero and correlation undefined. Even r = 1 only describes these paired values; it cannot establish why the relationship exists or whether it will persist on later data.",
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
      "Represent six standardized inputs with three orthogonal components ordered by explained variance.",
    evaluation:
      "Each dot is one generated date in the new coordinates. Points close together share similar projected inputs. Explained variance tells you how much of the standardized input spread a direction or plane retains; it is not prediction accuracy. The loadings describe how original inputs combine to define each direction, rather than contributions to a pain prediction.",
    purpose:
      "Principal component analysis, or PCA, transforms numeric variables into new coordinates called principal components. Each component is a weighted combination of the original inputs. PCA chooses the first direction to capture the most variation, then finds perpendicular directions capturing remaining variation. Its input weights are called loadings; an observation's coordinate on a component is its score. PCA is used for dimensionality reduction, exploring correlated measurements and plotting higher-dimensional data. It is unsupervised: it does not use an outcome label to choose directions, so explained variance is not prediction accuracy.\n\nOur descriptive workflow standardizes all six simulated input columns using the supplied snapshot, forms their sample covariance matrix, and retains three components through a Jacobi eigensolver. The scatter plot shows the first two scores for each date. Outputs include loadings and explained-variance fractions as well as projected points. Pain is not used to fit this projection. Other workflows fit PCA on training rows only when it forms part of a prediction model; this entry instead describes the full input dataset.",
    math: "C = XᶜᵀXᶜ / (n−1)\nCvⱼ = λⱼvⱼ,   Z = XᶜV",
    mathNote:
      "Xᶜ is the centered standardized input matrix with n rows. C is its sample covariance; the transpose symbol T changes rows into columns for the matrix multiplication. An eigenvector vⱼ satisfies Cvⱼ = λⱼvⱼ, with eigenvalue λⱼ describing variance in its direction. V collects retained directions, and Z contains projected row coordinates. Dividing each retained eigenvalue by the sum of all eigenvalues gives explained variance. Component signs can reverse without changing the represented structure, and loadings are not regression coefficients.",
    how: "Subtract each input column's mean and divide by its population standard deviation, using divisor one for a constant column. Center the resulting matrix and calculate sample covariance with denominator n−1. Covariance records how input deviations vary together. The symmetric Jacobi eigensolver repeatedly rotates pairs of coordinates to reduce off-diagonal covariance entries.\n\nEach resulting eigenvector is a component direction; its eigenvalue measures variance along that direction. Sort directions by decreasing eigenvalue and retain three. Rotation stops when the largest off-diagonal magnitude is below 1e−10 or after the limit of 100 times featureCount squared. Project rows onto retained directions and divide eigenvalues by total variance to obtain explained-variance fractions. The chart uses the first two scores, while returned loadings define all three retained components. Zero total variance yields zero explained fractions.",
    why: "This exposes the actual dimensionality-reduction work and makes six-input structure inspectable through a small number of coordinates. Explained variance helps quantify what the representation retains, while loadings identify how original variables define each component. The tradeoff is discarded variation: points close in the two-dimensional plot may differ in other directions. PCA is useful for representation, not an automatic improvement to target prediction.",
    archive:
      "The coursework PCA helper found directions by power iteration and orthogonalization. The replacement uses Jacobi eigenanalysis instead. Both calculate principal directions, but the numerical procedure has changed and is documented rather than treated as an identical restoration.",
    limitations:
      "A high-variation direction is not necessarily useful for predicting an outcome. Direction signs can flip without changing the geometry. When two directions have almost equal variance, their individual orientations can also change substantially while describing the same broad subspace.",
    steps: [
      [
        "Standardize the six input columns",
        "Use snapshot means and standard deviations so raw units do not determine the projection.",
      ],
      [
        "Build sample covariance",
        "Measure variation and joint variation among the centered columns using n−1.",
      ],
      [
        "Find and order component directions",
        "Use Jacobi eigenanalysis and retain three directions with the largest eigenvalues.",
      ],
      [
        "Project and inspect each date",
        "Plot the first two component scores; inspect loadings and explained-variance fractions.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 9,
    plainLanguage: {
      what: "Principal component analysis, or PCA, transforms numeric variables into new coordinates called principal components. Each component is a weighted combination of the original inputs. PCA chooses the first direction to capture the most variation, then finds perpendicular directions capturing remaining variation. Its input weights are called loadings; an observation's coordinate on a component is its score. PCA is used for dimensionality reduction, exploring correlated measurements and plotting higher-dimensional data. It is unsupervised: it does not use an outcome label to choose directions, so explained variance is not prediction accuracy.\n\nOur descriptive workflow standardizes all six simulated input columns using the supplied snapshot, forms their sample covariance matrix, and retains three components through a Jacobi eigensolver. The scatter plot shows the first two scores for each date. Outputs include loadings and explained-variance fractions as well as projected points. Pain is not used to fit this projection. Other workflows fit PCA on training rows only when it forms part of a prediction model; this entry instead describes the full input dataset.",
      uses: "Common uses: visualizing many measurements, compression, and finding shared patterns in correlated data.",
    },
    methodology: [
      [
        "The question",
        "What does the six-input dataset look like from a low-dimensional representation that retains the largest possible input variance? PCA does not use simulated pain as an answer to learn. It describes the arrangement of the input measurements themselves.",
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
    example:
      "Illustrative projection, not this seed's fitted PCA: suppose two standardized inputs vary identically and the other four columns are constant. A leading direction can have loadings approximately 0.707 and 0.707 on those inputs. A row with standardized values 1 and 1 then has component score 1×0.707 + 1×0.707 ≈ 1.414. The perpendicular direction with weights 0.707 and −0.707 has score zero. All the variation in this constructed rank-one dataset lies in the first direction. Reversing both leading loadings reverses its score sign but leaves distances and captured variance unchanged.",
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
      "Partition projected observations into three groups by minimizing squared distance to their centroids.",
    evaluation:
      "A colored dot belongs to the nearest learned center; each cross marks a center. The within-group squared error adds all squared distances to assigned centers. Lower means a tighter partition for this fixed view and group count; it is not medical accuracy. Every point is assigned, so an unusual day still receives a color.",
    purpose:
      "K-means is a clustering algorithm: it groups observations without predefined class labels. Choose K centers, assign each point to its nearest center, then replace every center with the mean of its assigned points. Repeating these steps seeks a partition with low within-cluster squared distance. A cluster's mean location is its centroid. K-means is useful for exploring compact groups, summarizing measurements and comparing grouping assumptions. It fixes the requested number of centers and assigns every point, including unusual observations, rather than having a separate outlier class.\n\nOur workflow first standardizes the six simulated inputs and projects them onto PCA's first two coordinates. It then fits three centers using seeded, distance-weighted initialization and at most 60 assignment/update rounds. Outputs include point labels, center coordinates, inertia—the total squared distance to assigned centers—and plotted points. This is descriptive grouping of the snapshot, with no pain target or future-prediction score. The archived workflow searched possible K values; this direct demonstration deliberately fixes K at 3.",
    math: "min  Σₖ Σᵢ∈clusterₖ ||zᵢ − μₖ||²\nμₖ = mean(points assigned to cluster k)",
    mathNote:
      "zᵢ is observation i in the two-coordinate PCA plane; μₖ is the centroid of cluster k. The squared norm ||zᵢ−μₖ||² is squared Euclidean distance. The objective adds that distance across every assigned point and cluster; this total is inertia. For fixed assignments, the arithmetic mean minimizes squared distance, explaining the centroid update. K is fixed at three here. Lower inertia means tighter grouping for this dataset, projection and K—not clinical accuracy, and not a guarantee of the global best partition.",
    how: "Reuse the descriptive PCA calculation on all six standardized inputs, then keep two component scores for clustering. Initialize three centers using the snapshot seed and distance-weighted selection: candidate points farther from existing centers receive greater selection weight. The seed makes the starting choices reproducible.\n\nAssign each point to the closest center by Euclidean distance. For each occupied cluster, average its point coordinates to create the next center. Repeat until the assignments stabilize or the implementation's 60-round bound is reached. A center with no assigned points retains its previous location, so a degenerate dataset can have fewer occupied clusters than the requested three. Return memberships, centers and inertia, the sum of squared distances from each point to its assigned center. Cluster numbers are arbitrary; meaningful comparisons concern membership and geometry rather than a particular label.",
    why: "K-means demonstrates iterative unsupervised optimization with an objective we can directly inspect. Compare it with DBSCAN to see the effect of forcing every point into one of three centroid-based groups. Standardization and PCA make the chosen geometry explicit, and seeded initialization supports repeatable examples. The tradeoff is the fixed K and preference for compact groups; another geometry or initialization can produce another partition.",
    archive:
      "The coursework workflow tried different group counts with elbow/silhouette-style selection and had broader feature handling. This demonstration deliberately requests K = 3 and groups only the first two PCA coordinates. It is a stated geometric variant rather than a copy of every earlier selection heuristic.",
    limitations:
      "K-means must assign every point, including outliers, and favors compact groups around means. The chosen K, input scaling and projection affect the answer. Group numbers are arbitrary identifiers and can change order; none of them identifies a disease state.",
    steps: [
      [
        "Project the standardized inputs",
        "Use the first two PCA scores from the complete descriptive snapshot.",
      ],
      [
        "Initialize three centers",
        "Use seeded distance-weighted selection so the same snapshot seed reproduces initialization.",
      ],
      [
        "Alternate assignments and means",
        "Assign each point to its nearest center and update occupied centers to their members’ means.",
      ],
      [
        "Inspect the final partition",
        "Read cluster labels, centroid locations and inertia; compare memberships with DBSCAN.",
      ],
    ],
    source: [
      "Clustering methods",
      "https://scikit-learn.org/stable/modules/clustering.html",
    ],
    number: 10,
    plainLanguage: {
      what: "K-means is a clustering algorithm: it groups observations without predefined class labels. Choose K centers, assign each point to its nearest center, then replace every center with the mean of its assigned points. Repeating these steps seeks a partition with low within-cluster squared distance. A cluster's mean location is its centroid. K-means is useful for exploring compact groups, summarizing measurements and comparing grouping assumptions. It fixes the requested number of centers and assigns every point, including unusual observations, rather than having a separate outlier class.\n\nOur workflow first standardizes the six simulated inputs and projects them onto PCA's first two coordinates. It then fits three centers using seeded, distance-weighted initialization and at most 60 assignment/update rounds. Outputs include point labels, center coordinates, inertia—the total squared distance to assigned centers—and plotted points. This is descriptive grouping of the snapshot, with no pain target or future-prediction score. The archived workflow searched possible K values; this direct demonstration deliberately fixes K at 3.",
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
    example:
      "Illustrative centroid update, not this seed's clustering: suppose three points assigned to one cluster are (0,0), (0.2,0) and (0,0.2). Their centroid becomes (0.0667,0.0667). The cluster's contribution to inertia is the sum of the three squared distances to that centroid, approximately 0.0533. After centers move, every point is reassigned to its nearest updated center; a nearby point can therefore change groups on the next round. An isolated point is still assigned somewhere. The example explains the update rule but does not imply that the current six-input dataset contains these coordinates or groups.",
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
      "Find connected dense neighborhoods in the PCA plane and label unassigned observations as noise.",
    evaluation:
      "Colors identify actual connected groups and gray marks noise with label −1. A core point has enough neighbors to expand a group; a border point may belong without meeting that core rule. The group and noise counts summarize the returned assignments. They are descriptive counts, not sensitivity, accuracy or clinical state estimates.",
    purpose:
      "DBSCAN is density-based clustering. It groups points through neighborhoods containing enough observations, without choosing the number of clusters in advance. A core point has at least a specified number of points within a radius. Connected core neighborhoods expand a cluster, and nearby border points can join even when they are not themselves core points. Points not reached by a cluster remain noise. This is useful for irregularly shaped groups and outlier inspection, although results depend strongly on the distance, radius and density setting.\n\nOur workflow standardizes the six simulated inputs, projects them to the first two PCA coordinates, then uses Euclidean radius 0.7 and minimum count 4, including the point itself. Results contain cluster memberships, noise count, group count and projected points. Noise receives label −1. There is no pain target or held-out predictive accuracy. Unlike the archived mixed-feature Gower-distance approach, the direct workflow explicitly clusters the two-dimensional PCA geometry; these memberships answer a different distance-based question.",
    math: "Nε(z) = {q : ||z−q|| ≤ ε}\ncore(z) when |Nε(z)| ≥ minPoints",
    mathNote:
      "Nε(z) is the neighborhood of point z: all q within Euclidean distance ε. A core point has neighborhood size at least minPoints. This workflow uses ε = 0.7 and minPoints = 4, counting z itself. Cluster expansion follows chains of core neighborhoods; therefore two members need not be within 0.7 of each other if intermediate core points connect them. A border point may join without meeting the core count. Noise is a membership outcome, label −1, rather than a failed calculation.",
    how: "Calculate PCA from the full standardized six-input snapshot and retain its first two score coordinates. Visit an unclassified point and count all points within Euclidean distance 0.7, including itself. If fewer than four are present, initially mark it as noise. Otherwise it is a core point and starts a cluster.\n\nExpand that cluster through a queue of neighbors. Reached points join the cluster, and a reached core point adds its own neighbors to the queue. This connects dense regions through multiple local neighborhoods without requiring every member to be near the initial point. A previously marked noise point can become a border member when reached from a core. Points never reached retain label −1. Return the actual labels and group/noise counts. Changing radius or using a different projection can materially change these results.",
    why: "DBSCAN provides a clear comparison with K-means: local density determines groups and can leave observations unassigned instead of forcing three clusters. The demonstration exposes neighborhood expansion and noise handling in the projected space. Fixed radius/minimum defaults make the rule reproducible, but they are not automatically optimal. A result containing one cluster or extensive noise is a legitimate outcome of these settings, not something to conceal.",
    archive:
      "The archived DBSCAN workflow described mixed-input Gower distances, score bins and adaptive radius selection. This direct version uses an explicit Euclidean radius in the two-component PCA plane. The simpler distance and fixed settings are deliberate changes.",
    limitations:
      "Changing the radius, scaling or projection can join groups, split them, or turn many points into noise. One dense group is a valid output. A geometric density group should not be given a disease interpretation simply because it has a clear color in the chart.",
    steps: [
      [
        "Project the input snapshot",
        "Standardize six inputs and use their first two PCA scores.",
      ],
      [
        "Count radius-based neighborhoods",
        "Include all points within distance 0.7 and count the point itself.",
      ],
      [
        "Expand connected core regions",
        "A core needs at least four neighborhood points; its neighbors can extend the cluster or join as borders.",
      ],
      [
        "Retain explicit noise labels",
        "Report actual memberships, cluster count and label −1 for points not reached by any cluster.",
      ],
    ],
    source: [
      "Clustering methods",
      "https://scikit-learn.org/stable/modules/clustering.html",
    ],
    number: 11,
    plainLanguage: {
      what: "DBSCAN is density-based clustering. It groups points through neighborhoods containing enough observations, without choosing the number of clusters in advance. A core point has at least a specified number of points within a radius. Connected core neighborhoods expand a cluster, and nearby border points can join even when they are not themselves core points. Points not reached by a cluster remain noise. This is useful for irregularly shaped groups and outlier inspection, although results depend strongly on the distance, radius and density setting.\n\nOur workflow standardizes the six simulated inputs, projects them to the first two PCA coordinates, then uses Euclidean radius 0.7 and minimum count 4, including the point itself. Results contain cluster memberships, noise count, group count and projected points. Noise receives label −1. There is no pain target or held-out predictive accuracy. Unlike the archived mixed-feature Gower-distance approach, the direct workflow explicitly clusters the two-dimensional PCA geometry; these memberships answer a different distance-based question.",
      uses: "Common uses: spatial grouping, irregular clusters, and finding isolated observations.",
    },
    methodology: [
      [
        "The question",
        "Which generated days form connected dense neighborhoods, and which stand apart? DBSCAN lets density decide how many groups appear. Its rule can produce a single group or many noise points without needing to force a more dramatic chart.",
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
    example:
      "Illustrative neighborhood, not this seed's output: consider points (0,0), (0.1,0), (0,0.1) and (0.1,0.1), plus an isolated point at (3,3). With radius 0.7, each of the first four sees all four points, including itself, and meets minPoints = 4. They form a cluster. The isolated point sees only itself, so it remains noise unless another core neighborhood reaches it. A fifth point near a cluster core could join as a border even if its own neighborhood were too small. The current workflow applies exactly these rules to its PCA coordinates.",
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
      "Compare the shape of two time series while allowing limited changes in their timing.",
    evaluation:
      "The two curves are actual generated values. Faint connections are the cheapest returned alignment path, which can match one position more than once. Lower distance means closer under this specific cost and timing rule. The comparison count shows how many candidate pairs were searched, and the other listed matches are actual ranked distances.",
    purpose:
      "Dynamic time warping (DTW) measures how closely two sequences match when their timing is stretched or compressed. Comparing day one with day one, day two with day two, and so on can miss a repeated pattern whose peak arrives later in one sequence. DTW instead aligns positions in order. A position can match more than one neighboring position, so local parts of a sequence can take longer without reversing the timeline. The result is an alignment path and a distance measuring its mismatch.\n\nOur implementation searches simulated pain history with a sliding window: seven consecutive recorded days form one window, and candidate starts advance by three rows. It compares separate, non-overlapping windows. A band of two limits each alignment to nearby positions; squared pain differences supply the local costs. We take the square root of the final accumulated cost and rank the five closest window pairs. The plotted links come from the actual alignment path. This comparison finds similar historical shapes; it does not forecast recurrence.",
    math: "D(i,j) = (aᵢ−bⱼ)² + min[D(i−1,j), D(i,j−1), D(i−1,j−1)]\ndistance = √D(last,last)",
    mathNote:
      "D(i,j) is the minimum accumulated cost of aligning the first i values of one sequence with the first j values of the other. A cell adds the squared difference between its two values and chooses the cheapest diagonal, vertical or horizontal predecessor. Those choices permit one-to-one and repeated-position matches while retaining order. The band allows |i−j| ≤ 2. Our distance is √D(last,last), not a path-length-normalized average.",
    how: "The handler first removes unknown pain values, then checks that each candidate seven-row window still has consecutive calendar dates. First-window starts move in three-row steps. For each, second-window starts begin after the first window and also advance by three rows. Every eligible pair is evaluated with the banded dynamic-programming recurrence. The full cost matrix is retained, allowing the minimum-cost path to be traced backward from its final cell. Matches are sorted by the calculated distance, and the best five are returned with dates, values and paths. Thus the algorithm searches a stated subset of starts, rather than every possible day or a correlation between curves.",
    why: "It demonstrates ordered sequence alignment, a dynamic-programming recurrence and a practical window search. The same search also supports a memory-saving variant, letting you compare what changes when the distance is needed but the path is not.",
    archive:
      "The archived motif finder added similarity filtering, pattern groups and overlap suppression. This direct search uses stated seven-day windows, three-row start steps and a timing band of two. It retains exact distances and paths without reproducing every historical grouping heuristic.",
    limitations:
      "A close historical match is not a forecast that the shape will repeat. Comparing many windows creates opportunities for coincidental matches. Distances also depend on the chosen value scale, timing band and normalization, so those choices must accompany the number.",
    steps: [
      [
        "Extract sliding seven-day windows",
        "Move candidate starts by three recorded rows and skip windows with date gaps.",
      ],
      [
        "Compare separate window pairs",
        "Evaluate non-overlapping sequences using squared value differences.",
      ],
      [
        "Calculate a constrained alignment",
        "Choose the minimum-cost ordered path within a two-position band.",
      ],
      [
        "Rank the matching distances",
        "Return the closest five pairs and their actual alignment paths.",
      ],
    ],
    source: [
      "DTW recurrence and use",
      "https://dtaidistance.readthedocs.io/en/latest/usage/dtw.html",
    ],
    number: 12,
    plainLanguage: {
      what: "Dynamic time warping (DTW) measures how closely two sequences match when their timing is stretched or compressed. Comparing day one with day one, day two with day two, and so on can miss a repeated pattern whose peak arrives later in one sequence. DTW instead aligns positions in order. A position can match more than one neighboring position, so local parts of a sequence can take longer without reversing the timeline. The result is an alignment path and a distance measuring its mismatch.\n\nOur implementation searches simulated pain history with a sliding window: seven consecutive recorded days form one window, and candidate starts advance by three rows. It compares separate, non-overlapping windows. A band of two keeps matched indices at most two positions apart; squared pain differences supply the local costs. We take the square root of the final accumulated cost and rank the five closest window pairs. The plotted links come from the actual alignment path. This comparison finds similar historical shapes; it does not forecast recurrence.",
      uses: "Common applications: speech alignment, movement and sensor comparison, and repeated time-series pattern search.",
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
    example:
      "Illustrative sequence example: suppose a rise occurs at position two in one seven-day window and position three in another. A same-position comparison penalizes that timing shift. DTW can align those nearby positions and repeat a neighboring match to preserve sequence order. The two-position band allows this local adjustment while ruling out unrestricted stretching. In this demo, the actual best pair’s dates, values, alignment links and distance are calculated from the selected seed and shown in the chart.",
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
      "Use the same DTW recurrence to calculate distances without retaining the full alignment matrix.",
    evaluation:
      "The two curves show the best-matched generated clips, but there are no correspondence links because the backtracking path was not saved. Lower distance still means a closer constrained match. Compare the full entry on the same seed: its distance should agree, while it can also display the stored path.",
    variant: true,
    purpose:
      "Rolling-memory DTW changes the storage used by dynamic time warping, while preserving its alignment distance. Each cost cell depends only on the previous row and the neighboring cell in the current row. If the task needs the final distance rather than the complete path, those two working rows are enough. Memory then grows with a sequence length instead of the number of all position pairs. This matters in repeated comparisons or longer sequences, although seven-day windows are small.\n\nOur variant performs the same sliding-window search as full DTW: consecutive seven-day pain windows, candidate starts advancing three rows, non-overlapping pairs, and a two-position timing band. It uses the same squared local differences and final square-root distance, then ranks the closest five pairs. It deliberately returns no alignment path because intermediate cost rows were overwritten. The curves and distances are actual computed results; to inspect position-to-position alignment links, select full DTW on the same seed.",
    math: "current[j] = cost(i,j) + min(previous[j], current[j−1], previous[j−1])\nmemory: O(m), rather than O(n·m)",
    mathNote:
      "At row i, current[j] needs previous[j], previous[j−1] and current[j−1]. Reusing two arrays therefore preserves the recurrence’s final value. Storage is O(m), where m is a sequence length, compared with the full grid’s O(n·m). Squared local costs, the two-position band and the final square root stay unchanged. The discarded rows prevent ordinary full-path backtracking.",
    how: "The outer window enumeration is the same as full DTW, including date-continuity checks, three-row candidate steps and non-overlap. For each comparison the kernel resets a current row, calculates valid band cells from that row and the previous one, then swaps the working arrays. After the final row, it returns the exact constrained distance but an empty path. Sorting and top-five selection are unchanged. This is a storage optimization, not an approximate matching rule or a restoration of every beam-search and lower-bound technique from the old code.",
    why: "This separates a mathematical result from the information retained to explain it. It demonstrates when an exact distance calculation can use less memory, and why that saving limits visualization or path reconstruction.",
    archive:
      "The earlier optimized DTW included additional beam-search, lower-bound and caching ideas. This direct variant focuses on exact rolling-memory distance within the chosen band. It does not claim to restore every historical optimization or a missing alignment path.",
    limitations:
      "The cost grid is not kept, so this version cannot simply trace the alignment backward. The seven-day demo is small enough that memory savings are mainly educational; larger sequence searches make the tradeoff more consequential. It remains motif comparison, not a recurrence forecast.",
    steps: [
      [
        "Enumerate the same sliding windows",
        "Use full DTW’s seven-day windows, three-row starts and non-overlap.",
      ],
      [
        "Keep two rows of costs",
        "Calculate each band cell before overwriting older rows.",
      ],
      [
        "Return the same constrained distance",
        "Retain the final value, without a full backtracking matrix.",
      ],
      [
        "Rank distance-only matches",
        "Use full DTW when the alignment path is required.",
      ],
    ],
    source: [
      "DTW recurrence and use",
      "https://dtaidistance.readthedocs.io/en/latest/usage/dtw.html",
    ],
    number: 13,
    plainLanguage: {
      what: "Rolling-memory DTW changes the storage used by dynamic time warping, while preserving its alignment distance. Each cost cell depends only on the previous row and the neighboring cell in the current row. If the task needs the final distance rather than the complete path, those two working rows are enough. Memory then grows with a sequence length instead of the number of all position pairs. This matters in repeated comparisons or longer sequences, although seven-day windows are small.\n\nOur variant performs the same sliding-window search as full DTW: consecutive seven-day pain windows, candidate starts advancing three rows, non-overlapping pairs, and a two-position timing band. It uses the same squared local differences and final square-root distance, then ranks the closest five pairs. It deliberately returns no alignment path because intermediate cost rows were overwritten. The curves and distances are actual computed results; to inspect position-to-position alignment links, select full DTW on the same seed.",
      uses: "Common applications: repeated distance-only sequence searches and memory-constrained time-series matching.",
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
    example:
      "On a fixed seed, open full DTW and note its best window dates and distance. The rolling-memory entry should return the same distance and ordering for those windows, because the recurrence and candidate pairs are identical. What changes is the returned path: full DTW retains links for backtracking, while this entry returns an empty path. The absence of links is a deliberate memory tradeoff, not a zero-cost match or a failed calculation.",
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
      "Fit independent regression models for pain exactly one, seven and fourteen days ahead.",
    evaluation:
      "The bars are current-input endpoint estimates from the earlier-period fitted models. The table evaluates each model on its own held-out days. RMSE is error in simulated pain-scale points, with big misses counting more; compare it with always predicting that model’s earlier target mean. Different row counts and errors across horizons are expected.",
    purpose:
      "Direct multi-horizon forecasting builds a separate model for each future endpoint. A one-day model learns from inputs at time t paired with the outcome at t+1; a seven-day model uses t+7, and so on. Each model can learn different coefficients because the information useful tomorrow may not be useful a week later. Unlike recursive forecasting, one model’s prediction is not passed into another to produce the longer horizon. This approach is used when different planning dates need separately evaluated estimates.\n\nOur three models predict simulated pain at +1, +7 and +14 calendar days from six current features. Each uses ElasticNet, with both coefficient sparsity and shrinkage, λ = 0.04 and an L1 fraction of 0.5. Date pairs are checked exactly. Input standardization is fitted on the earlier training period, while later pairs are held out for testing with a horizon-sized gap. The page shows current endpoint estimates and each model’s test errors; it does not calculate a daily path between those dates.",
    math: "ŷₜ₊ₕ = bₕ + xₜ·βₕ,  h ∈ {1,7,14}",
    mathNote:
      "h denotes the future offset in days. The starting value bₕ and coefficient vector βₕ are fitted separately for each horizon; there is no shared coefficient vector or recursive input substitution. Our h values are 1, 7 and 14. Each model minimizes half mean squared error plus an ElasticNet penalty with λ = 0.04 and equal L1/L2 contributions.",
    how: "For every horizon, the handler matches a dated feature row to pain at its exact future calendar endpoint. It creates an 80/20 chronological split and excludes a horizon-sized set of pairs at the boundary. Means and population standard deviations are learned from training features only and reused for inference. Coordinate descent fits a separate ElasticNet model. Its holdout series, coefficients, RMSE, R², mean-baseline error and latest-row endpoint estimate are returned. The latest estimates use these training-period models; no future food records are fetched, and a longer-horizon output is not constructed from the shorter predictions.",
    why: "It exposes temporal target construction and lets you evaluate each horizon independently. The fixture has a planted one-day exposure relationship, providing a useful demonstration that strong near-term information need not carry into longer horizons.",
    archive:
      "The old forecasting wrapper used larger temporal feature matrices, database reads during prediction and optional sampling of missing inputs. This direct version takes one supplied snapshot and uses explicit 1/7/14-day endpoints. Its current estimates use the earlier-period fitted models rather than a hidden inference-time database lookup.",
    limitations:
      "The three endpoints do not form a fitted day-by-day trajectory, and connecting them does not create an uncertainty interval. Today’s generated exposure features have a planted one-day relationship, so they need not predict outcomes a week or two later.",
    steps: [
      [
        "Construct each future target",
        "Pair current features with exact +1, +7 and +14-day pain.",
      ],
      [
        "Reserve chronological test pairs",
        "Use an 80/20 split and a gap matching each horizon.",
      ],
      [
        "Fit independent ElasticNet models",
        "Learn standardization and coefficients within each training period.",
      ],
      [
        "Evaluate and report each endpoint",
        "Compare holdout errors and return latest-row estimates separately.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 14,
    plainLanguage: {
      what: "Direct multi-horizon forecasting builds a separate model for each future endpoint. A one-day model learns from inputs at time t paired with the outcome at t+1; a seven-day model uses t+7, and so on. Each model can learn different coefficients because the information useful tomorrow may not be useful a week later. Unlike recursive forecasting, one model’s prediction is not passed into another to produce the longer horizon. This approach is used when different planning dates need separately evaluated estimates.\n\nOur three models predict simulated pain at +1, +7 and +14 calendar days from six current features. Each uses ElasticNet, with both coefficient sparsity and shrinkage, λ = 0.04 and an L1 fraction of 0.5. Date pairs are checked exactly. Input standardization is fitted on the earlier training period, while later pairs are held out for testing with a horizon-sized gap. The page shows current endpoint estimates and each model’s test errors; it does not calculate a daily path between those dates.",
      uses: "Common applications: demand planning, resource forecasting and independently evaluated future endpoints.",
    },
    methodology: [
      [
        "The question",
        "Can today’s generated inputs estimate simulated pain one, seven or fourteen days later? We fit three models because each endpoint is a different question. This is direct forecasting: today’s row predicts each endpoint without feeding earlier predictions into later ones.",
      ],
      [
        "How the models learn",
        "For each horizon we build exact calendar pairs. Roughly 80% of those pairs train the model, 20% are held out for later testing, and a horizon-sized gap separates the periods. Input scales and ElasticNet weights are learned separately for each task. Unavailable future labels are left out rather than imputed.",
      ],
      [
        "How to read the result",
        "The bars are current-input endpoint estimates from the earlier-period fitted models. The table evaluates each model on its own held-out days. RMSE is error in simulated pain-scale points, with big misses counting more; compare it with always predicting that model’s earlier target mean. Different row counts and errors across horizons are expected.",
      ],
      [
        "What that tells us",
        "A low one-day error does not validate the longer models. The generator has strong one-day exposure signal, not a promise of long-range signal. These are three point estimates, not daily observations, causal predictions or calibrated ranges.",
      ],
    ],
    example:
      "For the +7-day task, a January 1 feature row is paired with January 8 pain. The +1-day model pairs that same input date with January 2 instead. These are different training examples and can yield different coefficients and errors. The table reports each horizon’s own test sample count and RMSE, alongside the error from always predicting its training target mean. Its three forecast bars are discrete endpoints, not daily values hidden between them.",
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
      "Use a training-fitted PCA representation before each independent future-endpoint regression.",
    evaluation:
      "The bars show three current-input point estimates, while the table measures each model’s held-out errors. RMSE is a pain-scale error summary; the mean baseline is the simpler earlier-average estimate to compare with. The models have their own sample sizes and fitted views, so a score at one endpoint should not stand in for another.",
    purpose:
      "PCA plus multi-horizon regression combines dimensionality reduction with direct forecasting. Principal component analysis replaces input variables with weighted combinations called components, chosen to retain input variance. A separate regression model then predicts each future endpoint from those component coordinates. Reducing redundant measurements can simplify the model, but a direction with low variance can still contain predictive information, so compression must be evaluated rather than assumed beneficial.\n\nOur implementation fits models for simulated pain exactly +1, +7 and +14 days ahead. Each horizon has its own calendar-paired data, chronological training/test split and horizon-sized gap. Feature standardization and four PCA components are fitted only on its training rows; the same transformation is reused for later test rows and the latest input. ElasticNet predicts from those components. The page reports independent endpoint estimates and test metrics, allowing comparison with direct-feature ElasticNet on the same seed. These are separate point forecasts, not an interpolated daily trajectory.",
    math: "Zₕ = standardize(Xₕ) · Vₕ,₄\nŷₜ₊ₕ = bₕ + Zₜ,ₕ·βₕ",
    mathNote:
      "Vₕ,₄ contains four principal directions fitted to the training inputs for horizon h. After applying the saved standardization, multiplying by those directions produces Zₕ. ElasticNet coefficients βₕ then predict that horizon’s target from component coordinates. Each horizon has its own scaler, projection and regression fit; component coefficients are not original-variable coefficients.",
    how: "Repeat the entire feature/target preparation for horizons 1, 7 and 14. Use exact calendar endpoints and an 80/20 chronological split with a horizon-sized gap. Fit feature means and scales on the training portion, then use Jacobi eigenanalysis to obtain four PCA directions. Project training, test and latest rows with the same saved parameters. Fit an ElasticNet regressor on training component scores, with λ = 0.04 and l1Ratio = 0.5. Return each model’s held-out predictions and metrics, component information, coefficients and current estimate. No part of its projection is fitted on later test inputs.",
    why: "It tests a specific representation choice at several future offsets. A side-by-side comparison with direct forecasting reveals whether retaining broad input variation also retains the information needed by each future target.",
    archive:
      "The coursework version described same-day through seven-day forecasting, used database inference reads and could sample missing inputs. This entry instead uses fixed +1/+7/+14 endpoints and a complete immutable fixture. It documents its representation and dates instead of claiming every historical horizon was restored.",
    limitations:
      "PCA keeps large input variation, not necessarily the information each future target needs. The three estimates are separate endpoints, not a continuous daily forecast. A favorable compressed model at one horizon does not prove compression helps every horizon.",
    steps: [
      [
        "Pair each horizon’s exact dates",
        "Build separate +1, +7 and +14-day target datasets.",
      ],
      [
        "Fit standardization and four PCs",
        "Use only that horizon’s earlier training inputs.",
      ],
      [
        "Fit regression on component scores",
        "Train an independent ElasticNet model for each horizon.",
      ],
      [
        "Reuse the fitted transformation",
        "Measure holdout error and calculate the latest endpoint estimate.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 15,
    plainLanguage: {
      what: "PCA plus multi-horizon regression combines dimensionality reduction with direct forecasting. Principal component analysis replaces input variables with weighted combinations called components, chosen to retain input variance. A separate regression model then predicts each future endpoint from those component coordinates. Reducing redundant measurements can simplify the model, but a direction with low variance can still contain predictive information, so compression must be evaluated rather than assumed beneficial.\n\nOur implementation fits models for simulated pain exactly +1, +7 and +14 days ahead. Each horizon has its own calendar-paired data, chronological training/test split and horizon-sized gap. Feature standardization and four PCA components are fitted only on its training rows; the same transformation is reused for later test rows and the latest input. ElasticNet predicts from those components. The page reports independent endpoint estimates and test metrics, allowing comparison with direct-feature ElasticNet on the same seed. These are separate point forecasts, not an interpolated daily trajectory.",
      uses: "Common applications: forecasting with correlated measurements and comparing compressed versus original feature sets.",
    },
    methodology: [
      [
        "The question",
        "Does a smaller summary of today’s inputs help predict three future pain endpoints? This workflow asks the same +1/+7/+14-day questions as direct ElasticNet forecasting, but each model sees four combined patterns rather than six original features.",
      ],
      [
        "How the models learn",
        "Each horizon has exact input/target date pairs, an earlier roughly 80% training period, a later 20% test and a gap matching its horizon. Scaling and PCA are fitted inside that earlier period. Its four directions summarize those learning inputs; the separate ElasticNet model then learns a pain estimate from their coordinates.",
      ],
      [
        "How to read the result",
        "The bars show three current-input point estimates, while the table measures each model’s held-out errors. RMSE is a pain-scale error summary; the mean baseline is the simpler earlier-average estimate to compare with. The models have their own sample sizes and fitted views, so a score at one endpoint should not stand in for another.",
      ],
      [
        "What that tells us",
        "Compare each horizon with direct ElasticNet on the same seed. A compressed representation can help, do nothing or lose signal. The connecting presentation does not supply daily estimates between endpoints or a validated uncertainty range.",
      ],
    ],
    example:
      "For one horizon, the six standardized input values of a day become four component scores through its fitted PCA directions. The regression combines those scores to estimate the paired future pain value. A later test row must use those same directions; recalculating PCA with test inputs would change the experiment. Compare each row of the forecast table with the direct ElasticNet table on the same seed, rather than judging compression from variance percentages alone.",
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
      "Classify a precisely defined simulated event at three separate future endpoints.",
    evaluation:
      "The bars are probabilities for the latest input row. The table checks each model on different later examples. Accuracy measures yes/no choices at 0.5; Brier score measures probability error, with confident wrong answers costing more. Precision and recall are in the downloadable results. A common class can make accuracy look good even when probability quality is weak.",
    purpose:
      "Multi-horizon event classification estimates a binary outcome at several future offsets. The event definition must distinguish an occurrence exactly at an endpoint from an occurrence anywhere inside the intervening interval; those produce different labels and probabilities. Each offset needs its own training examples and evaluation because class frequency and available predictive information can change with time. A probability is an estimate of the chosen label, not a general statement about all future events.\n\nHere the label is simulated pain ≥ 5 exactly +3, +7 or +14 days after the feature date. Each model uses six current features, training-only standardization, four PCA components and logistic LASSO. An 80/20 chronological split with a horizon-sized gap separates fitting from testing. The bars show probabilities for the latest input row; the table checks each model on later examples. The threshold is an explicit coursework rule, and these endpoint probabilities do not represent validated Crohn’s flare risk.",
    math: "yₜ,ₕ = 1[pain(t+h) ≥ 5],  h ∈ {3,7,14}\npₜ,ₕ = sigmoid(bₕ + PCA(xₜ)·βₕ)",
    mathNote:
      "The indicator 1[pain(t+h) ≥ 5] defines the binary target for h = 3, 7 or 14. The sigmoid turns the weighted PCA score into that target’s probability. Its L1 regularization cost is λ = 0.04; predictions at or above 0.5 form the positive class for classification metrics. The target is the endpoint value, not “any threshold crossing before t+h.”",
    how: "For each endpoint, construct exact calendar-paired features and threshold labels, excluding pairs without a known endpoint. Create separate earlier training and later test periods with a gap equal to the horizon. Fit input standardization and four PCA directions on training features only. Fit proximal-gradient logistic LASSO on their component scores for 400 iterations, requiring both training classes. Apply the unchanged transforms to later examples and the latest row. Return current probabilities, coefficients, projection details, holdout series, accuracy, precision, recall and Brier scores. The three probability models are independent fits, rather than one model evaluated at three display positions.",
    why: "It makes event definitions, temporal pairing and probability evaluation explicit. It also demonstrates that changing a prediction offset changes the task, even when the numerical classifier remains the same.",
    archive:
      "The last archived flare workflow used direct inputs and evaluated its fit on learning rows. This direct demonstration uses PCA, exact endpoint labels and separate later tests. These choices are explicit changes, rather than a claim that the historical model already had valid clinical or held-out performance.",
    limitations:
      "The arbitrary pain threshold is a simulated class, not a validated Crohn’s flare event. A probability can be poorly calibrated even when class decisions look reasonable. Uneven classes and limited longer-horizon input signal can also make comparisons misleading.",
    steps: [
      [
        "Define each binary endpoint label",
        "Use pain ≥ 5 exactly at +3, +7 and +14 days.",
      ],
      [
        "Separate training and test periods",
        "Exclude a gap equal to each endpoint offset.",
      ],
      [
        "Fit PCA and logistic LASSO",
        "Learn both representations and coefficients on training rows.",
      ],
      [
        "Evaluate probabilities independently",
        "Report each horizon’s holdout metrics and latest estimate.",
      ],
    ],
    source: [
      "Logistic regression",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html",
    ],
    number: 16,
    plainLanguage: {
      what: "Multi-horizon event classification estimates a binary outcome at several future offsets. The event definition must distinguish an occurrence exactly at an endpoint from an occurrence anywhere inside the intervening interval; those produce different labels and probabilities. Each offset needs its own training examples and evaluation because class frequency and available predictive information can change with time. A probability is an estimate of the chosen label, not a general statement about all future events.\n\nHere the label is simulated pain ≥ 5 exactly +3, +7 or +14 days after the feature date. Each model uses six current features, training-only standardization, four PCA components and logistic LASSO. An 80/20 chronological split with a horizon-sized gap separates fitting from testing. The bars show probabilities for the latest input row; the table checks each model on later examples. The threshold is an explicit coursework rule, and these endpoint probabilities do not represent validated Crohn’s flare risk.",
      uses: "Common applications: scheduled threshold checks, endpoint classification and evaluating different prediction horizons.",
    },
    methodology: [
      [
        "The question",
        "What is the model’s probability that simulated pain reaches five exactly three, seven or fourteen days later? Each endpoint has its own yes/no labels. These are not “any event in the next window” labels and are not clinical flare-risk definitions.",
      ],
      [
        "How the models learn",
        "We form exact calendar pairs for each endpoint and exclude incomplete future labels. Earlier pairs provide roughly 80% of the examples; later pairs are saved, with a gap equal to the horizon. Each training period supplies its own input scale, four PCA directions and sparse logistic model.",
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
    example:
      "In the three-day task, January 1 features are labeled from January 4 pain. If pain exceeds five on January 2 but is below five on January 4, this endpoint label is negative. A label meaning “any event over the next three days” would be different. The handler deliberately uses the endpoint rule, and the table evaluates those labels separately at all three offsets.",
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
      "Predict a time series from observed lags, then recursively extend it beyond the available history.",
    evaluation:
      "The reported RMSE, R² and mean-baseline error belong to the one-step held-out test. RMSE is in pain-scale points, with lower better. The chart instead shows 28 observed synthetic days followed by the final model’s 14 recursive future steps. After observations end, predicted values enter later lag rows, and outputs are bounded to 0–10.",
    purpose:
      "Autoregression models a quantity using its previous values. Lagged observations can capture persistence, short-term changes or repeated timing structure. A one-step model predicts the next value from available history. To forecast several steps beyond that history, it can reuse its own earlier predictions as later inputs. This recursive procedure accumulates model error, so an accurate one-step test does not automatically establish an accurate long-range trajectory.\n\nOur ElasticNet model predicts simulated pain from lags of 1, 2, 3 and 7 days, a trend and weekly sine/cosine features. It requires consecutive observations and evaluates an 80/20 chronological one-step holdout using observed lag values. After recording that evaluation, it refits on all observed history and produces fourteen recursive future steps, bounded to 0–10. The chart separates observed history from this generated future. Despite the archived ARIMA filename, the implementation has no differencing or moving-average error term; autoregressive regression is the accurate description.",
    math: "ŷₜ = b + β₁yₜ₋₁ + β₂yₜ₋₂ + β₃yₜ₋₃ + β₇yₜ₋₇\n      + βtrend·t + βsin·sin(2πt/7) + βcos·cos(2πt/7)",
    mathNote:
      "The equation combines lagged pain values with fitted coefficients, a scaled time trend and weekly periodic terms. Sine and cosine together represent a repeating seven-day position. ElasticNet fits these regression features. There is no ARIMA differencing order or moving-average error model in this implementation. The 14-step forecast applies the regression repeatedly, substituting predictions when observed lag values run out.",
    how: "Require at least 30 demo rows and consecutive known pain dates. For each position after the first seven observations, construct lags 1/2/3/7, index divided by history length, and weekly sine/cosine features. Fit on the first 80% of lag rows and test the last 20% with their observed historical inputs. Record RMSE, R² and the training-mean baseline. Only afterward, fit a final model on all observed rows. Starting at the snapshot’s as-of date, append a prediction, clamp it to 0–10 and use the extended series to create the next feature row. Repeat for 14 days.",
    why: "It separates one-step evaluation from recursive forecasting and makes the lag-feature construction inspectable. The refit happens after the test record, so generating a future path is not confused with the evidence used to assess the earlier fitted model.",
    archive:
      "The old file was named ArimaForecasting, but actually fitted autoregressive ElasticNet features and added heuristic ranges. The direct version uses an accurate name, adds explicit weekly sine/cosine features, and does not display those heuristic ranges as proven prediction intervals.",
    limitations:
      "One-step error measured with real observed lags does not measure a whole 14-step recursive path. Mistakes can compound, and clamping predictions to 0–10 only limits the values; it does not establish their accuracy or provide uncertainty.",
    steps: [
      [
        "Construct lagged regression features",
        "Use lags 1/2/3/7, trend and weekly sine/cosine terms.",
      ],
      [
        "Evaluate a one-step holdout",
        "Keep observed previous values in each later test input.",
      ],
      [
        "Refit the observed history",
        "Record test metrics before fitting all available rows.",
      ],
      [
        "Generate a recursive future",
        "Append each bounded prediction before calculating the next step.",
      ],
    ],
    source: [
      "What an ARIMA model includes",
      "https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html",
    ],
    number: 17,
    plainLanguage: {
      what: "Autoregression models a quantity using its previous values. Lagged observations can capture persistence, short-term changes or repeated timing structure. A one-step model predicts the next value from available history. To forecast several steps beyond that history, it can reuse its own earlier predictions as later inputs. This recursive procedure accumulates model error, so an accurate one-step test does not automatically establish an accurate long-range trajectory.\n\nOur ElasticNet model predicts simulated pain from lags of 1, 2, 3 and 7 days, a trend and weekly sine/cosine features. It requires consecutive observations and evaluates an 80/20 chronological one-step holdout using observed lag values. After recording that evaluation, it refits on all observed history and produces fourteen recursive future steps, bounded to 0–10. The chart separates observed history from this generated future. Despite the archived ARIMA filename, the implementation has no differencing or moving-average error term; autoregressive regression is the accurate description.",
      uses: "Common applications: demand and sensor forecasting, serial dependence and recursive time-series prediction.",
    },
    methodology: [
      [
        "The question",
        "Can earlier pain values help estimate the next value, and what happens if the model continues beyond the observed history? This is autoregressive regression with recent and weekly lags, a trend and a repeating weekly pattern, not a full ARIMA fit.",
      ],
      [
        "How the model learns",
        "Consecutive observations create lag rows after the first seven days. Earlier 80% rows teach ElasticNet; later 20% are saved for one-step tests. For every test row, the lag features are observed history. Once these test scores are recorded, a separate final model is fitted to all observed lag rows.",
      ],
      [
        "How to read the result",
        "The reported RMSE, R² and mean-baseline error belong to the one-step held-out test. RMSE is in pain-scale points, with lower better. The chart instead shows 28 observed synthetic days followed by the final model’s 14 recursive future steps. After observations end, predicted values enter later lag rows, and outputs are bounded to 0–10.",
      ],
      [
        "What that tells us",
        "The one-step score cannot be presented as measured accuracy of the entire future path. A smooth continuation may simply reflect the model’s own dynamics. No calibrated prediction range is claimed, and a bound on values is not a bound on error.",
      ],
    ],
    example:
      "To predict an observed test day, its lag-1 input is the actual previous day’s pain. To predict the second unobserved future day, lag-1 is instead the first future prediction. That substitution is the key difference between the reported one-step holdout and the plotted recursive path. The forecast can remain inside 0–10 while still being inaccurate; clipping constrains values, not the error against unknown future outcomes.",
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
      "Predict a multivariate next state from PCA scores, then pass predicted states forward recursively.",
    evaluation:
      "The table reports one-step RMSE for each field, compared with its earlier-period mean estimate. Pain error is in pain-scale units; other errors use their own raw units. The chart shows recursively generated pain and rescales each feature trace to 0–10 using its observed range, allowing shapes to be compared. Downloaded values remain unscaled.",
    variant: true,
    purpose:
      "A multivariate cascade predicts several quantities that together form a state, then uses the predicted state as input for the next step. This can model dependencies among measurements, but errors in one field can influence predictions for other fields later. The PCA variant first represents the previous state with a smaller set of combined coordinates, reducing its dimension before fitting separate next-field regressors. Compression is a modeling choice, not evidence that the simulation is accurate.\n\nOur state contains simulated pain plus six generated features. Four PCA components and seven ElasticNet models are fitted to the earlier 80% of consecutive state pairs; the later 20% test one-step predictions using observed predecessor states. From the last observed state, the fitted models recursively generate seven future states. Every predicted field is bounded to its observed range. The plot shows pain and rescaled feature traces, while downloaded values remain in their original units. Its one-step metrics do not validate the whole recursive path.",
    math: "sₜ = [painₜ, six inputsₜ]\nŝₜ₊₁,j = fⱼ(PCA(sₜ));  ŝₜ₊₂ = f(PCA(ŝₜ₊₁))",
    mathNote:
      "sₜ contains seven fields. A training-fitted scaler and four PCA directions produce component coordinates; each function fⱼ is an ElasticNet regressor for the next field j. During recursion, f receives the predicted state ŝ from the preceding step. Bounds use each field’s observed minimum and maximum. Display normalization is separate from this model transformation.",
    how: "Require at least 40 rows with consecutive known pain dates, and construct adjacent seven-field state pairs. The first 80% of predecessor states fit means, scales and four PCA directions. Train one ElasticNet model for each next-state field using those component scores. Test later pairs by projecting their observed predecessors through the same transformation. Starting from the final observed state, predict all fields simultaneously, clamp them to their observed ranges, and reuse that state for the next step. Seven recursive rows are returned. The chart rescales feature traces to 0–10 for visual comparison; neither raw outputs nor holdout error units are changed.",
    why: "It combines dimensionality reduction and multiple regression outputs in a concrete state-transition system. Comparing it with the direct cascade isolates the effect of compression, while field-by-field metrics expose where error can enter the recursive system.",
    archive:
      "The archived PCA cascade used a larger eight-symptom representation and different score composition. This direct variant states a seven-field state of pain plus six demo inputs. It preserves the recursive multivariate idea while making the simpler state and numerical route explicit.",
    limitations:
      "Future exposure features are model-generated, not known future behavior. Many fixture inputs are random, so predicting them recursively can settle into smooth but unrealistic paths. Observed-range clipping helps control drift without validating the simulation.",
    steps: [
      [
        "Build consecutive state pairs",
        "A state contains pain plus six generated feature values.",
      ],
      [
        "Fit a four-component state representation",
        "Learn scaling and PCA from earlier predecessor states only.",
      ],
      [
        "Fit seven next-field regressors",
        "Evaluate each on later observed predecessor states.",
      ],
      [
        "Pass predictions through seven steps",
        "Bound the full predicted state before using it again.",
      ],
    ],
    source: [
      "PCA and decomposition",
      "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    ],
    number: 18,
    plainLanguage: {
      what: "A multivariate cascade predicts several quantities that together form a state, then uses the predicted state as input for the next step. This can model dependencies among measurements, but errors in one field can influence predictions for other fields later. The PCA variant first represents the previous state with a smaller set of combined coordinates, reducing its dimension before fitting separate next-field regressors. Compression is a modeling choice, not evidence that the simulation is accurate.\n\nOur state contains simulated pain plus six generated features. Four PCA components and seven ElasticNet models are fitted to the earlier 80% of consecutive state pairs; the later 20% test one-step predictions using observed predecessor states. From the last observed state, the fitted models recursively generate seven future states. Every predicted field is bounded to its observed range. The plot shows pain and rescaled feature traces, while downloaded values remain in their original units. Its one-step metrics do not validate the whole recursive path.",
      uses: "Common applications: multivariate simulation, compressed state modeling and studying forecast-error propagation.",
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
        "The table reports one-step RMSE for each field, compared with its earlier-period mean estimate. Pain error is in pain-scale units; other errors use their own raw units. The chart shows recursively generated pain and rescales each feature trace to 0–10 using its observed range, allowing shapes to be compared. Downloaded values remain unscaled.",
      ],
      [
        "What that tells us",
        "One-step checks do not measure the whole seven-step trajectory. Inputs predicted on earlier steps can propagate mistakes, and observed-range clipping can make an unstable estimate look orderly. These are simulated state dynamics, not known future exposures.",
      ],
    ],
    example:
      "One training pair maps today’s seven-field state to tomorrow’s seven-field state. PCA supplies four coordinates from today’s standardized values; seven regressors each learn one part of tomorrow’s answer. In the second future step, the input is the whole first predicted state, including predicted food and energy fields. Those fields are not known future behaviors, and their prediction errors can affect later pain estimates.",
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
      "Display one outcome from the same recursively predicted multivariate state.",
    evaluation:
      "The visible line is simulated pain, not a composite medical score. The returned evaluation table still includes one-step errors for every internal field. RMSE describes misses in each field’s units, and the baseline is always predicting that field’s earlier mean. Those checks use observed predecessor states, while the future line uses increasingly predicted states.",
    variant: true,
    purpose:
      "The score-cascade variant is a scalar output view of a multivariate recursive model. Internally, several state quantities are predicted and reused at every step; only one quantity is displayed. This can make the output easier to inspect, but does not simplify the underlying dependencies or eliminate error propagated through hidden fields. It is important to distinguish a display variant from a different mathematical model or a newly validated score.\n\nHere, the displayed quantity is simulated pain. The internal state still contains pain and six generated features, with one standardized ElasticNet model per next field and no PCA. Models use earlier consecutive state pairs; later pairs provide one-step holdout errors from observed predecessor states. Starting at the last observed state, they generate seven recursive steps bounded to each field’s observed range. This handler omits future feature traces while retaining the direct symptom cascade’s internal dynamics and evaluation. The historical name does not imply a composite clinical health-score formula.",
    math: "ŝₜ₊₁ = f(sₜ)\nDisplay ŝₜ₊ₕ,pain for h = 1…7",
    mathNote:
      "The full next-state function f predicts seven fields. This output variant returns only its pain coordinate for horizons 1…7. All predicted fields remain part of the next recursive input, even though six are hidden from the returned future rows. The numerical route uses direct standardized ElasticNet regressors rather than PCA components or a separate health-scoring composition.",
    how: "Use at least 40 consecutive demo rows to form adjacent pain-plus-six-feature states. Fit one ElasticNet regressor per output on the first 80% of state pairs, with each model’s standardization fitted inside that training period. Evaluate later pairs using their observed predecessors. Begin at the final observed state, predict all seven fields, clamp each to its observed range and repeat seven times. Return the pain component of each future state and all one-step field evaluations. Changing the display does not remove the feature regressors or their influence on later predictions.",
    why: "It preserves the scalar-output coursework variant while explaining exactly what is shared with the symptom cascade. A single trace helps inspect the recursive pain trajectory without claiming a separate score calculation.",
    archive:
      "The earlier health-score cascade relied on a historical HealthScoring composition. This direct demonstration replaces that with explicitly simulated pain and hides the other predicted fields in its output view. It does not claim to restore a separate validated health-score algorithm.",
    limitations:
      "A simpler display does not make the internal system simpler or more accurate. Hidden input predictions still affect later pain predictions. The line can converge smoothly because of the model and clipping, even when actual future observations would not follow it.",
    steps: [
      [
        "Construct seven-field state pairs",
        "Retain pain and all six generated features internally.",
      ],
      [
        "Fit direct next-state regressors",
        "Use training-only scaling, without PCA.",
      ],
      [
        "Recurse through the complete state",
        "Predict and bound every field at each step.",
      ],
      [
        "Return only the pain trajectory",
        "Keep shared field evaluations and explain the display choice.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 19,
    plainLanguage: {
      what: "The score-cascade variant is a scalar output view of a multivariate recursive model. Internally, several state quantities are predicted and reused at every step; only one quantity is displayed. This can make the output easier to inspect, but does not simplify the underlying dependencies or eliminate error propagated through hidden fields. It is important to distinguish a display variant from a different mathematical model or a newly validated score.\n\nHere, the displayed quantity is simulated pain. The internal state still contains pain and six generated features, with one standardized ElasticNet model per next field and no PCA. Models use earlier consecutive state pairs; later pairs provide one-step holdout errors from observed predecessor states. Starting at the last observed state, they generate seven recursive steps bounded to each field’s observed range. This handler omits future feature traces while retaining the direct symptom cascade’s internal dynamics and evaluation. The historical name does not imply a composite clinical health-score formula.",
      uses: "Common applications: scalar views of multivariate forecasts and inspecting one outcome of a simulation.",
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
    example:
      "Select this entry and the symptom cascade on the same seed. Both use the direct seven-field state models, so the pain trajectory should agree. The symptom view also returns future feature values; this entry hides them. A hidden energy or exposure prediction still enters the next state and can influence its pain estimate. “Score-only” therefore refers to what is returned for display, not to a one-variable model.",
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
      "Fit one next-state regression per field and recursively reuse the complete predicted state.",
    evaluation:
      "Violet represents simulated pain. Other traces are each rescaled to 0–10 from their observed ranges solely to compare motion; the downloaded feature values stay in their original units. The table’s RMSE values also retain original units and compare with simple earlier-period means. They evaluate one-step predictions, not the seven-step plotted path.",
    variant: true,
    purpose:
      "A direct multivariate cascade predicts a vector of measurements from the preceding vector, then repeats that transition using its own predicted values. Separate output models can capture different dependencies among state fields. Unlike a direct multi-horizon forecast, later steps are not independently fitted to their future endpoints: they reuse one-step models and increasingly predicted inputs. This makes the origin and propagation of error central to interpretation.\n\nOur state consists of simulated pain plus six generated features, and the implementation fits seven standardized ElasticNet regressors without PCA. Earlier adjacent-day state pairs form the training set; later pairs test one-step predictions from observed predecessors. From the last observed state, the models generate seven recursive future states, each bounded to its fields’ observed ranges. The plot rescales feature lines only to compare their trajectories; downloaded values and evaluation metrics retain original units. Comparing the PCA cascade tests a representation change, while comparing the score view tests a display change.",
    math: "ŝₜ₊₁,j = bⱼ + sₜ·βⱼ,  j = 1…7\nŝₜ₊₂ = f(ŝₜ₊₁)",
    mathNote:
      "Each field j has its own intercept and coefficient vector operating on the previous full state sₜ. No PCA projection is applied, although regression inputs are standardized with fitted training means and population spreads. The next recursive input is the predicted vector ŝₜ₊₁. This differs from independent models trained specifically for horizons +2 through +7.",
    how: "Require at least 40 consecutive rows with known pain and construct adjacent seven-field states. Split their pairs chronologically at 80%, then train one standardized ElasticNet regressor for each next-state field. Evaluate the remaining pairs using observed predecessor states. Starting from the latest observed state, apply all models, clamp predictions to each observed field range, and feed the entire vector forward seven times. Return pain and feature values for every future step, plus one-step RMSE, R² and mean-baseline errors per field. The display’s range normalization does not alter these calculated states or error metrics.",
    why: "It makes multivariate recursive prediction explicit without a compression layer. Field-by-field checks and comparisons with PCA/score variants help separate representation, numerical behavior and presentation.",
    archive:
      "The older symptom-cascade variant used a wider symptom vector. This direct version documents its seven state fields and performs no hidden composite-health-score calculation. Its direct state representation differs from the retained PCA cascade variant.",
    limitations:
      "Later steps inherit predictions for every field, including largely random synthetic exposures. A good one-step pain score can coexist with weak input predictions and a poor multi-step trajectory. Display normalization is only a chart aid, not a numerical accuracy adjustment.",
    steps: [
      [
        "Pair each state with the next day",
        "Use pain and six generated feature fields.",
      ],
      [
        "Fit one regression for every output",
        "Standardize direct state inputs within the training period.",
      ],
      [
        "Test observed-state transitions",
        "Evaluate later one-step answers from actual predecessor states.",
      ],
      [
        "Generate seven recursive states",
        "Feed each bounded predicted vector into the next transition.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 20,
    plainLanguage: {
      what: "A direct multivariate cascade predicts a vector of measurements from the preceding vector, then repeats that transition using its own predicted values. Separate output models can capture different dependencies among state fields. Unlike a direct multi-horizon forecast, later steps are not independently fitted to their future endpoints: they reuse one-step models and increasingly predicted inputs. This makes the origin and propagation of error central to interpretation.\n\nOur state consists of simulated pain plus six generated features, and the implementation fits seven standardized ElasticNet regressors without PCA. Earlier adjacent-day state pairs form the training set; later pairs test one-step predictions from observed predecessors. From the last observed state, the models generate seven recursive future states, each bounded to its fields’ observed ranges. The plot rescales feature lines only to compare their trajectories; downloaded values and evaluation metrics retain original units. Comparing the PCA cascade tests a representation change, while comparing the score view tests a display change.",
      uses: "Common applications: multivariate time-series simulation, coupled forecasts and comparing state representations.",
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
    example:
      "During the one-step test, an input includes the recorded simulated energy and exposure indicators for that date. During the second future step, those same fields come from the first predicted state. The chart’s feature traces show that substitution in action, after range scaling for display. A low one-step pain error can coexist with poor feature forecasts and a weak multi-step trajectory; the table is not an evaluation of the entire plotted future.",
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
      "Compare mean next-day pain between dates with and without each simulated exposure indicator.",
    evaluation:
      "A positive bar means the exposed group had higher mean pain the next day; a negative bar means lower mean pain. The number is a difference in simulated pain-scale points. It has no predictive test score, statistical interval or adjustment for other simultaneous inputs. Read the exposed and comparison counts alongside the magnitude.",
    purpose:
      "This workflow performs a descriptive group comparison rather than fitting a prediction model. For each exposure indicator, it divides dated observations into indicator-present and indicator-absent groups, then compares their average subsequent outcome. Such comparisons are useful for exploratory summaries and checking whether a specified delay has been aligned correctly. They do not isolate the exposure from other variables that may differ between groups. A mean difference alone has neither a causal interpretation nor a measure of statistical uncertainty.\n\nOur calculation examines dairy, spicy and caffeine indicators from the simulated inputs. Each is paired with pain exactly one calendar day later. A value above zero defines the exposed group; zero defines the comparison group. The output returns both group counts and the exposed-minus-comparison mean difference, in pain-scale points. The individual means are calculated internally but are not separate output fields. All complete pairs contribute; there is no training split, prediction score, confidence interval or adjustment for the other inputs.",
    math: "Δ = mean(painₜ₊₁ | exposureₜ > 0) − mean(painₜ₊₁ | exposureₜ = 0)",
    mathNote:
      "Δ is a difference in means. The condition exposureₜ > 0 selects next-day pain values after dates with the indicator present; exposureₜ = 0 selects the comparison dates. Subtracting the second average from the first yields a difference in simulated pain-scale units. A positive Δ means the first observed average is higher, a negative Δ lower. Both groups must contain observations. The expression is an unadjusted descriptive comparison; it does not estimate the outcome of changing an exposure while holding all other conditions constant.",
    how: "Create exact one-day input/pain pairs, excluding missing future endpoints. For each of the first three feature columns—dairy, spicy and caffeine—select target values whose current indicator is greater than zero as exposed outcomes. Select targets whose indicator is exactly zero as comparison outcomes. These are counts of dated rows, not counts of meals or individual foods.\n\nCompute each group's arithmetic mean and subtract the comparison mean from the exposed mean. Return the difference and both denominators so users can see how many dates support the comparison. If either group is empty, return null for the difference rather than manufacture a zero. The algorithm does not fit coefficients, control for coincident exposures or calculate a statistical test. A positive difference only states that the exposed rows had higher next-day average pain in this supplied dataset.",
    why: "This provides an understandable baseline alongside correlation and fitted coefficients. Its units remain the target's units, and reporting both sample counts makes support for the estimate visible. The simulation's planted one-day dependencies help check date alignment. The tradeoff is lack of adjustment: simultaneous inputs, periodic variation and sampling can influence the difference. An exposure association in personal data would need much stronger analysis before it could support any causal conclusion.",
    archive:
      "The original trigger analysis explored more exposure types and several delays. This direct demonstration uses three stated binary indicators and a fixed next-calendar-day delay. It labels both group sizes instead of treating any small difference as a proven trigger effect.",
    limitations:
      "The groups can differ in other ways, so their average difference need not come from that indicator alone. Recording patterns, co-occurring inputs and chance can all matter. The historical word “trigger” does not turn the comparison into an intervention estimate.",
    steps: [
      [
        "Build complete one-day pairs",
        "Use each exposure date with pain recorded exactly one calendar day later.",
      ],
      [
        "Separate two groups per indicator",
        "For dairy, spicy and caffeine, use values > 0 versus values exactly 0.",
      ],
      [
        "Calculate the mean difference",
        "Subtract the comparison group’s next-day mean from the exposed group’s mean; return null for an empty group.",
      ],
      [
        "Read the result with counts",
        "Inspect both dated-row counts and the pain-scale difference without treating it as a causal or predictive score.",
      ],
    ],
    source: [
      "Pearson correlation",
      "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html",
    ],
    number: 21,
    plainLanguage: {
      what: "This workflow performs a descriptive group comparison rather than fitting a prediction model. For each exposure indicator, it divides dated observations into indicator-present and indicator-absent groups, then compares their average subsequent outcome. Such comparisons are useful for exploratory summaries and checking whether a specified delay has been aligned correctly. They do not isolate the exposure from other variables that may differ between groups. A mean difference alone has neither a causal interpretation nor a measure of statistical uncertainty.\n\nOur calculation examines dairy, spicy and caffeine indicators from the simulated inputs. Each is paired with pain exactly one calendar day later. A value above zero defines the exposed group; zero defines the comparison group. The output returns both group counts and the exposed-minus-comparison mean difference, in pain-scale points. The individual means are calculated internally but are not separate output fields. All complete pairs contribute; there is no training split, prediction score, confidence interval or adjustment for the other inputs.",
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
    example:
      "Illustrative group arithmetic, not this seed's result: suppose next-day pain after three dairy-present dates is 5, 6 and 4, giving mean 5. After four dairy-absent dates it is 3, 4, 2 and 3, giving mean 3. The returned comparison would contain exposedDays = 3, comparisonDays = 4 and difference = 2. That difference does not show what would happen if dairy were changed: spicy input, energy or date patterns may also differ across those dates. If no absent dates existed, the mean comparison would be undefined and its difference would remain null.",
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
      "Define explicit low/high input cases using a stated association-based selection rule.",
    evaluation:
      "The bars are the actual recorded correlations used in selection, not predicted pain changes. The table states each case’s input bounds. Positive and negative associations can both enter the shortlist because the rule uses strength regardless of sign. No classifier, forecast score or held-out causal experiment is attached to this selection.",
    purpose:
      "Scenario generation prepares hypothetical input cases before a prediction model evaluates them. A useful scenario specifies which variables change, their new values and what stays fixed. Keeping that setup separate from execution makes comparisons reproducible and prevents a model’s output from being confused with the rule that selected its inputs. Scenarios can be used to investigate sensitivity, but choosing a case does not predict its outcome or establish a causal intervention.\n\nOur generator calculates Pearson correlations between six current features and next-day simulated pain, using exact calendar pairs. It ranks valid correlations by absolute magnitude and selects three features, retaining either positive or negative associations. Each receives a low value of zero; the high value is ten for energy and one for other features. The output includes names, bounds and recorded correlations, with no fitted scenario prediction. These fixed bounds are demonstration assumptions, not automatically optimized settings. The separate execution workflow applies them to a regression model.",
    math: "Select top 3 inputs by |r(inputₜ, painₜ₊₁)|\nCreate low/high values for each selected input",
    mathNote:
      "Ranking uses |r(featureₜ, painₜ₊₁)|, so either association sign can enter the top three. Pearson r measures a standardized linear association, not an intervention effect. Undefined correlations are excluded. Bounds are low = 0 and high = 10 for energy or 1 otherwise; they are declared case values rather than estimates learned from the outcome.",
    how: "Call the direct correlation handler on complete one-day date pairs. Remove features with undefined correlations, sort the remaining results by absolute coefficient magnitude and take three. For each, return its feature name, low/high bounds and recorded r. No regression or classifier is trained, and no low/high pain response is computed at this stage. The bounds do not necessarily span a feature’s observed range: for example, the generated fiber variable runs from zero to two but its selected high case is one.",
    why: "It keeps scenario selection distinct from the prediction calculation. The explicit cases let a reader or another model repeat the same comparison and inspect assumptions instead of accepting an unexplained what-if recommendation.",
    archive:
      "The engine-era generator could produce a richer collection of scenario variations. This direct demonstration uses one concise rule for choosing three inputs and states every case’s bounds. It preserves hypothetical-case construction without the surrounding engine lifecycle.",
    limitations:
      "Choosing the largest recorded associations can favor chance patterns. Fixed bounds can explore values that do not represent realistic combined behavior. Selecting a feature for inspection does not recommend changing it or estimate any causal benefit.",
    steps: [
      [
        "Measure next-day associations",
        "Use complete calendar-paired features and pain.",
      ],
      [
        "Rank absolute Pearson coefficients",
        "Keep strong positive or negative associations.",
      ],
      [
        "Select three input variables",
        "Retain names and the recorded association values.",
      ],
      [
        "Declare low/high case bounds",
        "Pass those cases to the separate execution workflow.",
      ],
    ],
    source: [
      "Pearson correlation",
      "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html",
    ],
    number: 22,
    plainLanguage: {
      what: "Scenario generation prepares hypothetical input cases before a prediction model evaluates them. A useful scenario specifies which variables change, their new values and what stays fixed. Keeping that setup separate from execution makes comparisons reproducible and prevents a model’s output from being confused with the rule that selected its inputs. Scenarios can be used to investigate sensitivity, but choosing a case does not predict its outcome or establish a causal intervention.\n\nOur generator calculates Pearson correlations between six current features and next-day simulated pain, using exact calendar pairs. It ranks valid correlations by absolute magnitude and selects three features, retaining either positive or negative associations. Each receives a low value of zero; the high value is ten for energy and one for other features. The output includes names, bounds and recorded correlations, with no fitted scenario prediction. These fixed bounds are demonstration assumptions, not automatically optimized settings. The separate execution workflow applies them to a regression model.",
      uses: "Common applications: reproducible sensitivity studies, simulation case preparation and controlled model comparisons.",
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
    example:
      "If fiber enters the selected three, the case states fiber = 0 versus fiber = 1. It does not report a pain change, even though the feature has a recorded next-day correlation. Energy, if selected, instead uses a high value of ten. Those choices are explicit settings, not observed treatment outcomes. Execution uses the same selected cases to calculate how a fitted model responds.",
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
      "Evaluate paired hypothetical inputs while holding every nonselected feature fixed.",
    evaluation:
      "Mint and violet bars are the low-input and high-input predictions. Their difference shows how this particular fitted model responds under those fixed conditions. Unlike the main regression demos, these comparisons do not have a reserved scenario test period; the model uses all available pairs. The input bounds and prediction differences stay visible in the table.",
    purpose:
      "Scenario execution evaluates an already defined set of hypothetical inputs with a fitted model. Changing one feature while holding other features fixed isolates the model’s sensitivity to that input under the chosen baseline. The resulting prediction difference can help explain a model, but it is not the same as observing a real intervention. Correlated features and unrealistic combinations can make such comparisons especially difficult to interpret causally.\n\nOur handler fits ElasticNet to all complete current-feature/next-day-pain pairs. It uses the latest six-feature row as the baseline input, then takes three cases from scenario generation. For each selected feature, it creates low and high copies of the baseline while preserving the other five values. The output reports both model predictions and their difference, together with the case bounds and recorded association. There is no separate scenario holdout test, and the original snapshot is unchanged. The bars show calculated model responses, not known future outcomes or recommended behavior changes.",
    math: "Δmodel = f(xbase with xⱼ = high) − f(xbase with xⱼ = low)",
    mathNote:
      "f is the fitted ElasticNet prediction function. Δmodel subtracts its answer for the low-setting copy from its answer for the high-setting copy. The other five features stay at their latest-row values. This is a difference between predictions conditional on a chosen input configuration; it does not identify an effect from randomized or observed interventions.",
    how: "Build all complete one-day feature/target pairs and fit an ElasticNet regressor with its standardization learned from that full fitting set. Obtain the three selected low/high cases from the generator. Copy the latest feature vector twice per case, modify only the selected coordinate, and pass both vectors through the fitted model. Return lowPrediction, highPrediction and their difference, alongside the feature and bounds. No baseline pain prediction is separately returned, no personal data is read, and no held-out scenario outcome is used to validate the comparison.",
    why: "It makes a model-based sensitivity calculation inspectable and repeatable. The paired inputs reveal exactly what changes, helping distinguish a conditional model response from observed evidence about a real-world action.",
    archive:
      "The historical engine supported richer generated-scenario execution. This direct route uses one explicit latest-row baseline and one changed field at a time. It returns numerical model responses directly and does not treat them as observed outcomes from an experiment.",
    limitations:
      "Holding other features fixed can create combinations that never occur naturally. A fitted association does not estimate the result of a real food or medication intervention. These hypothetical comparisons have no separate scenario holdout or causal validation.",
    steps: [
      [
        "Fit the next-day regression model",
        "Use all complete date pairs and fitted input standardization.",
      ],
      [
        "Copy the latest feature vector",
        "Use one explicit baseline input configuration.",
      ],
      [
        "Change one selected coordinate",
        "Create low/high inputs with five other values unchanged.",
      ],
      [
        "Compare the calculated predictions",
        "Report both estimates and their difference, without a causal claim.",
      ],
    ],
    source: [
      "ElasticNet objective",
      "https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html",
    ],
    number: 23,
    plainLanguage: {
      what: "Scenario execution evaluates an already defined set of hypothetical inputs with a fitted model. Changing one feature while holding other features fixed isolates the model’s sensitivity to that input under the chosen baseline. The resulting prediction difference can help explain a model, but it is not the same as observing a real intervention. Correlated features and unrealistic combinations can make such comparisons especially difficult to interpret causally.\n\nOur handler fits ElasticNet to all complete current-feature/next-day-pain pairs. It uses the latest six-feature row as the baseline input, then takes three cases from scenario generation. For each selected feature, it creates low and high copies of the baseline while preserving the other five values. The output reports both model predictions and their difference, together with the case bounds and recorded association. There is no separate scenario holdout test, and the original snapshot is unchanged. The bars show calculated model responses, not known future outcomes or recommended behavior changes.",
      uses: "Common applications: model sensitivity analysis, controlled what-if evaluation and explaining fitted predictions.",
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
    example:
      "For a selected dairy case, the two feature vectors differ only in dairy = 0 versus dairy = 1. Both retain the latest row’s spicy, caffeine, fiber, medication and energy values. The fitted regression produces one estimate for each vector, and the reported difference is high minus low. That difference describes the model under those fixed inputs. It does not show what happened to a person after changing dairy consumption.",
  },
];
