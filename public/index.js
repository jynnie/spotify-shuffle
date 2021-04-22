const step1El = document.querySelector("#step1");
const loginEl = document.querySelector("#login");
const step2El = document.querySelector("#step2");
const diversityEl = document.querySelector("#diversity");
const magicEl = document.querySelector("#magic");
const workingEl = document.querySelector("#working");
const errorEl = document.querySelector("#error");
const descEl = document.querySelector("#desc");
const resultEl = document.querySelector("#result");
const againEl = document.querySelector("#again");

const hideElement = (element) => {
  if (!element.classList.contains("hide")) {
    element.classList.toggle("hide");
  }
};

const showElement = (element) => {
  if (element.classList.contains("hide")) {
    element.classList.toggle("hide");
  }
};

const login = () => {
  window.location.href = "/login";
};

const less = () => {
  const diversity = parseInt(diversityEl.innerText);
  if (diversity > 1) {
    diversityEl.innerText = diversity - 1;
  }
};

const more = () => {
  const diversity = parseInt(diversityEl.innerText);
  if (diversity < 5) {
    diversityEl.innerText = diversity + 1;
  }
};

const roll = (diversity) => {
  fetch(`/playlists/${diversity}`)
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        hideElement(workingEl);
        const descParts = res.desc.split(" | ");
        descEl.innerHTML = `${descParts[0]}<br/>${descParts[1]}`;
        showElement(descEl);
        resultEl.setAttribute("href", res.url);
        showElement(resultEl);
        showElement(againEl);
      } else {
        hideElement(workingEl);
        showElement(magicEl);
        errorEl.innerHTML = res.msg;
        showElement(errorEl);
        setTimeout(() => {
          hideElement(errorEl);
          errorEl.innerHTML = "";
        }, 5000);
      }
    });
};

const magic = () => {
  const diversity = parseInt(diversityEl.innerText);
  if (diversity >= 1 && diversity <= 5) {
    hideElement(magicEl);
    showElement(workingEl);
    roll(diversity);
  }
};

const again = () => {
  const diversity = parseInt(diversityEl.innerText);
  if (diversity >= 1 && diversity <= 5) {
    hideElement(descEl);
    hideElement(resultEl);
    hideElement(againEl);
    showElement(workingEl);
    roll(diversity);
  }
};

const onload = () => {
  fetch("/whoami")
    .then((res) => res.json())
    .then((res) => {
      if (res.user) {
        hideElement(step1El);
        showElement(step2El);
      }
    });
};

onload();
