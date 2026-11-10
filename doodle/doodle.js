/* Doodle + Squib, the Scool Tracker mascots. ONE swappable place.
   Original art (cut out from mascots/*.webp, transparent background).
     Doodle = the energetic green bird, cheering with a star.  Poses: wave, jump, worried
     Squib  = the clever lanky one with a pencil and a scroll.  Poses: focused, sleepy
   API (unchanged from the old SVG placeholder):
     Doodle.mountAll()          renders every [data-doodle] element (value = pose)
     Doodle.set(el, pose)       swaps an element to another pose with a little bounce
   Optional attributes: data-doodle-label="alt text" (default is empty alt = decorative).
   Poses are only motion (CSS, off when the user prefers reduced motion). */
(function (root) {
  'use strict';
  var ENABLED = false; // mascots hidden for now (2026-11-10). Set true and remove the 'mascots off' block at the end of style.css to bring them back.
  var POSES = ['wave', 'jump', 'worried', 'focused', 'sleepy'];
  var WHO = { wave: 'doodle', jump: 'doodle', worried: 'doodle', focused: 'squib', sleepy: 'squib' };
  var ALT = {
    doodle: 'Doodle, a green, wide-eyed bird mascot, cheering and holding up a gold star',
    squib: 'Squib, a lanky green mascot with a pencil in its hair and a scroll under its arm, thinking'
  };
  var SIZES = { doodle: [439, 640, 110, 160], squib: [402, 640, 101, 160] };

  function svg(pose, label) {
    if (!WHO[pose]) pose = 'wave';
    var who = WHO[pose], s = SIZES[who];
    var alt = label === '' || label == null ? '' : (label === true ? ALT[who] : label);
    return '<img class="dd dd-' + pose + ' dd-' + who + '" src="mascots/' + who + '.webp"' +
      ' srcset="mascots/' + who + '-icon.webp ' + s[2] + 'w, mascots/' + who + '.webp ' + s[0] + 'w"' +
      ' sizes="(max-width: 599px) 110px, 200px" width="' + s[0] + '" height="' + s[1] + '"' +
      ' alt="' + String(alt).replace(/"/g, '&quot;') + '" decoding="async" draggable="false">';
  }

  function render(el) {
    if (!ENABLED) { el.innerHTML = ''; return; }
    var pose = el.getAttribute('data-doodle') || 'wave';
    var label = el.hasAttribute('data-doodle-label') ? el.getAttribute('data-doodle-label') || true : '';
    el.innerHTML = svg(pose, label);
    el.setAttribute('data-pose', pose);
  }

  function set(el, pose) {
    if (!el || el.getAttribute('data-pose') === pose) return;
    el.setAttribute('data-doodle', pose);
    render(el);
    el.classList.remove('dd-swap'); void el.offsetWidth; el.classList.add('dd-swap');
  }

  function mountAll(scope) {
    [].forEach.call((scope || document).querySelectorAll('[data-doodle]'), render);
  }

  root.Doodle = { svg: svg, set: set, mountAll: mountAll, poses: POSES, who: WHO };
})(window);
