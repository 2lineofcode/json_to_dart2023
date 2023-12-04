function showSnackbar() {
  var x = document.getElementById("snackbar");
  x.className = "show";
  setTimeout(function () {
    x.className = x.className.replace("show", "");
  }, 1000);
}

// DARK MODE
var element = document.body;
var icon = document.getElementById("modeIcon");

function toggleDarkMode() {
  element.classList.toggle("dark-mode");
  var isDarkMode = element.classList.contains("dark-mode");
  document.cookie = "darkMode=" + isDarkMode + "; max-age=" + 365 * 24 * 60 * 60 + "; path=/";

  // update icon
  icon.classList.toggle("bi-sun-fill", isDarkMode);
  icon.classList.toggle("bi-moon-fill", !isDarkMode);

  // update json editor
  updateEditorTheme(isDarkMode);
}

function updateEditorTheme(isDarkMode) {
  const editor = window.jsonEditor;
  if (editor && editor.aceEditor) {
    const aceEditor = editor.aceEditor;
    aceEditor.setTheme(isDarkMode ? "ace/theme/pastel_on_dark" : '');
  }
}

$(document).ready(function () {
  var darkModeCookie = document.cookie.replace(/(?:(?:^|.*;\s*)darkMode\s*=\s*([^;]*).*$)|^.*$/, "$1");

  if (darkModeCookie) {
    var isDarkMode = darkModeCookie === "true";
    element.classList.toggle("dark-mode", isDarkMode);
    icon.classList.toggle("bi-sun-fill", isDarkMode);
    icon.classList.toggle("bi-moon-fill", !isDarkMode);

    // Update the theme of the JSON editor based on dark mode status
    updateEditorTheme(isDarkMode);

  } else {
    const prefersDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDarkMode) {
      element.classList.add("dark-mode");
      icon.classList.add("bi-sun-fill");
    } else {
      icon.classList.add("bi-moon-fill");
    }
  }
});
