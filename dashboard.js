// ===== AdaNeu Admin Dashboard =====
// localStorage-based org tracking, submission review, usage stats

const STORAGE_KEYS = {
    organizations: 'adaneu_organizations',
    submissions: 'adaneu_submissions',
    activity: 'adaneu_activity'
};

// ===== Data Layer =====
function getOrganizations() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.organizations) || '[]');
}

function saveOrganizations(orgs) {
    localStorage.setItem(STORAGE_KEYS.organizations, JSON.stringify(orgs));
}

function getSubmissions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.submissions) || '[]');
}

function saveSubmissions(subs) {
    localStorage.setItem(STORAGE_KEYS.submissions, JSON.stringify(subs));
}

function getActivity() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.activity) || '[]');
}

function addActivity(icon, text) {
    const activity = getActivity();
    activity.unshift({
        icon,
        text,
        time: new Date().toISOString()
    });
    // Keep last 50
    if (activity.length > 50) activity.length = 50;
    localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(activity));
}

// ===== Stats =====
function updateStats() {
    const orgs = getOrganizations();
    const subs = getSubmissions().filter(s => s.status === 'pending');

    document.getElementById('totalOrgs').textContent = orgs.length;

    const totalTeammates = orgs.reduce((sum, o) => sum + (o.teammates || 0), 0);
    document.getElementById('totalTeammates').textContent = totalTeammates;

    const totalTokens = orgs.reduce((sum, o) => sum + (o.tokensUsed || 0), 0);
    document.getElementById('totalTokens').textContent = formatTokens(totalTokens);

    const totalRevenue = orgs.reduce((sum, o) => sum + (o.monthlyRevenue || 0), 0);
    document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toLocaleString();
}

function formatTokens(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
}

// ===== Submissions =====
function loadSubmissions() {
    const subs = getSubmissions();
    const container = document.getElementById('submissionsTable');

    if (subs.length === 0) {
        container.innerHTML = '<div class="empty-state">No submissions yet. Submissions from the Get Started wizard will appear here.</div>';
        return;
    }

    const pending = subs.filter(s => s.status === 'pending');
    const approved = subs.filter(s => s.status === 'approved');

    let html = '';

    // Pending first
    pending.forEach((sub, idx) => {
        const originalIdx = subs.indexOf(sub);
        html += renderSubmissionRow(sub, originalIdx);
    });

    // Then approved (dimmed)
    approved.forEach((sub) => {
        const originalIdx = subs.indexOf(sub);
        html += renderSubmissionRow(sub, originalIdx, true);
    });

    container.innerHTML = html || '<div class="empty-state">All submissions processed!</div>';
}

function renderSubmissionRow(sub, idx, dimmed) {
    const roles = (sub.teammates || []).map(t => `<span class="submission-tag">${t.role}</span>`).join('');
    const date = new Date(sub.submittedAt).toLocaleDateString();
    const style = dimmed ? ' style="opacity:0.5"' : '';
    const actions = sub.status === 'pending'
        ? `<button class="btn-approve" onclick="approveSubmission(${idx})">✓ Approve</button>
           <button class="btn-reject" onclick="rejectSubmission(${idx})">✕ Reject</button>`
        : `<span class="submission-tag">${sub.status}</span>`;

    return `<div class="submission-row"${style}>
        <div class="submission-org">${escapeHtml(sub.orgName)}<small>${escapeHtml(sub.contactEmail || '')}</small></div>
        <div class="submission-teammates">${roles}</div>
        <div class="submission-estimate">$${(sub.estimate?.monthly || 0).toLocaleString()}/mo</div>
        <div class="submission-date">${date}</div>
        <div class="submission-actions">${actions}</div>
    </div>`;
}

function approveSubmission(idx) {
    const subs = getSubmissions();
    if (!subs[idx]) return;
    subs[idx].status = 'approved';
    saveSubmissions(subs);

    // Auto-create organization from submission
    const sub = subs[idx];
    const orgs = getOrganizations();
    orgs.push({
        id: Date.now().toString(36),
        name: sub.orgName,
        email: sub.contactEmail,
        plan: sub.workload?.model === 'opus' ? 'enterprise' : 'business',
        teammates: (sub.teammates || []).length,
        roles: (sub.teammates || []).map(t => t.role),
        status: 'onboarding',
        createdAt: new Date().toISOString(),
        monthlyRevenue: sub.estimate?.monthly || 0,
        tokensUsed: 0,
        tokenBudget: (sub.estimate?.monthly || 0) * 200000 // rough token equiv
    });
    saveOrganizations(orgs);
    addActivity('✅', `Approved submission from ${sub.orgName} — auto-created org`);

    loadSubmissions();
    loadOrganizations();
    updateStats();
}

function rejectSubmission(idx) {
    const subs = getSubmissions();
    if (!subs[idx]) return;
    subs[idx].status = 'rejected';
    saveSubmissions(subs);
    addActivity('❌', `Rejected submission from ${subs[idx].orgName}`);
    loadSubmissions();
}

// ===== Organizations =====
function loadOrganizations() {
    const orgs = getOrganizations();
    const grid = document.getElementById('orgGrid');

    if (orgs.length === 0) {
        grid.innerHTML = '<div class="empty-state">No organizations onboarded yet.</div>';
        return;
    }

    grid.innerHTML = orgs.map((org, idx) => renderOrgCard(org, idx)).join('');
}

function renderOrgCard(org, idx) {
    const usagePercent = org.tokenBudget > 0 ? Math.round((org.tokensUsed / org.tokenBudget) * 100) : 0;
    const barClass = usagePercent < 50 ? 'low' : usagePercent < 80 ? 'medium' : 'high';
    const statusClass = org.status === 'active' ? 'status-active' : 'status-onboarding';

    return `<div class="org-card">
        <div class="org-card-header">
            <div class="org-card-name">${escapeHtml(org.name)}</div>
            <span class="org-card-status ${statusClass}">${org.status}</span>
        </div>
        <div class="org-card-meta">
            <div class="org-meta-item">
                <span class="meta-label">Plan</span>
                <span class="meta-value">${org.plan || 'starter'}</span>
            </div>
            <div class="org-meta-item">
                <span class="meta-label">Teammates</span>
                <span class="meta-value">${org.teammates}</span>
            </div>
            <div class="org-meta-item">
                <span class="meta-label">Email</span>
                <span class="meta-value">${escapeHtml(org.email || '—')}</span>
            </div>
            <div class="org-meta-item">
                <span class="meta-label">Revenue</span>
                <span class="meta-value">$${(org.monthlyRevenue || 0).toLocaleString()}/mo</span>
            </div>
        </div>
        <div class="org-card-usage">
            <div class="usage-bar-container">
                <div class="usage-bar">
                    <div class="usage-bar-fill ${barClass}" style="width: ${usagePercent}%"></div>
                </div>
                <span class="usage-percent">${usagePercent}%</span>
            </div>
            <div class="usage-label">Token budget used: ${formatTokens(org.tokensUsed)} / ${formatTokens(org.tokenBudget)}</div>
        </div>
    </div>`;
}

// ===== Add Org Modal =====
function showAddOrg() {
    document.getElementById('addOrgModal').style.display = 'flex';
}

function hideAddOrg() {
    document.getElementById('addOrgModal').style.display = 'none';
}

function addOrganization() {
    const name = document.getElementById('newOrgName').value.trim();
    const email = document.getElementById('newOrgEmail').value.trim();
    const plan = document.getElementById('newOrgPlan').value;
    const teammates = parseInt(document.getElementById('newOrgTeammates').value) || 1;

    if (!name) return;

    const orgs = getOrganizations();
    orgs.push({
        id: Date.now().toString(36),
        name,
        email,
        plan,
        teammates,
        status: 'onboarding',
        createdAt: new Date().toISOString(),
        monthlyRevenue: teammates * 200,
        tokensUsed: 0,
        tokenBudget: teammates * 1000000
    });
    saveOrganizations(orgs);
    addActivity('🏢', `Added organization: ${name}`);

    hideAddOrg();
    loadOrganizations();
    updateStats();

    // Clear form
    document.getElementById('newOrgName').value = '';
    document.getElementById('newOrgEmail').value = '';
    document.getElementById('newOrgTeammates').value = '1';
}

// ===== Activity Feed =====
function loadActivityFeed() {
    const feed = document.getElementById('activityFeed');
    const activity = getActivity();

    if (activity.length === 0) return; // Keep default items

    const items = activity.map(a => {
        const time = new Date(a.time);
        const ago = timeAgo(time);
        return `<div class="activity-item">
            <div class="activity-icon">${a.icon}</div>
            <div class="activity-content">
                ${escapeHtml(a.text)}
                <div class="activity-time">${ago}</div>
            </div>
        </div>`;
    }).join('');

    feed.innerHTML = items;
}

function timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

// ===== Usage Chart =====
function updateUsageView() {
    // Placeholder — with a real backend this would fetch usage data
    const period = document.getElementById('usagePeriod').value;
    const bars = document.querySelectorAll('.chart-bar');
    bars.forEach(bar => {
        bar.style.height = Math.floor(Math.random() * 80 + 10) + '%';
    });
}

// ===== Helpers =====
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    loadSubmissions();
    loadOrganizations();
    loadActivityFeed();
});

// Close modal on outside click
document.getElementById('addOrgModal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        hideAddOrg();
    }
});
