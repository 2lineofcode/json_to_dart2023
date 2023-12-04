function showSnackbar() {
    var x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 1000);
}


var element = document.body;
var icon = document.getElementById("modeIcon");
function toggleDarkMode() {
    element.classList.toggle("dark-mode");
    var isDarkMode = element.classList.contains("dark-mode");
    document.cookie = "darkMode=" + isDarkMode + "; max-age=" + 365 * 24 * 60 * 60 + "; path=/";

    // Ganti ikon sesuai mode
    icon.classList.toggle("bi-sun-fill", isDarkMode);
    icon.classList.toggle("bi-moon-fill", !isDarkMode);
}

// Cek cookie saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
    var darkModeCookie = document.cookie.replace(/(?:(?:^|.*;\s*)darkMode\s*=\s*([^;]*).*$)|^.*$/, "$1");

    // Jika cookie ada, atur dark mode sesuai status
    if (darkModeCookie) {
        var isDarkMode = darkModeCookie === "true";
        element.classList.toggle("dark-mode", isDarkMode);
        // Atur ikon sesuai mode
        icon.classList.toggle("bi-sun-fill", isDarkMode);
        icon.classList.toggle("bi-moon-fill", !isDarkMode);
    } else {
        // Jika tidak ada cookie, cek tema sistem operasi
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Set dark mode sesuai preferensi sistem operasi
        if (prefersDarkMode) {
            element.classList.add('dark-mode');
            icon.classList.add('bi-sun-fill');
        } else {
            icon.classList.add('bi-moon-fill');
        }
    }
});
