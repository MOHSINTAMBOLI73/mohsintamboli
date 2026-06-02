// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. Lenis Smooth Scroll
// ==========================================
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { });  // keep GSAP in sync (no duplicate lenis)

// ==========================================
// 2. Custom Cursor (passive listeners)
// ==========================================
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
    gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });
}, { passive: true });

// Magnetic effect
const magneticEls = document.querySelectorAll('.magnetic');
const allInteractive = document.querySelectorAll('a, button, input, textarea');

allInteractive.forEach(el => {
    el.addEventListener('mouseenter', () => {
        gsap.to(follower, { width: 60, height: 60, backgroundColor: 'rgba(0, 243, 255, 0.1)' });
    });
    el.addEventListener('mouseleave', () => {
        gsap.to(follower, { width: 40, height: 40, backgroundColor: 'transparent' });
        // Reset magnetic pull only for magnetic elements
        if (el.classList.contains('magnetic')) {
            gsap.to(el, { x: 0, y: 0, duration: 0.3 });
        }
    });
});

magneticEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
        gsap.to(el, { x, y, duration: 0.3 });
    });
});

// ==========================================
// 3. Loader
// ==========================================
const progressEl = document.querySelector('.loader-progress');
let progress = 0;
const loaderInterval = setInterval(() => {
    progress += 7;
    if (progress > 100) progress = 100;
    progressEl.textContent = `${progress}%`;
    if (progress === 100) {
        clearInterval(loaderInterval);
        const tl = gsap.timeline();
        tl.to('.loader-logo', { opacity: 0, scale: 1.2, duration: 0.4, ease: 'power2.inOut' })
            .to('.loader', { yPercent: -100, duration: 0.8, ease: 'expo.inOut' })
            .from('.hero-title', { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
            .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6 }, '-=0.6')
            .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6 }, '-=0.5');
    }
}, 40);

// ==========================================
// 4. Three.js Particle Background
// ==========================================
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const particlesCount = 10000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 15;
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    size: 0.005,
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);
camera.position.z = 5;

let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
}, { passive: true });

const clock = new THREE.Clock();
function animateParticles() {
    requestAnimationFrame(animateParticles);
    const elapsed = clock.getElapsedTime();
    particles.rotation.y = elapsed * 0.02;
    particles.rotation.x = elapsed * 0.01;
    particles.position.x += (mouseX * 0.5 - particles.position.x) * 0.02;
    particles.position.y += (-mouseY * 0.5 - particles.position.y) * 0.02;
    renderer.render(scene, camera);
}
animateParticles();

// Debounced resize for performance
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, 150);
});

// ==========================================
// 5. Scroll Animations (GSAP + ScrollTrigger)
// ==========================================
function initScrollReveal() {
    document.querySelectorAll('.reveal-up').forEach(el => {
        // Kill existing triggers to avoid duplicates
        ScrollTrigger.getAll().forEach(t => { if (t.vars.trigger === el) t.kill(); });
        gsap.fromTo(el,
            { y: 50, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 1, ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    });
}

// Initial call for static elements
initScrollReveal();

// Counter animation (only once)
document.querySelectorAll('.counter').forEach(counter => {
    const target = +counter.dataset.target;
    ScrollTrigger.create({
        trigger: counter,
        start: 'top 90%',
        once: true,
        onEnter: () => {
            gsap.to(counter, {
                innerText: target,
                duration: 2,
                snap: { innerText: 1 },
                ease: 'power1.out',
            });
        }
    });
});

// Back to top
document.getElementById('back-to-top').addEventListener('click', () => {
    lenis.scrollTo(0, { duration: 1.5 });
});

// ==========================================
// 6. Video Modal
// ==========================================
const modal = document.getElementById('project-modal');
const modalVideo = document.querySelector('.modal-video-wrapper');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalDesc = document.getElementById('modal-desc');
const closeBtn = document.querySelector('.modal-close');

function openModal(card) {
    const videoType = card.dataset.videoType;
    const videoId = card.dataset.videoId;
    modalTitle.textContent = card.dataset.title;
    modalCategory.textContent = card.dataset.category;
    modalDesc.textContent = card.dataset.desc;

    // Stop previous media completely
    modalVideo.innerHTML = '';

    if (videoType === 'youtube') {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
        iframe.allow = 'autoplay; encrypted-media';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        modalVideo.appendChild(iframe);
    } else if (videoId) {
        const video = document.createElement('video');
        video.src = videoId;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        modalVideo.appendChild(video);
    }

    lenis.stop();
    modal.classList.add('active');
    gsap.fromTo('.modal-content', { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' });
    closeBtn.focus();
}

function closeModal() {
    gsap.to('.modal-content', {
        scale: 0.95, opacity: 0, y: 20, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
            modal.classList.remove('active');
            modalVideo.innerHTML = '';  // kill media
            lenis.start();
        }
    });
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// ==========================================
// 7. Dynamic Portfolio from JSON
// ==========================================
const portfolioSectionsContainer = document.getElementById('portfolio-sections');

function formatSectionTitle(sectionKey) {
    return sectionKey
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        if (!response.ok) throw new Error('Failed to load projects');
        const projects = await response.json();

        const mergedGroups = {};
        projects.forEach(p => {
            const rawSection = p.section || 'other';
            let canonicalSection = rawSection;
            if (['vfx', '3d-animation', '3d', 'animation'].includes(rawSection)) {
                canonicalSection = 'vfx-3d';
            }
            if (!mergedGroups[canonicalSection]) mergedGroups[canonicalSection] = [];
            mergedGroups[canonicalSection].push(p);
        });

        const sectionOrder = ['vfx-3d', 'web'];
        const sortedGroups = Object.entries(mergedGroups).sort((a, b) => {
            const indexA = sectionOrder.indexOf(a[0]);
            const indexB = sectionOrder.indexOf(b[0]);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        await buildPortfolioSections(Object.fromEntries(sortedGroups));
    } catch (err) {
        console.error(err);
        portfolioSectionsContainer.innerHTML = '<p style="color:#aaa">Unable to load projects at the moment.</p>';
    }
}

async function buildPortfolioSections(groups) {
    portfolioSectionsContainer.innerHTML = '';

    for (const [sectionKey, projects] of Object.entries(groups)) {
        if (projects.length === 0) continue;

        const sectionBlock = document.createElement('div');
        sectionBlock.className = 'work-category reveal-up';

        const heading = document.createElement('h3');
        heading.className = 'category-title';
        heading.textContent = sectionKey === 'vfx-3d' ? 'VFX & 3D Animation' : formatSectionTitle(sectionKey);
        sectionBlock.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'portfolio-grid';
        sectionBlock.appendChild(grid);

        const cardPromises = projects.map(project => buildProjectCard(project));
        const cards = await Promise.all(cardPromises);
        cards.forEach(card => grid.appendChild(card));

        const hasVfx = projects.some(p => p.section === 'vfx');
        if (hasVfx) {
            const moreCard = createMoreCard('https://www.youtube.com/channel/UCg7nQprQv4Chz2oYC4p7-rQ', '🎬 More Work on YouTube');
            grid.appendChild(moreCard);
        }

        portfolioSectionsContainer.appendChild(sectionBlock);
    }

    initScrollReveal();
    ScrollTrigger.refresh();
}

async function buildProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card reveal-up';
    card.setAttribute('data-title', project.title || '');
    card.setAttribute('data-category', project.category);
    card.setAttribute('data-desc', project.desc);

    const imgDiv = document.createElement('div');
    imgDiv.className = 'project-img';
    const img = document.createElement('img');
    img.alt = project.title + ' preview';
    img.loading = 'lazy';
    img.width = 800;
    img.height = 450;

    const overlay = document.createElement('div');
    overlay.className = 'project-overlay';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary magnetic';
    btn.textContent = 'View Project';
    overlay.appendChild(btn);

    imgDiv.appendChild(img);
    imgDiv.appendChild(overlay);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'project-info';
    const h3 = document.createElement('h3');
    const span = document.createElement('span');
    span.textContent = project.category;
    infoDiv.appendChild(h3);
    infoDiv.appendChild(span);

    card.appendChild(imgDiv);
    card.appendChild(infoDiv);

    if (project.type === 'youtube') {
        card.dataset.videoType = 'youtube';
        card.dataset.videoId = project.videoId;
        img.src = `https://img.youtube.com/vi/${project.videoId}/maxresdefault.jpg`;
        img.onerror = () => { img.src = `https://img.youtube.com/vi/${project.videoId}/hqdefault.jpg`; };

        h3.textContent = 'Loading title…';
        try {
            const ytTitle = await fetchYouTubeTitle(project.videoId);
            const cleanTitle = ytTitle.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
            h3.textContent = cleanTitle || (project.title || project.videoId);
            card.setAttribute('data-title', h3.textContent);
        } catch {
            h3.textContent = project.title || project.videoId;
        }
    } else if (project.type === 'website') {
        card.dataset.videoType = 'website';
        card.dataset.websiteUrl = project.url;
        img.src = project.thumbnail || 'https://via.placeholder.com/800x450/0b0b0b/00f3ff?text=Website';
        h3.textContent = project.title || 'Website';
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleProjectClick(card);
    });

    return card;
}

async function fetchYouTubeTitle(videoId) {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('YouTube oEmbed failed');
    const data = await response.json();
    return data.title;
}

function handleProjectClick(card) {
    const type = card.dataset.videoType;
    if (type === 'website') {
        const url = card.dataset.websiteUrl;
        if (url) window.open(url, '_blank', 'noopener');
        return;
    }
    openModal(card);
}

function createMoreCard(youtubeUrl, text) {
    const card = document.createElement('div');
    card.className = 'project-card reveal-up more-card';
    card.setAttribute('data-title', text);
    card.setAttribute('data-category', 'VFX');
    card.setAttribute('data-desc', 'Visit my YouTube channel for more motion graphics work.');

    const imgDiv = document.createElement('div');
    imgDiv.className = 'project-img';
    const placeholder = document.createElement('div');
    placeholder.className = 'more-placeholder';
    placeholder.textContent = text;

    const overlay = document.createElement('div');
    overlay.className = 'project-overlay';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary magnetic';
    btn.textContent = 'Open Channel';
    overlay.appendChild(btn);

    imgDiv.appendChild(placeholder);
    imgDiv.appendChild(overlay);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'project-info';
    const h3 = document.createElement('h3');
    h3.textContent = 'Explore More';
    const span = document.createElement('span');
    span.textContent = 'YouTube Channel';
    infoDiv.appendChild(h3);
    infoDiv.appendChild(span);

    card.appendChild(imgDiv);
    card.appendChild(infoDiv);

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(youtubeUrl, '_blank', 'noopener');
    });
    return card;
}

// Start loading dynamic projects
loadProjects();