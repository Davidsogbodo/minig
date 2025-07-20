// ====DOM Elements=====
const authModal = document.getElementById('authModal');
const authModalTitle = document.getElementById('authModalTitle');
const closeAuthModal = document.getElementById('closeAuthModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const authButton = document.getElementById('authButton');
const guestAuthButton = document.getElementById('guestAuthButton');
const userDashboard = document.getElementById('userDashboard');
const guestView = document.getElementById('guestView');
const mineButton = document.getElementById('mineButton');
const miningTimer = document.getElementById('miningTimer');
const tasksContainer = document.getElementById('tasksContainer');
const leaderboardBody = document.getElementById('leaderboardBody');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenu = document.getElementById('mobileMenu');
const referralCodeDisplay = document.getElementById('referralCodeDisplay');
const copyReferralBtn = document.getElementById('copyReferral');
const totalReferralsDisplay = document.getElementById('totalReferrals');
const dpowerBalanceDisplay = document.getElementById('dpowerBalance');
const convertDpowerBtn = document.getElementById('convertDpower');
const purchaseDpowerBtn = document.getElementById('purchaseDpower');
const paymentModal = document.getElementById('paymentModal');
const closePaymentModal = document.getElementById('closePaymentModal');
const dpowerAmountInput = document.getElementById('dpowerAmount');
const paymentAmountDisplay = document.getElementById('paymentAmount');
const paymentWalletDisplay = document.getElementById('paymentWallet');
const copyWalletBtn = document.getElementById('copyWallet');
const confirmPaymentBtn = document.getElementById('confirmPayment');
const profileSection = document.getElementById('profileSection');
const transactionsList = document.getElementById('transactionsList');

// ====App State=====
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let miningCooldown = null;

// Token Economy Configuration
const TOKEN_ECONOMY = {
    totalSupply: 100000000, // 100 million tokens
    minedSupply: JSON.parse(localStorage.getItem('minedSupply')) || 2450000, // Starting mined amount
    miningRate: 0.25,      // Tokens per mining operation
    miningCooldown: 12 * 60 * 60 * 1000 // 12 hours in ms
};

// Sample tasks data
const tasks = [
    { id: 1, title: "Follow us on Twitter", description: "Follow our official Twitter account", url: "https://twitter.com", completed: false },
    { id: 2, title: "Join our Telegram", description: "Join our official Telegram group", url: "https://telegram.org", completed: false },
    { id: 3, title: "Retweet our post", description: "Retweet our latest announcement", url: "https://twitter.com", completed: false }
];

// ====Utility Functions====
function formatNumber(num) {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function saveCurrentUser() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

function saveMinedSupply() {
    localStorage.setItem('minedSupply', JSON.stringify(TOKEN_ECONOMY.minedSupply));
}

// ===Authentication Functions===
function showLoginForm() {
    if (!loginForm || !registerForm || !authModalTitle) return;
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authModalTitle.textContent = 'Login';
}

function showRegisterForm() {
    if (!loginForm || !registerForm || !authModalTitle) return;
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authModalTitle.textContent = 'Register';
}

function handleLogin(email, password, rememberMe) {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        saveCurrentUser();
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        updateUI();
        if (authModal) authModal.classList.add('hidden');
        return true;
    }
    return false;
}

function handleRegister(email, password, referralCode) {
    // Check if user already exists
    if (users.some(u => u.email === email)) {
        alert('User with this email already exists');
        return false;
    }

    // Create new user
    const newUser = {
        email,
        password,
        difiBalance: 0,
        dpowerBalance: 0,
        tasksCompleted: [],
        lastMined: 0,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        referrals: 0,
        transactions: [],
        isAdmin: email === 'admin@defi.com',
        stakedBalance: 0,
        stakes: [],
        achievements: [],
        lastLogin: null,
        consecutiveLogins: 0,
        referralLevel: 1,
        referralEarnings: 0,
        joinedDate: new Date().toISOString(),
    };

    // Handle referral if provided
    if (referralCode) {
        const referrer = users.find(u => u.referralCode === referralCode);
        if (referrer && referrer.email !== newUser.email) {
            referrer.dpowerBalance += 2000;
            referrer.referrals += 1;
            referrer.transactions.push({
                type: 'referral_bonus',
                amount: 2000,
                date: new Date().toISOString(),
                description: `Referral from ${newUser.email}`
            });
            newUser.dpowerBalance += 500;
            newUser.transactions.push({
                type: 'referral_signup',
                amount: 500,
                date: new Date().toISOString(),
                description: `Used referral code ${referralCode}`
            });
            
            // Save referrer changes
            saveUsers();
            alert('Referral applied! You received 500 DPower and your referrer got 2000 DPower');
        }
    }

    users.push(newUser);
    saveUsers();
    currentUser = newUser;
    saveCurrentUser();
    updateUI();
    if (authModal) authModal.classList.add('hidden');
    return true;
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUI();
}

// ====Referral System====
function updateReferralUI() {
    if (!currentUser || !referralCodeDisplay || !totalReferralsDisplay) return;
    referralCodeDisplay.textContent = currentUser.referralCode;
    totalReferralsDisplay.textContent = currentUser.referrals;
}

// ====DPower System====
function updateDPowerUI() {
    if (!currentUser || !dpowerBalanceDisplay) return;
    dpowerBalanceDisplay.textContent = formatNumber(currentUser.dpowerBalance || 0);
}

function handleConvertDPower() {
    if (!currentUser) return;

    const conversionRate = 250; // 250 DPower = 0.25 DiFi
    if (currentUser.dpowerBalance < conversionRate) {
        alert(`You need at least ${conversionRate} DPower to convert`);
        return;
    }
    
    if (confirm(`Convert ${conversionRate} DPower to 0.25 DiFi?`)) {
        currentUser.dpowerBalance -= conversionRate;
        currentUser.difiBalance += 0.25;
        currentUser.transactions.push({
            type: 'conversion',
            amount: 0.25,
            date: new Date().toISOString(),
            description: `Converted ${conversionRate} DPower to DiFi`
        });
        
        // Update in both currentUser and users array
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) users[userIndex] = currentUser;
        
        saveCurrentUser();
        saveUsers();
        updateUI();
        alert('Conversion successful!');
    }
}

// ====Premium Purchase System====
function generateWalletAddress() {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 40; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

function setupPaymentModal() {
    if (!purchaseDpowerBtn || !paymentModal || !closePaymentModal || 
        !dpowerAmountInput || !paymentAmountDisplay || !paymentWalletDisplay || 
        !copyWalletBtn || !confirmPaymentBtn) return;

    purchaseDpowerBtn.addEventListener('click', () => {
        paymentWalletDisplay.textContent = generateWalletAddress();
        paymentModal.classList.remove('hidden');
        dpowerAmountInput.value = '10000';
        paymentAmountDisplay.textContent = '$5.00';
    });

    closePaymentModal.addEventListener('click', () => {
        paymentModal.classList.add('hidden');
    });

    dpowerAmountInput.addEventListener('input', () => {
        let amount = parseInt(dpowerAmountInput.value) || 0;
        const minAmount = 10000;
        if (amount < minAmount) amount = minAmount;
        dpowerAmountInput.value = amount;
        const paymentAmount = (amount / 10000) * 5;
        paymentAmountDisplay.textContent = `$${paymentAmount.toFixed(2)}`;
    });

    copyWalletBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(paymentWalletDisplay.textContent)
            .then(() => {
                const originalHTML = copyWalletBtn.innerHTML;
                copyWalletBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyWalletBtn.innerHTML = originalHTML;
                }, 2000);
            });
    });

    confirmPaymentBtn.addEventListener('click', () => {
        const amount = parseInt(dpowerAmountInput.value) || 0;
        if (amount < 10000) {
            alert('Minimum purchase is 10,000 DPower');
            return;
        }
        
        currentUser.dpowerBalance += amount;
        currentUser.transactions.push({
            type: 'dpower_purchase',
            amount: amount,
            date: new Date().toISOString(),
            description: `Purchased ${amount} DPower`
        });
        
        // Update in both currentUser and users array
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) users[userIndex] = currentUser;
        
        saveCurrentUser();
        saveUsers();
        updateUI();
        paymentModal.classList.add('hidden');
        alert(`Successfully purchased ${amount} DPower!`);
    });
}

// ====Profile and Transactions====
function renderProfile() {
    if (!currentUser || !profileSection) return;
    
    profileSection.innerHTML = `
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
        <h3 class="text-lg font-bold mb-4">Your Profile</h3>
        <div class="space-y-3">
            <p><span class="text-gray-400">Email:</span> ${currentUser.email}</p>
            <p><span class="text-gray-400">Joined:</span> ${new Date(currentUser.joinedDate || Date.now()).toLocaleDateString()}</p>
            <p><span class="text-gray-400">Total Mined:</span> ${(currentUser.difiBalance).toFixed(2)} DiFi</p>
            <p><span class="text-gray-400">DPower Points:</span> ${formatNumber(currentUser.dpowerBalance)}</p>
            <p><span class="text-gray-400">Referrals:</span> ${currentUser.referrals}</p>
        </div>
    </div>
    `;
}

function renderTransactions() {
    if (!currentUser || !transactionsList) return;
    
    transactionsList.innerHTML = '';
    const sortedTransactions = [...currentUser.transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedTransactions.forEach(tx => {
        const txElement = document.createElement('div');
        txElement.className = 'border-b border-gray-700 py-3';
        let amountClass = 'text-green-400';
        if (tx.type === 'dpower_purchase') {
            amountClass = 'text-yellow-400';
        } else if (tx.amount < 0) {
            amountClass = 'text-red-400';
        }
        
        txElement.innerHTML = `
            <div class="flex justify-between">
                <div>
                    <p class="font-medium">${tx.description}</p>
                    <p class="text-sm text-gray-400">${new Date(tx.date).toLocaleString()}</p>
                </div>
                <span class="${amountClass}">${tx.amount > 0 ? '+' : ''}${tx.amount} ${tx.type.includes('dpower') ? 'DPower' : 'DiFi'}</span>
            </div>
        `;
        transactionsList.appendChild(txElement);
    });
}

// ====Mining Functions====
function updateSupplyUI() {
    const remaining = TOKEN_ECONOMY.totalSupply - TOKEN_ECONOMY.minedSupply;
    const progressPercent = (TOKEN_ECONOMY.minedSupply / TOKEN_ECONOMY.totalSupply) * 100;
    
    const remainingSupplyEl = document.getElementById('remainingSupply');
    const minedSupplyEl = document.getElementById('minedSupply');
    const supplyProgressEl = document.getElementById('supplyProgress');
    
    if (remainingSupplyEl) remainingSupplyEl.textContent = formatNumber(remaining);
    if (minedSupplyEl) minedSupplyEl.textContent = formatNumber(TOKEN_ECONOMY.minedSupply);
    if (supplyProgressEl) supplyProgressEl.style.width = `${progressPercent}%`;
}

function updateMiningTimer() {
    if (!currentUser || !mineButton || !miningTimer) return;
    
    const now = Date.now();
    const timeSinceLastMine = now - currentUser.lastMined;

    // Clear previous interval
    if (miningCooldown) {
        clearInterval(miningCooldown);
        miningCooldown = null;
    }

    if (timeSinceLastMine >= TOKEN_ECONOMY.miningCooldown) {
        mineButton.disabled = false;
        mineButton.classList.add('ready');
        miningTimer.textContent = 'Ready to mine!';
    } else {
        mineButton.disabled = true;
        mineButton.classList.remove('ready');
        
        const updateTimer = () => {
            const now = Date.now();
            const timeSinceLastMine = now - currentUser.lastMined;
            
            if (timeSinceLastMine >= TOKEN_ECONOMY.miningCooldown) {
                mineButton.disabled = false;
                mineButton.classList.add('ready');
                miningTimer.textContent = 'Ready to mine!';
                clearInterval(miningCooldown);
                miningCooldown = null;
                
                // Show notification if allowed
                if (Notification.permission === 'granted') {
                    new Notification('DeFi Airdrop', {
                        body: 'You can now mine your next DiFi tokens!'
                    });
                }
            } else {
                const remainingTime = Math.floor((TOKEN_ECONOMY.miningCooldown - timeSinceLastMine) / 1000);
                miningTimer.textContent = formatTime(remainingTime);
            }
        };
        
        updateTimer();
        miningCooldown = setInterval(updateTimer, 1000);
    }
}

function handleMine() {
    if (!currentUser) return;
    
    const now = Date.now();
    const timeSinceLastMine = now - currentUser.lastMined;
    
    // Check cooldown
    if (timeSinceLastMine < TOKEN_ECONOMY.miningCooldown) {
        alert(`You can only mine once every ${TOKEN_ECONOMY.miningCooldown / (60 * 60 * 1000)} hours`);
        return;
    }
    
    // Check if all tokens are mined
    if (TOKEN_ECONOMY.minedSupply >= TOKEN_ECONOMY.totalSupply) {
        alert('All tokens have been mined!');
        return;
    }
    
    // Calculate amount to mine (don't exceed total supply)
    const minedAmount = Math.min(
        TOKEN_ECONOMY.miningRate,
        TOKEN_ECONOMY.totalSupply - TOKEN_ECONOMY.minedSupply
    );
    
    // Update balances
    TOKEN_ECONOMY.minedSupply += minedAmount;
    currentUser.difiBalance += minedAmount;
    currentUser.lastMined = now;
    currentUser.transactions.push({
        type: 'mine',
        amount: minedAmount,
        date: new Date().toISOString(),
        description: `Mined ${minedAmount} DiFi`
    });
    
    // Update in both currentUser and users array
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) users[userIndex] = currentUser;
    
    // Save changes
    saveCurrentUser();
    saveUsers();
    saveMinedSupply();
    
    // Update UI
    updateUI();
    updateSupplyUI();
    alert(`Successfully mined ${minedAmount} DiFi!`);
}

// ====Task Functions====
function renderTasks() {
    if (!currentUser || !tasksContainer) return;
    
    tasksContainer.innerHTML = '';
    tasks.forEach(task => {
        const isCompleted = currentUser.tasksCompleted?.includes(task.id) || false;
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item bg-gray-700 rounded-lg p-4 mb-3';
        taskElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-medium">${task.title}</h4>
                    <p class="text-sm text-gray-400">${task.description}</p>
                </div>
                <button class="${isCompleted ? 'bg-gray-600 cursor-default' : 'bg-blue-600 hover:bg-blue-700'} py-1 px-3 rounded-md text-sm transition"
                        data-id="${task.id}" ${isCompleted ? 'disabled' : ''}>
                    ${isCompleted ? 'Completed' : 'Start Task'}
                </button>
            </div>
        `;
        tasksContainer.appendChild(taskElement);
        
        if (!isCompleted) {
            const button = taskElement.querySelector('button');
            button.addEventListener('click', () => handleTaskComplete(task));
        }
    });
}

function handleTaskComplete(task) {
    if (!currentUser) return;
    
    window.open(task.url, '_blank');
    
    if (!currentUser.tasksCompleted.includes(task.id)) {
        currentUser.tasksCompleted.push(task.id);
        currentUser.difiBalance += 0.25;
        currentUser.transactions.push({
            type: 'task',
            amount: 0.25,
            date: new Date().toISOString(),
            description: `Completed task: ${task.title}`
        });
        
        // Update in both currentUser and users array
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) users[userIndex] = currentUser;
        
        saveCurrentUser();
        saveUsers();
        renderTasks();
        updateUI();
        alert('Task completed! 0.25 DiFi has been added to your balance.');
    }
}

// ====Leaderboard Functions====
function renderLeaderboard() {
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';

    // Use users registered in localStorage, sorted by highest difiBalance
    let leaderboard = [...users]
        .filter(u => typeof u.difiBalance === "number" && u.difiBalance > 0)
        .sort((a, b) => b.difiBalance - a.difiBalance)
        .slice(0, 10); // Top 10

    if (leaderboard.length > 0) {
        leaderboard.forEach((user, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-700';
            row.innerHTML = `
                <td class="py-3 font-mono">${index + 1}</td>
                <td>
                    <div class="flex items-center space-x-2">
                        <span class="font-semibold">
                            ${user.email ? user.email.split("@")[0] + '...' : 'User'}
                        </span>
                    </div>
                </td>
                <td>${user.difiBalance.toFixed(2)} DiFi</td>
            `;
            leaderboardBody.appendChild(row);
        });
    } else {
        // Fallback if no real users
        leaderboardBody.innerHTML = `
            <tr>
                <td class="py-3 text-gray-400" colspan="3">No mining data yet. Be the first to mine some DiFi!</td>
            </tr>
        `;
    }
}

// ====UI Update Function====
function updateUI() {
    if (currentUser) {
        if (userDashboard) userDashboard.classList.remove('hidden');
        if (guestView) guestView.classList.add('hidden');
        if (authButton) authButton.textContent = 'Logout';
        
        updateMiningTimer();
        renderTasks();
        updateReferralUI();
        updateDPowerUI();
        renderProfile();
        renderTransactions();
        updateSupplyUI();
    } else {
        if (userDashboard) userDashboard.classList.add('hidden');
        if (guestView) guestView.classList.remove('hidden');
        if (authButton) authButton.textContent = 'Login';
        
        // Stop mining timer if exists
        if (miningCooldown) {
            clearInterval(miningCooldown);
            miningCooldown = null;
        }
    }
    
    renderLeaderboard();
}

// ====Initialize Additional Features====
function initAdditionalFeatures() {
    // Set up referral code copy button
    if (copyReferralBtn) {
        copyReferralBtn.addEventListener('click', () => {
            if (!currentUser) return;
            navigator.clipboard.writeText(currentUser.referralCode)
                .then(() => {
                    const originalHTML = copyReferralBtn.innerHTML;
                    copyReferralBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyReferralBtn.innerHTML = originalHTML;
                    }, 2000);
                });
        });
    }

    if (convertDpowerBtn) convertDpowerBtn.addEventListener('click', handleConvertDPower);
    setupPaymentModal();
}

// ====App Initialization====
function initializeApp() {
    // Check for remember me
    if (localStorage.getItem('rememberMe') === 'true' && currentUser) {
        updateUI();
    } else {
        currentUser = null;
        updateUI();
    }
    
    initAdditionalFeatures();

    // Event Listeners
    if (authButton) {
        authButton.addEventListener('click', () => {
            if (currentUser) {
                handleLogout();
            } else {
                if (authModal) authModal.classList.remove('hidden');
                showLoginForm();
            }
        });
    }

    if (guestAuthButton) {
        guestAuthButton.addEventListener('click', () => {
            if (authModal) authModal.classList.remove('hidden');
            showLoginForm();
        });
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', () => {
            if (authModal) authModal.classList.add('hidden');
        });
    }

    if (showRegister) showRegister.addEventListener('click', showRegisterForm);
    if (showLogin) showLogin.addEventListener('click', showLoginForm);

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#loginEmail')?.value.trim();
            const password = loginForm.querySelector('#loginPassword')?.value;
            const rememberMe = loginForm.querySelector('#rememberMe')?.checked;

            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            if (!validateEmail(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            if (!validatePassword(password)) {
                alert('Password must be at least 8 characters');
                return;
            }
            
            if (handleLogin(email, password, rememberMe)) {
                loginForm.reset();
            } else {
                alert('Invalid email or password');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = registerForm.querySelector('#registerEmail')?.value.trim();
            const password = registerForm.querySelector('#registerPassword')?.value;
            const confirmPassword = registerForm.querySelector('#confirmPassword')?.value;
            const referralCode = registerForm.querySelector('#referralCode')?.value.trim();

            if (!email || !password || !confirmPassword) {
                alert('Please fill in all required fields');
                return;
            }
            
            if (!validateEmail(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            if (!validatePassword(password)) {
                alert('Password must be at least 8 characters');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            if (handleRegister(email, password, referralCode)) {
                registerForm.reset();
            }
        });
    }

    if (mineButton) mineButton.addEventListener('click', handleMine);

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && e.target !== mobileMenuButton) {
                mobileMenu.classList.remove('open');
            }
        });
    }
    
    // Request notification permission
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// Start App
document.addEventListener('DOMContentLoaded', initializeApp);