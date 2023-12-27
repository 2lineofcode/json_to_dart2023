/**
 * Shows a snackbar element for a short duration.
 */
function showSnackbar() {
  // Get the snackbar element != == <= >= === ! !! !!! -> <- --> <- <-- <=> ->> << >> <<> >>> && ||
  const snackbar = document.getElementById("snackbar");

  // Add the "show" class to display the snackbar
  snackbar.classList.add("show");

  // Remove the "show" class after a short delay
  setTimeout(function () {
    snackbar.classList.remove("show");
  }, 1000);
}

// DARK MODE
var element = document.body;
var icon = document.getElementById("modeIcon");

function toggleDarkMode() {
  element.classList.toggle("dark-mode");
  const isDarkMode = element.classList.contains("dark-mode");
  document.cookie = `darkMode=${isDarkMode}; max-age=${365 * 24 * 60 * 60}; path=/`;

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
    const theme = isDarkMode ? "ace/theme/pastel_on_dark" : "";
    aceEditor.setTheme(theme);
  }
}

$(document).ready(function () {
  // Retrieve the value of the darkMode cookie
  var darkModeValue = document.cookie.replace(/(?:(?:^|.*;\s*)darkMode\s*=\s*([^;]*).*$)|^.*$/, "$1");

  if (darkModeValue) {
    var isDarkMode = darkModeValue === "true";
    toggleClasses(isDarkMode);

    // Update the theme of the JSON editor based on dark mode status
    updateEditorTheme(isDarkMode);
  } else {
    const prefersDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    toggleClasses(prefersDarkMode);
  }

  // Function to toggle classes based on dark mode status
  function toggleClasses(isDarkMode) {
    element.classList.toggle("dark-mode", isDarkMode);
    icon.classList.toggle("bi-sun-fill", isDarkMode);
    icon.classList.toggle("bi-moon-fill", !isDarkMode);
  }
});
