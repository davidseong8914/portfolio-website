let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight; // Corrected typo here
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(links => {
                links.classList.remove('active');
                document.querySelector('header nav a[href*=' + id + ']').classList.add('active') // Corrected the selector syntax
            });
        }
    });
};

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
};

document.addEventListener('DOMContentLoaded', () => {
    const projectItems = document.querySelectorAll('.project-item');

    projectItems.forEach(item => {
        item.addEventListener('click', () => {
            const projectId = item.id;
            window.location.href = `projects/${projectId}.html`;
        });
    });

    // Fun fact functionality
    const funFacts = [
        "I have traveled to 19 countries.",
        "Yo hablo español.",
        "I once did a 90 hour Greyhound trip from California to Virginia",
        "I'm a ceramics master.",
        "Favorite Book: Norwegian Wood by Haruki Murakami",
        "Weather is great today",
        "More to come...",
        "More to come...",
        "More to come...",
    ];

    const funFactBtn = document.getElementById("fun-fact-btn");
    const funFactContainer = document.getElementById("fun-fact-container");

    funFactBtn.addEventListener("click", function () {
        const randomIndex = Math.floor(Math.random() * funFacts.length);
        const randomFact = funFacts[randomIndex];
        funFactContainer.innerText = randomFact;
    });
});
