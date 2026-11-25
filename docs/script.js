// Reveal sections as they come into view. Purely cosmetic: the page is
// fully readable without this file, and the CSS drops the effect when
// motion is turned down.
(function () {
  var root = document.documentElement;
  if (root.classList.contains("flat")) return;

  var targets = document.querySelectorAll(
    ".section-head, .plates, .entry, .card, .quiet-copy, .leaders, .requirements, .section-note"
  );

  targets.forEach(function (el, i) {
    el.classList.add("reveal");
    el.style.transitionDelay = Math.min(i % 3, 2) * 70 + "ms";
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
  );

  targets.forEach(function (el) { io.observe(el); });
})();
