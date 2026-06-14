/**
 * Simple Gallery Lightbox
 * Vanilla JS lightbox for the SNN Simple Gallery block.
 */
(function () {
    'use strict';

    var lightbox = null;
    var currentIndex = 0;
    var images = [];
    var isOpen = false;

    // ─── Build the lightbox DOM ───

    function buildLightbox() {
        if (lightbox) return;

        lightbox = document.createElement('div');
        lightbox.className = 'snn-lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.setAttribute('aria-label', 'Image lightbox');
        lightbox.innerHTML =
            '<div class="snn-lightbox-overlay"></div>' +
            '<div class="snn-lightbox-content">' +
                '<button class="snn-lightbox-close" aria-label="Close lightbox">' +
                    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                        '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                    '</svg>' +
                '</button>' +
                '<button class="snn-lightbox-prev" aria-label="Previous image">' +
                    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<polyline points="15 18 9 12 15 6"></polyline>' +
                    '</svg>' +
                '</button>' +
                '<button class="snn-lightbox-next" aria-label="Next image">' +
                    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<polyline points="9 18 15 12 9 6"></polyline>' +
                    '</svg>' +
                '</button>' +
                '<div class="snn-lightbox-figure">' +
                    '<img class="snn-lightbox-img" src="" alt="" />' +
                    '<div class="snn-lightbox-caption"></div>' +
                '</div>' +
                '<div class="snn-lightbox-counter"></div>' +
                '<button class="snn-lightbox-fullscreen" aria-label="Toggle fullscreen">' +
                    '<svg class="snn-lightbox-fs-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>' +
                    '</svg>' +
                '</button>' +
            '</div>';

        document.body.appendChild(lightbox);
    }

    // ─── Open lightbox ───

    function openLightbox(index) {
        if (!lightbox) buildLightbox();
        if (images.length === 0) return;

        currentIndex = index;
        isOpen = true;
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ─── Close lightbox ───

    function closeLightbox() {
        if (!lightbox) return;
        isOpen = false;
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ─── Update image ───

    function updateLightboxImage() {
        if (!lightbox || images.length === 0) return;

        var img = images[currentIndex];
        var imgEl = lightbox.querySelector('.snn-lightbox-img');
        var captionEl = lightbox.querySelector('.snn-lightbox-caption');
        var counterEl = lightbox.querySelector('.snn-lightbox-counter');

        imgEl.src = img.url;
        imgEl.alt = img.alt || '';
        captionEl.textContent = img.caption || '';
        captionEl.style.display = img.caption ? '' : 'none';
        counterEl.textContent = (currentIndex + 1) + ' / ' + images.length;

        // Preload adjacent images
        preloadImage(currentIndex - 1);
        preloadImage(currentIndex + 1);
    }

    function preloadImage(index) {
        if (index < 0 || index >= images.length) return;
        var link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = images[index].url;
        document.head.appendChild(link);
        setTimeout(function () { document.head.removeChild(link); }, 1000);
    }

    // ─── Navigation ───

    function goTo(index) {
        if (index < 0) {
            index = images.length - 1; // loop to last
        } else if (index >= images.length) {
            index = 0; // loop to first
        }
        if (index !== currentIndex) {
            currentIndex = index;
            updateLightboxImage();
        }
    }

    function goPrev() {
        goTo(currentIndex - 1);
    }

    function goNext() {
        goTo(currentIndex + 1);
    }

    // ─── Fullscreen ───

    function toggleFullscreen() {
        var el = lightbox.querySelector('.snn-lightbox-content');
        if (!document.fullscreenElement) {
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    // ─── Event handlers ───

    function onOverlayClick(e) {
        if (e.target.classList.contains('snn-lightbox-overlay')) {
            closeLightbox();
        }
    }

    function onKeyDown(e) {
        if (!isOpen) return;
        switch (e.key) {
            case 'Escape':
            case 'Esc':
                closeLightbox();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                goPrev();
                break;
            case 'ArrowRight':
                e.preventDefault();
                goNext();
                break;
        }
    }

    // ─── Touch / Swipe support ───

    var touchStartX = 0;
    var touchStartY = 0;

    function onTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    function onTouchEnd(e) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            e.preventDefault();
            if (dx > 0) {
                goPrev();
            } else {
                goNext();
            }
        }
    }

    // ─── Click handlers on gallery items ───

    function initGallery(galleryEl) {
        var links = galleryEl.querySelectorAll('.snn-gallery-link');
        if (links.length === 0) return;

        // Get pre-loaded images data from data-images attribute
        var imagesData = [];
        try {
            var data = galleryEl.getAttribute('data-images');
            if (data) {
                imagesData = JSON.parse(data);
            }
        } catch (e) {
            // fallback: build from link hrefs
        }

        // Fallback: build image list from links if data-images wasn't available
        if (imagesData.length === 0) {
            links.forEach(function (link) {
                var img = link.querySelector('img');
                imagesData.push({
                    url: link.getAttribute('href'),
                    alt: img ? img.getAttribute('alt') : '',
                    caption: '',
                });
            });
        }

        links.forEach(function (link, index) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                images = imagesData;
                openLightbox(index);
            });
        });
    }

    // ─── Initialize all galleries on DOM ready ───

    function init() {
        buildLightbox();

        var galleries = document.querySelectorAll('.snn-simple-gallery.has-lightbox');

        galleries.forEach(function (gallery) {
            // If already initialized, skip
            if (gallery.getAttribute('data-lightbox-initialized')) return;
            gallery.setAttribute('data-lightbox-initialized', '1');
            initGallery(gallery);
        });

        // Global event listeners
        if (lightbox) {
            lightbox.querySelector('.snn-lightbox-close').addEventListener('click', closeLightbox);
            lightbox.querySelector('.snn-lightbox-prev').addEventListener('click', goPrev);
            lightbox.querySelector('.snn-lightbox-next').addEventListener('click', goNext);
            lightbox.querySelector('.snn-lightbox-fullscreen').addEventListener('click', toggleFullscreen);
            lightbox.querySelector('.snn-lightbox-overlay').addEventListener('click', onOverlayClick);
            lightbox.addEventListener('touchstart', onTouchStart, { passive: true });
            lightbox.addEventListener('touchend', onTouchEnd, { passive: false });
        }

        document.addEventListener('keydown', onKeyDown);
    }

    // ─── Run on DOM ready ───

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
