// ================================================================
// script.js - HomeWise Property Valuation App
// ================================================================

// ================================================================
// 0. FALLBACK: Wait for noUiSlider to load
// ================================================================
(function waitForNoUiSlider() {
    if (typeof noUiSlider === 'undefined') {
        console.warn("⏳ noUiSlider not loaded yet. Waiting...");
        setTimeout(waitForNoUiSlider, 200);
        return;
    }
    console.log("✅ noUiSlider loaded successfully!");
    initApp();
})();

// ================================================================
// 1. SECTION TOGGLE (Hero ↔ Wizard)
// ================================================================
function initApp() {

    // ---- DOM References ----
    const heroSection = document.getElementById('hero-section');
    const wizardSection = document.getElementById('wizard-section');
    const startBtn = document.getElementById('start-btn');
    const backHomeBtn = document.getElementById('back-home-btn');
    const stepContent = document.getElementById('step-content');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const stepCounter = document.getElementById('step-counter');
    const progressFill = document.getElementById('progress-fill');
    const resultsCard = document.getElementById('results-card');
    const wizardCard = document.querySelector('.glass.rounded-2xl.p-6.md\\:p-8');
    const restartBtn = document.getElementById('restart-btn');

    // ---- State ----
    let currentStep = 0;
    let featureValues = {};
    let chartInstance = null;
    let priceAnimationInterval = null;
    let threshold = 0.5;
    let stepValid = true;  // Track if current step has valid input

    // ================================================================
    // 2. CONFIGURATION
    // ================================================================
    
    const API_URL = "https://xgboost-house-api.onrender.com/predict";

    const STEPS = [
        { name: "Gr_Liv_Area", label: "What is the living area?", min: 300, max: 6000, step: 10, default: 1500,
            unit: "sq ft" },
            { name: "Year_Built", label: "What year was it built?", min: 1870, max: 2010, step: 1, default: 1970,
                unit: "" },
                { name: "Total_Bsmt_SF", label: "How large is the basement?", min: 0, max: 3000, step: 10, default: 900,
                    unit: "sq ft" },
                    { name: "Full_Bath", label: "How many full bathrooms?", min: 0, max: 4, step: 1, default: 2, unit: "" },
                    { name: "Half_Bath", label: "How many half bathrooms?", min: 0, max: 2, step: 1, default: 0, unit: "" },
                    { name: "Bedroom_AbvGr", label: "How many bedrooms?", min: 1, max: 8, step: 1, default: 3, unit: "" },
                    { name: "Garage_Cars", label: "How many cars fit in the garage?", min: 0, max: 4, step: 1, default: 2,
                        unit: "" },
                        { name: "Lot_Area", label: "What is the lot size?", min: 1000, max: 200000, step: 100, default: 10000,
                            unit: "sq ft" },
                            { name: "Fireplaces", label: "How many fireplaces?", min: 0, max: 4, step: 1, default: 0, unit: "" },
                            { name: "Overall_Qual", label: "How would you rate the overall quality?", min: 1, max: 10, step: 1,
                                default: 5, unit: "" },
                                { name: "Overall_Cond", label: "How would you rate the overall condition?", min: 1, max: 10, step: 1,
                                default: 5, unit: "" },
                                { name: "sensitivity", label: "How sensitive should the model be?", min: 0, max: 1, step: 0.01, default: 0.5,
                                    unit: " (0-1)" }
    ];

    const IMPORTANCE = {
        "Gr_Liv_Area": 0.25,
        "Overall_Qual": 0.22,
        "Year_Built": 0.15,
        "Total_Bsmt_SF": 0.12,
        "Garage_Cars": 0.10,
        "Lot_Area": 0.06,
        "Full_Bath": 0.04,
        "Bedroom_AbvGr": 0.03,
        "Fireplaces": 0.02,
        "Half_Bath": 0.01,
        "Overall_Cond": 0.00
    };

    const FRIENDLY_NAMES = {
        "Gr_Liv_Area": { icon: "📐", name: "Living Area" },
        "Overall_Qual": { icon: "⭐", name: "Overall Quality" },
        "Year_Built": { icon: "📅", name: "Year Built" },
        "Total_Bsmt_SF": { icon: "🏚️", name: "Basement Size" },
        "Garage_Cars": { icon: "🚗", name: "Garage Capacity" },
        "Lot_Area": { icon: "🌳", name: "Lot Size" },
        "Full_Bath": { icon: "🛁", name: "Full Bathrooms" },
        "Bedroom_AbvGr": { icon: "🛏️", name: "Bedrooms" },
        "Fireplaces": { icon: "🔥", name: "Fireplaces" },
        "Half_Bath": { icon: "🚽", name: "Half Bathrooms" },
        "Overall_Cond": { icon: "🔧", name: "Overall Condition" }
    };

    // ================================================================
    // 3. FUNCTIONS
    // ================================================================

    function showHero() {
        heroSection.classList.remove('hidden');
        heroSection.classList.add('visible');
        wizardSection.classList.remove('visible');
        wizardSection.classList.add('hidden');
        goToStep(0);
        resultsCard.classList.add('hidden');
        wizardCard.style.display = 'block';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    function showWizard() {
        heroSection.classList.remove('visible');
        heroSection.classList.add('hidden');
        wizardSection.classList.remove('hidden');
        wizardSection.classList.add('visible');
        if (currentStep !== 0) {
            currentStep = 0;
            renderStep(0);
        }
        resultsCard.classList.add('hidden');
        wizardCard.style.display = 'block';
    }

    startBtn.addEventListener('click', showWizard);
    backHomeBtn.addEventListener('click', showHero);

    // ================================================================
    // 4. RENDER STEP (with validation warning)
    // ================================================================
    function renderStep(index) {
        const step = STEPS[index];
        const total = STEPS.length;
        const progress = ((index + 1) / total) * 100;

        stepCounter.textContent = `Step ${index+1} of ${total}`;
        progressFill.style.width = `${progress}%`;

        backBtn.disabled = index === 0;

        // Update Next button based on validity
        updateNextButton();

        // Build HTML with number input and validation message
        let html = `
        <div class="step-container visible">
        <h2 class="text-xl md:text-2xl font-semibold text-white mb-2 step-title">${step.label}</h2>
        <div class="text-sm text-[#888] mb-4">${step.unit ? `Value in ${step.unit}` : 'Select a value'}</div>

        <div class="flex items-center gap-4 mb-2">
        <span class="text-sm text-[#888]">${step.min}</span>
        <div id="slider-${step.name}" class="flex-1"></div>
        <span class="text-sm text-[#888]">${step.max}</span>
        </div>

        <div class="flex flex-col items-center gap-1 mt-3">
        <div class="flex items-center justify-center gap-4">
        <input type="number"
        id="input-${step.name}"
        min="${step.min}"
        max="${step.max}"
        step="${step.step}"
        placeholder="${step.default}"
        class="w-28 px-3 py-2 bg-[#1E222D] border border-[#2A2F3A] rounded-lg text-white text-center focus:border-[#F59E0B] focus:outline-none transition-colors"
        />
        <span class="text-sm text-[#888]">${step.unit || ''}</span>
        </div>
        <!-- Validation Warning -->
        <div id="validation-warning-${step.name}" class="text-xs text-[#FF6B6B] hidden mt-1">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        Please enter a value between ${step.min} and ${step.max}.
        </div>
        </div>
        </div>
        `;
        stepContent.innerHTML = html;

        // Get elements
        const sliderEl = document.getElementById(`slider-${step.name}`);
        const inputEl = document.getElementById(`input-${step.name}`);
        const valueDisplay = document.getElementById(`value-display-${step.name}`);
        const warningEl = document.getElementById(`validation-warning-${step.name}`);

        // Set initial input value
        inputEl.value = step.default;
        stepValid = true;

        // Create noUiSlider
        noUiSlider.create(sliderEl, {
            start: step.default,
            range: { min: step.min, max: step.max },
            step: step.step,
            format: {
                to: function(value) { return parseFloat(value).toFixed(step.step < 1 ? 2 : 0); },
                          from: function(value) { return parseFloat(value); }
            }
        });

        // ----- Validation function -----
        function validateInput(value) {
            const num = parseFloat(value);
            if (value === '' || isNaN(num)) {
                return { valid: false, message: `Please enter a valid number.` };
            }
            if (num < step.min) {
                return { valid: false, message: `Value must be at least ${step.min}.` };
            }
            if (num > step.max) {
                return { valid: false, message: `Value cannot exceed ${step.max}.` };
            }
            return { valid: true, message: '' };
        }

        // ----- Show/hide warning -----
        function updateValidationWarning(value) {
            const result = validateInput(value);
            if (!result.valid) {
                warningEl.classList.remove('hidden');
                warningEl.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i> ${result.message}`;
                inputEl.classList.add('border-[#FF6B6B]');
                inputEl.classList.remove('border-[#2A2F3A]');
                stepValid = false;
            } else {
                warningEl.classList.add('hidden');
                inputEl.classList.remove('border-[#FF6B6B]');
                inputEl.classList.add('border-[#2A2F3A]');
                stepValid = true;
            }
            updateNextButton();
        }

        // ----- Sync: Slider → Input -----
        sliderEl.noUiSlider.on('update', function(values) {
            const val = parseFloat(values[0]);
            if (document.activeElement !== inputEl) {
                inputEl.value = val;
                // Validate the updated value
                updateValidationWarning(val);
            }
            // Always store the value (clamped from slider)
            if (step.name === 'sensitivity') {
                threshold = val;
            } else {
                featureValues[step.name] = val;
            }
            if (valueDisplay) {
                valueDisplay.textContent = val;
            }
        });

        // ----- Sync: Input → Slider (with validation) -----
        inputEl.addEventListener('input', function() {
            const rawValue = this.value;

            // If empty, just show warning
            if (rawValue === '') {
                updateValidationWarning(rawValue);
                return;
            }

            let val = parseFloat(rawValue);
            if (isNaN(val)) {
                updateValidationWarning(rawValue);
                return;
            }

            // Update slider (it will clamp internally, but we keep the input value as-is)
            sliderEl.noUiSlider.set(val);

            // Validate and show warning if needed
            updateValidationWarning(rawValue);

            // Store the value (even if invalid)
            if (step.name === 'sensitivity') {
                threshold = val;
            } else {
                featureValues[step.name] = val;
            }
            if (valueDisplay) {
                valueDisplay.textContent = val;
            }
        });

        // ----- On blur: validate and show warning -----
        inputEl.addEventListener('blur', function() {
            const rawValue = this.value;
            if (rawValue === '') {
                updateValidationWarning(rawValue);
                return;
            }
            let val = parseFloat(rawValue);
            if (isNaN(val)) {
                updateValidationWarning(rawValue);
                return;
            }
            // If valid, keep it; if invalid, show warning but don't change the value
            updateValidationWarning(rawValue);
        });

        // ----- Focus the slider handle -----
        setTimeout(() => {
            const handle = sliderEl.querySelector('.noUi-handle');
            if (handle) handle.focus();
        }, 100);
    }

    // ================================================================
    // 5. NAVIGATION
    // ================================================================
    function goToStep(index) {
        if (index < 0 || index >= STEPS.length) return;
        currentStep = index;
        renderStep(index);
    }

    function updateNextButton() {
        if (currentStep === STEPS.length - 1) {
            nextBtn.innerHTML = '<i class="fas fa-magic"></i> Predict';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
        // Disable next button if current step is invalid
        nextBtn.disabled = !stepValid;
    }

    // ----- Next button click (with validation check) -----
    nextBtn.addEventListener('click', function() {
        // Double-check validation before proceeding
        if (!stepValid) {
            // Focus the input to draw attention
            const inputEl = document.querySelector(`#input-${STEPS[currentStep].name}`);
            if (inputEl) inputEl.focus();
            return;
        }

        if (currentStep === STEPS.length - 1) {
            handlePrediction();
        } else {
            goToStep(currentStep + 1);
        }
    });

    backBtn.addEventListener('click', function() {
        goToStep(currentStep - 1);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault();
            if (!stepValid) {
                const inputEl = document.querySelector(`#input-${STEPS[currentStep].name}`);
                if (inputEl) inputEl.focus();
                return;
            }
            if (currentStep === STEPS.length - 1) {
                handlePrediction();
            } else {
                goToStep(currentStep + 1);
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToStep(currentStep - 1);
        }
    });

    // ================================================================
    // 6. PREDICTION
    // ================================================================
    function handlePrediction() {
        // Final validation check
        for (let i = 0; i < STEPS.length; i++) {
            const step = STEPS[i];
            if (step.name !== 'sensitivity') {
                const val = featureValues[step.name];
                if (val === undefined || val === '' || isNaN(val) || val < step.min || val > step.max) {
                    // Go to the invalid step and show warning
                    goToStep(i);
                    // Focus the input
                    setTimeout(() => {
                        const inputEl = document.querySelector(`#input-${step.name}`);
                        if (inputEl) inputEl.focus();
                    }, 100);
                        return;
                }
            }
        }

        // Proceed with prediction
        nextBtn.disabled = true;
        backBtn.disabled = true;
        nextBtn.innerHTML = '<span class="spinner"></span> Analyzing...';

        const payload = {};
        STEPS.forEach(step => {
            if (step.name !== 'sensitivity') {
                payload[step.name] = parseFloat(featureValues[step.name] !== undefined ? featureValues[step.name] : step
                .default);
            }
        });
        payload['threshold'] = threshold;

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) throw new Error(`API error (${response.status})`);
            return response.json();
        })
        .then(data => {
            showResults(data);
        })
        .catch(err => {
            alert('❌ Error: ' + err.message + '\n\nMake sure the FastAPI backend is running on Render.');
        })
        .finally(() => {
            nextBtn.disabled = false;
            backBtn.disabled = false;
            nextBtn.innerHTML = '<i class="fas fa-magic"></i> Predict';
        });
    }

    // ================================================================
    // 7. SHOW RESULTS
    // ================================================================
    function showResults(data) {
        wizardCard.style.display = 'none';
        resultsCard.classList.remove('hidden');

        const price = data.predicted_price || 0;
        const priceElement = document.getElementById('result-price-number');
        animatePrice(priceElement, price);

        const statusEl = document.getElementById('result-status');
        if (data.is_anomaly) {
            statusEl.className =
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/20';
        statusEl.innerHTML = '<i class="fas fa-triangle-exclamation"></i> ANOMALY';
        } else {
            statusEl.className =
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/20';
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> NORMAL';
        }

        document.getElementById('result-confidence').textContent = '87%';
        renderResultChart();
    }

    // ================================================================
    // 8. PRICE ANIMATION
    // ================================================================
    function animatePrice(element, targetPrice) {
        const startPrice = 0;
        const duration = 800;
        const startTime = performance.now();

        if (priceAnimationInterval) {
            cancelAnimationFrame(priceAnimationInterval);
        }

        function updatePrice(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentPrice = startPrice + (targetPrice - startPrice) * eased;
            element.textContent = currentPrice.toFixed(2);

            if (progress < 1) {
                priceAnimationInterval = requestAnimationFrame(updatePrice);
            } else {
                element.textContent = targetPrice.toFixed(2);
                priceAnimationInterval = null;
            }
        }
        priceAnimationInterval = requestAnimationFrame(updatePrice);
    }

    // ================================================================
    // 9. RESULT CHART
    // ================================================================
    function renderResultChart() {
        const ctx = document.getElementById('result-chart').getContext('2d');
        const sorted = Object.entries(IMPORTANCE)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

        const labels = sorted.map(([key]) => {
            const info = FRIENDLY_NAMES[key];
            return info ? `${info.icon} ${info.name}` : key;
        });
        const values = sorted.map(([, val]) => val);

        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Influence',
                    data: values,
                    backgroundColor: [
                        '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'
                    ],
                    borderRadius: 4,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${(context.parsed.x * 100).toFixed(0)}% influence`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                                  ticks: {
                                      color: '#888',
                                      callback: function(value) {
                                          return (value * 100).toFixed(0) + '%';
                                      }
                                  },
                                  title: {
                                      display: true,
                                      text: 'Relative Influence',
                                      color: '#888',
                                      font: { size: 10 }
                                  }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: '#aaa',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });

        const top = sorted[0];
        const topName = FRIENDLY_NAMES[top[0]]?.name || top[0];
        document.getElementById('result-caption').innerHTML = `
        💡 <span class="text-white">${topName}</span> is the strongest driver •
        <span class="text-[#888]">${(top[1] * 100).toFixed(0)}% influence</span>
        `;
    }

    // ================================================================
    // 10. RESTART
    // ================================================================
    restartBtn.addEventListener('click', function() {
        currentStep = 0;
        STEPS.forEach(step => {
            if (step.name !== 'sensitivity') {
                featureValues[step.name] = step.default;
            }
        });
        threshold = 0.5;
        resultsCard.classList.add('hidden');
        wizardCard.style.display = 'block';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        goToStep(0);
    });

    // ================================================================
    // 11. INITIAL RENDER
    // ================================================================
    goToStep(0);
}
