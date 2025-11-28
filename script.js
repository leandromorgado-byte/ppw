// --- ESTADO DA APLICAÇÃO (Dados Iniciais) ---
let dealState = {
    originalDebt: 30000,
    entryValue: 1000,
    installments: 1,
    dueDate: 5
};

// --- NAVEGAÇÃO SPA ---
function showPage(pageId) {
    const allPages = document.querySelectorAll('section');
    allPages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active-page');
        page.classList.add('hidden-page');
    });

    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.style.display = 'block';
        target.classList.remove('hidden-page');
        target.classList.add('active-page');

        if (pageId === 'dashboard') {
            setTimeout(checkCarouselButtons, 100);
        }
    } else {
        console.error(`Página não encontrada: page-${pageId}`);
    }

    const publicNav = document.getElementById('public-nav');
    const privateNav = document.getElementById('private-nav');
    
    if (pageId === 'home' || pageId === 'login') {
        if(publicNav) publicNav.style.display = 'block';
        if(privateNav) privateNav.style.display = 'none';
        document.body.style.background = '#f4f8fa';
    } else {
        if(publicNav) publicNav.style.display = 'none';
        if(privateNav) privateNav.style.display = 'block';
        document.body.style.background = 'linear-gradient(to bottom, #ffffff, #cceeff)';
        
        if(pageId === 'negotiation') updateNegotiationUI();
    }
    
    window.scrollTo(0,0);
}

function login() {
    showPage('dashboard');
}

// --- LÓGICA FINANCEIRA ---
function formatMoney(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calculateTier(numInstallments) {
    if (numInstallments > 6) {
        return { total: 4500, discount: 85 };
    } else if (numInstallments > 4) {
        return { total: 3000, discount: 90 };
    } else {
        return { total: 2100, discount: 93 };
    }
}

function updateNegotiationUI() {
    const tier = calculateTier(dealState.installments);
    let balance = tier.total - dealState.entryValue;
    if (balance < 0) balance = 0; 
    let installmentValue = balance / dealState.installments;

    const elTotal = document.getElementById('val-total');
    if(elTotal) elTotal.innerText = formatMoney(tier.total);
    const elDisc = document.getElementById('val-discount');
    if(elDisc) elDisc.innerText = `↓ ${tier.discount}%`;
    const elEntry = document.getElementById('val-entry');
    if(elEntry) elEntry.innerText = formatMoney(dealState.entryValue);
    const elInst = document.getElementById('val-installments');
    if(elInst) elInst.innerText = `${dealState.installments}x de ${formatMoney(installmentValue)}`;
    const elDate = document.getElementById('val-date');
    if(elDate) elDate.innerText = `Todo dia ${dealState.dueDate.toString().padStart(2, '0')}`;
    const elFooter = document.getElementById('val-total-footer');
    if(elFooter) elFooter.innerText = formatMoney(tier.total);
}

function selectPayment(button) {
    const container = button.parentElement;
    container.querySelectorAll('.btn-option').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

function finishDeal() {
    alert("Parabéns! Acordo realizado com sucesso. Os boletos serão enviados para seu e-mail.");
    showPage('dashboard');
}

// --- GERENCIAMENTO DE MODAIS ---
function openModal(type) {
    const modal = document.getElementById(`modal-${type}`);
    if(modal) {
        modal.classList.add('active');
        // Esconde a barra de rolagem do body quando o modal abre
        document.body.style.overflow = 'hidden';
        if (type === 'installments') renderInstallmentsList();
    }
}

function closeModal(type) {
    const modal = document.getElementById(`modal-${type}`);
    if(modal) {
        modal.classList.remove('active');
        // Devolve a barra de rolagem ao fechar
        document.body.style.overflow = 'auto';
    }
}

// --- MODAL: ENTRADA ---
function toggleEntryInput(isCustom) {
    const input = document.getElementById('custom-entry-input');
    input.style.display = isCustom ? 'block' : 'none';
    if (!isCustom) input.value = ''; 
}

function applyEntry() {
    const isCustom = document.querySelector('input[name="entry-option"][value="custom"]').checked;
    let newVal = 1000;
    if (isCustom) {
        const rawVal = document.getElementById('custom-entry-input').value;
        newVal = parseFloat(rawVal);
        if (isNaN(newVal) || newVal < 1000) {
            alert("O valor mínimo de entrada é R$ 1.000,00");
            return;
        }
        const currentTier = calculateTier(dealState.installments);
        if (newVal >= currentTier.total) {
             alert(`A entrada não pode ser maior ou igual ao valor total do acordo.`);
             return;
        }
    }
    dealState.entryValue = newVal;
    updateNegotiationUI();
    closeModal('entry');
}

// --- MODAL: PARCELAS ---
function renderInstallmentsList() {
    const list = document.getElementById('installments-list');
    list.innerHTML = ''; 
    for (let i = 1; i <= 10; i++) {
        const tier = calculateTier(i);
        let balance = tier.total - dealState.entryValue;
        if (balance < 0) balance = 0;
        let valParcela = balance / i;
        const div = document.createElement('div');
        div.className = `inst-option ${dealState.installments === i ? 'selected' : ''}`;
        div.onclick = () => { 
            dealState.installments = i;
            applyInstallments();
        };
        div.innerHTML = `
            <div style="display:flex; flex-direction:column;">
                <strong>${i}x de ${formatMoney(valParcela)}</strong>
                <small style="color:#888">Restante após entrada</small>
            </div>
            <div style="text-align:right">
                <div style="font-weight:bold; color:var(--primary-blue)">Total: ${formatMoney(tier.total)}</div>
                <small style="color:#28a745">Desconto: ${tier.discount}%</small>
            </div>
        `;
        list.appendChild(div);
    }
}

function applyInstallments() {
    updateNegotiationUI();
    closeModal('installments');
}

// --- MODAL: DATA ---
let tempDate = 5;
function selectDate(day, elem) {
    tempDate = day;
    document.querySelectorAll('.date-circle').forEach(d => d.classList.remove('selected'));
    elem.classList.add('selected');
}

function applyDate() {
    dealState.dueDate = tempDate;
    updateNegotiationUI();
    closeModal('date');
}

// --- CARROSSEL INTELIGENTE ---
function moveCarousel(direction) {
    const track = document.getElementById('debt-track');
    const card = track.querySelector('.debt-card');
    if (!card) return;
    const style = window.getComputedStyle(track);
    const gap = parseInt(style.gap) || 20;
    const scrollAmount = card.offsetWidth + gap;
    if (direction === 1) {
        track.scrollLeft += scrollAmount;
    } else {
        track.scrollLeft -= scrollAmount;
    }
    setTimeout(checkCarouselButtons, 300);
}

function checkCarouselButtons() {
    if (window.innerWidth <= 768) return;
    const track = document.getElementById('debt-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    if (!track || !prevBtn || !nextBtn) return;

    if (track.scrollWidth <= track.clientWidth + 5) {
        prevBtn.style.opacity = '0'; prevBtn.style.pointerEvents = 'none';
        nextBtn.style.opacity = '0'; nextBtn.style.pointerEvents = 'none';
        return;
    }
    if (track.scrollLeft <= 5) {
        prevBtn.style.opacity = '0'; prevBtn.style.pointerEvents = 'none';
    } else {
        prevBtn.style.opacity = '1'; prevBtn.style.pointerEvents = 'auto';
    }
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 5) {
        nextBtn.style.opacity = '0'; nextBtn.style.pointerEvents = 'none';
    } else {
        nextBtn.style.opacity = '1'; nextBtn.style.pointerEvents = 'auto';
    }
}

function updateIndicators() {
    const track = document.getElementById('debt-track');
    const dots = document.querySelectorAll('.dot');
    const card = track.querySelector('.debt-card');
    if(!card) return;
    const cardWidth = card.offsetWidth + 20; 
    const scrollPos = track.scrollLeft;
    const index = Math.round(scrollPos / cardWidth);
    dots.forEach(dot => dot.classList.remove('active'));
    if (dots[index]) {
        dots[index].classList.add('active');
    }
    checkCarouselButtons();
}

// --- TELA DE PERFIL ---
function enableProfileEdit() {
    const inputs = document.querySelectorAll('#page-profile input');
    inputs.forEach(input => { input.disabled = false; });
    const buttons = document.querySelectorAll('.form-actions button');
    buttons.forEach(btn => { btn.disabled = false; });
    if(inputs.length > 0) inputs[0].focus();
}

function saveProfile() {
    alert('Dados salvos com sucesso!');
    resetProfileState();
}

function cancelProfileEdit() {
    resetProfileState();
}

function resetProfileState() {
    const inputs = document.querySelectorAll('#page-profile input');
    inputs.forEach(input => { input.disabled = true; });
    const buttons = document.querySelectorAll('.form-actions button');
    buttons.forEach(btn => { btn.disabled = true; });
}

// --- MENU DE USUÁRIO ---
function toggleMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById("user-menu");
    menu.classList.toggle("show-menu");
}

function logout() {
    const menu = document.getElementById("user-menu");
    if(menu) menu.classList.remove("show-menu");
    showPage('home');
}

window.onclick = function(event) {
    if (!event.target.matches('.user-profile') && !event.target.matches('.user-profile *')) {
        const menu = document.getElementById("user-menu");
        if (menu && menu.classList.contains('show-menu')) {
            menu.classList.remove('show-menu');
        }
    }
}

// --- ATUALIZAÇÃO DE IMAGENS (WHITE-LABEL) ---
function updateImageColors() {
    let brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();
    brandColor = brandColor.replace('#', '');
    const heroImg = document.getElementById('brand-hero-img');
    if (heroImg) {
        heroImg.src = `https://placehold.co/400x500/${brandColor}/white?text=Imagem HomePage`;
    }
    const loginImg = document.getElementById('brand-login-img');
    if (loginImg) {
        loginImg.src = `https://placehold.co/400x500/${brandColor}/white?text=Imagem Login`;
    }
}

// --- INICIALIZAÇÃO ---
window.addEventListener('load', () => {
    showPage('home');
    const track = document.getElementById('debt-track');
    if (track) {
        checkCarouselButtons(); 
        track.addEventListener('scroll', checkCarouselButtons);
        window.addEventListener('resize', checkCarouselButtons);
    }
    updateImageColors();
});
