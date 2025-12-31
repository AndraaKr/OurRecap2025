const audio = document.getElementById('bgMusic');
const slide1 = document.getElementById('slide1');
const musicControl = document.getElementById('music-control');
const modal = document.getElementById('m');

const happyGif = new Image();
happyGif.src = 'assets/happy2.gif'; 
const bgHero = new Image();
bgHero.src = 'assets/bg-hero.jpg';

let musicManuallyPaused = false;
let pausedByVideo = false;
let playingVideosCount = 0;


function startExperience() {
    const overlay = document.getElementById('overlay');
    
    // 1. Tambahkan class animasi (menyusut ke atas)
    overlay.classList.add('hide-overlay');
    
    // 2. Munculkan kontrol musik
    musicControl.style.display = 'block';
    
    // 3. Jalankan Musik
    audio.play().then(() => {
        musicManuallyPaused = false;
    }).catch(e => console.log("Audio play deferred"));

    // 4. Jeda 1 detik (sesuai durasi transisi di CSS)
    setTimeout(() => {
        overlay.style.display = 'none';
        
        // 5. Mulai animasi teks di slide 1
        slide1.classList.add('start-anim');
    }, 1000); 
}

function toggleMusic() {
    if (audio.paused) {
        audio.play();
        musicControl.innerHTML = '🎵';
        musicManuallyPaused = false;
    } else {
        audio.pause();
        musicControl.innerHTML = '🔇';
        musicManuallyPaused = true;
    }
}

function openModal() {
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

// Close modal if user clicks outside of it
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// (Removed old generic Swiper init to use mainSwiper + nested swipers)

function openFull(src) {
    const fullView = document.getElementById('fullView');
    const imgFull = document.getElementById('imgFull');
    const dlBtn = document.getElementById('downloadBtn');
    
    imgFull.src = src;
    dlBtn.href = src;
    fullView.style.display = 'flex';
}

function closeFull() {
    document.getElementById('fullView').style.display = 'none';
}


const defaultMusic = "https://www.dropbox.com/scl/fi/5fr2urouiedcfa4o2znay/American-Authors-Best-Day-Of-My-Life-Lyrics-vJ9KFEJVISo.m4a?rlkey=ldjif03fqf9k6byy6j6vkxtcc&st=ug7cqwjd&raw=1";
// Main Vertical Swiper
const mainSwiper = new Swiper('.mainSwiper', {
    direction: 'vertical',
    speed: 800,
    mousewheel: true,
    on: {
        slideChangeTransitionStart: function () {
            pauseAllVideos();

            // AMBIL SLIDE YANG SEDANG AKTIF
            const activeSlide = this.slides[this.activeIndex];
            const newMusic = activeSlide.getAttribute('data-music');

            // LOGIKA GANTI LAGU
            if (newMusic) {
                // Jika slide punya lagu khusus (seperti slide surat)
                if (audio.src !== newMusic) {
                    audio.src = newMusic;
                    audio.load();
                    if (!musicManuallyPaused) audio.play();
                }
            } else {
                // Jika slide TIDAK punya lagu khusus, kembalikan ke lagu awal
                if (audio.src !== defaultMusic) {
                    audio.src = defaultMusic;
                    audio.load();
                    if (!musicManuallyPaused) audio.play();
                }
            }

            if (this.activeIndex === 0) {
                document.getElementById('slide1').classList.add('start-anim');
            }
            
            if (activeSlide && activeSlide.classList.contains('s-stat')) {
                startStatsCounters(activeSlide);
            }
        }
    }
});

// Pause all videos on the page (used when changing slides)
function pauseAllVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
        try {
            if (!v.paused) v.pause();
        } catch (e) {
            // ignore
        }
    });
}
// Initialize all nested horizontal swipers (one instance per container)
const nestedSwiperInstances = [];
document.querySelectorAll('.nestedSwiper').forEach(container => {
    const paginationEl = container.querySelector('.swiper-pagination') || container.querySelector('.custom-pagination');
    const opts = {
        direction: 'horizontal',
        slidesPerView: 1,
        spaceBetween: 16,
        speed: 700,
        centeredSlides: true,
        parallax: true,
        preloadImages: false,
        lazy: { loadPrevNext: true },
    };
    if (paginationEl) {
        opts.pagination = { el: paginationEl, clickable: true };
    }
    const inst = new Swiper(container, opts);
    nestedSwiperInstances.push(inst);

    // update nested navigation visibility per-instance
    const prevBtn = container.querySelector('.nested-nav.prev');
    const nextBtn = container.querySelector('.nested-nav.next');
    function updateNestedNav() {
        try {
            if (prevBtn) prevBtn.style.display = inst.isBeginning ? 'none' : 'flex';
            if (nextBtn) nextBtn.style.display = inst.isEnd ? 'none' : 'flex';
        } catch (e) {}
    }
    // run on relevant events
    inst.on('slideChange', updateNestedNav);
    inst.on('transitionEnd', updateNestedNav);
    // initial update
    updateNestedNav();
});

// Fungsi untuk tombol "Berikutnya"
function goNext(btn) {
    const nestedContainer = btn.closest('.nestedSwiper');
    if (!nestedContainer) return;
    const swiperContainer = nestedContainer.swiper;
    if (!swiperContainer) return;

    if (swiperContainer.isEnd) {
        mainSwiper.slideNext();
    } else {
        swiperContainer.slideNext();
    }
}

// Modal logic tetap sama...

// Attach listeners to all videos so background music pauses when any video plays
function attachVideoListeners() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        // avoid attaching multiple times
        if (video._hasBgListener) return;
        video._hasBgListener = true;

        video.addEventListener('play', () => {
            playingVideosCount++;
            if (!audio.paused) {
                audio.pause();
                pausedByVideo = true;
                musicControl.innerHTML = '🔇';
            }
        });

        const onStopped = () => {
            playingVideosCount = Math.max(0, playingVideosCount - 1);
            if (playingVideosCount === 0 && pausedByVideo && !musicManuallyPaused) {
                audio.play().then(() => {
                    pausedByVideo = false;
                    musicControl.innerHTML = '🎵';
                }).catch(() => {
                    // ignore play errors
                });
            }
        };

        video.addEventListener('pause', onStopped);
        video.addEventListener('ended', onStopped);
    });
}

// Call once on load, and also after dynamic content changes if needed
document.addEventListener('DOMContentLoaded', attachVideoListeners);
// In case scripts run after DOMContentLoaded
attachVideoListeners();

// Navigation helpers for nested swipers (buttons)
function nestedNext(btn) {
    const container = btn.closest('.nestedSwiper');
    if (!container) return;
    const sw = container.swiper;
    if (sw) sw.slideNext();
}

function nestedPrev(btn) {
    const container = btn.closest('.nestedSwiper');
    if (!container) return;
    const sw = container.swiper;
    if (sw) sw.slidePrev();
}

// CountUp stats initialization (scoped to a container or document)
function startStatsCounters(container) {
    const scope = container || document;
    const elems = scope.querySelectorAll('.stat-number');
    elems.forEach(el => {
        // Special happy-slide flow (prank + reveal)
        const parentSlide = scope.closest && scope.closest('.swiper-slide') ? scope.closest('.swiper-slide') : scope;
        if (parentSlide && parentSlide.id === 'slide-stat-happy') {
            if (el._countStarted) return;
            el._countStarted = true;
            const icon = parentSlide.querySelector('.stat-gif');
            const label = parentSlide.querySelector('.stat-label');
            const card = parentSlide.querySelector('.card') || parentSlide;
            const smallTarget = parseInt(el.getAttribute('data-target')) || 0; // initial small number (e.g., 4)
            const finalText = '10+'; // real final stat as requested

            // 1) Start spinner animation (random digits) for ~2.5s
            let spinner = null;
            function startSpinner() {
                spinner = setInterval(() => {
                    // show random 1-9 numbers to look like counting
                    el.textContent = Math.floor(Math.random() * 9) + 1;
                }, 80);
            }
            function stopSpinner() {
                if (spinner) { clearInterval(spinner); spinner = null; }
            }

            // Ensure initial state: icon visible (ketakutan), label hidden until first stop
            if (icon) icon.style.display = '';
            if (label) label.style.opacity = '0';

            startSpinner();

            // after 2.5s stop spinner and show smallTarget with bubble effect
            setTimeout(() => {
                stopSpinner();
                el.textContent = smallTarget.toLocaleString();
                // bubble animation: add class, remove after animation
                el.classList.add('bubble');
                setTimeout(() => el.classList.remove('bubble'), 700);

                // reveal label smoothly
                if (label) label.style.transition = 'opacity 300ms';
                if (label) label.style.opacity = '1';

                // 2) after 2s from this stop, show prank overlay (shortened per request)
                setTimeout(() => {
                    const overlay = document.createElement('div');
                    overlay.className = 'prank-overlay';
                    overlay.innerHTML = '<div class="prank-text">Bercanda, pasti ada happynya lah</div>';
                    card.appendChild(overlay);
                    // show overlay for 2s
                    setTimeout(() => {
                        try { overlay.remove(); } catch (e) {}
                        // 3) after overlay removed: animate counting again then reveal final number and swap gif
                        // quick spinner
                        startSpinner();
                        setTimeout(() => {
                            stopSpinner();
                            el.textContent = finalText;
                            // bubble animation on final reveal
                            el.classList.add('bubble');
                            setTimeout(() => el.classList.remove('bubble'), 700);
                            // swap gif to a happier gif if available
                            if (icon) {
                                try {
                                    // try to find a happy gif; fallback to same
                                    icon.src = icon.getAttribute('data-final') || 'assets/happy2.gif';
                                } catch (e) {}
                            }
                        }, 800);
                    }, 2100);
                }, 1000);

            }, 2500);

            return;
        }

        if (el._countStarted) return;
        el._countStarted = true;
        const target = parseInt(el.getAttribute('data-target')) || 0;
        const options = { duration: 1.6, separator: ',' };
        try {
            const CountUpCtor = window.CountUp || (window.countUp && window.countUp.CountUp) || (window.CountUp && window.CountUp.CountUp);
            if (CountUpCtor) {
                const cnt = new CountUpCtor(el, target, options);
                if (!cnt.error) {
                    cnt.start();
                    // add bubble when animation completes (approx options.duration)
                    setTimeout(() => {
                        try { el.classList.add('bubble'); setTimeout(() => el.classList.remove('bubble'), 700); } catch(e){}
                    }, (options.duration || 1.6) * 1000 + 80);
                } else {
                    el.textContent = target.toLocaleString();
                    try { el.classList.add('bubble'); setTimeout(() => el.classList.remove('bubble'), 700); } catch(e){}
                }
            } else {
                // fallback: simple increment animation
                let start = 0;
                const duration = 1600;
                const stepTime = 30;
                const steps = Math.max(1, Math.floor(duration / stepTime));
                const increment = target / steps;
                const iv = setInterval(() => {
                    start += increment;
                    if (start >= target) {
                        el.textContent = target.toLocaleString();
                        clearInterval(iv);
                        try { el.classList.add('bubble'); setTimeout(() => el.classList.remove('bubble'), 700); } catch(e){}
                    } else {
                        el.textContent = Math.floor(start).toLocaleString();
                    }
                }, stepTime);
            }
        } catch (err) {
            el.textContent = target.toLocaleString();
        }
    });
}

// If stats slide is visible on init, start counters
document.addEventListener('DOMContentLoaded', () => {
    try {
        const active = mainSwiper && mainSwiper.slides && mainSwiper.slides[mainSwiper.activeIndex];
        if (active && active.classList.contains('s-stat')) startStatsCounters(active);
    } catch (e) {}
});

/* --- Fungsi Kontrol Play Video --- */
function togglePlayVideo(btn) {
    const wrapper = btn.closest('.video-wrapper');
    const video = wrapper.querySelector('video');
    
    if (video.paused) {
        // Pause semua video lain dulu agar tidak tabrakan suara
        document.querySelectorAll('video').forEach(v => {
            if (v !== video) {
                v.pause();
                v.parentElement.classList.remove('video-playing');
            }
        });

        video.play();
        wrapper.classList.add('video-playing');
        video.controls = true; // Munculkan bar durasi/volume setelah play
    } else {
        video.pause();
        wrapper.classList.remove('video-playing');
    }
}

// Tambahan agar jika user pause lewat tombol bawaan HP/Browser, tombol play tengah muncul lagi
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('video').forEach(v => {
        v.addEventListener('pause', () => {
            if (v.parentElement.classList.contains('video-wrapper')) {
                v.parentElement.classList.remove('video-playing');
            }
        });
        v.addEventListener('play', () => {
            if (v.parentElement.classList.contains('video-wrapper')) {
                v.parentElement.classList.add('video-playing');
                v.controls = true;
            }
        });
    });
});

// Hilangkan Loader saat halaman selesai dimuat
window.addEventListener('load', () => {
    const loader = document.getElementById('loader-wrapper');
    
    // Beri sedikit delay agar transisi mulus
    setTimeout(() => {
        loader.classList.add('loader-hidden');
    }, 2500); 
});