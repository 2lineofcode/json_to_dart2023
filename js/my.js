function showSnackbar() {
    var x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 1000);
}

function toggleDarkMode() {
    var element = document.body;
    element.classList.toggle("dark-mode");
    var isDarkMode = element.classList.contains("dark-mode");
    document.cookie = "darkMode=" + isDarkMode + "; max-age=" + 365 * 24 * 60 * 60 + "; path=/";
}

// Cek cookie saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
    var darkModeCookie = document.cookie.replace(/(?:(?:^|.*;\s*)darkMode\s*=\s*([^;]*).*$)|^.*$/, "$1");
    // Jika cookie ada, atur dark mode sesuai status
    if (darkModeCookie) {
        var element = document.body;
        element.classList.toggle("dark-mode", darkModeCookie === "true");
    } else {
        // Jika tidak ada cookie, cek tema sistem operasi
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Set dark mode sesuai preferensi sistem operasi
        if (prefersDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }
});