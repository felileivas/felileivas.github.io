// Loop ping-pong del clip de 5 s: solo se reproduce si el usuario no pidió reducir movimiento.
const video = document.querySelector('.video-bg');
const hero = document.querySelector('.hero');
video.addEventListener('loadeddata', () => hero.classList.add('is-loaded'), { once: true });
if (video.readyState >= 2) hero.classList.add('is-loaded');
if (matchMedia('(prefers-reduced-motion: no-preference)').matches) video.play().catch(() => {});
