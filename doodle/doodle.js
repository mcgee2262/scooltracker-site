/* Doodle, the Scool Tracker mascot. ONE swappable place.
   Placeholder art: inline SVG, a soft lavender storybook creature with a floppy hair tuft,
   a calm goofy face and a big chewed pencil. Wobbly ink comes from a tiny displacement filter.
   To swap in real art later (e.g. Higgsfield PNGs), change svg() below to return
   '<img src="doodle/' + pose + '.png" alt="" width="200" height="240">' and keep the API:
     Doodle.mountAll()          renders every [data-doodle] element (value = pose)
     Doodle.set(el, pose)       swaps an element to another pose with a little bounce
   Poses: wave, jump, worried, focused, sleepy. */
(function (root) {
  'use strict';
  var INK = '#1B2421', BODY = '#CDC2FF', BELLY = '#E6E0FF', CHEEK = '#FF9FB2',
      HAIR = '#A898FF', PENCIL = '#FFD66B', PENCIL2 = '#E9B949', WOOD = '#F2CFA0', METAL = '#B7C4C0', ERASER = '#FF9FB2';
  var uid = 0;
  var POSES = ['wave', 'jump', 'worried', 'focused', 'sleepy'];
  var LABEL = {
    wave: 'Doodle, a purple doodle creature, waving hello',
    jump: 'Doodle jumping for joy',
    worried: 'Doodle sweating and worried',
    focused: 'Doodle focused, writing with a big pencil',
    sleepy: 'Doodle sleepy at night'
  };

  function S(d, extra) { return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '/>'; }

  /* noodle arm: thick ink stroke with body stroke on top, plus a round hand */
  function arm(d, hx, hy, cls) {
    return '<g' + (cls ? ' class="' + cls + '"' : '') + '>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + BODY + '" stroke-width="6.4" stroke-linecap="round"/>' +
      '<circle cx="' + hx + '" cy="' + hy + '" r="7.5" fill="' + BODY + '" stroke="' + INK + '" stroke-width="3.4"/></g>';
  }

  /* the big chewed pencil, drawn tip-up at the origin; len ~ 118 */
  function pencil(x, y, angle, cls) {
    var L = 118;
    return '<g' + (cls ? ' class="' + cls + '"' : '') + ' transform="translate(' + x + ' ' + y + ') rotate(' + angle + ')">' +
      // eraser + ferrule at the bottom
      '<rect x="-8" y="' + (L - 12) + '" width="16" height="12" rx="4" fill="' + ERASER + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<rect x="-8.5" y="' + (L - 21) + '" width="17" height="10" fill="' + METAL + '" stroke="' + INK + '" stroke-width="3"/>' +
      // body with chew notches near the eraser end
      '<path d="M-8 20 L8 20 L8 ' + (L - 44) + ' l-3.5 3 l3.5 3 l-3.5 3.5 l3.5 3 L8 ' + (L - 21) + ' L-8 ' + (L - 21) + ' L-8 ' + (L - 38) + ' l3 -3 l-3 -3 l3.5 -3 l-3.5 -3 Z" fill="' + PENCIL + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M0 22 L0 ' + (L - 48) + '" stroke="' + PENCIL2 + '" stroke-width="3" stroke-linecap="round"/>' +
      // sharpened wood + graphite tip
      '<path d="M-8 20 L0 0 L8 20 Z" fill="' + WOOD + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M-2.6 6.6 L0 0 L2.6 6.6 Z" fill="' + INK + '"/>' +
      '</g>';
  }

  var BODY_PATH = 'M100 80 C146 77 166 118 165 153 C164 193 138 214 100 214 C62 214 35 193 35 153 C35 117 55 82 100 80 Z';
  var BELLY_PATH = 'M100 152 C123 151 135 168 134 185 C133 201 119 208 100 208 C81 208 67 201 66 185 C65 168 77 152 100 152 Z';

  function strand(d) {
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + HAIR + '" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function tuft(cls) {
    return '<g class="dd-tuft' + (cls ? ' ' + cls : '') + '">' +
      strand('M95 85 C88 72 78 76 74 64 C71 56 64 56 61 60') +
      strand('M105 85 C110 72 121 76 124 66') +
      strand('M100 85 C96 66 110 58 106 44 C103 33 113 27 121 32 C127 36 126 44 120 45')+ '</g>';
  }

  function feet(lift) {
    var y = 214 - (lift || 0);
    return '<ellipse cx="78" cy="' + y + '" rx="17" ry="9" fill="' + BODY + '" stroke="' + INK + '" stroke-width="3.4"/>' +
           '<ellipse cx="122" cy="' + y + '" rx="17" ry="9" fill="' + BODY + '" stroke="' + INK + '" stroke-width="3.4"/>';
  }

  function torso() {
    return '<path d="' + BODY_PATH + '" fill="' + BODY + '" stroke="' + INK + '" stroke-width="3.8" stroke-linejoin="round"/>' +
      '<path d="' + BELLY_PATH + '" fill="' + BELLY + '"/>' +
      '<circle cx="68" cy="150" r="8" fill="' + CHEEK + '" opacity=".6"/><circle cx="132" cy="150" r="8" fill="' + CHEEK + '" opacity=".6"/>';
  }

  /* calm, half-lidded eyes */
  function calmEyes() {
    return '<ellipse cx="83" cy="126" rx="5.6" ry="7" fill="' + INK + '"/><ellipse cx="117" cy="126" rx="5.6" ry="7" fill="' + INK + '"/>' +
      '<circle cx="85" cy="128" r="1.6" fill="#fff"/><circle cx="119" cy="128" r="1.6" fill="#fff"/>' +
      '<rect x="75" y="116" width="17" height="7.5" fill="' + BODY + '"/><rect x="108" y="116" width="17" height="7.5" fill="' + BODY + '"/>' +
      S('M76 123.5 Q83 122 90 123.5') + S('M110 123.5 Q117 122 124 123.5');
  }

  function goofySmile() {
    return S('M84 158 Q100 172 117 156') +
      '<rect x="95" y="162" width="8" height="7" rx="1.5" fill="#fff" stroke="' + INK + '" stroke-width="2.6"/>';
  }

  var poses = {
    wave: function () {
      return '<g class="dd-body">' + feet() +
        pencil(30, 222, 180) +
        torso() + tuft() + calmEyes() + goofySmile() +
        arm('M46 152 C31 162 28 176 33 186', 33, 187) +
        arm('M155 142 C175 130 182 110 177 93', 177, 91, 'dd-wave') + '</g>';
    },
    jump: function () {
      return '<g class="dd-body dd-hop">' + feet(4) + torso() + tuft('dd-tuft-up') +
        S('M75 128 Q83 117 91 128') + S('M109 128 Q117 117 125 128') +
        '<path d="M83 155 Q100 184 118 155 Z" fill="#5A2E44" stroke="' + INK + '" stroke-width="3.4" stroke-linejoin="round"/>' +
        '<path d="M92 168 Q100 176 109 168 Q101 162 92 168 Z" fill="' + CHEEK + '"/>' +
        arm('M46 140 C30 124 27 106 34 92', 34, 90) +
        pencil(30, 16, 8) +
        arm('M154 140 C170 124 174 106 168 92', 168, 90) + '</g>' +
        '<g class="dd-lines" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"><path d="M62 236 l-8 4"/><path d="M100 238 v6"/><path d="M138 236 l8 4"/></g>';
    },
    worried: function () {
      return '<g class="dd-body dd-shake">' + feet() + torso() + tuft() +
        S('M72 113 L89 106') + S('M128 113 L111 106') +
        '<circle cx="83" cy="127" r="9" fill="#fff" stroke="' + INK + '" stroke-width="3"/><circle cx="117" cy="127" r="9" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
        '<circle cx="84" cy="129" r="3.6" fill="' + INK + '"/><circle cx="116" cy="129" r="3.6" fill="' + INK + '"/>' +
        S('M85 164 q4 -5 8 0 t8 0 t8 0 t8 0') +
        pencil(142, 136, 50) +
        arm('M42 150 C50 170 68 174 82 166', 82, 166) +
        arm('M158 150 C150 170 132 176 118 170', 118, 170) + '</g>' +
        '<g class="dd-sweat"><path d="M154 96 C150 104 148 108 151 112 C154 115 159 113 159 108 C159 104 156 100 154 96 Z" fill="#8FD3FF" stroke="' + INK + '" stroke-width="2.6"/>' +
        '<path d="M44 104 C41 110 40 113 42 116 C44 118 48 117 48 113 C48 110 46 107 44 104 Z" fill="#8FD3FF" stroke="' + INK + '" stroke-width="2.4"/></g>';
    },
    focused: function () {
      return '<g class="dd-body">' + feet() + torso() + tuft('dd-tuft-up') +
        '<path d="M77 127 Q84 136 91 127 Z" fill="' + INK + '"/><path d="M111 127 Q118 136 125 127 Z" fill="' + INK + '"/>' +
        S('M76 127 L92 127') + S('M110 127 L126 127') +
        S('M88 162 Q100 167 112 159') +
        '<path d="M106 162 Q111 172 116 163" fill="' + CHEEK + '" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round"/>' +
        arm('M46 152 C34 164 34 178 42 188', 42, 189) +
        '<g class="dd-paper"><rect x="128" y="196" width="58" height="34" rx="4" fill="#fff" stroke="' + INK + '" stroke-width="3" transform="rotate(-6 157 213)"/>' +
        '<path class="dd-scribble" d="M136 210 q5 -5 9 0 t9 0 t9 0 M137 220 q5 -4 9 0 t9 0" fill="none" stroke="#7B6CF0" stroke-width="2.6" stroke-linecap="round" transform="rotate(-6 157 213)"/></g>' +
        '<g class="dd-write">' + pencil(150, 212, -160) + arm('M154 150 C166 160 168 172 163 182', 163, 183) + '</g></g>';
    },
    sleepy: function () {
      return '<g class="dd-body dd-breathe" transform="rotate(-5 100 214)">' + feet() +
        pencil(160, 222, 196) + torso() + tuft('dd-tuft-down') +
        S('M75 127 Q83 133 91 127') + S('M109 127 Q117 133 125 127') +
        '<ellipse cx="101" cy="162" rx="5" ry="6" fill="#5A2E44" stroke="' + INK + '" stroke-width="2.8"/>' +
        arm('M46 152 C34 164 32 178 38 190', 38, 191) +
        arm('M154 152 C164 166 164 180 158 190', 158, 191) + '</g>' +
        '<g class="dd-zzz" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<path class="z1" d="M146 70 h12 l-12 13 h12"/><path class="z2" d="M164 46 h9 l-9 10 h9"/><path class="z3" d="M178 26 h7 l-7 8 h7"/></g>';
    }
  };

  function svg(pose, label) {
    if (!poses[pose]) pose = 'wave';
    var id = 'ddw' + (++uid);
    var t = label === '' ? '' : '<title>' + (label || LABEL[pose]) + '</title>';
    return '<svg class="dd dd-' + pose + '" viewBox="0 0 200 250" ' + (label === '' ? 'aria-hidden="true" focusable="false"' : 'role="img"') + '>' + t +
      '<defs><filter id="' + id + '" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="' + (uid % 7 + 2) + '"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter></defs>' +
      '<ellipse class="dd-shadow" cx="100" cy="228" rx="50" ry="6" fill="' + INK + '" opacity=".18"/>' +
      '<g filter="url(#' + id + ')">' + poses[pose]() + '</g></svg>';
  }

  function render(el) {
    var pose = el.getAttribute('data-doodle') || 'wave';
    var label = el.hasAttribute('data-doodle-label') ? el.getAttribute('data-doodle-label') : '';
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

  root.Doodle = { svg: svg, set: set, mountAll: mountAll, poses: POSES };
})(window);
