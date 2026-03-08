(function () {
  "use strict";

  var STORAGE = {
    enabled: "iwd_music_enabled",
    muted: "iwd_music_muted",
    time: "iwd_music_time"
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupPageMotion();
    setupReveal();
    setupPetals();
    setupPageLinks();
    setupMusic();
  });

  function setupPageMotion() {
    var curtain = document.getElementById("welcomeCurtain");
    requestAnimationFrame(function () {
      document.body.classList.add("is-ready");
    });

    if (curtain) {
      setTimeout(function () {
        curtain.classList.add("is-hidden");
      }, 1000);
    }
  }

  function setupReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (node) {
        node.classList.add("in-view");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.18
    });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function setupPetals() {
    var field = document.getElementById("petalField");
    if (!field) {
      return;
    }

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }

    for (var i = 0; i < 18; i += 1) {
      var petal = document.createElement("span");
      petal.className = "petal";
      petal.style.setProperty("--left", random(1, 98) + "%");
      petal.style.setProperty("--size", random(8, 18) + "px");
      petal.style.setProperty("--opacity", (Math.random() * 0.5 + 0.2).toFixed(2));
      petal.style.setProperty("--duration", random(12, 26) + "s");
      petal.style.setProperty("--delay", (-random(0, 24)).toFixed(2) + "s");
      petal.style.setProperty("--sway", random(-100, 100) + "px");
      field.appendChild(petal);
    }
  }

  function setupPageLinks() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".page-link"));
    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href") || "";
        if (!href || href.indexOf("#") === 0) {
          return;
        }

        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        event.preventDefault();
        document.body.classList.add("is-leaving");
        setTimeout(function () {
          window.location.href = href;
        }, 220);
      });
    });
  }

  function setupMusic() {
    var audio = document.getElementById("bgMusic");
    var toggle = document.getElementById("musicToggle");
    var overlay = document.getElementById("musicOverlay");
    var enableBtn = document.getElementById("enableMusicBtn");

    if (!audio || !toggle) {
      return;
    }

    var desiredVolume = parseFloat(audio.dataset.volume || "0.18");
    var playAttemptNonce = 0;
    var synthState = {
      active: false,
      muted: false,
      ctx: null,
      master: null,
      intervalIds: []
    };

    audio.volume = clamp(desiredVolume, 0, 1);

    var mutedSaved = safeGet(STORAGE.muted);
    var enabledSaved = safeGet(STORAGE.enabled);
    var savedTime = parseFloat(safeGet(STORAGE.time) || "0");

    audio.muted = mutedSaved === "true";

    var loadedTime = false;
    audio.addEventListener("loadedmetadata", function () {
      if (!loadedTime && !Number.isNaN(savedTime) && savedTime > 0 && audio.duration && savedTime < audio.duration) {
        audio.currentTime = savedTime;
      }
      loadedTime = true;
    });

    var persistTime = throttle(function () {
      safeSet(STORAGE.time, String(audio.currentTime || 0));
    }, 1200);

    audio.addEventListener("timeupdate", persistTime);
    window.addEventListener("pagehide", function () {
      safeSet(STORAGE.time, String(audio.currentTime || 0));
    });

    if (enableBtn) {
      enableBtn.addEventListener("click", function () {
        hideMusicOverlay();
        attemptPlay(true);
      });
    }

    toggle.addEventListener("click", function () {
      if (synthState.active) {
        synthState.muted = !synthState.muted;
        if (synthState.master) {
          synthState.master.gain.value = synthState.muted ? 0 : desiredVolume * 0.1;
        }
        safeSet(STORAGE.muted, String(synthState.muted));
        safeSet(STORAGE.enabled, String(!synthState.muted));
        updateMusicButton();
        return;
      }

      if (audio.paused) {
        audio.muted = false;
        safeSet(STORAGE.muted, "false");
        attemptPlay(true);
        return;
      }

      audio.muted = !audio.muted;
      safeSet(STORAGE.muted, String(audio.muted));
      safeSet(STORAGE.enabled, String(!audio.muted));
      updateMusicButton();
    });

    var shouldAutoplay = enabledSaved !== "false";
    if (shouldAutoplay) {
      attemptPlay(false);
    } else {
      updateMusicButton();
    }

    function attemptPlay(userInitiated) {
      var thisAttempt = ++playAttemptNonce;
      var playPromise;

      if (userInitiated) {
        hideMusicOverlay();
      }

      try {
        playPromise = audio.play();
      } catch (error) {
        handlePlayFailure(thisAttempt, userInitiated);
        return;
      }

      if (!playPromise || typeof playPromise.then !== "function") {
        safeSet(STORAGE.enabled, String(!audio.muted));
        updateMusicButton();
        return;
      }

      playPromise.then(function () {
        if (thisAttempt !== playAttemptNonce) {
          return;
        }
        safeSet(STORAGE.enabled, "true");
        if (audio.muted) {
          safeSet(STORAGE.enabled, "false");
        }
        hideMusicOverlay();
        updateMusicButton();
      }).catch(function () {
        handlePlayFailure(thisAttempt, userInitiated);
      });
    }

    function handlePlayFailure(attemptId, userInitiated) {
      if (attemptId !== playAttemptNonce) {
        return;
      }

      if (userInitiated) {
        var fallbackStarted = startSynthFallback();
        hideMusicOverlay();
        safeSet(STORAGE.enabled, String(fallbackStarted));
        safeSet(STORAGE.muted, "false");
        updateMusicButton();
        return;
      }

      updateMusicButton();
      showMusicOverlay();
    }

    function startSynthFallback() {
      try {
        if (synthState.active && synthState.ctx) {
          if (synthState.ctx.state === "suspended") {
            synthState.ctx.resume();
          }
          synthState.muted = false;
          if (synthState.master) {
            synthState.master.gain.value = clamp(desiredVolume * 1.6, 0.06, 0.22);
          }
          return true;
        }

        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          return false;
        }

        var ctx = new AudioCtx();
        var master = ctx.createGain();
        master.gain.value = clamp(desiredVolume * 1.6, 0.06, 0.22);
        master.connect(ctx.destination);

        var tones = [196, 246.94, 293.66];
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        tones.forEach(function (tone, idx) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = tone;
          gain.gain.value = 0.0;
          osc.connect(gain).connect(master);
          osc.start();

          pulse(gain, ctx.currentTime + idx * 0.15);
          var intervalId = setInterval(function () {
            var now = ctx.currentTime;
            var target = tones[(idx + Math.floor(Math.random() * tones.length)) % tones.length];
            osc.frequency.linearRampToValueAtTime(target, now + 2.4);
            pulse(gain, now);
          }, 2200 + idx * 170);
          synthState.intervalIds.push(intervalId);
        });

        synthState.active = true;
        synthState.muted = false;
        synthState.ctx = ctx;
        synthState.master = master;
        return true;
      } catch (e) {
        // If fallback cannot initialize, UI remains usable without background music.
        return false;
      }
    }

    function updateMusicButton() {
      var on = synthState.active ? !synthState.muted : (!audio.paused && !audio.muted);
      toggle.textContent = on ? "Music: On" : "Music: Off";
      toggle.setAttribute("aria-pressed", on ? "true" : "false");
    }

    function showMusicOverlay() {
      if (overlay) {
        overlay.hidden = false;
      }
    }

    function hideMusicOverlay() {
      if (overlay) {
        overlay.hidden = true;
      }
    }

    function pulse(gainNode, startAt) {
      gainNode.gain.cancelScheduledValues(startAt);
      gainNode.gain.linearRampToValueAtTime(0.09, startAt + 0.7);
      gainNode.gain.linearRampToValueAtTime(0.0, startAt + 2.2);
    }
  }

  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn();
      }
    };
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Storage can be unavailable in restricted browsing contexts.
    }
  }
})();
