// 3D INTERACTIVITY & PARALLAX JAVASCRIPT

document.addEventListener("DOMContentLoaded", () => {
  // 1. 3D Card Perspective Tilt Physics
  const cards = document.querySelectorAll(".card-3d");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (-10 to 10 deg)
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });

  // 2. Parallax Scroll Effect for Hero
  window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY || window.pageYOffset;
    const heroBg = document.getElementById("heroBg");
    if (heroBg) {
      heroBg.style.transform = `translate3d(0, ${scrollPos * 0.35}px, -50px) scale(1.1)`;
    }
  });

  // 3. Modal Background Click Listener
  const quoteModal = document.getElementById("quoteModal");
  if (quoteModal) {
    quoteModal.addEventListener("click", (e) => {
      if (e.target === quoteModal) {
        closeQuoteModal();
      }
    });
  }
});

// Interactive Quote Modal Functions (Global scope for HTML onclick attributes)
function openQuoteModal() {
  const modal = document.getElementById("quoteModal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeQuoteModal() {
  const modal = document.getElementById("quoteModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function selectRentalItem(itemName) {
  const select = document.getElementById("itemSelect");
  if (select) {
    select.value = itemName;
  }
  openQuoteModal();
}

function handleFormSubmit(e) {
  if (e) e.preventDefault();
  alert(
    "Mahalo! Your quote request has been received. Our team will verify date availability and contact you shortly.",
  );
  closeQuoteModal();
}
