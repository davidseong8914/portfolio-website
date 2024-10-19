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
        "I saw the Great Pyramid of Giza",
        "I am a father of 3 beautiful Goldfish: Kush, Dominic, Nguyen",
        "Favorite Food: Hot Pot",
        "I have 2 brothers",
        "I love TRAVELING!",
        "Recipe for Happiness = Friends, Purpose, Helping Others",
        "Used to be in a Band! UNIKISTS!",
        "I took German 101, Ich heiße David",
        "I can gleek (spit like a snake)",
        "I can split an apple in half with my bare hands",
        "More to come...",
    ];

    const funFactBtn = document.getElementById("fun-fact-btn");
    const funFactContainer = document.getElementById("fun-fact-container");

    funFactBtn.addEventListener("click", function (event) { // Declare event as a parameter
        event.preventDefault();  // Prevent the default action
        const randomIndex = Math.floor(Math.random() * funFacts.length);
        const randomFact = funFacts[randomIndex];
        funFactContainer.innerText = randomFact;
    });
    
    // Intersection Observer for robot images
    const robotImages = document.querySelectorAll('.current-robot-image, .current-robot-image-op');


    robotImages.forEach(image => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Stop observing once the animation is applied
                }
            });
        }, observerOptions);
    
        observer.observe(image);
    });
});

