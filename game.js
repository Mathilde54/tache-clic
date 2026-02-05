/* ================================
   JEU DES CIBLES — MODE OBJECTIF
   25 cibles le plus vite possible
================================ */

const OBJECTIF = 25;

/* DOM */
const zone = document.getElementById('zone-jeu');
const accueil = document.getElementById('accueil');
const accueilDemarrer = document.getElementById('accueil-demarrer');
const accueilScores = document.getElementById('accueil-scores');
const infosElt = document.getElementById('infos');
const scoreElt = document.getElementById('score');
const touchesElt = document.getElementById('touches');
const tempsElt = document.getElementById('temps');
const messageCentreElt = document.getElementById('message-centre');
const finContainer = document.getElementById('fin-container');
const finResultatElt = document.getElementById('fin-resultat');
const boutonEnregistrerScore = document.getElementById('enregistrer-score');
const boutonRecommencerFin = document.getElementById('recommencer-fin');
const boutonMenuFin = document.getElementById('menu-fin');
const scoresTbody = document.getElementById('scores-tbody');
const scoresContainer = document.getElementById('scores-container');
const cible = document.getElementById('cible');

/* Jeu */
let score = 0;
let nbTouches = 0;
let erreurs = 0;
let jeuActif = false;

/* Chrono */
let startTime = 0;
let elapsed = 0;
let rafId = null;

/* Placement */
const nbZones = 6;
let zonePrecedente = null;
let cibleTaille = null;

/* Scores */
const STORAGE_KEY = 'scoresJeu1_v2';
let scores = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let dernierPseudo = localStorage.getItem('dernierPseudo') || '';
let indexDernierScore = -1;

/* ===== AFFICHAGE ===== */

function majStats() {
  erreurs = nbTouches - score;
  scoreElt.textContent = `Cibles touchées : ${score} / ${OBJECTIF}`;
  touchesElt.textContent = `Touches totales : ${nbTouches} (Erreurs : ${erreurs})`;
}

function majTemps() {
  tempsElt.textContent = `Temps : ${elapsed.toFixed(2)} s`;
}

function chronoLoop() {
  elapsed = (performance.now() - startTime) / 1000;
  majTemps();
  rafId = requestAnimationFrame(chronoLoop);
}

/* ===== PLACEMENT CIBLE ===== */

function choisirZoneAleatoireDiff() {
  let i;
  do {
    i = Math.floor(Math.random() * nbZones);
  } while (i === zonePrecedente);
  zonePrecedente = i;
  return i;
}

function placerCibleDansZone(index) {
  const w = zone.clientWidth / 2;
  const h = zone.clientHeight / 3;
  const col = index % 2;
  const row = Math.floor(index / 2);

  if (!cibleTaille) cibleTaille = cible.getBoundingClientRect().width;

  cible.style.left = (col * w + w / 2 - cibleTaille / 2) + 'px';
  cible.style.top = (row * h + h / 2 - cibleTaille / 2) + 'px';
}

function nouvellePosition() {
  placerCibleDansZone(choisirZoneAleatoireDiff());
}

/* ===== JEU ===== */

function lancerNouvellePartie() {
  score = 0;
  nbTouches = 0;
  erreurs = 0;
  elapsed = 0;
  zonePrecedente = null;
  cibleTaille = null;

  majStats();
  majTemps();

  accueil.style.display = 'none';
  finContainer.style.display = 'none';
  infosElt.style.display = 'block';

  cible.style.display = 'none';
  jeuActif = false;

  let c = 3;
  messageCentreElt.style.display = 'block';
  messageCentreElt.textContent = `Départ dans ${c}`;

  const countdown = setInterval(() => {
    c--;
    if (c > 0) {
      messageCentreElt.textContent = `Départ dans ${c}`;
    } else {
      clearInterval(countdown);
      messageCentreElt.style.display = 'none';
      demarrerJeu();
    }
  }, 1000);
}

function demarrerJeu() {
  jeuActif = true;
  cible.style.display = 'flex';
  nouvellePosition();
  startTime = performance.now();
  rafId = requestAnimationFrame(chronoLoop);
}

function terminerJeu() {
  jeuActif = false;
  cancelAnimationFrame(rafId);
  cible.style.display = 'none';
  infosElt.style.display = 'none';
  finContainer.style.display = 'block';

  finResultatElt.textContent =
    `Objectif atteint 🎯\nTemps : ${elapsed.toFixed(2)} s\nErreurs : ${erreurs}`;

  afficherScoresAvecPerfCourante();
}

/* ===== INTERACTION ===== */

zone.addEventListener('pointerdown', e => {
  if (!jeuActif) return;

  nbTouches++;
  const r = cible.getBoundingClientRect();
  const ok =
    e.clientX >= r.left && e.clientX <= r.right &&
    e.clientY >= r.top && e.clientY <= r.bottom;

  if (ok) {
    score++;
    if (score >= OBJECTIF) {
      majStats();
      terminerJeu();
      return;
    }
    nouvellePosition();
  }

  majStats();
});

/* ===== SCORES ===== */

function trierScores(a) {
  a.sort((x, y) => {
    if (x.temps !== y.temps) return x.temps - y.temps;
    return x.erreurs - y.erreurs;
  });
}

function afficherScoresAvecPerfCourante() {
  const temp = scores.slice();
  const virtuel = { pseudo: '...', temps: elapsed, erreurs };
  temp.push(virtuel);
  trierScores(temp);
  indexDernierScore = temp.indexOf(virtuel);
  afficherListe(temp, indexDernierScore);
}

function afficherListe(liste, index) {
  scoresTbody.innerHTML = '';
  liste.forEach((s, i) => {
    const tr = document.createElement('tr');
    if (i === index) tr.classList.add('ligne-dernier');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${s.pseudo}</td>
      <td>${s.temps.toFixed(2)} s</td>
      <td>${s.erreurs}</td>
    `;
    scoresTbody.appendChild(tr);
  });
}

/* ===== BOUTONS ===== */

boutonEnregistrerScore.addEventListener('click', () => {
  const pseudo = prompt('Pseudo :', dernierPseudo) || 'Anonyme';
  dernierPseudo = pseudo;
  localStorage.setItem('dernierPseudo', pseudo);

  scores.push({ pseudo, temps: elapsed, erreurs });
  trierScores(scores);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));

  afficherListe(scores, scores.findIndex(
    s => s.pseudo === pseudo && s.temps === elapsed
  ));
});

boutonRecommencerFin.addEventListener('click', lancerNouvellePartie);

boutonMenuFin.addEventListener('click', () => {
  finContainer.style.display = 'none';
  accueil.style.display = 'flex';
});

accueilDemarrer.addEventListener('click', lancerNouvellePartie);

accueilScores.addEventListener('click', () => {
  accueil.style.display = 'none';
  finContainer.style.display = 'block';
  afficherListe(scores, -1);
});
