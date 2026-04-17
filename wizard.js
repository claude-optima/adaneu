/* ===== AdaNeu Customer Intake Wizard ===== */

// Token usage per role (tokens per hour of operation)
const ROLE_TOKENS = {
    developer:  { name: 'Software Developer', tokensPerHour: 250000, icon: '👩‍💻' },
    analyst:    { name: 'Data Analyst',        tokensPerHour: 187500, icon: '📊' },
    writer:     { name: 'Technical Writer',    tokensPerHour: 125000, icon: '✍️' },
    devops:     { name: 'DevOps Engineer',     tokensPerHour: 225000, icon: '🔧' },
    security:   { name: 'Security Analyst',    tokensPerHour: 150000, icon: '🔒' },
    pm:         { name: 'Project Manager',     tokensPerHour: 100000, icon: '📋' },
    researcher: { name: 'Research Analyst',    tokensPerHour: 187500, icon: '🔬' },
    support:    { name: 'Customer Support',    tokensPerHour: 125000, icon: '💬' }
};

// Pricing (per 1M tokens)
const PRICING = {
    standard: { inputCost: 3, outputCost: 15, name: 'Claude Sonnet', ratio: 0.3 },
    advanced: { inputCost: 15, outputCost: 75, name: 'Claude Opus', ratio: 0.3 }
};

// Hours per week by availability tier
const AVAILABILITY = {
    business: { hoursPerWeek: 40, name: 'Business Hours (40 hrs/week)' },
    extended: { hoursPerWeek: 84, name: 'Extended Hours (84 hrs/week)' },
    '24x7':  { hoursPerWeek: 168, name: '24/7 Always On (168 hrs/week)' }
};

// Platform fee per teammate per month
const PLATFORM_FEE_PER_TEAMMATE = 200;
const MAINTENANCE_MULTIPLIER = 1.15; // 15% overhead for infrastructure

let currentStep = 1;
let selectedTeammates = new Set();

function updateProgress() {
    const fill = document.getElementById('progressFill');
    fill.style.width = `${(currentStep / 4) * 100}%`;
    
    document.querySelectorAll('.progress-steps .step').forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (stepNum === currentStep) s.classList.add('active');
        if (stepNum < currentStep) s.classList.add('completed');
    });
}

function showStep(step) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep(from) {
    if (from === 1) {
        const name = document.getElementById('orgName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        if (!name) { highlight('orgName'); return; }
        if (!email || !email.includes('@')) { highlight('contactEmail'); return; }
    }
    if (from === 2 && selectedTeammates.size === 0) {
        alert('Please select at least one AI teammate.');
        return;
    }
    if (from === 3) {
        generateEstimate();
    }
    showStep(from + 1);
}

function prevStep(from) {
    showStep(from - 1);
}

function highlight(id) {
    const el = document.getElementById(id);
    el.style.borderColor = '#ef4444';
    el.focus();
    setTimeout(() => { el.style.borderColor = ''; }, 2000);
}

function toggleTeammate(card) {
    const role = card.dataset.role;
    if (selectedTeammates.has(role)) {
        selectedTeammates.delete(role);
        card.classList.remove('selected');
    } else {
        selectedTeammates.add(role);
        card.classList.add('selected');
    }
    document.getElementById('selectedCount').textContent = 
        `${selectedTeammates.size} teammate${selectedTeammates.size !== 1 ? 's' : ''} selected`;
}

function getSelectedRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
}

function getSelectedCheckboxes(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
}

function generateEstimate() {
    const orgName = document.getElementById('orgName').value.trim();
    const orgSize = document.getElementById('orgSize').value;
    const industry = document.getElementById('industry').value;
    const availability = getSelectedRadio('availability');
    const model = getSelectedRadio('model');
    const compliance = getSelectedCheckboxes('compliance');

    // Organization info
    document.getElementById('estimateOrg').innerHTML = `
        <strong>${escapeHtml(orgName)}</strong> · ${orgSize || 'Team size not specified'} · ${industry || 'Industry not specified'}
    `;

    // Teammates
    const teammatesContainer = document.getElementById('estimateTeammates');
    teammatesContainer.innerHTML = '';
    selectedTeammates.forEach(role => {
        const info = ROLE_TOKENS[role];
        const tag = document.createElement('span');
        tag.className = 'estimate-teammate-tag';
        tag.textContent = `${info.icon} ${info.name}`;
        teammatesContainer.appendChild(tag);
    });

    // Config
    const avail = AVAILABILITY[availability];
    const modelInfo = PRICING[model];
    document.getElementById('estimateConfig').innerHTML = `
        <p><strong>Availability:</strong> ${avail.name}</p>
        <p><strong>AI Model:</strong> ${modelInfo.name}</p>
        <p><strong>Compliance:</strong> ${compliance.map(c => c.replace(/-/g, ' ')).join(', ') || 'Standard'}</p>
    `;

    // Cost calculation
    const weeksPerMonth = 4.33;
    const hoursPerMonth = avail.hoursPerWeek * weeksPerMonth;
    const costBreakdown = document.getElementById('costBreakdown');
    costBreakdown.innerHTML = '';
    
    let totalTokenCost = 0;

    selectedTeammates.forEach(role => {
        const info = ROLE_TOKENS[role];
        const monthlyTokens = info.tokensPerHour * hoursPerMonth;
        
        // Cost: input tokens + output tokens (output ratio ~30% of input)
        const inputTokens = monthlyTokens;
        const outputTokens = monthlyTokens * modelInfo.ratio;
        const inputCost = (inputTokens / 1_000_000) * modelInfo.inputCost;
        const outputCost = (outputTokens / 1_000_000) * modelInfo.outputCost;
        const roleCost = (inputCost + outputCost) * MAINTENANCE_MULTIPLIER;
        
        totalTokenCost += roleCost;

        const line = document.createElement('div');
        line.className = 'cost-line';
        line.innerHTML = `
            <span class="label">${info.icon} ${info.name} (${formatTokens(monthlyTokens)} tokens/mo)</span>
            <span class="amount">$${roleCost.toFixed(0)}</span>
        `;
        costBreakdown.appendChild(line);
    });

    // Platform fee
    const platformFee = selectedTeammates.size * PLATFORM_FEE_PER_TEAMMATE;
    const platformLine = document.createElement('div');
    platformLine.className = 'cost-line';
    platformLine.innerHTML = `
        <span class="label">Platform & Infrastructure (${selectedTeammates.size} teammates)</span>
        <span class="amount">$${platformFee.toFixed(0)}</span>
    `;
    costBreakdown.appendChild(platformLine);

    // Compliance add-ons
    let complianceCost = 0;
    if (compliance.includes('soc2')) complianceCost += 500;
    if (compliance.includes('data-residency')) complianceCost += 300;
    if (complianceCost > 0) {
        const compLine = document.createElement('div');
        compLine.className = 'cost-line';
        compLine.innerHTML = `
            <span class="label">Compliance Add-ons</span>
            <span class="amount">$${complianceCost.toFixed(0)}</span>
        `;
        costBreakdown.appendChild(compLine);
    }

    // Total
    const total = totalTokenCost + platformFee + complianceCost;
    document.getElementById('costTotal').innerHTML = `
        <span class="label">Estimated Monthly Total</span>
        <span class="amount">$${total.toFixed(0)}/mo</span>
    `;
}

function formatTokens(tokens) {
    if (tokens >= 1_000_000_000) return `${(tokens / 1_000_000_000).toFixed(1)}B`;
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
    return tokens.toString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function submitWizard() {
    const orgName = document.getElementById('orgName').value.trim();
    const contactName = document.getElementById('contactName').value.trim();
    const contactEmail = document.getElementById('contactEmail').value.trim();

    // Collect all data
    const submission = {
        timestamp: new Date().toISOString(),
        organization: {
            name: orgName,
            size: document.getElementById('orgSize').value,
            industry: document.getElementById('industry').value,
        },
        contact: {
            name: contactName,
            email: contactEmail,
        },
        teammates: Array.from(selectedTeammates).map(role => ({
            role,
            name: ROLE_TOKENS[role].name,
        })),
        configuration: {
            availability: getSelectedRadio('availability'),
            model: getSelectedRadio('model'),
            gitPlatform: getSelectedRadio('git'),
            compliance: getSelectedCheckboxes('compliance'),
        },
    };

    // Store in localStorage as a simple queue (will be picked up by backend later)
    const submissions = JSON.parse(localStorage.getItem('adaneu_submissions') || '[]');
    submissions.push(submission);
    localStorage.setItem('adaneu_submissions', JSON.stringify(submissions));

    // Show success modal
    document.getElementById('modalName').textContent = contactName;
    document.getElementById('modalOrg').textContent = orgName;
    document.getElementById('modalEmail').textContent = contactEmail;
    document.getElementById('successModal').classList.add('active');

    console.log('Submission stored:', submission);
}

function downloadEstimate() {
    // Generate a text-based estimate for download
    const orgName = document.getElementById('orgName').value.trim();
    const availability = getSelectedRadio('availability');
    const model = getSelectedRadio('model');
    
    let text = `AdaNeu — Cost Estimate\n`;
    text += `${'='.repeat(50)}\n\n`;
    text += `Organization: ${orgName}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;
    text += `Selected AI Teammates:\n`;
    selectedTeammates.forEach(role => {
        text += `  • ${ROLE_TOKENS[role].name}\n`;
    });
    text += `\nConfiguration:\n`;
    text += `  Availability: ${AVAILABILITY[availability].name}\n`;
    text += `  AI Model: ${PRICING[model].name}\n`;
    text += `\n${'='.repeat(50)}\n`;
    text += `\nThis estimate is based on average token usage patterns.\n`;
    text += `Contact us at hello@adaneu.com for a detailed proposal.\n`;
    text += `\nGenerated by AdaNeu — adaneu.com\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adaneu-estimate-${orgName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
